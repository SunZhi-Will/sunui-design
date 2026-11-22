"use client";

import { AnimatedGlyph, springs, type AnimatedGlyphProps, type IconRecipe, type MotionKind } from "./sunui-animated-icons";
import { twoToneIcons, twoToneSolids, type TwoToneIconName } from "./sunui-twotone-icons";

/**
 * SunUI Animated Two-tone Icons
 *
 * 雙色圖示的動態版：共用 sunui-twotone-icons 的幾何，動作規則與線條動態版相同（見 sunui-animated-icons）。
 * parts 的編號對應 twoToneIcons 裡各部位的順序。每個雙色圖示都有動態版。
 */

export const twoToneRecipes = {
  // 電商
  cart: { kind: "hover", whole: { active: { rotate: [0, -8, 4, 0] }, origin: [8, 19] } },
  bag: { kind: "hover", parts: { 1: { active: { y: [0, -1.5, 0] } } } },
  tag: { kind: "hover", whole: { active: { rotate: [0, -14, 9, -4, 0] }, origin: [8, 8] } },
  gift: {
    kind: "hover",
    parts: {
      2: { active: { y: -2.4, rotate: -7 }, origin: [3.4, 12] },
      3: { active: { y: -2.4, rotate: -7 }, origin: [3.4, 12] },
      4: { active: { y: -2.4, rotate: -7 }, origin: [3.4, 12] },
    },
  },
  truck: { kind: "hover", whole: { active: { x: [0, 3, -1, 0] } } },
  package: { kind: "hover", whole: { active: { y: [0, -2.5, 0] } } },
  store: { kind: "hover", parts: { 1: { active: { scaleY: [1, 0.82, 1.06, 1] }, origin: [12, 4] } } },
  card: { kind: "hover", whole: { active: { x: [0, 2.5, -1, 0] } } },
  wallet: { kind: "hover", parts: { 1: { active: { rotate: [0, -14, 0] }, origin: [5.2, 6.6] } } },
  coin: { kind: "hover", whole: { active: { scaleX: [1, 0.12, 1] } } },

  // 介面
  bell: {
    kind: "hover",
    whole: { active: { rotate: [0, 14, -10, 6, -3, 0] }, origin: [12, 3.5] },
    parts: { 2: { active: { x: [0, -1.4, 1.2, -0.4, 0] } } },
  },
  heart: {
    kind: "toggle",
    nodes: [...twoToneIcons.heart, { d: twoToneSolids.heart, fill: true, accent: true }],
    parts: { 2: { rest: { opacity: 0, scale: 0.6 }, active: { opacity: 1, scale: 1, transition: springs.stamp }, origin: [12, 13] } },
  },
  star: {
    kind: "toggle",
    nodes: [...twoToneIcons.star, { d: twoToneSolids.star, fill: true, accent: true }],
    parts: { 2: { rest: { opacity: 0, scale: 0.6 }, active: { opacity: 1, scale: 1, transition: springs.stamp } } },
  },
  bookmark: {
    kind: "toggle",
    nodes: [...twoToneIcons.bookmark, { d: twoToneSolids.bookmark, fill: true, accent: true }],
    parts: { 2: { rest: { scaleY: 0 }, active: { scaleY: 1 }, origin: [12, 3] } },
  },
  home: {
    kind: "hover",
    parts: {
      1: { active: { y: [0, -1.6, 0.3, 0] } },
      2: { active: { scaleX: [1, 0.35, 1] }, origin: [10, 20] },
    },
  },
  mail: {
    kind: "hover",
    nodes: [{ r: [7, 6.5, 10, 6.5, 1], fill: true }, ...twoToneIcons.mail],
    parts: {
      0: { rest: { opacity: 0, y: 0 }, active: { opacity: [0, 1, 1, 0], y: [0, -4, -4, 0] } },
      2: { active: { scaleY: [1, -0.7, -0.7, 1] }, origin: [12, 6.6] },
    },
  },
  lock: { kind: "hover", parts: { 0: { active: { y: -2.5 } } } },
  user: { kind: "hover", parts: { 0: { active: { y: [0, -1.2, 0] } } } },
  calendar: { kind: "hover", parts: { 3: { active: { x: [0, 5, 5, 0] } } } },
  clock: { kind: "hover", parts: { 1: { active: { rotate: [0, 360] }, origin: [12, 12] } } },
  image: { kind: "hover", parts: { 2: { active: { y: [0, -1.6, 0] } } } },
  file: { kind: "hover", parts: { 2: { active: { pathLength: [0, 1] } } } },
  trash: { kind: "hover", parts: { 0: { active: { y: -1.5, rotate: -12 }, origin: [4.5, 7] } } },
  search: { kind: "hover", whole: { active: { rotate: [0, -14, 10, 0] }, origin: [10.6, 10.6] } },

  // 介面：純符號
  check: { kind: "hover", parts: { 0: { active: { pathLength: [0, 1] } } } },
  close: { kind: "hover", whole: { active: { rotate: [0, 90] } } },
  plus: { kind: "toggle", whole: { active: { rotate: 45 } } },
  minus: { kind: "hover", whole: { active: { scaleX: [1, 0.5, 1] } } },
  "chevron-left": { kind: "hover", whole: { active: { x: [0, -2.5, 0] } } },
  "chevron-right": { kind: "hover", whole: { active: { x: [0, 2.5, 0] } } },
  "chevron-up": { kind: "hover", whole: { active: { y: [0, -2.5, 0] } } },
  "chevron-down": { kind: "toggle", whole: { active: { rotate: 180 } } },
  "arrow-left": { kind: "hover", whole: { active: { x: [0, -3, 0] } } },
  "arrow-right": { kind: "hover", whole: { active: { x: [0, 3, 0] } } },
  external: { kind: "hover", parts: { 1: { active: { x: [0, 2, 0], y: [0, -2, 0] } } } },
  menu: {
    kind: "toggle",
    nodes: [
      { d: "M4.5 7L19.5 7", sw: 2.2 },
      { d: "M4.5 12L19.5 12", sw: 2.2 },
      { d: "M4.5 17L19.5 17", sw: 2.2 },
    ],
    parts: {
      0: { active: { d: "M6.5 6.5L17.5 17.5" }, rest: { d: "M4.5 7L19.5 7" } },
      1: { active: { opacity: 0, scaleX: 0.2 } },
      2: { active: { d: "M6.5 17.5L17.5 6.5" }, rest: { d: "M4.5 17L19.5 17" } },
    },
  },
  more: {
    kind: "hover",
    parts: {
      0: { active: { y: [0, -2, 0] } },
      1: { active: { y: [0, 0, -2, 0] } },
      2: { active: { y: [0, 0, 0, -2, 0] } },
    },
  },
  sliders: {
    kind: "hover",
    parts: {
      1: { active: { x: [0, -4, 0] } },
      2: { active: { x: [0, -4, 0] } },
      3: { active: { x: [0, 4, 0] } },
      4: { active: { x: [0, 4, 0] } },
    },
  },
  copy: { kind: "hover", parts: { 1: { active: { x: [0, 2, 0], y: [0, 2, 0] } }, 2: { active: { x: [0, 2, 0], y: [0, 2, 0] } } } },
  link: { kind: "hover", parts: { 0: { active: { x: [0, 1.2, 0], y: [0, -1.2, 0] } }, 1: { active: { x: [0, -1.2, 0], y: [0, 1.2, 0] } } } },
  undo: { kind: "hover", whole: { active: { rotate: [0, -25, 0] } } },
  retry: { kind: "hover", whole: { active: { rotate: [0, -360] } } },
  download: { kind: "hover", parts: { 1: { active: { y: [0, 2.5, 0] } } } },
  upload: { kind: "hover", parts: { 1: { active: { y: [0, -2.5, 0] } } } },
  edit: { kind: "hover", whole: { active: { rotate: [0, -10, 4, 0] }, origin: [5, 19] } },
  info: { kind: "hover", parts: { 2: { active: { y: [0, -1.5, 0] } } } },
  alert: { kind: "hover", whole: { active: { rotate: [0, -8, 8, -4, 0] }, origin: [12, 20] } },
  unlock: { kind: "hover", parts: { 0: { active: { rotate: [0, -18, 0] }, origin: [8, 10.6] } } },
  eye: { kind: "hover", whole: { active: { scaleY: [1, 0.1, 1], transition: { duration: 0.3 } } } },
  "eye-off": { kind: "hover", parts: { 2: { active: { pathLength: [0, 1] } } } },
  share: {
    kind: "hover",
    parts: {
      1: { active: { scale: [1, 1.25, 1] }, origin: [17, 5.6] },
      3: { active: { scale: [1, 1, 1.25, 1] }, origin: [17, 18.4] },
    },
  },
  grid: { kind: "hover", parts: { 0: { active: { scale: [1, 0.8, 1] }, origin: [7.5, 7.5] } } },
  sun: { kind: "hover", parts: { 1: { active: { rotate: [0, 45] }, origin: [12, 12] } } },
  moon: { kind: "hover", whole: { active: { rotate: [0, -14, 0] } } },
  filter: { kind: "hover", parts: { 0: { active: { scaleY: [1, 0.85, 1] }, origin: [12, 5.6] } } },
  phone: { kind: "hover", whole: { active: { rotate: [0, -8, 8, -6, 4, 0] } } },
  globe: { kind: "hover", parts: { 1: { active: { scaleX: [1, 0.2, 1] } } } },
  "map-pin": { kind: "hover", whole: { active: { y: [0, -2.5, 0] } } },
  sparkle: { kind: "hover", parts: { 0: { active: { scale: [1, 1.15, 1], rotate: [0, 12, 0] }, origin: [11, 11.8] } } },

  // 電商
  percent: { kind: "hover", whole: { active: { rotate: [0, -12, 0] } } },
  scan: { kind: "hover", parts: { 2: { active: { scaleY: [1, 0.5, 1] } } } },
  flash: { kind: "hover", whole: { active: { scale: [1, 1.12, 1] } } },
  timer: { kind: "hover", whole: { active: { rotate: [0, 180] } } },

  // 紙品
  coupon: { kind: "hover", parts: { 1: { active: { x: 1, rotate: -12 }, origin: [15.4, 5.5] } } },
  receipt: { kind: "hover", parts: { 1: { active: { pathLength: [0, 1] } } } },
  ticket: { kind: "hover", whole: { active: { rotate: [0, -8, 0] } } },
  stamp: { kind: "hover", whole: { active: { scale: [1, 1.2, 0.92, 1], rotate: [0, -8, -8, 0] } } },
  "stamp-check": { kind: "hover", parts: { 1: { active: { pathLength: [0, 1] } } } },
  "stamp-tool": {
    kind: "hover",
    parts: {
      0: { active: { y: [0, 2.5, 0] } },
      1: { active: { y: [0, 2.5, 0] } },
      2: { active: { y: [0, 2.5, 0] } },
      3: { active: { scaleX: [1, 1.2, 1] }, origin: [12, 19.6] },
    },
  },
  "punch-card": {
    kind: "toggle",
    nodes: [...twoToneIcons["punch-card"], { c: [12, 14.5, 1.6], fill: true, accent: true }],
    parts: { 7: { rest: { scale: 0, opacity: 0 }, active: { scale: 1, opacity: 1, transition: springs.stamp }, origin: [12, 14.5] } },
  },
  scissors: {
    kind: "hover",
    parts: {
      1: { active: { rotate: [0, 10, 0] }, origin: [12, 12] },
      2: { active: { rotate: [0, 10, 0] }, origin: [12, 12] },
      3: { active: { rotate: [0, -10, 0] }, origin: [12, 12] },
      4: { active: { rotate: [0, -10, 0] }, origin: [12, 12] },
    },
  },
  envelope: {
    kind: "hover",
    parts: { 1: { active: { y: [0, 1, 0] } }, 2: { active: { scale: [1, 1.4, 1] }, origin: [12, 11.5] } },
  },

  // 產品工具
  activity: { kind: "hover", parts: { 0: { active: { pathLength: [0, 1] } } } },
  "chart-bar": {
    kind: "hover",
    parts: {
      0: { active: { scaleY: [1, 0.5, 1] }, origin: [7.4, 17] },
      1: { active: { scaleY: [1, 0.7, 1] }, origin: [12, 17] },
      2: { active: { scaleY: [1, 1.6, 1] }, origin: [16.6, 17] },
    },
  },
  gauge: { kind: "hover", parts: { 1: { active: { rotate: [-90, 0] }, origin: [12, 16] } } },
  terminal: { kind: "hover", parts: { 2: { active: { opacity: [1, 0, 1, 0, 1] } } } },
  window: { kind: "hover", parts: { 1: { active: { scaleY: [1, 1.5, 1] }, origin: [12, 4.6] } } },
  key: { kind: "hover", whole: { active: { rotate: [0, -20, 0] }, origin: [8, 15.6] } },
  layers: { kind: "hover", parts: { 0: { active: { y: [0, -1.8, 0] } }, 1: { active: { y: [0, -0.8, 0] } } } },
  inbox: { kind: "hover", parts: { 1: { active: { y: [0, 1.5, 0] } } } },
  shield: { kind: "hover", parts: { 1: { active: { pathLength: [0, 1] } } } },
  loader: {
    kind: "loop",
    whole: { active: { rotate: 360, transition: { repeat: Infinity, ease: "linear", duration: 0.9 } } },
  },
  status: {
    kind: "loop",
    parts: { 2: { active: { rotate: 360, transition: { repeat: Infinity, ease: "linear", duration: 6 } } } },
  },
  mic: { kind: "hover", parts: { 0: { active: { scale: [1, 1.08, 1] }, origin: [12, 8.8] }, 2: { active: { scale: [1, 1.08, 1] }, origin: [12, 8.8] } } },
  caption: { kind: "hover", parts: { 1: { active: { pathLength: [0, 1] } } } },

  // 故事與媒體
  play: {
    kind: "toggle",
    nodes: [...twoToneIcons.play, { d: "M9.8 8.6v6.8M14.2 8.6v6.8", sw: 2.4 }],
    parts: {
      1: { active: { opacity: 0, scale: 0.6 }, origin: [12, 12] },
      2: { rest: { opacity: 0, scale: 0.6 }, active: { opacity: 1, scale: 1 }, origin: [12, 12] },
    },
  },
  pause: { kind: "hover", parts: { 1: { active: { scaleY: [1, 0.6, 1] } } } },
  skip: { kind: "hover", whole: { active: { x: [0, 2.5, 0] } } },
  volume: { kind: "hover", parts: { 1: { active: { opacity: [0, 1] } }, 2: { active: { opacity: [0, 0, 1] } } } },
  book: { kind: "hover", parts: { 1: { active: { scaleX: [1, 0.5, 1] }, origin: [12.6, 12] }, 2: { active: { scaleX: [1, 0.5, 1] }, origin: [12.6, 12] } } },
  dialogue: { kind: "hover", parts: { 1: { active: { pathLength: [0, 1] } } } },
  lantern: { kind: "hover", whole: { active: { rotate: [0, 8, -6, 3, 0] }, origin: [12, 3.4] } },
  scroll: { kind: "hover", parts: { 2: { active: { pathLength: [0, 1] } } } },
  quill: { kind: "hover", whole: { active: { rotate: [0, -8, 4, 0] }, origin: [4.4, 19.6] } },
  map: { kind: "hover", whole: { active: { scaleX: [1, 0.85, 1] } } },
  gem: { kind: "hover", whole: { active: { y: [0, -1.8, 0], rotate: [0, -6, 6, 0] } } },
  trophy: { kind: "hover", whole: { active: { rotate: [0, -8, 8, 0] }, origin: [12, 20.8] } },

  // 節慶
  "red-envelope": { kind: "hover", parts: { 2: { active: { scale: [1, 1.3, 1] }, origin: [12, 10.6] } } },
  firework: {
    kind: "hover",
    parts: {
      0: { active: { scale: [0.4, 1.1, 1] }, origin: [12, 12] },
      1: { active: { scale: [0.4, 1, 1] }, origin: [12, 12] },
    },
  },
} satisfies Record<TwoToneIconName, IconRecipe>;

export type AnimatedTwoToneIconName = keyof typeof twoToneRecipes;
export const animatedTwoToneIconNames = Object.keys(twoToneRecipes) as AnimatedTwoToneIconName[];
export const twoToneMotionKindOf = (name: AnimatedTwoToneIconName): MotionKind => twoToneRecipes[name].kind;

export type AnimatedTwoToneIconProps = Omit<AnimatedGlyphProps, "recipe" | "nodes" | "strokeWidth"> & {
  name: AnimatedTwoToneIconName;
};

export function AnimatedTwoToneIcon({ name, ...rest }: AnimatedTwoToneIconProps) {
  const recipe: IconRecipe = twoToneRecipes[name];
  return <AnimatedGlyph recipe={recipe} nodes={recipe.nodes ?? twoToneIcons[name]} data-icon={name} {...rest} />;
}
