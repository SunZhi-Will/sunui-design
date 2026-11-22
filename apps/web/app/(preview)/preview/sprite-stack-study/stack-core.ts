/**
 * Sprite stacking 引擎（樣張用，2026-11-22）。
 *
 * 把 16 × 16 的像素圖示變成一疊水平切片，每片繞中心轉同一個角度、垂直壓扁（鏡頭俯角）、
 * 每往上一片抬高 1 格，由下往上畫。一張小圖就能轉到任何角度。
 * 參考 danielwh2/sprite-stacking（MIT）的渲染規則：對稱旋轉中心、最近鄰取樣、整疊只描一次外框、
 * 先在 1 倍美術解析度畫好再整數倍放大。
 *
 * 跟原 repo 不同的地方：原 repo 用四張視圖（上、側、前、後）做 visual hull 雕刻；
 * SunUI 的圖示只有正面一張，所以這裡用三種方式從一張正面長出體積：
 * - slab：直接往後擠出固定厚度（徽章、代幣）。
 * - puff：依距離邊緣的遠近決定厚度，中間厚、邊緣薄（愛心、史萊姆、雲）。
 * - lathe：把每一列繞垂直軸轉一圈（藥水、蘑菇、杯子蛋糕、燈籠，左右對稱的東西）。
 * 另外 carve() 保留原 repo 的多視圖雕刻，給手繪的物件用。
 */

export type Rgb = readonly [number, number, number];
/** 一張點陣：每列一個字串，"." 是空格，其餘字元查 colors 取色 */
export type Grid = readonly string[];

export type Volume = {
  /** 寬（x，左到右） */
  w: number;
  /** 深（y，後到前） */
  d: number;
  /** 高（z，0 是地面那一片） */
  h: number;
  filled: Uint8Array;
  /** 每個體素的 rgb，0 到 255 */
  rgb: Uint8Array;
  /** 每個體素的法線，平滑過的佔據梯度 */
  nx: Float32Array;
  ny: Float32Array;
  nz: Float32Array;
  /** 地面投影：任何一層有東西的 (x, y) */
  footprint: Uint8Array;
};

export type ShapeMode = "slab" | "puff" | "lathe";

const idx = (v: { w: number; d: number }, x: number, y: number, z: number) => (z * v.d + y) * v.w + x;

function emptyVolume(w: number, d: number, h: number): Volume {
  const n = w * d * h;
  return {
    w,
    d,
    h,
    filled: new Uint8Array(n),
    rgb: new Uint8Array(n * 3),
    nx: new Float32Array(n),
    ny: new Float32Array(n),
    nz: new Float32Array(n),
    footprint: new Uint8Array(w * d),
  };
}

function setVoxel(v: Volume, x: number, y: number, z: number, c: Rgb) {
  const i = idx(v, x, y, z);
  v.filled[i] = 1;
  v.rgb[i * 3] = c[0];
  v.rgb[i * 3 + 1] = c[1];
  v.rgb[i * 3 + 2] = c[2];
}

/** 佔據的負梯度當法線（3 × 3 × 3 鄰居加權），表面就有平滑的明暗，而不是六個方向的硬面 */
function computeNormals(v: Volume) {
  const { w, d, h } = v;
  const at = (x: number, y: number, z: number) =>
    x < 0 || y < 0 || z < 0 || x >= w || y >= d || z >= h ? 0 : v.filled[idx(v, x, y, z)];
  for (let z = 0; z < h; z++)
    for (let y = 0; y < d; y++)
      for (let x = 0; x < w; x++) {
        const i = idx(v, x, y, z);
        if (!v.filled[i]) continue;
        v.footprint[y * w + x] = 1;
        let gx = 0;
        let gy = 0;
        let gz = 0;
        for (let dz = -1; dz <= 1; dz++)
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy && !dz) continue;
              if (at(x + dx, y + dy, z + dz)) continue;
              const k = 1 / Math.hypot(dx, dy, dz);
              gx += dx * k;
              gy += dy * k;
              gz += dz * k;
            }
        const len = Math.hypot(gx, gy, gz);
        if (len < 1e-4) {
          v.nz[i] = 1;
        } else {
          v.nx[i] = gx / len;
          v.ny[i] = gy / len;
          v.nz[i] = gz / len;
        }
      }
}

/** 到最近空格的距離（棋盤距離，邊緣是 1），puff 用 */
function distanceInside(grid: Grid): number[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const dist = grid.map((r) => Array.from(r, (c) => (c === "." ? 0 : Infinity)));
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : dist[y][x]);
  for (let pass = 0; pass < 2; pass++) {
    const ys = pass === 0 ? [...Array(h).keys()] : [...Array(h).keys()].reverse();
    const xs = pass === 0 ? [...Array(w).keys()] : [...Array(w).keys()].reverse();
    const s = pass === 0 ? -1 : 1;
    for (const y of ys)
      for (const x of xs) {
        if (dist[y][x] === 0) continue;
        dist[y][x] = Math.min(dist[y][x], get(x + s, y) + 1, get(x, y + s) + 1, get(x + s, y + s) + 1, get(x - s, y + s) + 1);
      }
  }
  return dist;
}

export type ShapeOptions = {
  mode: ShapeMode;
  /** slab 的厚度、puff 的最大厚度（格） */
  depth?: number;
};

/**
 * 從一張正面點陣長出體積。點陣第一列是物件頂端（最高那片），最後一列是地面。
 * 物件站著面向鏡頭：正面在 +y（前），轉 0 度時正對觀眾。
 */
export function shapeFromFront(grid: Grid, colors: Record<string, Rgb>, opts: ShapeOptions): Volume {
  const rows = grid.length;
  const w = grid[0]?.length ?? 0;
  const color = (ch: string): Rgb => colors[ch] ?? [0, 0, 0];

  if (opts.mode === "lathe") {
    const d = w;
    const v = emptyVolume(w, d, rows);
    const axis = w / 2;
    for (let r = 0; r < rows; r++) {
      const row = grid[r];
      const z = rows - 1 - r;
      for (let y = 0; y < d; y++)
        for (let x = 0; x < w; x++) {
          const rad = Math.hypot(x + 0.5 - axis, y + 0.5 - axis);
          // 左半邊的點取左半邊的像素，非對稱的圖示（例如把手）也有自己的一側
          const col = x + 0.5 >= axis ? Math.floor(axis + rad) : Math.floor(axis - rad - 1e-6);
          if (col < 0 || col >= w) continue;
          const edge = row[col];
          if (!edge || edge === ".") continue;
          // 形狀看半徑，顏色從正面直直投過來（像貼花），轉到正面時才讀得出圖案；那一格是空的就用邊的顏色
          const own = row[x];
          setVoxel(v, x, y, z, color(own && own !== "." ? own : edge));
        }
    }
    computeNormals(v);
    return v;
  }

  if (opts.mode === "puff") {
    const maxHalf = Math.max(1, Math.round((opts.depth ?? 6) / 2));
    const d = maxHalf * 2 + 1;
    const v = emptyVolume(w, d, rows);
    const dist = distanceInside(grid);
    const c = maxHalf;
    for (let r = 0; r < rows; r++) {
      const z = rows - 1 - r;
      for (let x = 0; x < w; x++) {
        const ch = grid[r][x];
        if (ch === ".") continue;
        // 邊緣 1 格厚，往內每一圈多 1 格，像吹氣枕頭
        const half = Math.min(maxHalf, Math.round(Math.sqrt(dist[r][x]) * 1.6 - 0.6));
        for (let y = c - half; y <= c + half; y++) setVoxel(v, x, y, z, color(ch));
      }
    }
    computeNormals(v);
    return v;
  }

  const d = Math.max(1, opts.depth ?? 3);
  const v = emptyVolume(w, d, rows);
  for (let r = 0; r < rows; r++) {
    const z = rows - 1 - r;
    for (let x = 0; x < w; x++) {
      const ch = grid[r][x];
      if (ch === ".") continue;
      // 整條擠出同一個顏色：俯看時每片只露出 1 格寬的邊，取樣常落在中間那層，中間換色會整面發黑
      for (let y = 0; y < d; y++) setVoxel(v, x, y, z, color(ch));
    }
  }
  computeNormals(v);
  return v;
}

/**
 * 原 repo 的四視圖雕刻（visual hull）：體素只在每張視圖都蓋到的地方留下。
 * top：往下看，第一列是後、最後一列是前（w × d）。side：從右看，第一欄是後（d × h）。
 * front：從前看（w × h）。顏色優先取 front，其次 side，最後 top。
 */
export function carve(views: { top: Grid; side: Grid; front: Grid }, colors: Record<string, Rgb>): Volume {
  const w = views.front[0].length;
  const h = views.front.length;
  const d = views.top.length;
  const v = emptyVolume(w, d, h);
  for (let z = 0; z < h; z++) {
    const r = h - 1 - z;
    for (let y = 0; y < d; y++)
      for (let x = 0; x < w; x++) {
        const t = views.top[y][x];
        const s = views.side[r][y];
        const f = views.front[r][x];
        if (t === "." || s === "." || f === ".") continue;
        // 碰到前面空氣的體素用正面色，頂上露空的用頂視色，其他用側面色
        const frontOpen = y === d - 1 || views.top[y + 1]?.[x] === "." || views.side[r][y + 1] === ".";
        const topOpen = z === h - 1 || views.front[r - 1]?.[x] === "." || views.side[r - 1]?.[y] === ".";
        const ch = frontOpen ? f : topOpen ? t : s;
        setVoxel(v, x, y, z, colors[ch] ?? [0, 0, 0]);
      }
  }
  computeNormals(v);
  return v;
}

export type RenderOptions = {
  /** 繞垂直軸的角度（弧度），0 正對鏡頭 */
  turn: number;
  /** 俯角壓扁，1 是正上方往下看，0.35 接近平視 */
  squash: number;
  /** 每片之間額外的間距倍數，0 是實心，1.5 是爆炸圖 */
  explode?: number;
  /** 每片的抬升比例（0 到 1），給由下往上長出來的登場用；不給就全部 1 */
  lifts?: ArrayLike<number> | null;
  /** 光從哪裡來（世界座標，物件轉、光不轉） */
  light?: readonly [number, number, number];
  /** 明暗分幾階，像素畫的色階不要連續漸層；0 是連續 */
  bands?: number;
  /** 外框色，整疊只描一次；不給就不描 */
  outline?: Rgb | null;
  /** 地面影子的不透明度 */
  shadow?: number;
};

export type Frame = { data: ImageData; ox: number; oy: number };

/** 畫布需要多大才裝得下任何角度與爆炸程度 */
export function frameSize(v: Volume, maxExplode = 0) {
  const diag = Math.ceil(Math.hypot(v.w, v.d)) + 2;
  const tall = Math.ceil(diag + v.h * (1 + maxExplode)) + 4;
  return { width: diag + 4, height: tall };
}

/**
 * 在 1 倍美術解析度的 ImageData 上畫一幀。逐片由下往上，每片用反向映射取樣（最近鄰），
 * 旋轉中心取 (w - 1) / 2，偶數寬度轉 90 度才不會晃半格。
 */
export function renderStack(out: ImageData, v: Volume, o: RenderOptions) {
  const W = out.width;
  const H = out.height;
  const px = out.data;
  px.fill(0);
  const cos = Math.cos(o.turn);
  const sin = Math.sin(o.turn);
  const sq = Math.max(0.2, Math.min(1, o.squash));
  const gap = 1 + (o.explode ?? 0);
  // 光從左上、偏向鏡頭：正對鏡頭的面約等於原本的平面色，背光面約六成
  const L = o.light ?? [-0.45, 0.75, 0.5];
  const ll = Math.hypot(L[0], L[1], L[2]);
  const lx = L[0] / ll;
  const ly = L[1] / ll;
  const lz = L[2] / ll;
  const bands = o.bands ?? 4;
  const cx = (v.w - 1) / 2;
  const cy = (v.d - 1) / 2;
  const ox = Math.round(W / 2);
  // 地面那片放在畫布下方，留出影子的空間
  const radius = Math.hypot(v.w, v.d) / 2;
  const oy = Math.round(H - radius * sq - 3);
  const rad = Math.ceil(radius) + 1;
  const ryMax = Math.ceil(rad * sq) + 1;

  // 地面影子：所有層的投影，往右下偏一點
  const shadowA = o.shadow ?? 0.16;
  if (shadowA > 0) {
    const a = Math.round(shadowA * 255);
    for (let sy = -ryMax; sy <= ryMax; sy++)
      for (let sx = -rad; sx <= rad; sx++) {
        const X = sx;
        const Y = sy / sq;
        const x = Math.round(cos * X + sin * Y + cx);
        const y = Math.round(-sin * X + cos * Y + cy);
        if (x < 0 || y < 0 || x >= v.w || y >= v.d || !v.footprint[y * v.w + x]) continue;
        const tx = ox + sx + 1;
        const ty = oy + sy + 1;
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
        const p = (ty * W + tx) * 4;
        px[p + 3] = a;
      }
  }

  // 這一幀每個體素的明暗：法線跟著物件轉，光固定
  const shade = (i: number) => {
    const nx = v.nx[i];
    const ny = v.ny[i];
    const rx = cos * nx - sin * ny;
    const ry = sin * nx + cos * ny;
    let s = 0.62 + 0.5 * Math.max(0, rx * lx + ry * ly + v.nz[i] * lz);
    if (bands > 0) s = Math.round(s * bands) / bands;
    return s;
  };

  for (let z = 0; z < v.h; z++) {
    const lift = o.lifts ? o.lifts[z] ?? 1 : 1;
    if (lift <= 0) continue;
    const lz0 = Math.round(z * gap * lift);
    const base = z * v.d * v.w;
    for (let sy = -ryMax; sy <= ryMax; sy++) {
      const ty = oy + sy - lz0;
      if (ty < 0 || ty >= H) continue;
      const Y = sy / sq;
      for (let sx = -rad; sx <= rad; sx++) {
        const tx = ox + sx;
        if (tx < 0 || tx >= W) continue;
        const x = Math.round(cos * sx + sin * Y + cx);
        const y = Math.round(-sin * sx + cos * Y + cy);
        if (x < 0 || y < 0 || x >= v.w || y >= v.d) continue;
        const i = base + y * v.w + x;
        if (!v.filled[i]) continue;
        const s = shade(i);
        const p = (ty * W + tx) * 4;
        px[p] = Math.min(255, v.rgb[i * 3] * s);
        px[p + 1] = Math.min(255, v.rgb[i * 3 + 1] * s);
        px[p + 2] = Math.min(255, v.rgb[i * 3 + 2] * s);
        px[p + 3] = 255;
      }
    }
  }

  if (o.outline) outlineOnce(out, o.outline);
}

/** 整疊畫完後沿著不透明的邊描一圈 1 格外框（影子不算），每片各描會在身體裡留下縫 */
function outlineOnce(out: ImageData, c: Rgb) {
  const W = out.width;
  const H = out.height;
  const px = out.data;
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) solid[i] = px[i * 4 + 3] === 255 ? 1 : 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (solid[i]) continue;
      const n =
        (x > 0 && solid[i - 1]) || (x < W - 1 && solid[i + 1]) || (y > 0 && solid[i - W]) || (y < H - 1 && solid[i + W]);
      if (!n) continue;
      px[i * 4] = c[0];
      px[i * 4 + 1] = c[1];
      px[i * 4 + 2] = c[2];
      px[i * 4 + 3] = 255;
    }
}
