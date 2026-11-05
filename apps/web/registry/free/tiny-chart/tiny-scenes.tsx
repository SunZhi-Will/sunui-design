"use client";

import { cn } from "@/lib/utils";

/* tiny-chart 的等角小場景：道具與人物全部用程式畫，只有平塗的紙色多邊形和墨線，沒有圖片、漸層或陰影。
   座標是世界座標 (x, y, z)：y 是流程前進方向（畫面右下）、x 是分岔方向（畫面左下）、z 往上。 */

export type Pt = [number, number];

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const ISO_C = Math.cos(Math.PI / 6);
export const ISO_S = 0.5;
/** 世界座標投影到畫面，讀起來由左上到右下 */
export const iso = (x: number, y: number, z = 0): Pt => [r1((y - x) * ISO_C), r1((x + y) * ISO_S - z)];

/** 可以放在步驟旁邊的道具 */
export const tinyProps = ["home", "shop", "counter", "warehouse", "parcels", "truck", "house", "shelf", "post"] as const;
export type TinyProp = (typeof tinyProps)[number];
/** 步驟旁的場景：只給道具名稱，或加上一位站在旁邊的人 */
export type TinyScene = TinyProp | { prop: TinyProp; person?: boolean };

type Tone = "paper" | "card" | "ink";
/** 同一張紙的三階明度：頂面最亮、正面次之、側面最暗 */
const FILL: Record<Tone, { top: string; front: string; side: string }> = {
  paper: { top: "fill-[#faf7f0] dark:fill-[#1f1c18]", front: "fill-[#efe8da] dark:fill-[#2a2620]", side: "fill-[#e3dbc9] dark:fill-[#15130f]" },
  card: { top: "fill-[#ebe3d2] dark:fill-[#38322a]", front: "fill-[#ddd3be] dark:fill-[#2c2720]", side: "fill-[#cdc1a7] dark:fill-[#1d1a15]" },
  ink: { top: "fill-[#57534e] dark:fill-[#a8a29e]", front: "fill-[#44403c] dark:fill-[#8f8982]", side: "fill-[#292524] dark:fill-[#6b655e]" },
};

export type ScenePart =
  | { kind: "poly"; pts: Pt[]; fill: string }
  | { kind: "line"; pts: Pt[] }
  | { kind: "person"; at: Pt; tone: PersonTone };

/** 在某個錨點上用世界座標疊方塊；每個方法依「先遠後近」的順序呼叫，畫的時候照順序疊上去 */
/** 道具在世界座標裡的縮放：讓門、桌子、櫃台和小人（約 35 高）的比例接近真實 */
const K = 1.35;

class Sketch {
  parts: ScenePart[] = [];
  constructor(private ox: number, private oy: number) {}
  p = (x: number, y: number, z: number) => iso(this.ox + x * K, this.oy + y * K, z * K);
  private poly(pts: Pt[], fill: string) {
    this.parts.push({ kind: "poly", pts, fill });
    return this;
  }
  cube(x: number, y: number, z: number, w: number, d: number, h: number, tone: Tone = "paper") {
    const { p } = this, f = FILL[tone], [x1, y1, z1] = [x + w, y + d, z + h];
    this.poly([p(x1, y, z), p(x1, y1, z), p(x1, y1, z1), p(x1, y, z1)], f.side);
    this.poly([p(x, y1, z), p(x1, y1, z), p(x1, y1, z1), p(x, y1, z1)], f.front);
    return this.poly([p(x, y, z1), p(x1, y, z1), p(x1, y1, z1), p(x, y1, z1)], f.top);
  }
  /** 貼在朝 +y 那一面的平面：門、窗、螢幕 */
  face(x: number, y: number, z: number, w: number, h: number, fill: string) {
    const { p } = this;
    return this.poly([p(x, y, z), p(x + w, y, z), p(x + w, y, z + h), p(x, y, z + h)], fill);
  }
  /** 貼在朝 +x 那一面的平面 */
  flank(x: number, y: number, z: number, d: number, h: number, fill: string) {
    const { p } = this;
    return this.poly([p(x, y, z), p(x, y + d, z), p(x, y + d, z + h), p(x, y, z + h)], fill);
  }
  /** 屋脊沿 x 方向的兩坡屋頂 */
  roof(x: number, y: number, z: number, w: number, d: number, rh: number, tone: Tone = "card") {
    const { p } = this, f = FILL[tone], [x1, ym, y1, zt] = [x + w, y + d / 2, y + d, z + rh];
    this.poly([p(x, y, z), p(x1, y, z), p(x1, ym, zt), p(x, ym, zt)], f.side);
    this.poly([p(x1, y, z), p(x1, y1, z), p(x1, ym, zt)], FILL.paper.front);
    return this.poly([p(x, ym, zt), p(x1, ym, zt), p(x1, y1, z), p(x, y1, z)], f.top);
  }
  /** 立在 +y 面上的輪子（八角形） */
  wheel(cx: number, y: number, cz: number, r: number) {
    const pts = Array.from({ length: 8 }, (_, i) => this.p(cx + Math.cos((i * Math.PI) / 4) * r, y, cz + Math.sin((i * Math.PI) / 4) * r));
    return this.poly(pts, FILL.ink.front);
  }
  line(a: [number, number, number], b: [number, number, number]) {
    this.parts.push({ kind: "line", pts: [this.p(...a), this.p(...b)] });
    return this;
  }
  person(x: number, y: number, z = 0, tone: PersonTone = "card") {
    this.parts.push({ kind: "person", at: this.p(x, y, z), tone });
    return this;
  }
}

/** 每個道具的占地（世界單位）與畫法；person 是站在道具前的人要站哪 */
const PROPS: Record<TinyProp, { w: number; d: number; h: number; person: [number, number]; draw: (s: Sketch) => Sketch }> = {
  // 家裡的書桌：桌腳、桌面、筆電、馬克杯
  home: {
    w: 64, d: 40, h: 36, person: [0, 30],
    draw: (s) =>
      s.cube(-28, -16, 0, 3, 3, 18, "card").cube(25, -16, 0, 3, 3, 18, "card").cube(-28, 13, 0, 3, 3, 18, "card").cube(25, 13, 0, 3, 3, 18, "card")
        .cube(-30, -18, 18, 60, 36, 3, "card")
        .face(-6, -6, 22.5, 18, 12, FILL.ink.front)
        .cube(-6, -6, 21, 18, 12, 1.5, "paper")
        .cube(-22, 4, 21, 5, 5, 6, "paper"),
  },
  // 店面：兩坡屋頂、門、窗、門上的雨棚
  shop: {
    w: 66, d: 50, h: 50, person: [16, 36],
    draw: (s) =>
      s.cube(-30, -22, 0, 60, 44, 32, "paper")
        .roof(-33, -25, 32, 66, 50, 16)
        .face(-6, 22, 0, 12, 24, FILL.ink.front)
        .face(-24, 22, 10, 12, 10, FILL.card.top)
        .face(12, 22, 10, 12, 10, FILL.card.top)
        .face(-10, 22, 25, 20, 3, FILL.card.side),
  },
  // 服務台：櫃台、檯面、立牌，櫃台後站一個人
  counter: {
    w: 64, d: 40, h: 40, person: [0, 24],
    draw: (s) =>
      s.cube(-12, -19, 17, 2, 2, 12, "ink").cube(10, -19, 17, 2, 2, 12, "ink")
        .cube(-16, -20, 29, 32, 3, 10, "paper")
        .person(0, -12, 0, "ink")
        .cube(-30, -6, 0, 60, 14, 15, "card")
        .cube(-32, -8, 15, 64, 18, 2, "paper"),
  },
  // 倉庫：寬矮的量體、平屋頂、捲門
  warehouse: {
    w: 84, d: 64, h: 38, person: [24, 42],
    draw: (s) =>
      s.cube(-40, -30, 0, 80, 60, 34, "card")
        .cube(-42, -32, 34, 84, 64, 3, "paper")
        .face(-14, 30, 0, 28, 24, FILL.paper.front)
        .line([-14, 30, 6], [14, 30, 6]).line([-14, 30, 12], [14, 30, 12]).line([-14, 30, 18], [14, 30, 18]),
  },
  // 一疊包裹，頂面有封箱膠帶
  parcels: {
    w: 40, d: 30, h: 24, person: [0, 26],
    draw: (s) =>
      s.cube(4, -12, 0, 16, 16, 12, "card").line([12, -12, 12], [12, 4, 12])
        .cube(-18, -10, 0, 20, 18, 14, "card").line([-8, -10, 14], [-8, 8, 14])
        .cube(-12, -8, 14, 14, 12, 10, "card").line([-5, -8, 24], [-5, 4, 24]),
  },
  // 貨車：貨櫃、車頭、車窗、兩個輪子
  truck: {
    w: 64, d: 26, h: 36, person: [-14, 26],
    draw: (s) =>
      s.cube(-30, -13, 4, 46, 26, 32, "paper")
        .cube(16, -13, 4, 16, 26, 24, "card")
        .flank(32, -8, 18, 16, 8, FILL.ink.side)
        .wheel(-20, 13.2, 5, 5).wheel(22, 13.2, 5, 5),
  },
  // 住家：兩坡屋頂、門、窗、煙囪
  house: {
    w: 50, d: 46, h: 52, person: [8, 32],
    draw: (s) =>
      s.cube(-22, -20, 0, 44, 40, 28, "paper")
        .roof(-25, -23, 28, 50, 46, 18)
        .cube(8, -16, 36, 6, 6, 12, "card")
        .face(-14, 20, 0, 10, 22, FILL.ink.front)
        .face(4, 20, 12, 10, 8, FILL.card.top)
        .flank(22, -10, 10, 12, 8, FILL.card.top),
  },
  // 層架：兩片側板、四層板子、上面的盒子
  shelf: {
    w: 60, d: 16, h: 46, person: [0, 22],
    draw: (s) =>
      s.cube(-30, -8, 0, 3, 16, 44, "card")
        .cube(-27, -8, 0, 54, 16, 2, "paper").cube(-24, -6, 2, 10, 10, 8, "card").cube(-10, -6, 2, 12, 10, 10, "paper")
        .cube(-27, -8, 14, 54, 16, 2, "paper").cube(4, -6, 16, 14, 10, 9, "card")
        .cube(-27, -8, 28, 54, 16, 2, "paper").cube(-20, -6, 30, 10, 10, 7, "paper").cube(10, -6, 30, 8, 10, 10, "card")
        .cube(-27, -8, 42, 54, 16, 2, "paper")
        .cube(27, -8, 0, 3, 16, 44, "card"),
  },
  // 郵筒：柱子、筒身、投信口、頂蓋
  post: {
    w: 22, d: 18, h: 24, person: [0, 20],
    draw: (s) =>
      s.cube(-2, -2, 0, 4, 4, 10, "ink")
        .cube(-9, -7, 10, 18, 14, 12, "card")
        .face(-5, 7, 17, 10, 2, FILL.ink.front)
        .cube(-10, -8, 22, 20, 16, 2, "paper"),
  },
};

export interface SceneDraw {
  parts: ScenePart[];
  /** 世界座標的占地，用來排地板格線 */
  footprint: { x0: number; x1: number; y0: number; y1: number };
  depth: number;
}

/**
 * 把場景放在方塊旁邊：side 為 -1 放在畫面右上（遠側），+1 放在左下（近側）。
 * blockX、blockY 是方塊中心，blockW 是方塊在 x 方向的長度。
 */
export function placeScene(scene: TinyScene, blockX: number, blockY: number, blockW: number, side: 1 | -1): SceneDraw {
  const { prop, person } = typeof scene === "string" ? { prop: scene, person: false } : scene;
  const def = PROPS[prop];
  const [w, d] = [def.w * K, def.d * K];
  const ax = blockX + side * (blockW / 2 + 30 + w / 2), ay = blockY;
  const sketch = def.draw(new Sketch(ax, ay));
  if (person) sketch.person(def.person[0], def.person[1]);
  return {
    parts: sketch.parts,
    footprint: { x0: ax - w / 2, x1: ax + w / 2, y0: ay - d / 2, y1: ay + d / 2 + (person ? 20 : 0) },
    depth: ax + ay,
  };
}

export type PersonTone = "card" | "ink" | "red";

const INK_LINE = "stroke-[#1c1917] dark:stroke-[#ece7dc]";
const SHIRT: Record<PersonTone, string> = {
  card: FILL.card.front,
  ink: FILL.ink.front,
  red: "fill-[#c8361d] dark:fill-[#ec6a4f]",
};

/** 一個小人：腳底在 (0, 0)，身高約 35；red 是正在走流程的那個人 */
export function Figure({ tone = "card" }: { tone?: PersonTone }) {
  return (
    <g transform="scale(1.1)">
      <path d="M-2.6 0 V-9 M2.6 0 V-9" strokeWidth="2.4" strokeLinecap="round" className={INK_LINE} />
      <rect x="-5.5" y="-22" width="11" height="14" rx="4.5" strokeWidth="1.2" className={cn(SHIRT[tone], INK_LINE)} />
      <circle cy="-27" r="4.6" strokeWidth="1.2" className={cn(FILL.paper.top, INK_LINE)} />
      <path d="M-4.6 -27.6 a4.6 4.6 0 0 1 9.2 0 q-4.6 -1.6 -9.2 0 z" className="fill-[#1c1917] dark:fill-[#ece7dc]" />
    </g>
  );
}

/** 畫一組場景零件 */
export function SceneParts({ parts }: { parts: ScenePart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.kind === "person" ? (
          <g key={i} transform={`translate(${part.at[0]} ${part.at[1]})`}>
            <Figure tone={part.tone} />
          </g>
        ) : part.kind === "line" ? (
          <path key={i} d={`M${part.pts[0].join(" ")} L${part.pts[1].join(" ")}`} fill="none" strokeWidth="0.9" className={INK_LINE} />
        ) : (
          <polygon key={i} points={part.pts.map((q) => q.join(",")).join(" ")} strokeWidth="1" strokeLinejoin="round" className={cn(part.fill, INK_LINE)} />
        ),
      )}
    </>
  );
}
