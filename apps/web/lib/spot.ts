/**
 * 品牌專色（--sunui-spot）的展示設定。分析見 reports/網站灰階單調診斷-2026-11-08.md。
 *
 * 區塊出廠專色跟著買家主題的 --primary。網站上預設用 SunUI 的鈷藍（2026-11-22），預覽工具列可以換成墨色（買家沒設專色時）或幾種常見品牌色，
 * 回答「放進我的店會長怎樣」。顏色只是示範，不是 SunUI 的品牌色。
 * 避開已被點名的 AI 色：靛藍與紫、紫粉漸層、青色霓虹、色相 40 到 60 的赤陶橘。
 */

export type SpotKey = "cobalt" | "ink" | "wine" | "forest" | "magenta";

type Swatch = { light: string; dark: string };

/** light 配白字，dark 配近黑字，兩邊對比都過 4.5:1 */
export const spotSwatches: Record<Exclude<SpotKey, "ink">, Swatch> = {
  cobalt: { light: "#2f6bff", dark: "#7aa2ff" },
  wine: { light: "#b3243d", dark: "#f28da0" },
  forest: { light: "#24774a", dark: "#7fd0a2" },
  magenta: { light: "#bb2a6b", dark: "#f590c2" },
};

/** cobalt 是網站預設（globals.css 已經設好），排第一；ink 是買家沒設專色時看到的樣子 */
export const spotKeys: SpotKey[] = ["cobalt", "ink", "wine", "forest", "magenta"];

/** 注入預覽 iframe 的樣式。cobalt 回傳空字串（globals.css 的預設）；ink 把專色退回主題的 --primary，等於買家沒設專色 */
export function spotCss(key: SpotKey): string {
  if (key === "cobalt") return "";
  if (key === "ink") return ":root,:root.dark{--sunui-spot:var(--primary);--sunui-spot-foreground:var(--primary-foreground)}";
  const { light, dark } = spotSwatches[key];
  const darkVars = `--sunui-spot:${dark};--sunui-spot-foreground:#0a0a0a`;
  return [
    `:root{--sunui-spot:${light};--sunui-spot-foreground:#ffffff}`,
    `:root.dark{${darkVars}}`,
    `@media (prefers-color-scheme: dark){:root:not(.light){${darkVars}}}`,
  ].join("");
}
