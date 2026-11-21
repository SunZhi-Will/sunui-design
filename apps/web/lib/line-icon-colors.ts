import { pigments, pixelPigments, type Pigment } from "@/registry/icons/sunui-pixel-icons";

// /icons 頁的彩色模式：每個線條圖示一個本色（2026-11-22 起預設彩色，黑白是切換選項）。
// 只給網站用，不隨圖示庫安裝；使用者要上色就在自己的專案傳 color。
// 色值沿用像素圖示的 pigments，同名圖示（heart、star、coin……）先用像素版的本色。
// steel、bone 太接近灰，線條版不用。

const lineColors: Record<string, Pigment> = {
  // 完成、新增、通行
  check: "green",
  plus: "green",
  download: "green",
  unlock: "green",
  status: "green",
  activity: "green",
  retry: "green",
  map: "green",
  // 關閉、刪除、警告、喜歡、節慶
  close: "red",
  minus: "red",
  trash: "red",
  alert: "red",
  "red-envelope": "red",
  lantern: "red",
  stamp: "red",
  coupon: "red",
  // 導覽、資訊、安全
  "chevron-left": "blue",
  "chevron-right": "blue",
  "chevron-up": "blue",
  "chevron-down": "blue",
  "arrow-left": "blue",
  "arrow-right": "blue",
  external: "blue",
  search: "blue",
  info: "blue",
  lock: "blue",
  eye: "blue",
  "eye-off": "blue",
  link: "blue",
  user: "blue",
  mail: "blue",
  phone: "blue",
  globe: "blue",
  window: "blue",
  caption: "blue",
  dialogue: "blue",
  scan: "blue",
  // 光、價值、獎勵
  sun: "gold",
  timer: "gold",
  firework: "gold",
  // 動作、購物、媒體
  upload: "orange",
  edit: "orange",
  share: "orange",
  tag: "orange",
  percent: "orange",
  cart: "orange",
  truck: "orange",
  ticket: "orange",
  "punch-card": "orange",
  mic: "orange",
  play: "orange",
  home: "orange",
  // 介面工具、時間、內容
  moon: "violet",
  theme: "violet",
  menu: "violet",
  more: "violet",
  sliders: "violet",
  filter: "violet",
  grid: "violet",
  copy: "violet",
  undo: "violet",
  calendar: "violet",
  clock: "violet",
  image: "violet",
  file: "violet",
  layers: "violet",
  nodes: "violet",
  terminal: "violet",
  loader: "violet",
  gauge: "violet",
  pause: "violet",
  skip: "violet",
  volume: "violet",
  bookmark: "violet",
  "chart-bar": "violet",
  // 店面與票據
  bag: "pink",
  store: "pink",
  card: "pink",
  receipt: "pink",
  envelope: "pink",
  name: "pink",
  inbox: "pink",
  "map-pin": "pink",
  "stamp-check": "pink",
  scissors: "pink",
  // 紙、木、皮
  scroll: "brown",
  quill: "brown",
  "stamp-tool": "brown",
};

const vivid: Pigment[] = ["blue", "green", "orange", "violet", "pink", "red", "gold"];

export function lineIconColor(name: string): string {
  const own = lineColors[name] ?? pixelPigments[name as keyof typeof pixelPigments];
  if (own && own !== "steel" && own !== "bone") return pigments[own];
  // 沒指定的新圖示：依名稱固定挑一個鮮明的色，避免整片同色
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pigments[vivid[hash % vivid.length]];
}

/**
 * 雙色彩色模式：細節用本色（color），主體用同色相的淺色。
 * 回傳 CSS 屬性，直接放在圖示或外層的 style 上。
 */
export function lineIconTone(name: string): Record<string, string> {
  const ink = lineIconColor(name);
  const hue = ink.match(/oklch\([\d.]+ [\d.]+ ([\d.]+)\)/)?.[1] ?? "250";
  const body = `oklch(0.86 0.085 ${hue})`;
  return {
    color: ink,
    "--sunui-icon-body": body,
    "--sunui-icon-body-opacity": "1",
    "--sunui-icon-mid": `color-mix(in oklab, ${ink} 55%, ${body})`,
    "--sunui-icon-mid-opacity": "1",
    "--sunui-icon-accent": ink,
  };
}
