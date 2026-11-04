"use client";

import { motion, useReducedMotion, type TargetAndTransition, type Transition, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type SVGProps } from "react";

import { icons, type IconName, type IconNode } from "./sunui-icons";

/**
 * SunUI Animated Icons
 *
 * 與 sunui-icons 共用同一套 24 網格幾何，只加動作。動作遵守 DESIGN.md：
 * - 只回應使用者動作或狀態改變：hover / focus 父元素時播放，或用 active 控制狀態。
 * - 單次動作 400ms 以內；常駐循環只給載入中（loader、status）。
 * - 有重量的瞬間（蓋章、填滿）用 stamp 彈簧，其餘用 gentle。
 * - useReducedMotion 為真時直接切到結果，資訊不遺失。
 */

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const satisfies Record<string, Transition>;

const ONCE: Transition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] };

/**
 * hover：滑過或聚焦時播放（陣列值是一次性關鍵影格，單一值是滑過期間維持的狀態）
 * toggle：兩種狀態之間切換，用 active 控制
 * loop：active 期間持續循環，只用於載入與即時狀態
 */
export type MotionKind = "hover" | "toggle" | "loop";

type Part = {
  active: TargetAndTransition;
  rest?: TargetAndTransition;
  /** 變形中心，使用圖示座標（0 到 24），預設 [12, 12] */
  origin?: [number, number];
};

type Recipe = {
  kind: MotionKind;
  /** 需要拆開或變形的圖示自帶幾何，否則沿用同名靜態圖示 */
  nodes?: IconNode[];
  parts?: Record<number, Part>;
  whole?: Part;
};

const HEART = "M12 19.5s-7.5-4.4-7.5-10A4.25 4.25 0 0 1 12 7a4.25 4.25 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z";
const STAR = "M12 3.8l2.5 5.2 5.6.8-4.1 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z";
const BOOKMARK = "M7 4.5h10V20l-5-3.5L7 20z";

export const recipes = {
  // 介面
  check: { kind: "hover", parts: { 0: { active: { pathLength: [0, 1] } } } },
  copy: { kind: "hover", parts: { 1: { active: { x: [0, 2, 0], y: [0, 2, 0] } } } },
  retry: { kind: "hover", whole: { active: { rotate: [0, -360] } } },
  undo: { kind: "hover", whole: { active: { rotate: [0, -25, 0] } } },
  search: { kind: "hover", whole: { active: { rotate: [0, -14, 10, 0] }, origin: [11, 11] } },
  bell: {
    kind: "hover",
    whole: { active: { rotate: [0, 14, -10, 6, -3, 0] }, origin: [12, 4] },
    parts: { 2: { active: { scale: [1, 1.5, 1] }, origin: [17.5, 5.5] } },
  },
  trash: { kind: "hover", parts: { 0: { active: { y: -1.5, rotate: -12 }, origin: [4.5, 7] } } },
  lock: { kind: "hover", parts: { 1: { active: { y: -2.5 } } } },
  eye: { kind: "hover", whole: { active: { scaleY: [1, 0.1, 1], transition: { duration: 0.3 } } } },
  download: {
    kind: "hover",
    nodes: ["M12 4.5v10M7.5 10.5l4.5 4.5 4.5-4.5", "M5 19.5h14"],
    parts: { 0: { active: { y: [0, 2.5, 0] } } },
  },
  upload: {
    kind: "hover",
    nodes: ["M12 15V5M7.5 9L12 4.5 16.5 9", "M5 19.5h14"],
    parts: { 0: { active: { y: [0, -2.5, 0] } } },
  },
  "arrow-right": { kind: "hover", whole: { active: { x: [0, 3, 0] } } },
  "arrow-left": { kind: "hover", whole: { active: { x: [0, -3, 0] } } },
  external: { kind: "hover", whole: { active: { x: [0, 2, 0], y: [0, -2, 0] } } },
  sliders: {
    kind: "hover",
    parts: { 1: { active: { x: [0, -4, 0] } }, 2: { active: { x: [0, 4, 0] } } },
  },
  alert: { kind: "hover", whole: { active: { rotate: [0, -8, 8, -4, 0] }, origin: [12, 20] } },
  clock: { kind: "hover", parts: { 1: { active: { rotate: [0, 360] }, origin: [12, 12] } } },
  "chevron-down": { kind: "toggle", whole: { active: { rotate: 180 } } },
  plus: { kind: "toggle", whole: { active: { rotate: 45 } } },
  menu: {
    kind: "toggle",
    nodes: ["M4.5 7L19.5 7", "M4.5 12L19.5 12", "M4.5 17L19.5 17"],
    parts: {
      0: { active: { d: "M6.5 6.5L17.5 17.5" }, rest: { d: "M4.5 7L19.5 7" } },
      1: { active: { opacity: 0, scaleX: 0.2 } },
      2: { active: { d: "M6.5 17.5L17.5 6.5" }, rest: { d: "M4.5 17L19.5 17" } },
    },
  },
  heart: {
    kind: "toggle",
    nodes: [HEART, { d: HEART, fill: true, accent: true }],
    parts: { 1: { rest: { opacity: 0, scale: 0.6 }, active: { opacity: 1, scale: 1, transition: springs.stamp }, origin: [12, 13] } },
  },
  star: {
    kind: "toggle",
    nodes: [STAR, { d: STAR, fill: true, accent: true }],
    parts: { 1: { rest: { opacity: 0, scale: 0.6 }, active: { opacity: 1, scale: 1, transition: springs.stamp } } },
  },
  bookmark: {
    kind: "toggle",
    nodes: [BOOKMARK, { d: BOOKMARK, fill: true, accent: true }],
    parts: { 1: { rest: { scaleY: 0 }, active: { scaleY: 1 }, origin: [12, 4.5] } },
  },
  theme: {
    kind: "toggle",
    nodes: [
      { c: [12, 12, 3.5], accent: true },
      "M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6",
      "M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z",
    ],
    parts: {
      0: { active: { scale: 0.4, opacity: 0 } },
      1: { active: { rotate: 45, scale: 0.5, opacity: 0 } },
      2: { rest: { opacity: 0, rotate: -30, scale: 0.6 }, active: { opacity: 1, rotate: 0, scale: 1 } },
    },
  },

  // 電商
  cart: { kind: "hover", whole: { active: { rotate: [0, -8, 4, 0] }, origin: [8, 19] } },
  bag: { kind: "hover", parts: { 1: { active: { y: [0, -1.5, 0] } } } },
  tag: { kind: "hover", whole: { active: { rotate: [0, -14, 9, -4, 0] }, origin: [8, 8] } },
  truck: { kind: "hover", whole: { active: { x: [0, 3, -1, 0] } } },
  gift: {
    kind: "hover",
    parts: {
      0: { active: { y: -2.5, rotate: -8 }, origin: [4.5, 10.5] },
      3: { active: { y: -2.5, rotate: -8 }, origin: [4.5, 10.5] },
    },
  },
  package: { kind: "hover", whole: { active: { y: [0, -2.5, 0] } } },
  flash: { kind: "hover", parts: { 0: { active: { pathLength: [0, 1] } } } },
  timer: { kind: "hover", whole: { active: { rotate: [0, 180] } } },

  // 紙品
  coupon: {
    kind: "hover",
    nodes: [
      "M15 5.5H5A1.5 1.5 0 0 0 3.5 7v2.5a2.5 2.5 0 0 1 0 5V17A1.5 1.5 0 0 0 5 18.5h10",
      "M15 5.5h4A1.5 1.5 0 0 1 20.5 7v2.5a2.5 2.5 0 0 0 0 5V17a1.5 1.5 0 0 1-1.5 1.5h-4",
      { d: "M15 7.5v9", dash: "1.5 2" },
      { d: "M8 14.5l3.5-5", accent: true },
    ],
    // 沿打孔線撕開：右側票根往外轉開
    parts: { 1: { active: { x: 1, rotate: -12 }, origin: [15, 5.5] } },
  },
  receipt: { kind: "hover", parts: { 1: { active: { pathLength: [0, 1] } } } },
  stamp: {
    kind: "hover",
    whole: { active: { scale: [1, 1.2, 0.92, 1], rotate: [0, -8, -8, 0] } },
  },
  "stamp-tool": {
    kind: "hover",
    parts: {
      0: { active: { y: [0, 2.5, 0] } },
      1: { active: { y: [0, 2.5, 0] } },
      2: { active: { y: [0, 2.5, 0] } },
      3: { active: { scaleX: [1, 1.2, 1] }, origin: [12, 19.5] },
    },
  },
  "punch-card": {
    kind: "toggle",
    nodes: [...icons["punch-card"], { c: [12, 14.5, 1.5], fill: true, accent: true }],
    parts: { 7: { rest: { scale: 0, opacity: 0 }, active: { scale: 1, opacity: 1, transition: springs.stamp }, origin: [12, 14.5] } },
  },
  envelope: {
    kind: "hover",
    parts: { 1: { active: { y: [0, 1, 0] } }, 2: { active: { scale: [1, 1.5, 1] }, origin: [12, 11.5] } },
  },

  // 產品工具
  loader: {
    kind: "loop",
    whole: { active: { rotate: 360, transition: { repeat: Infinity, ease: "linear", duration: 0.9 } } },
  },
  status: {
    kind: "loop",
    parts: { 1: { active: { rotate: 360, transition: { repeat: Infinity, ease: "linear", duration: 6 } } } },
  },
  activity: { kind: "hover", parts: { 0: { active: { pathLength: [0, 1] } } } },
  gauge: { kind: "hover", parts: { 1: { active: { rotate: [-90, 0] }, origin: [12, 16] } } },

  // 故事
  play: {
    kind: "toggle",
    nodes: ["M8 5.5v13l10.5-6.5z", "M8.5 5.5v13M15.5 5.5v13"],
    parts: {
      0: { active: { opacity: 0, scale: 0.6 } },
      1: { rest: { opacity: 0, scale: 0.6 }, active: { opacity: 1, scale: 1 } },
    },
  },
  skip: { kind: "hover", whole: { active: { x: [0, 2.5, 0] } } },
  volume: {
    kind: "hover",
    nodes: ["M4.5 9.5v5h3l4.5 4v-13l-4.5 4z", "M15.5 9a4 4 0 0 1 0 6", "M18 6.5a7.5 7.5 0 0 1 0 11"],
    parts: { 1: { active: { opacity: [0, 1] } }, 2: { active: { opacity: [0, 0, 1] } } },
  },
  dialogue: { kind: "hover", parts: { 1: { active: { pathLength: [0, 1] } } } },
  lantern: { kind: "hover", whole: { active: { rotate: [0, 8, -6, 3, 0] }, origin: [12, 3.5] } },
} satisfies Record<string, Recipe>;

export type AnimatedIconName = keyof typeof recipes;
export const animatedIconNames = Object.keys(recipes) as AnimatedIconName[];
export const motionKindOf = (name: AnimatedIconName): MotionKind => recipes[name].kind;

export type AnimatedIconProps = Omit<SVGProps<SVGSVGElement>, "children" | "ref"> & {
  name: AnimatedIconName;
  /** 受控狀態。省略時，滑過或聚焦 trigger 指定的元素就會播放 */
  active?: boolean;
  /** 未受控時，監聽父元素（整顆按鈕）或圖示本身 */
  trigger?: "parent" | "self";
  size?: number | string;
  strokeWidth?: number;
  title?: string;
};

const ACCENT = "var(--sunui-icon-accent, currentColor)";
const IDENTITY: Record<string, number> = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1, pathLength: 1 };

export function AnimatedIcon({
  name,
  active,
  trigger = "parent",
  size = 24,
  strokeWidth = 1.5,
  title,
  ...rest
}: AnimatedIconProps) {
  const recipe: Recipe = recipes[name];
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);
  const controlled = active !== undefined;

  useEffect(() => {
    if (controlled) return;
    const el = trigger === "self" ? ref.current : ref.current?.parentElement;
    if (!el) return;
    const on = () => setHovered(true);
    const off = () => setHovered(false);
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    el.addEventListener("focusin", on);
    el.addEventListener("focusout", off);
    return () => {
      el.removeEventListener("pointerenter", on);
      el.removeEventListener("pointerleave", off);
      el.removeEventListener("focusin", on);
      el.removeEventListener("focusout", off);
    };
  }, [controlled, trigger]);

  // 減少動態時，循環直接不播；其他動作以 0 秒切到結果
  const on = (controlled ? active : hovered) && !(reduce && recipe.kind === "loop");
  const nodes: readonly IconNode[] = recipe.nodes ?? icons[name as IconName];
  const children = nodes.map((node, i) => renderNode(node, i, recipe.parts?.[i], recipe.kind, reduce));

  return (
    <motion.svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-icon={name}
      data-state={on ? "active" : "rest"}
      initial={false}
      animate={on ? "active" : "rest"}
      overflow="visible"
      {...(rest as object)}
    >
      {title && <title>{title}</title>}
      {recipe.whole ? (
        <motion.g variants={variants(recipe.whole, recipe.kind, reduce)} style={origin(recipe.whole.origin)}>
          {children}
        </motion.g>
      ) : (
        children
      )}
    </motion.svg>
  );
}

function renderNode(node: IconNode, key: number, part: Part | undefined, kind: MotionKind, reduce: boolean) {
  const n = typeof node === "string" ? { d: node } : node;
  const paint = n.accent ? ACCENT : "currentColor";
  const props = {
    key,
    stroke: n.fill ? "none" : n.accent ? paint : undefined,
    fill: n.fill ? paint : undefined,
    strokeDasharray: n.dash,
    variants: part ? variants(part, kind, reduce) : undefined,
    style: part ? origin(part.origin) : undefined,
  };
  if ("d" in n) return <motion.path {...props} d={n.d} />;
  if ("c" in n) return <motion.circle {...props} cx={n.c[0]} cy={n.c[1]} r={n.c[2]} />;
  const [x, y, width, height, rx] = n.r;
  return <motion.rect {...props} x={x} y={y} width={width} height={height} rx={rx} />;
}

function variants(part: Part, kind: MotionKind, reduce: boolean): Variants {
  const { transition: custom, ...active } = part.active;
  const values = active as Record<string, unknown>;
  const once = Object.values(values).some(Array.isArray);
  const rest =
    part.rest ??
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, Array.isArray(value) ? value[value.length - 1] : IDENTITY[key]]),
    );
  const instant: Transition = { duration: 0 };
  return {
    active: { ...active, transition: reduce ? instant : (custom ?? (once ? ONCE : springs.gentle)) },
    // 一次性與循環動作離開時立即歸位，不倒放
    rest: { ...rest, transition: reduce || once || kind === "loop" ? instant : springs.gentle },
  };
}

// 以整個 24 網格為參考框，讓不同形狀共用同一個旋轉中心
function origin(point: [number, number] = [12, 12]) {
  return { transformBox: "view-box" as const, originX: point[0] / 24, originY: point[1] / 24 };
}
