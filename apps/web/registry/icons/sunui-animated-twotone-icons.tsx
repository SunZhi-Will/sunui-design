"use client";

import { AnimatedGlyph, springs, type AnimatedGlyphProps, type IconRecipe, type MotionKind } from "./sunui-animated-icons";
import { twoToneIcons, twoToneSolids, type TwoToneIconName } from "./sunui-twotone-icons";

/**
 * SunUI Animated Two-tone Icons
 *
 * 雙色圖示的動態版：共用 sunui-twotone-icons 的幾何，動作規則與線條動態版相同（見 sunui-animated-icons）。
 * parts 的編號對應 twoToneIcons 裡各部位的順序。
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
