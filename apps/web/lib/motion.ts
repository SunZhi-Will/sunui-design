/** 網站外殼的動效 tokens（規範見 SITE-MOTION.md）。CSS 端在 app/globals.css 的 @theme。 */
export const EASE_SITE = [0.23, 1, 0.32, 1] as const;

/** 秒，給 framer-motion 用 */
export const DURATION = {
  press: 0.1,
  fast: 0.15,
  base: 0.2,
  panelIn: 0.26,
  panelOut: 0.18,
  reveal: 0.3,
} as const;
