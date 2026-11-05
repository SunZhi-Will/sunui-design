/**
 * 掛在橫桿上的布：Verlet 質點網格。純計算，不碰 DOM，方便單元測試。
 *
 * 世界座標以畫面高度為 2：y 從 1（上緣）到 -1（下緣），x 從 -aspect 到
 * aspect，z 朝向鏡頭。第 0 欄是布的前緣（手拉的那一邊），最後一欄收在
 * gatherSide 那一側。
 */
export const CLOTH_COLUMNS = 72;
export const CLOTH_ROWS = 38;

const STEP_SECONDS = 1 / 60;
const SOLVER_ITERATIONS = 7;
const DAMPING = 0.982;
const GRAVITY = 2.6;
/** 布比窗寬多出來的比例：窗簾本來就不是平的，多出來的布才會垂成皺褶。 */
const FULLNESS = 1.55;
const COLUMNS_PER_FOLD = 7;
const RAIL_Y = 1.1;
const DROP_LENGTH = 2.42;
/** 完全拉開後，收攏的布還占多寬。 */
const GATHERED_WIDTH = 0.34;
const OFFSCREEN_MARGIN = 0.3;
const NORMAL_SMOOTHING_PASSES = 3;
const HAND_RADIUS = 0.7;
const HAND_PULL = 0.03;
const HAND_LIFT = 0.1;

export interface ClothPanelSpec {
  /** 拉開時布往哪一側收。 */
  gatherSide: 1 | -1;
  /** 布拉上時，前緣與收攏側外緣的 x。 */
  leadX: number;
  edgeX: number;
  /** 畫面半寬，決定拉開後要退到哪裡才算出畫。 */
  aspect: number;
}

export interface ClothHand {
  x: number;
  y: number;
}

export interface ClothForces {
  /** 目前環境風的強度。 */
  breeze: number;
  /** 一陣掀起簾子的強風，0 到 1。 */
  gust: number;
  time: number;
  hand?: ClothHand;
}

export interface ClothPanel {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint16Array;
  step(open: number, forces: ClothForces): void;
}

function particle(column: number, row: number): number {
  return row * CLOTH_COLUMNS + column;
}

/** 皺褶不等距：一樣寬的波浪看起來就是瓦楞紙。 */
function foldPhase(column: number): number {
  return (column * Math.PI * 2) / COLUMNS_PER_FOLD + 0.8 * Math.sin(column * 0.21) + 0.45 * Math.sin(column * 0.53);
}

function foldWeight(column: number): number {
  return 0.8 + 0.2 * Math.sin(column * 0.37 + 1.3);
}

export function createClothPanel(spec: ClothPanelSpec): ClothPanel {
  const count = CLOTH_COLUMNS * CLOTH_ROWS;
  const positions = new Float32Array(count * 3);
  const previous = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const smoothed = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices = new Uint16Array((CLOTH_COLUMNS - 1) * (CLOTH_ROWS - 1) * 6);

  const closedSpacing = Math.abs(spec.edgeX - spec.leadX) / (CLOTH_COLUMNS - 1);
  const clothSpacing = closedSpacing * FULLNESS;
  const rowSpacing = DROP_LENGTH / (CLOTH_ROWS - 1);
  const openLeadX = spec.aspect * spec.gatherSide + spec.gatherSide * OFFSCREEN_MARGIN;
  const openEdgeX = openLeadX + spec.gatherSide * GATHERED_WIDTH;

  const pinned = new Float32Array(CLOTH_COLUMNS * 3);

  /**
   * 橫桿上的掛點。布長不變，掛點靠得越近，皺褶就要凸得越深：
   * 正弦波每段平均長度是 sqrt(s² + (Ak)²/2)，令它等於布長即可解出 A。
   */
  const placeRail = (open: number) => {
    const leadX = spec.leadX + (openLeadX - spec.leadX) * open;
    const edgeX = spec.edgeX + (openEdgeX - spec.edgeX) * open;
    const spacing = Math.abs(edgeX - leadX) / (CLOTH_COLUMNS - 1);
    const slack = Math.max(0, clothSpacing * clothSpacing - spacing * spacing);
    const amplitude = Math.sqrt(2 * slack) / ((Math.PI * 2) / COLUMNS_PER_FOLD);
    for (let column = 0; column < CLOTH_COLUMNS; column += 1) {
      const u = column / (CLOTH_COLUMNS - 1);
      pinned[column * 3] = leadX + (edgeX - leadX) * u;
      pinned[column * 3 + 1] = RAIL_Y;
      pinned[column * 3 + 2] = Math.sin(foldPhase(column)) * amplitude * foldWeight(column);
    }
  };

  placeRail(0);
  for (let row = 0; row < CLOTH_ROWS; row += 1) {
    for (let column = 0; column < CLOTH_COLUMNS; column += 1) {
      const index = particle(column, row);
      positions[index * 3] = pinned[column * 3];
      positions[index * 3 + 1] = RAIL_Y - row * rowSpacing;
      positions[index * 3 + 2] = pinned[column * 3 + 2];
      uvs[index * 2] = column / (CLOTH_COLUMNS - 1);
      uvs[index * 2 + 1] = row / (CLOTH_ROWS - 1);
    }
  }
  previous.set(positions);

  const firsts: number[] = [];
  const seconds: number[] = [];
  const lengths: number[] = [];
  const stiffnesses: number[] = [];
  const link = (a: number, b: number, stiffness: number) => {
    firsts.push(a);
    seconds.push(b);
    lengths.push(
      Math.hypot(
        positions[a * 3] - positions[b * 3],
        positions[a * 3 + 1] - positions[b * 3 + 1],
        positions[a * 3 + 2] - positions[b * 3 + 2]
      )
    );
    stiffnesses.push(stiffness);
  };

  for (let row = 0; row < CLOTH_ROWS; row += 1) {
    for (let column = 0; column < CLOTH_COLUMNS; column += 1) {
      const here = particle(column, row);
      if (column + 1 < CLOTH_COLUMNS) link(here, particle(column + 1, row), 1);
      if (row + 1 < CLOTH_ROWS) link(here, particle(column, row + 1), 1);
      if (column + 1 < CLOTH_COLUMNS && row + 1 < CLOTH_ROWS) {
        link(here, particle(column + 1, row + 1), 0.22);
        link(particle(column + 1, row), particle(column, row + 1), 0.22);
      }
      if (column + 2 < CLOTH_COLUMNS) link(here, particle(column + 2, row), 0.12);
      if (row + 2 < CLOTH_ROWS) link(here, particle(column, row + 2), 0.4);
    }
  }
  const linkFirst = Uint16Array.from(firsts);
  const linkSecond = Uint16Array.from(seconds);
  const linkLength = Float32Array.from(lengths);
  const linkStiffness = Float32Array.from(stiffnesses);

  let cursor = 0;
  for (let row = 0; row < CLOTH_ROWS - 1; row += 1) {
    for (let column = 0; column < CLOTH_COLUMNS - 1; column += 1) {
      const a = particle(column, row);
      const b = particle(column + 1, row);
      const c = particle(column, row + 1);
      const d = particle(column + 1, row + 1);
      indices.set([a, c, b, b, c, d], cursor);
      cursor += 6;
    }
  }

  const computeNormals = () => {
    normals.fill(0);
    for (let face = 0; face < indices.length; face += 3) {
      const a = indices[face] * 3;
      const b = indices[face + 1] * 3;
      const c = indices[face + 2] * 3;
      const ux = positions[b] - positions[a];
      const uy = positions[b + 1] - positions[a + 1];
      const uz = positions[b + 2] - positions[a + 2];
      const vx = positions[c] - positions[a];
      const vy = positions[c + 1] - positions[a + 1];
      const vz = positions[c + 2] - positions[a + 2];
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      normals[a] += nx;
      normals[a + 1] += ny;
      normals[a + 2] += nz;
      normals[b] += nx;
      normals[b + 1] += ny;
      normals[b + 2] += nz;
      normals[c] += nx;
      normals[c + 1] += ny;
      normals[c + 2] += nz;
    }
    for (let index = 0; index < count * 3; index += 3) {
      const length =
        Math.sqrt(normals[index] ** 2 + normals[index + 1] ** 2 + normals[index + 2] ** 2) || 1;
      normals[index] /= length;
      normals[index + 1] /= length;
      normals[index + 2] /= length;
    }
  };

  /** 把法線抹順：賽璐璐的色階邊界直接描著法線走，網格的碎折會變成鋸齒。 */
  const smoothNormals = () => {
    for (let pass = 0; pass < NORMAL_SMOOTHING_PASSES; pass += 1) {
      smoothed.set(normals);
      for (let row = 1; row < CLOTH_ROWS - 1; row += 1) {
        for (let column = 1; column < CLOTH_COLUMNS - 1; column += 1) {
          const i3 = particle(column, row) * 3;
          const up = i3 - CLOTH_COLUMNS * 3;
          const down = i3 + CLOTH_COLUMNS * 3;
          for (let axis = 0; axis < 3; axis += 1) {
            normals[i3 + axis] =
              (smoothed[i3 + axis] * 2 +
                smoothed[i3 - 3 + axis] +
                smoothed[i3 + 3 + axis] +
                smoothed[up + axis] +
                smoothed[down + axis]) /
              6;
          }
        }
      }
    }
  };

  computeNormals();

  const step = (open: number, forces: ClothForces) => {
    placeRail(open);
    const { breeze, gust, time, hand } = forces;
    const stepSquared = STEP_SECONDS * STEP_SECONDS;

    for (let index = 0; index < count; index += 1) {
      const i3 = index * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      const hang = uvs[index * 2 + 1];

      // 風只推得動正對它的布面，側著的皺褶吃不到風，布才會鼓起來而不是整片平移。
      const wave = Math.sin(x * 1.5 + time * 1.15 + y * 1.1) + 0.6 * Math.sin(x * 3.1 - time * 0.8 + y * 2.3);
      const windX = (0.05 * Math.sin(time * 0.6) + wave * 0.02) * breeze;
      const windZ = (0.1 + 0.11 * wave) * breeze + gust * (0.7 + 0.35 * wave);
      const facing = normals[i3] * windX + normals[i3 + 2] * windZ;
      const push = facing * (0.3 + hang * hang * 2.4);

      const velocityX = (x - previous[i3]) * DAMPING;
      const velocityY = (y - previous[i3 + 1]) * DAMPING;
      const velocityZ = (z - previous[i3 + 2]) * DAMPING;
      previous[i3] = x;
      previous[i3 + 1] = y;
      previous[i3 + 2] = z;
      positions[i3] = x + velocityX + normals[i3] * push * stepSquared * 60;
      positions[i3 + 1] = y + velocityY + (gust * hang * hang * 1.8 - GRAVITY) * stepSquared;
      positions[i3 + 2] = z + velocityZ + normals[i3 + 2] * push * stepSquared * 60;

      if (hand) {
        const distance = Math.sqrt((x - hand.x) ** 2 + (y - hand.y) ** 2);
        if (distance < HAND_RADIUS) {
          const grip = (1 - distance / HAND_RADIUS) ** 2;
          positions[i3] += (hand.x - x) * grip * HAND_PULL;
          positions[i3 + 1] += (hand.y - y) * grip * HAND_PULL * 0.6;
          positions[i3 + 2] += (HAND_LIFT - z) * grip * HAND_PULL;
        }
      }
    }

    for (let iteration = 0; iteration < SOLVER_ITERATIONS; iteration += 1) {
      for (let index = 0; index < linkFirst.length; index += 1) {
        const a = linkFirst[index] * 3;
        const b = linkSecond[index] * 3;
        const deltaX = positions[b] - positions[a];
        const deltaY = positions[b + 1] - positions[a + 1];
        const deltaZ = positions[b + 2] - positions[a + 2];
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ) || 1e-6;
        const correction = ((distance - linkLength[index]) / distance) * 0.5 * linkStiffness[index];
        positions[a] += deltaX * correction;
        positions[a + 1] += deltaY * correction;
        positions[a + 2] += deltaZ * correction;
        positions[b] -= deltaX * correction;
        positions[b + 1] -= deltaY * correction;
        positions[b + 2] -= deltaZ * correction;
      }
      positions.set(pinned);
    }

    computeNormals();
    smoothNormals();
  };

  return { positions, normals, uvs, indices, step };
}
