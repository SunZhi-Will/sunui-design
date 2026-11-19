"use client";

import { cn } from "@/lib/utils";

/* Isometric mini scenes for tiny-chart: props and people are all drawn in code, using only flat-filled surface polygons and thin lines, with no images, gradients or shadows.
   Coordinates are world coordinates (x, y, z): y is the direction of the flow (toward lower right on screen), x is the branch direction (toward lower left), z is up. */

export type Pt = [number, number];

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const ISO_C = Math.cos(Math.PI / 6);
export const ISO_S = 0.5;
/** Project world coordinates to the screen, reading from upper left to lower right */
export const iso = (x: number, y: number, z = 0): Pt => [r1((y - x) * ISO_C), r1((x + y) * ISO_S - z)];

/** Props that can sit beside a step */
export const tinyProps = ["home", "shop", "counter", "warehouse", "parcels", "truck", "house", "shelf", "post"] as const;
export type TinyProp = (typeof tinyProps)[number];
/** Scene beside a step: just a prop name, or add a person standing next to it */
export type TinyScene = TinyProp | { prop: TinyProp; person?: boolean };

type Tone = "paper" | "card" | "ink";
/** Three lightness steps of the same surface: top is lightest, front next, side darkest */
const FILL: Record<Tone, { top: string; front: string; side: string }> = {
  paper: { top: "fill-card", front: "fill-[#e8e8e8] dark:fill-[#272727]", side: "fill-[#dbdbdb] dark:fill-[#131313]" },
  card: { top: "fill-[#e3e3e3] dark:fill-foreground/10", front: "fill-foreground/15 dark:fill-[#282828]", side: "fill-[#c2c2c2] dark:fill-[#1a1a1a]" },
  ink: { top: "fill-muted-foreground", front: "fill-[#404040] dark:fill-[#8a8a8a]", side: "fill-[#262626] dark:fill-[#666666]" },
};

export type ScenePart =
  | { kind: "poly"; pts: Pt[]; fill: string }
  | { kind: "line"; pts: Pt[] }
  | { kind: "person"; at: Pt; tone: PersonTone };

/** Stack boxes at an anchor in world coordinates; call each method in far-to-near order, since drawing stacks in call order */
/** Prop scale in world coordinates: keeps doors, desks, counters and people (about 35 tall) in believable proportion */
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
  /** A plane on the +y face: doors, windows, screens */
  face(x: number, y: number, z: number, w: number, h: number, fill: string) {
    const { p } = this;
    return this.poly([p(x, y, z), p(x + w, y, z), p(x + w, y, z + h), p(x, y, z + h)], fill);
  }
  /** A plane on the +x face */
  flank(x: number, y: number, z: number, d: number, h: number, fill: string) {
    const { p } = this;
    return this.poly([p(x, y, z), p(x, y + d, z), p(x, y + d, z + h), p(x, y, z + h)], fill);
  }
  /** Gable roof with its ridge along x */
  roof(x: number, y: number, z: number, w: number, d: number, rh: number, tone: Tone = "card") {
    const { p } = this, f = FILL[tone], [x1, ym, y1, zt] = [x + w, y + d / 2, y + d, z + rh];
    this.poly([p(x, y, z), p(x1, y, z), p(x1, ym, zt), p(x, ym, zt)], f.side);
    this.poly([p(x1, y, z), p(x1, y1, z), p(x1, ym, zt)], FILL.paper.front);
    return this.poly([p(x, ym, zt), p(x1, ym, zt), p(x1, y1, z), p(x, y1, z)], f.top);
  }
  /** Wheel standing on the +y face (octagon) */
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

/** Footprint of each prop (world units) and how it is drawn; person is where someone standing in front of the prop stands */
const PROPS: Record<TinyProp, { w: number; d: number; h: number; person: [number, number]; draw: (s: Sketch) => Sketch }> = {
  // Desk at home: legs, tabletop, laptop, mug
  home: {
    w: 64, d: 40, h: 36, person: [0, 30],
    draw: (s) =>
      s.cube(-28, -16, 0, 3, 3, 18, "card").cube(25, -16, 0, 3, 3, 18, "card").cube(-28, 13, 0, 3, 3, 18, "card").cube(25, 13, 0, 3, 3, 18, "card")
        .cube(-30, -18, 18, 60, 36, 3, "card")
        .face(-6, -6, 22.5, 18, 12, FILL.ink.front)
        .cube(-6, -6, 21, 18, 12, 1.5, "paper")
        .cube(-22, 4, 21, 5, 5, 6, "paper"),
  },
  // Storefront: gable roof, door, window, awning over the door
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
  // Service desk: counter, countertop, sign, a person behind the counter
  counter: {
    w: 64, d: 40, h: 40, person: [0, 24],
    draw: (s) =>
      s.cube(-12, -19, 17, 2, 2, 12, "ink").cube(10, -19, 17, 2, 2, 12, "ink")
        .cube(-16, -20, 29, 32, 3, 10, "paper")
        .person(0, -12, 0, "ink")
        .cube(-30, -6, 0, 60, 14, 15, "card")
        .cube(-32, -8, 15, 64, 18, 2, "paper"),
  },
  // Warehouse: wide low volume, flat roof, roll-up door
  warehouse: {
    w: 84, d: 64, h: 38, person: [24, 42],
    draw: (s) =>
      s.cube(-40, -30, 0, 80, 60, 34, "card")
        .cube(-42, -32, 34, 84, 64, 3, "paper")
        .face(-14, 30, 0, 28, 24, FILL.paper.front)
        .line([-14, 30, 6], [14, 30, 6]).line([-14, 30, 12], [14, 30, 12]).line([-14, 30, 18], [14, 30, 18]),
  },
  // A stack of parcels, with sealing tape on the top face
  parcels: {
    w: 40, d: 30, h: 24, person: [0, 26],
    draw: (s) =>
      s.cube(4, -12, 0, 16, 16, 12, "card").line([12, -12, 12], [12, 4, 12])
        .cube(-18, -10, 0, 20, 18, 14, "card").line([-8, -10, 14], [-8, 8, 14])
        .cube(-12, -8, 14, 14, 12, 10, "card").line([-5, -8, 24], [-5, 4, 24]),
  },
  // Truck: cargo box, cab, windows, two wheels
  truck: {
    w: 64, d: 26, h: 36, person: [-14, 26],
    draw: (s) =>
      s.cube(-30, -13, 4, 46, 26, 32, "paper")
        .cube(16, -13, 4, 16, 26, 24, "card")
        .flank(32, -8, 18, 16, 8, FILL.ink.side)
        .wheel(-20, 13.2, 5, 5).wheel(22, 13.2, 5, 5),
  },
  // House: gable roof, door, window, chimney
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
  // Shelving: two side panels, four shelves, boxes on top
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
  // Mailbox: post, body, mail slot, top cap
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
  /** Footprint in world coordinates, used to lay out the floor grid lines */
  footprint: { x0: number; x1: number; y0: number; y1: number };
  depth: number;
}

/**
 * Put a scene beside a block: side -1 places it upper right on screen (far side), +1 lower left (near side).
 * blockX and blockY are the block center; blockW is the block length along x.
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

const INK_LINE = "stroke-foreground";
const SHIRT: Record<PersonTone, string> = {
  card: FILL.card.front,
  ink: FILL.ink.front,
  red: "fill-foreground",
};

/** A figure: feet at (0, 0), about 35 tall; red is the one walking the flow */
export function Figure({ tone = "card" }: { tone?: PersonTone }) {
  return (
    <g transform="scale(1.1)">
      <path d="M-2.6 0 V-9 M2.6 0 V-9" strokeWidth="2.4" strokeLinecap="round" className={INK_LINE} />
      <rect x="-5.5" y="-22" width="11" height="14" rx="4.5" strokeWidth="1.2" className={cn(SHIRT[tone], INK_LINE)} />
      <circle cy="-27" r="4.6" strokeWidth="1.2" className={cn(FILL.paper.top, INK_LINE)} />
      <path d="M-4.6 -27.6 a4.6 4.6 0 0 1 9.2 0 q-4.6 -1.6 -9.2 0 z" className="fill-foreground" />
    </g>
  );
}

/** Draw a set of scene parts */
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
