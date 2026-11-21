import { Glyph, type GlyphProps, type IconNode } from "./sunui-icons";

/**
 * SunUI Two-tone Icons
 *
 * 規格（見 apps/web/ICONS.md「雙色」）：
 * - 與線條版同一套 24 × 24 網格，內容落在 3 到 21 之間。
 * - 實心淺色主體（tone "body"，必要時一處中間色 "mid"）＋ currentColor 的細節（線寬 1.7 到 2.6、或實心）。
 * - 預設黑白：主體是 currentColor 20%，跟著文字顏色。要上色就設 color（細節）與 --sunui-icon-body
 *   （主體，並把 --sunui-icon-body-opacity 設為 1）。
 * - 主體之間不重疊；細節畫在主體上面。不用漸層、陰影、光暈。
 * - 與線條版共用名稱與渲染元件（Glyph），換風格只要換元件。
 */

// 實心外形（比線條版飽滿，邊緣由主體的細描邊修圓）
const HEART = "M12 20.3s-8-4.8-8-10.6a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 5.8-8 10.6-8 10.6z";
const STAR = "M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.5l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z";
const BOOKMARK = "M6.6 4.6A1.6 1.6 0 0 1 8.2 3h7.6a1.6 1.6 0 0 1 1.6 1.6v15.6L12 16.6l-5.4 3.6z";
export const twoToneSolids = { heart: HEART, star: STAR, bookmark: BOOKMARK } as const;

export const twoToneIcons = {
  cart: [
    { d: "M5.6 8h15.2l-1.7 7.3a2 2 0 0 1-2 1.5H9.2a2 2 0 0 1-2-1.5z", tone: "body" },
    { d: "M2.6 4.2h2.1l1.3 4.1", sw: 2 },
    { d: "M10.4 10.8v3.2M13.4 10.8v3.2M16.4 10.8v3.2", sw: 1.7 },
    { c: [9.6, 20, 1.7], fill: true },
    { c: [16.6, 20, 1.7], fill: true },
  ],
  bag: [
    { d: "M5.4 8.5h13.2l-.9 10.5a1.8 1.8 0 0 1-1.8 1.6H8.1a1.8 1.8 0 0 1-1.8-1.6z", tone: "body" },
    { d: "M9 11V7.2a3 3 0 0 1 6 0V11", sw: 1.9 },
  ],
  tag: [
    {
      d: "M3.6 11.4V5.1a1.5 1.5 0 0 1 1.5-1.5h6.3a1.5 1.5 0 0 1 1.06.44l7.4 7.4a1.5 1.5 0 0 1 0 2.12l-6.3 6.3a1.5 1.5 0 0 1-2.12 0l-7.4-7.4a1.5 1.5 0 0 1-.44-1.06z",
      tone: "body",
    },
    { c: [8.2, 8.2, 1.8], fill: true },
  ],
  gift: [
    { r: [4.8, 13.2, 14.4, 7.4, 1.6], tone: "body" },
    { r: [11, 13.2, 2, 7.4, 0], fill: true },
    { r: [3.4, 8, 17.2, 4, 1.3], tone: "body" },
    { r: [11, 8, 2, 4, 0], fill: true },
    { d: "M12 8c-1.2-3.2-5-3.6-4.8-1.4.2 1.2 2.6 1.4 4.8 1.4zM12 8c1.2-3.2 5-3.6 4.8-1.4-.2 1.2-2.6 1.4-4.8 1.4z", fill: true },
  ],
  truck: [
    { r: [2.6, 5.6, 11.4, 10.6, 1.6], tone: "body" },
    { d: "M15.4 9h2.4a1.5 1.5 0 0 1 1.2.6l2 2.7a1.5 1.5 0 0 1 .3.9v2.4a.6.6 0 0 1-.6.6h-5.3z", tone: "body" },
    { d: "M16.6 10.8h1.4l1.3 1.8h-2.7z", fill: true },
    { c: [7, 17.8, 1.9], fill: true },
    { c: [17.2, 17.8, 1.9], fill: true },
  ],
  package: [
    { d: "M4 8.2l8 4 8-4v8.4a1 1 0 0 1-.55.9L12 21.2l-7.45-3.7a1 1 0 0 1-.55-.9z", tone: "body" },
    { d: "M4 8.2l8-4 8 4-8 4z", tone: "mid" },
    { d: "M8 6.2l8 4v3.2", sw: 1.8 },
  ],
  store: [
    { r: [4.6, 10.6, 14.8, 9.9, 1.5], tone: "body" },
    {
      d: "M3.6 7.4L5.1 4h13.8l1.5 3.4a2.5 2.5 0 0 1-4.1 2.3 2.5 2.5 0 0 1-4.3 0 2.5 2.5 0 0 1-4.3 0 2.5 2.5 0 0 1-4.1-2.3z",
      fill: true,
    },
    { r: [10, 14.4, 4, 6.1, 1], fill: true },
  ],
  card: [
    { r: [2.8, 5.6, 18.4, 12.8, 2.2], tone: "body" },
    { r: [2.8, 8.6, 18.4, 2.6, 0], fill: true },
    { r: [5.6, 13.6, 4.2, 2.2, 0.8], fill: true },
  ],
  wallet: [
    { r: [3, 7.2, 18, 12.6, 2.2], tone: "body" },
    { d: "M5.2 6.6l10.4-3a1.2 1.2 0 0 1 1.5 1.15V6.6z", tone: "mid" },
    { r: [14.6, 11.2, 6.4, 4.6, 1.6], fill: true },
  ],
  coin: [
    { c: [12, 12, 8.6], tone: "body" },
    { c: [12, 12, 5.6], sw: 1.8 },
    { d: "M12 9.6v4.8", sw: 1.9 },
  ],
  bell: [
    {
      d: "M12 2.8a1.6 1.6 0 0 1 1.6 1.6v.5A6.2 6.2 0 0 1 18.2 11v3.4l1.6 2.4a.9.9 0 0 1-.8 1.4H5a.9.9 0 0 1-.8-1.4l1.6-2.4V11a6.2 6.2 0 0 1 4.6-6.1v-.5A1.6 1.6 0 0 1 12 2.8z",
      tone: "body",
    },
    { d: "M5.8 14.4h12.4", sw: 1.7 },
    { c: [12, 20.4, 2], fill: true },
  ],
  heart: [{ d: HEART, tone: "body" }, { d: "M7.6 9.6a2 2 0 0 1 2-1.9", sw: 1.8 }],
  star: [{ d: STAR, tone: "body" }, { c: [12, 12.6, 1.6], fill: true }],
  bookmark: [{ d: BOOKMARK, tone: "body" }, { d: "M9.4 8.6h5.2", sw: 1.8 }],
  home: [
    { d: "M4.6 10.4L12 4.6l7.4 5.8v8.6a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6z", tone: "body" },
    { d: "M2.8 11.2L12 3.9l9.2 7.3", sw: 2 },
    { r: [10, 14, 4, 6.6, 1], fill: true },
  ],
  mail: [
    { r: [2.8, 6, 18.4, 13, 2.2], tone: "body" },
    { d: "M4.2 7.4L12 13l7.8-5.6", sw: 2 },
  ],
  lock: [
    { d: "M8 10.6V8a4 4 0 0 1 8 0v2.6", sw: 2 },
    { r: [5, 10.6, 14, 10, 2.2], tone: "body" },
    { d: "M12 14.4v2.6", sw: 2.2 },
  ],
  user: [
    { c: [12, 7.8, 3.6], fill: true },
    { d: "M4.6 20.2a7.4 7.4 0 0 1 14.8 0 .6.6 0 0 1-.6.6H5.2a.6.6 0 0 1-.6-.6z", tone: "body" },
  ],
  calendar: [
    { r: [3.4, 5, 17.2, 15.6, 2.2], tone: "body" },
    { d: "M3.4 7.2A2.2 2.2 0 0 1 5.6 5h12.8a2.2 2.2 0 0 1 2.2 2.2V10H3.4z", fill: true },
    { d: "M8 3v3.6M16 3v3.6", sw: 2 },
    { r: [7, 13, 3.2, 3.2, 0.8], fill: true },
  ],
  clock: [
    { c: [12, 12, 8.6], tone: "body" },
    { d: "M12 7.4V12l3.2 2", sw: 2 },
  ],
  image: [
    { r: [3, 4.6, 18, 14.8, 2.2], tone: "body" },
    {
      d: "M3 16.8l5.1-5.1a1 1 0 0 1 1.4 0l4.4 4.4 2-2a1 1 0 0 1 1.4 0L21 17.8v-.6 0a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.2z",
      fill: true,
    },
    { c: [15.6, 8.8, 1.8], fill: true },
  ],
  file: [
    { d: "M6.6 3H14l5 5v11.4a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 19.4V4.6A1.6 1.6 0 0 1 6.6 3z", tone: "body" },
    { d: "M14 3v3.4A1.6 1.6 0 0 0 15.6 8H19z", fill: true },
    { d: "M8.6 12.6h6.8M8.6 16h4.4", sw: 1.8 },
  ],
  trash: [
    { d: "M4.5 6.6h15M9.6 6.6V5.1a1 1 0 0 1 1-1h2.8a1 1 0 0 1 1 1v1.5", sw: 2 },
    { d: "M6 8.6h12l-.9 10.6a1.5 1.5 0 0 1-1.5 1.4H8.4a1.5 1.5 0 0 1-1.5-1.4z", tone: "body" },
    { d: "M10 11.6v5.4M14 11.6v5.4", sw: 1.8 },
  ],
  search: [
    { c: [10.6, 10.6, 6.2], tone: "body" },
    { c: [10.6, 10.6, 6.2], sw: 2 },
    { d: "M15.4 15.4L20 20", sw: 2.6 },
  ],
} satisfies Record<string, readonly IconNode[]>;

export type TwoToneIconName = keyof typeof twoToneIcons;
export const twoToneIconNames = Object.keys(twoToneIcons) as TwoToneIconName[];

export type TwoToneIconProps = Omit<GlyphProps, "nodes" | "strokeWidth"> & { name: TwoToneIconName };

export function TwoToneIcon({ name, ...rest }: TwoToneIconProps) {
  return <Glyph nodes={twoToneIcons[name]} data-icon={name} {...rest} />;
}
