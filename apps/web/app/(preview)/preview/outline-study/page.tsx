import type { CSSProperties } from "react";
import type { Metadata } from "next";

import {
  pigmentTones,
  pixelIcons,
  pixelPigments,
  pixelTones,
  type Pigment,
  type PixelIconName,
} from "@/registry/icons/sunui-pixel-icons";

export const metadata: Metadata = {
  title: "Outline study",
  robots: { index: false },
};

/**
 * 外框樣張（2026-11-07）：16 格裡外框已經是 1 格，不能再細，只能降低它的份量。
 * 比較四種做法，選定後再做進 sunui-pixel-icons。只是樣張，不進導覽與 registry。
 */

type Variant = "current" | "inner" | "soft" | "selout";

const VARIANTS: { key: Variant; title: string; note: string }[] = [
  { key: "current", title: "A. Current", note: "Every outline pixel in full ink" },
  { key: "inner", title: "B. Inner lines to shade", note: "Outer edge stays ink; lines inside the shape use the shade tone" },
  { key: "soft", title: "C. B + softer outer edge", note: "Outer edge at 70% ink (pigment: darkest hue tone)" },
  { key: "selout", title: "D. B + lit edge", note: "Top and left outer edge use the shade tone, bottom and right stay ink" },
];

const NAMES: PixelIconName[] = [
  "potion", "apple", "heart", "coin", "crown", "key", "sword", "star", "gem", "orb", "shield", "chest",
  "slime", "fire", "scroll", "trophy", "cart", "gift", "coupon", "bell", "lock", "mail", "home", "store",
];

type Kind = "outer" | "outerLit" | "inner";

/** 從邊界灌水找出外部空格；碰到外部的「#」是外框，其餘是內線。外部在上方或左方的外框是受光邊 */
function classify(rows: readonly string[]) {
  const h = rows.length;
  const w = rows[0].length;
  const outside = rows.map((r) => [...r].map(() => false));
  const stack: [number, number][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if ((y === 0 || x === 0 || y === h - 1 || x === w - 1) && rows[y][x] === ".") stack.push([x, y]);
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h || outside[y][x] || rows[y][x] !== ".") continue;
    outside[y][x] = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const out = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || outside[y][x];
  const kinds: (Kind | null)[][] = rows.map((r, y) =>
    [...r].map((c, x) => {
      if (c !== "#") return null;
      const up = out(x, y - 1);
      const left = out(x - 1, y);
      const down = out(x, y + 1);
      const right = out(x + 1, y);
      if (!up && !left && !down && !right) return "inner";
      return (up || left) && !down && !right ? "outerLit" : "outer";
    }),
  );
  return kinds;
}

function StudyIcon({ name, variant, pigment, size }: { name: PixelIconName; variant: Variant; pigment?: Pigment; size: number }) {
  const rows = pixelIcons[name];
  const kinds = classify(rows);
  const tones = pigment ? pigmentTones(pigment) : pixelTones;
  const tone = (ch: string) => tones.find((t) => t.char === ch)!;
  const shade = tone(":");
  const deep = tone("~");

  const rects: { x: number; y: number; fill: string; opacity: number }[] = [];
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      if (ch !== "#") {
        const t = tone(ch);
        rects.push({ x, y, fill: t.fill, opacity: t.opacity });
        return;
      }
      const k = kinds[y][x];
      if (variant === "current") return rects.push({ x, y, fill: "currentColor", opacity: 1 });
      if (k === "inner") return rects.push({ x, y, fill: shade.fill, opacity: shade.opacity });
      if (variant === "soft")
        return rects.push(pigment ? { x, y, fill: deep.fill, opacity: 1 } : { x, y, fill: "currentColor", opacity: 0.7 });
      if (variant === "selout" && k === "outerLit") return rects.push({ x, y, fill: shade.fill, opacity: shade.opacity });
      rects.push({ x, y, fill: "currentColor", opacity: 1 });
    }),
  );

  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={1} height={1} fill={r.fill} fillOpacity={r.opacity === 1 ? undefined : r.opacity} />
      ))}
    </svg>
  );
}

const PAPER = {
  light: { bg: "#ffffff", paper: "#f7f7f7", edge: "#e2e2e2", ink: "#171717", soft: "#737373", shine: "#ffffff" },
  dark: { bg: "#0a0a0a", paper: "#1c1c1c", edge: "#333333", ink: "#ededed", soft: "#a3a3a3", shine: "#ededed" },
} as const;

function Panel({ mode }: { mode: "light" | "dark" }) {
  const p = PAPER[mode];
  const style = {
    "--sunui-pixel-shine": p.shine,
    colorScheme: mode,
    background: p.bg,
    color: p.ink,
    padding: 24,
    display: "grid",
    gap: 18,
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  } as CSSProperties;
  const card: CSSProperties = { background: p.paper, border: `1px solid ${p.edge}`, borderRadius: 6, padding: 14, display: "grid", gap: 10 };

  return (
    <section style={style} data-mode={mode}>
      <h2 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{mode === "light" ? "Light" : "Dark"}</h2>
      {VARIANTS.map((v) => (
        <div key={v.key}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>{v.title}</p>
          <p style={{ fontSize: 11, color: p.soft, margin: "0 0 8px" }}>{v.note}</p>
          <div style={card}>
            {[false, true].map((on) => (
              <div key={String(on)} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {NAMES.map((n) => (
                  <StudyIcon key={n} name={n} variant={v.key} size={32} pigment={on ? pixelPigments[n] : undefined} />
                ))}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10 }}>
              {NAMES.map((n) => (
                <StudyIcon key={n} name={n} variant={v.key} size={16} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function OutlineStudyPage() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minWidth: 1700 }}>
      <Panel mode="light" />
      <Panel mode="dark" />
    </main>
  );
}
