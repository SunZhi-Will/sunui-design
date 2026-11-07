import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { Icon, type IconName } from "@/registry/icons/sunui-icons";
import { PixelIcon, pigments, pixelIcons, toPixelPaths, type PixelIconName } from "@/registry/icons/sunui-pixel-icons";

export const metadata: Metadata = {
  title: "Color study: pigment",
  robots: { index: false },
};

/**
 * 顏色樣張（2026-11-07）：比較像素圖示的「墨」與「pigment」兩種上色。
 * 只是樣張，不進導覽，不進 registry。決定後再把 tone prop 做進 sunui-pixel-icons。
 * 背景：reports/顏色系統分析-黑白灰之外-2026-11-07.md
 */

// 這頁是 11-07 的研究稿，只比較最初的七種本色（鋼、骨、粉紅是之後補的）
type Pigment = Exclude<keyof typeof pigments, "steel" | "bone" | "pink">;
type Swatch = { tint: string; shade: string; main: string; deep: string };

// 油墨感：彩度壓低，明度分四階。tint 給「=」填色，shade 給「:」陰影，main 給「+」，deep 給「~」
const LIGHT: Record<Pigment, Swatch> = {
  red: { tint: "oklch(0.80 0.08 25)", shade: "oklch(0.58 0.14 25)", main: "oklch(0.60 0.16 25)", deep: "oklch(0.46 0.13 25)" },
  orange: { tint: "oklch(0.85 0.09 65)", shade: "oklch(0.68 0.14 55)", main: "oklch(0.72 0.15 60)", deep: "oklch(0.56 0.13 50)" },
  gold: { tint: "oklch(0.88 0.09 90)", shade: "oklch(0.70 0.12 80)", main: "oklch(0.80 0.13 88)", deep: "oklch(0.60 0.11 75)" },
  green: { tint: "oklch(0.85 0.08 145)", shade: "oklch(0.62 0.11 150)", main: "oklch(0.66 0.12 148)", deep: "oklch(0.50 0.10 152)" },
  blue: { tint: "oklch(0.83 0.06 240)", shade: "oklch(0.58 0.11 250)", main: "oklch(0.62 0.12 248)", deep: "oklch(0.47 0.11 255)" },
  violet: { tint: "oklch(0.82 0.06 305)", shade: "oklch(0.56 0.11 305)", main: "oklch(0.60 0.13 305)", deep: "oklch(0.45 0.11 305)" },
  brown: { tint: "oklch(0.80 0.05 65)", shade: "oklch(0.56 0.07 55)", main: "oklch(0.60 0.08 60)", deep: "oklch(0.45 0.06 55)" },
};

// 深色紙上：tint 降明度避免刺眼，陰影反而略亮，才分得出層次
const DARK: Record<Pigment, Swatch> = {
  red: { tint: "oklch(0.52 0.12 25)", shade: "oklch(0.40 0.10 25)", main: "oklch(0.66 0.15 25)", deep: "oklch(0.48 0.12 25)" },
  orange: { tint: "oklch(0.60 0.12 60)", shade: "oklch(0.46 0.10 55)", main: "oklch(0.74 0.14 62)", deep: "oklch(0.56 0.12 52)" },
  gold: { tint: "oklch(0.66 0.11 88)", shade: "oklch(0.50 0.09 80)", main: "oklch(0.82 0.12 90)", deep: "oklch(0.62 0.10 78)" },
  green: { tint: "oklch(0.56 0.10 148)", shade: "oklch(0.42 0.08 150)", main: "oklch(0.70 0.12 148)", deep: "oklch(0.52 0.10 150)" },
  blue: { tint: "oklch(0.52 0.09 248)", shade: "oklch(0.40 0.08 252)", main: "oklch(0.68 0.11 245)", deep: "oklch(0.50 0.10 250)" },
  violet: { tint: "oklch(0.50 0.09 305)", shade: "oklch(0.38 0.08 305)", main: "oklch(0.66 0.12 305)", deep: "oklch(0.48 0.10 305)" },
  brown: { tint: "oklch(0.50 0.05 62)", shade: "oklch(0.38 0.04 58)", main: "oklch(0.62 0.07 60)", deep: "oklch(0.46 0.05 56)" },
};

/** 物件本色：只標「本身就有顏色」的東西；沒列的維持墨色（控制符號、紙品、介面） */
const OBJECT: Partial<Record<PixelIconName, Pigment>> = {
  heart: "red",
  "heart-half": "red",
  apple: "red",
  potion: "red",
  meat: "red",
  flag: "red",
  gift: "red",
  fire: "orange",
  torch: "orange",
  coin: "gold",
  crown: "gold",
  key: "gold",
  trophy: "gold",
  star: "gold",
  sparkle: "gold",
  ring: "gold",
  bell: "gold",
  flash: "gold",
  hourglass: "gold",
  slime: "green",
  battery: "green",
  gem: "blue",
  orb: "blue",
  snowflake: "blue",
  fish: "blue",
  shield: "blue",
  book: "blue",
  wand: "violet",
  amulet: "violet",
  dice: "violet",
  chest: "brown",
  door: "brown",
  bow: "brown",
  boots: "brown",
  scroll: "brown",
  map: "brown",
};

function PigmentIcon({ name, pigment, size = 32 }: { name: PixelIconName; pigment?: Pigment; size?: number }) {
  // 用正式元件：pigment 有值就上色，沒有就是墨色
  return <PixelIcon name={name} size={size} pigment={pigment} />;
}

/** 剪影測試：所有非空格子都塗成墨色，1x 並排看輪廓認不認得出來 */
function Silhouette({ name, size = 16 }: { name: PixelIconName; size?: number }) {
  const d = Object.entries(toPixelPaths(pixelIcons[name]))
    .map(([, path]) => path)
    .join("");
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

const SILHOUETTE: PixelIconName[] = [
  "potion", "orb", "bomb", "gem", "apple", "slime", "key", "sword", "dagger", "wand", "star", "crown",
  "trophy", "coin", "ring", "amulet", "heart", "shield", "chest", "scroll", "map", "fish", "meat", "fire",
];

function vars(swatches: Record<Pigment, Swatch>) {
  const out: Record<string, string> = {};
  for (const [p, s] of Object.entries(swatches)) {
    for (const [k, c] of Object.entries(s)) out[`--${p}-${k}`] = c;
  }
  return out;
}

const PAPER = {
  light: { bg: "#ffffff", paper: "#f7f7f7", edge: "#e2e2e2", ink: "#171717", soft: "#737373", shine: "#ffffff", sw: LIGHT },
  dark: { bg: "#0a0a0a", paper: "#1c1c1c", edge: "#333333", ink: "#ededed", soft: "#a3a3a3", shine: "#ededed", sw: DARK },
} as const;

// 意義色 token：狀態只上在圖示與小字
const STATUS = {
  light: { ok: "oklch(0.55 0.10 150)", warn: "oklch(0.62 0.11 75)", bad: "oklch(0.55 0.13 25)", spot: "oklch(0.50 0.12 255)" },
  dark: { ok: "oklch(0.72 0.10 150)", warn: "oklch(0.78 0.11 80)", bad: "oklch(0.70 0.13 25)", spot: "oklch(0.72 0.11 250)" },
} as const;

const GAME: PixelIconName[] = [
  "potion", "apple", "meat", "heart", "fire", "torch", "coin", "crown", "key", "sword", "star", "ring",
  "slime", "gem", "orb", "snowflake", "fish", "shield", "wand", "amulet", "dice", "chest", "door", "scroll",
];

const CONFUSABLE: PixelIconName[] = ["potion", "orb", "bomb", "gem", "apple", "slime"];

const RARITY: { label: string; pigment?: Pigment }[] = [
  { label: "Common" },
  { label: "Rare", pigment: "blue" },
  { label: "Epic", pigment: "violet" },
  { label: "Legendary", pigment: "gold" },
];

const INVENTORY: { name: PixelIconName; qty: string }[] = [
  { name: "potion", qty: "x3" },
  { name: "coin", qty: "1,280" },
  { name: "key", qty: "x1" },
  { name: "apple", qty: "x6" },
  { name: "gem", qty: "x2" },
  { name: "scroll", qty: "x1" },
];

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: "var(--soft)", margin: "0 0 10px", letterSpacing: "0.02em" }}>{children}</p>;
}

function Panel({ mode }: { mode: "light" | "dark" }) {
  const p = PAPER[mode];
  const s = STATUS[mode];
  const style = {
    ...vars(p.sw),
    "--shine": p.shine,
    "--soft": p.soft,
    colorScheme: mode,
    background: p.bg,
    color: p.ink,
    padding: 28,
    display: "grid",
    gap: 28,
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  } as CSSProperties;
  const card: CSSProperties = { background: p.paper, border: `1px solid ${p.edge}`, borderRadius: 6, padding: 16 };

  return (
    <section style={style} data-mode={mode}>
      <h2 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{mode === "light" ? "Light" : "Dark"}</h2>

      <div>
        <Label>Study palettes (first draft, for reference; icons below use the shipped ramps)</Label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(Object.keys(p.sw) as Pigment[]).map((k) => (
            <div key={k} style={{ display: "grid", gap: 4, justifyItems: "start" }}>
              <div style={{ display: "flex" }}>
                {(["tint", "shade", "main", "deep"] as const).map((t) => (
                  <span key={t} style={{ width: 16, height: 24, background: p.sw[k][t] }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: p.soft }}>{k}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>A. Ink (current) vs pigment, 32px</Label>
        <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(12, 1fr)", rowGap: 14, columnGap: 6 }}>
          {GAME.map((n) => (
            <div key={n} style={{ display: "grid", justifyItems: "center", gap: 4 }}>
              <PigmentIcon name={n} />
              <PigmentIcon name={n} pigment={OBJECT[n]} />
              <span style={{ fontSize: 9, color: p.soft }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <Label>B. Easy to confuse at 16px</Label>
          <div style={{ ...card, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>
              {CONFUSABLE.map((n) => <PigmentIcon key={n} name={n} size={16} />)}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {CONFUSABLE.map((n) => <PigmentIcon key={n} name={n} size={16} pigment={OBJECT[n]} />)}
            </div>
          </div>
        </div>
        <div>
          <Label>C. Rarity, gem 48px</Label>
          <div style={{ ...card, display: "grid", gap: 10 }}>
            {[false, true].map((on) => (
              <div key={String(on)} style={{ display: "flex", gap: 14 }}>
                {RARITY.map((r) => (
                  <div key={r.label} style={{ display: "grid", justifyItems: "center", gap: 2 }}>
                    <PigmentIcon name="gem" size={48} pigment={on ? r.pigment : undefined} />
                    <span style={{ fontSize: 9, color: p.soft }}>{r.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>D. In context: inventory strip</Label>
        <div style={{ display: "grid", gap: 8 }}>
          {[false, true].map((on) => (
            <div key={String(on)} style={{ ...card, display: "flex", gap: 18, padding: "12px 16px" }}>
              {INVENTORY.map((it) => (
                <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <PigmentIcon name={it.name} size={32} pigment={on ? OBJECT[it.name] : undefined} />
                  <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{it.qty}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>F. Silhouette test at 16px (every pixel in ink), then the real ink icon</Label>
        <div style={{ ...card, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {SILHOUETTE.map((n) => <Silhouette key={n} name={n} />)}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {SILHOUETTE.map((n) => <PixelIcon key={n} name={n} size={16} />)}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {SILHOUETTE.map((n) => <PixelIcon key={n} name={n} size={16} tone="pigment" />)}
          </div>
        </div>
      </div>

      <div>
        <Label>E. Line icons: ink vs status tokens and one spot</Label>
        <div style={{ display: "grid", gap: 8 }}>
          {[false, true].map((on) => (
            <div key={String(on)} style={{ ...card, display: "flex", gap: 22, alignItems: "center", padding: "12px 16px", fontSize: 12 }}>
              {(
                [
                  ["check", "Claimed", s.ok],
                  ["alert", "Expires in 2h", s.warn],
                  ["close", "Payment failed", s.bad],
                ] as [IconName, string, string][]
              ).map(([n, t, c]) => (
                <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: on ? c : undefined, display: "inline-flex" }}>
                    <Icon name={n} size={18} />
                  </span>
                  {t}
                </span>
              ))}
              <span
                style={
                  {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginLeft: "auto",
                    "--sunui-icon-accent": on ? s.spot : undefined,
                  } as CSSProperties
                }
              >
                <Icon name="punch-card" size={22} />
                Spot = brand
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ColorStudyPage() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minWidth: 1500 }}>
      <Panel mode="light" />
      <Panel mode="dark" />
    </main>
  );
}
