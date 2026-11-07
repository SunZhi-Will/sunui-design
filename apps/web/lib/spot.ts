/**
 * 品牌專色（--sunui-spot）的展示設定。分析見 reports/網站灰階單調診斷-2026-11-08.md。
 *
 * 區塊出廠是墨色，專色預設跟著主題的 --primary。區塊頁的預覽工具列可以換幾種常見的電商品牌色，
 * 回答「放進我的店會長怎樣」。顏色只是示範，不是 SunUI 的品牌色。
 * 避開已被點名的 AI 色：靛藍與紫、紫粉漸層、青色霓虹、色相 40 到 60 的赤陶橘。
 */

export type SpotKey = "ink" | "wine" | "forest" | "navy" | "magenta";

type Swatch = { light: string; dark: string };

/** light 配白字，dark 配近黑字，兩邊對比都過 4.5:1 */
export const spotSwatches: Record<Exclude<SpotKey, "ink">, Swatch> = {
  wine: { light: "#9b1c31", dark: "#f08a9b" },
  forest: { light: "#25603f", dark: "#7cc89c" },
  navy: { light: "#1f3a68", dark: "#93b4ea" },
  magenta: { light: "#a3245e", dark: "#f28cbd" },
};

export const spotKeys: SpotKey[] = ["ink", "wine", "forest", "navy", "magenta"];

/** 已改用 --sunui-spot 的區塊。試做中，確認效果後再推到其餘區塊 */
export const spotBlocks = new Set(["coupon-wallet", "add-to-cart-button", "addon-checklist", "shipping-options", "tier-progress"]);

/** 注入預覽 iframe 的樣式；ink 回傳空字串，回到出廠樣子 */
export function spotCss(key: SpotKey): string {
  if (key === "ink") return "";
  const { light, dark } = spotSwatches[key];
  const darkVars = `--sunui-spot:${dark};--sunui-spot-foreground:#0a0a0a`;
  return [
    `:root{--sunui-spot:${light};--sunui-spot-foreground:#ffffff}`,
    `:root.dark{${darkVars}}`,
    `@media (prefers-color-scheme: dark){:root:not(.light){${darkVars}}}`,
  ].join("");
}
