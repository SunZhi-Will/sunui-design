"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { recipes, type AnimatedIconName } from "@/registry/icons/sunui-animated-icons";
import { pixelRecipes, type AnimatedPixelIconName } from "@/registry/icons/sunui-animated-pixel-icons";
import { Icon, iconNames, icons, type IconName, type IconNode } from "@/registry/icons/sunui-icons";
import {
  PixelIcon,
  pixelIconNames,
  pixelIcons,
  PixelPathsGroup,
  toPixelPaths,
  type PixelIconName,
} from "@/registry/icons/sunui-pixel-icons";

/**
 * 圖示自檢頁的內容，給 scripts/check-icons.mjs 用無頭瀏覽器截圖。
 * 不播動畫：動態版的每個時間點都直接算成靜態的一格，截圖才不會停在半路。
 * - sizes：每個圖示在三種尺寸下的樣子
 * - frames：動態版。線條版是 rest，以及 active 的 0%、25%、50%、75%、100%；像素版是靜止格加每一格影格
 * 參考框：線條版虛線是 3 到 21 的內容區；像素版實線是 16 格邊界，影格畫出框外的部分會露在外面。
 */

export type CheckSet = "line" | "pixel";
export type CheckSheet = "sizes" | "frames";
export type CheckTheme = "light" | "dark";

type Props = {
  set: CheckSet;
  sheet: CheckSheet;
  theme: CheckTheme;
  only: string[];
  refs: string[];
  accent: boolean;
  /** 1 起算的頁碼；圖示多時分頁，截圖才不會高到看不清 */
  page: number;
  per: number;
};

const themes = {
  light: { background: "#faf9f6", ink: "#1c1b19", muted: "#8a867e", guide: "#d9d5cc", accent: "#c8361d" },
  dark: { background: "#161513", ink: "#ece9e2", muted: "#8a867e", guide: "#3a3732", accent: "#ec6a4f" },
} as const;

const LINE_SIZES = [16, 24, 48];
const PIXEL_SIZES = [16, 32, 48];
const FRAME_SIZE = 48;
const PROGRESS = [0, 0.25, 0.5, 0.75, 1];

export function IconCheckSheet({ set, sheet, theme, only, refs, accent, page, per }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const palette = themes[theme];

  const all: readonly string[] = set === "line" ? iconNames : pixelIconNames;
  const animated: readonly string[] = set === "line" ? Object.keys(recipes) : Object.keys(pixelRecipes);
  const requested = [...refs, ...only];
  const unknown = requested.filter((name) => !all.includes(name));
  const base = sheet === "frames" ? animated : all;
  const everything = requested.length ? requested.filter((name) => all.includes(name)) : [...base];
  const pages = Math.max(1, Math.ceil(everything.length / per));
  const current = Math.min(Math.max(1, page), pages);
  const names = everything.slice((current - 1) * per, current * per);
  const refSet = new Set(refs);

  // 截圖腳本讀這些屬性：尺寸決定視窗大小，unknown 讓它報錯
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!el) return;
    root.dataset.unknown = unknown.join(",");
    root.dataset.pages = String(pages);
    root.dataset.w = String(Math.ceil(el.scrollWidth));
    root.dataset.h = String(Math.ceil(el.scrollHeight));
    root.dataset.ready = "1";
  });

  const style = {
    background: palette.background,
    color: palette.ink,
    "--sunui-icon-accent": accent ? palette.accent : palette.ink,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 11,
    padding: 24,
    width: "max-content",
    minWidth: "100%",
  } as CSSProperties;

  return (
    <div ref={ref} data-check-sheet style={style}>
      <p style={{ color: palette.muted, marginBottom: 16 }}>
        {set} · {sheet} · {theme}
        {accent ? "" : " · accent off"}
        {pages > 1 ? ` · page ${current}/${pages}` : ""}
        {unknown.length ? ` · unknown: ${unknown.join(", ")}` : ""}
      </p>
      {sheet === "sizes" ? (
        <SizesSheet set={set} names={names} refSet={refSet} palette={palette} />
      ) : (
        <FramesSheet set={set} names={names} animated={animated} refSet={refSet} palette={palette} />
      )}
    </div>
  );
}

type Palette = (typeof themes)[CheckTheme];

function Label({ name, isRef, palette, extra }: { name: string; isRef: boolean; palette: Palette; extra?: string }) {
  return (
    <span style={{ color: isRef ? palette.muted : palette.ink, whiteSpace: "nowrap" }}>
      {name}
      {isRef ? " (ref)" : ""}
      {extra ? <span style={{ color: palette.muted }}> {extra}</span> : null}
    </span>
  );
}

function SizesSheet({ set, names, refSet, palette }: { set: CheckSet; names: string[]; refSet: Set<string>; palette: Palette }) {
  const sizes = set === "line" ? LINE_SIZES : PIXEL_SIZES;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 168px)", gap: 8 }}>
      {names.map((name) => (
        <div key={name} style={{ border: `1px solid ${palette.guide}`, borderRadius: 6, padding: 10 }}>
          <Label name={name} isRef={refSet.has(name)} palette={palette} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 10 }}>
            {sizes.map((size) =>
              set === "line" ? (
                <Icon key={size} name={name as IconName} size={size} strokeWidth={size >= 32 ? 1.25 : 1.5} />
              ) : (
                <PixelIcon key={size} name={name as PixelIconName} size={size} />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FramesSheet({
  set,
  names,
  animated,
  refSet,
  palette,
}: {
  set: CheckSet;
  names: string[];
  animated: readonly string[];
  refSet: Set<string>;
  palette: Palette;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {set === "line" && (
        <Row label={<span style={{ color: palette.muted }}>progress</span>}>
          {["rest", ...PROGRESS.map((t) => `${t * 100}%`)].map((head) => (
            <span key={head} style={{ width: FRAME_SIZE + 16, color: palette.muted, textAlign: "center" }}>
              {head}
            </span>
          ))}
        </Row>
      )}
      {names.map((name) => {
        const isRef = refSet.has(name);
        if (!animated.includes(name)) {
          return (
            <Row key={name} label={<Label name={name} isRef={isRef} palette={palette} extra="static only" />}>
              <Cell palette={palette} set={set}>
                {set === "line" ? (
                  <Icon name={name as IconName} size={FRAME_SIZE} strokeWidth={1.25} />
                ) : (
                  <PixelIcon name={name as PixelIconName} size={FRAME_SIZE} />
                )}
              </Cell>
            </Row>
          );
        }
        if (set === "line") {
          const recipe = recipes[name as AnimatedIconName] as unknown as LineRecipe;
          return (
            <Row key={name} label={<Label name={name} isRef={isRef} palette={palette} extra={recipe.kind} />}>
              <Cell palette={palette} set={set}>
                <LinePose name={name as AnimatedIconName} at={null} />
              </Cell>
              {PROGRESS.map((t) => (
                <Cell key={t} palette={palette} set={set}>
                  <LinePose name={name as AnimatedIconName} at={t} />
                </Cell>
              ))}
            </Row>
          );
        }
        const recipe = pixelRecipes[name as AnimatedPixelIconName] as PixelRecipe;
        const rest = recipe.rest ? decodeFrame(recipe.rest) : [...pixelIcons[name as PixelIconName]];
        return (
          <Row
            key={name}
            label={<Label name={name} isRef={isRef} palette={palette} extra={`${recipe.kind} · ${recipe.fps}fps`} />}
          >
            <Cell palette={palette} set={set} caption="rest">
              <PixelFrame rows={rest} />
            </Cell>
            {recipe.frames.map((frame, i) => (
              <Cell key={i} palette={palette} set={set} caption={String(i + 1)}>
                <PixelFrame rows={decodeFrame(frame)} />
              </Cell>
            ))}
          </Row>
        );
      })}
    </div>
  );
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 190, flex: "none" }}>{label}</div>
      {children}
    </div>
  );
}

/** 一格：框住 48px 的圖示，畫出參考框 */
function Cell({ children, palette, set, caption }: { children: ReactNode; palette: Palette; set: CheckSet; caption?: string }) {
  const unit = FRAME_SIZE / (set === "line" ? 24 : 16);
  const guide: CSSProperties =
    set === "line"
      ? { inset: 3 * unit, border: `1px dashed ${palette.guide}` }
      : { inset: 0, border: `1px solid ${palette.guide}` };
  return (
    <div style={{ width: FRAME_SIZE + 16, flex: "none", textAlign: "center" }}>
      <div style={{ position: "relative", width: FRAME_SIZE, height: FRAME_SIZE, margin: "8px auto" }}>
        <span aria-hidden style={{ position: "absolute", ...guide }} />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
      {caption ? <span style={{ color: palette.muted }}>{caption}</span> : null}
    </div>
  );
}

// ---------- 像素版：直接解出每一格 ----------

type PixelRecipe = { kind: string; fps: number; rest?: string; frames: readonly string[] };

const decodeRow = (row: string) => row.replace(/(\d+)(\D)/g, (_, n: string, ch: string) => ch.repeat(Number(n)));
const decodeFrame = (frame: string) => frame.split("/").map(decodeRow);

function PixelFrame({ rows }: { rows: string[] }) {
  // 20 列的影格以 (-2, -2) 為原點，與元件相同
  const paths = toPixelPaths(rows, -(rows.length - 16) / 2);
  return (
    <svg viewBox="0 0 16 16" width={FRAME_SIZE} height={FRAME_SIZE} shapeRendering="crispEdges" overflow="visible" aria-hidden>
      <PixelPathsGroup paths={paths} />
    </svg>
  );
}

// ---------- 線條版：把 recipe 在某個時間點的姿勢算出來 ----------

type Values = Record<string, unknown>;
type LinePart = { active: Values; rest?: Values; origin?: [number, number] };
type LineRecipe = { kind: string; nodes?: IconNode[]; parts?: Record<number, LinePart>; whole?: LinePart };

const IDENTITY: Record<string, number> = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1, pathLength: 1 };
const ACCENT = "var(--sunui-icon-accent, currentColor)";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 同結構的 path 字串逐數插值；結構不同就在一半時切換 */
function lerpPath(a: string, b: string, t: number) {
  const num = /-?\d*\.?\d+(?:e-?\d+)?/g;
  const na = a.match(num) ?? [];
  const nb = b.match(num) ?? [];
  if (na.length !== nb.length || a.replace(num, "#") !== b.replace(num, "#")) return t < 0.5 ? a : b;
  let i = 0;
  return b.replace(num, () => {
    const v = lerp(Number(na[i]), Number(nb[i]), t);
    i += 1;
    return String(Math.round(v * 1000) / 1000);
  });
}

function lerpValue(a: unknown, b: unknown, t: number): unknown {
  if (typeof a === "number" && typeof b === "number") return lerp(a, b, t);
  if (typeof a === "string" && typeof b === "string") return lerpPath(a, b, t);
  return t < 0.5 ? a : b;
}

/** 關鍵影格陣列平均分配時間，取 t 的位置 */
function sampleKeyframes(frames: unknown[], t: number) {
  if (frames.length === 1) return frames[0];
  const pos = t * (frames.length - 1);
  const i = Math.min(frames.length - 2, Math.floor(pos));
  return lerpValue(frames[i], frames[i + 1], pos - i);
}

function restOf(part: LinePart): Values {
  if (part.rest) return part.rest;
  return Object.fromEntries(
    Object.entries(part.active)
      .filter(([key]) => key !== "transition")
      .map(([key, value]) => [key, Array.isArray(value) ? value[value.length - 1] : IDENTITY[key]]),
  );
}

/** at 為 null 是 rest；否則是 active 播到 t 的姿勢 */
function poseOf(part: LinePart, at: number | null): Values {
  const rest = restOf(part);
  if (at === null) return rest;
  const out: Values = {};
  for (const [key, value] of Object.entries(part.active)) {
    if (key === "transition") continue;
    out[key] = Array.isArray(value) ? sampleKeyframes(value, at) : lerpValue(rest[key] ?? IDENTITY[key], value, at);
  }
  return out;
}

function transformOf(pose: Values, origin: [number, number] = [12, 12]) {
  const n = (key: string) => (typeof pose[key] === "number" ? (pose[key] as number) : IDENTITY[key]);
  const [ox, oy] = origin;
  const sx = n("scale") * n("scaleX");
  const sy = n("scale") * n("scaleY");
  const parts = [`translate(${n("x")} ${n("y")})`, `translate(${ox} ${oy})`];
  if (n("rotate")) parts.push(`rotate(${n("rotate")})`);
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx} ${sy})`);
  parts.push(`translate(${-ox} ${-oy})`);
  return parts.join(" ");
}

function LinePose({ name, at }: { name: AnimatedIconName; at: number | null }) {
  const recipe = recipes[name] as unknown as LineRecipe;
  const nodes: readonly IconNode[] = recipe.nodes ?? icons[name as IconName];
  const children = nodes.map((node, i) => {
    const part = recipe.parts?.[i];
    const pose = part ? poseOf(part, at) : {};
    return <PoseNode key={i} node={node} pose={pose} origin={part?.origin} />;
  });
  const whole = recipe.whole ? poseOf(recipe.whole, at) : null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={FRAME_SIZE}
      height={FRAME_SIZE}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      overflow="visible"
      aria-hidden
    >
      {whole ? (
        <g transform={transformOf(whole, recipe.whole?.origin)} opacity={whole.opacity as number | undefined}>
          {children}
        </g>
      ) : (
        children
      )}
    </svg>
  );
}

function PoseNode({ node, pose, origin }: { node: IconNode; pose: Values; origin?: [number, number] }) {
  const n = typeof node === "string" ? { d: node } : node;
  const paint = n.accent ? ACCENT : "currentColor";
  const length = typeof pose.pathLength === "number" ? Math.max(0, Math.min(1, pose.pathLength)) : 1;
  const props = {
    stroke: n.fill ? "none" : n.accent ? paint : undefined,
    fill: n.fill ? paint : undefined,
    transform: transformOf(pose, origin),
    opacity: typeof pose.opacity === "number" ? pose.opacity : undefined,
    ...(length < 1 ? { pathLength: 1, strokeDasharray: `${length} 2` } : { strokeDasharray: n.dash }),
  };
  if ("d" in n) return <path {...props} d={typeof pose.d === "string" ? pose.d : n.d} />;
  if ("c" in n) {
    const r = typeof pose.r === "number" ? pose.r : n.c[2];
    return <circle {...props} cx={n.c[0]} cy={n.c[1]} r={r} />;
  }
  const [x, y, width, height, rx] = n.r;
  return <rect {...props} x={x} y={y} width={width} height={height} rx={rx} />;
}
