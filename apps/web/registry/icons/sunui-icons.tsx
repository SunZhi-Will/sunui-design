import type { SVGProps } from "react";

/**
 * SunUI Icons
 *
 * 規格（見 apps/web/ICONS.md）：
 * - 24 × 24 網格，主要內容落在 3 到 21 之間，2px 安全邊。
 * - 線寬 1.5，圓頭圓角，顏色跟隨 currentColor。
 * - 每個圖示最多一處「朱紅點」（accent），預設也是 currentColor；
 *   設定 CSS 變數 --sunui-icon-accent 才會上色，對應 DESIGN.md「朱紅只用一處」。
 * - 紙品類圖示帶實體細節：票券有半圓缺口與打孔線、收據有鋸齒底、印章微微傾斜。
 */

type Shape = { accent?: boolean; fill?: boolean; dash?: string };
type IconNode =
  | string
  | (Shape & { d: string })
  | (Shape & { c: [cx: number, cy: number, r: number] })
  | (Shape & { r: [x: number, y: number, w: number, h: number, rx: number] });

export const icons = {
  // 介面
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  close: ["M6.5 6.5l11 11M17.5 6.5l-11 11"],
  plus: ["M12 5v14M5 12h14"],
  minus: ["M5 12h14"],
  "chevron-left": ["M14.5 6l-6 6 6 6"],
  "chevron-right": ["M9.5 6l6 6-6 6"],
  "chevron-up": ["M6 14.5l6-6 6 6"],
  "chevron-down": ["M6 9.5l6 6 6-6"],
  "arrow-left": ["M19.5 12h-15M10.5 6l-6 6 6 6"],
  "arrow-right": ["M4.5 12h15M13.5 6l6 6-6 6"],
  external: ["M7 17L17 7M9 7h8v8"],
  search: [{ c: [11, 11, 6.5] }, "M16 16l4 4"],
  menu: ["M4.5 7h15M4.5 12h15M4.5 17h15"],
  more: [
    { c: [6, 12, 1.25], fill: true },
    { c: [12, 12, 1.25], fill: true },
    { c: [18, 12, 1.25], fill: true },
  ],
  sliders: ["M4.5 7h9M17.5 7h2M4.5 17h2M10.5 17h9", { c: [15.5, 7, 2] }, { c: [8.5, 17, 2] }],
  copy: [
    { r: [8.5, 8.5, 11, 11, 1.5] },
    "M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5",
  ],
  link: [
    "M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1",
    "M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1",
  ],
  undo: ["M9 14L4.5 9.5 9 5", "M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3"],
  retry: ["M4.5 12a7.5 7.5 0 1 0 2.4-5.5L4.5 8.5", "M4.5 4.5v4h4"],
  download: ["M12 4.5v10M7.5 10.5l4.5 4.5 4.5-4.5M5 19.5h14"],
  upload: ["M12 15V5M7.5 9L12 4.5 16.5 9M5 19.5h14"],
  trash: [
    "M4.5 7h15M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7",
    "M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7",
    "M10 11v5M14 11v5",
  ],
  edit: ["M14.5 5.5l4 4L9 19H5v-4z", "M12.5 7.5l4 4"],
  info: [{ c: [12, 12, 8.5] }, "M12 11v5", { c: [12, 8, 1], fill: true }],
  alert: [
    "M10.3 4.6L3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z",
    "M12 9.5v4",
    { c: [12, 16.6, 1], fill: true, accent: true },
  ],
  lock: [{ r: [5, 10.5, 14, 10, 2] }, "M8 10.5v-3a4 4 0 0 1 8 0v3"],
  unlock: [{ r: [5, 10.5, 14, 10, 2] }, "M8 10.5v-3a4 4 0 0 1 7.7-1.5"],
  eye: ["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", { c: [12, 12, 2.75] }],
  "eye-off": [
    "M9.9 5.7A9.3 9.3 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.4 3.2",
    "M6.4 7.4C3.9 9.1 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4.7-1.3",
    "M10 10a2.75 2.75 0 0 0 4 4",
    "M4 4l16 16",
  ],
  bell: [
    "M6 10a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6.5h-15C4.5 16 6 14.5 6 10z",
    "M10 19.5a2 2 0 0 0 4 0",
    { c: [17.5, 5.5, 2], fill: true, accent: true },
  ],
  star: ["M12 3.8l2.5 5.2 5.6.8-4.1 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z"],
  heart: ["M12 19.5s-7.5-4.4-7.5-10A4.25 4.25 0 0 1 12 7a4.25 4.25 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"],
  share: [{ c: [17, 5.5, 2.5] }, { c: [7, 12, 2.5] }, { c: [17, 18.5, 2.5] }, "M9.2 10.8l5.6-3.6M9.2 13.2l5.6 3.6"],
  user: [{ c: [12, 8.5, 3.5] }, "M5 19.5a7 7 0 0 1 14 0"],
  calendar: [{ r: [4.5, 5.5, 15, 14, 1.5] }, "M4.5 10h15M8.5 3.5v4M15.5 3.5v4"],
  clock: [{ c: [12, 12, 8.5] }, "M12 7.5V12l3 2"],
  image: [{ r: [4, 5, 16, 14, 1.5] }, { c: [9, 10, 1.5] }, "M20 16l-4.5-4.5L7 19"],
  file: [
    "M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z",
    "M13.5 3.5v5h5",
  ],
  grid: [{ r: [4, 4, 7, 7, 1] }, { r: [13, 4, 7, 7, 1] }, { r: [4, 13, 7, 7, 1] }, { r: [13, 13, 7, 7, 1] }],
  sun: [
    { c: [12, 12, 3.5], accent: true },
    "M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6",
  ],
  moon: ["M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"],

  // 電商
  cart: [
    "M3.5 4.5h2l2.2 10.2A1.5 1.5 0 0 0 9.2 16h7.6a1.5 1.5 0 0 0 1.5-1.2L19.5 8H6.4",
    { c: [9.5, 19.5, 1.25] },
    { c: [16.5, 19.5, 1.25] },
  ],
  bag: [
    "M5.5 7.5h13l-.9 11.6a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z",
    "M9 10V6.5a3 3 0 0 1 6 0V10",
  ],
  tag: [
    "M3.5 12.3V5A1.5 1.5 0 0 1 5 3.5h7.3a1.5 1.5 0 0 1 1.1.4l6.7 6.8a1.5 1.5 0 0 1 0 2.1l-7.3 7.3a1.5 1.5 0 0 1-2.1 0l-6.8-6.7a1.5 1.5 0 0 1-.4-1.1z",
    { c: [8, 8, 1.5], accent: true },
  ],
  percent: ["M18 6L6 18", { c: [7.5, 7.5, 2] }, { c: [16.5, 16.5, 2] }],
  gift: [
    { r: [4.5, 8.5, 15, 4, 1] },
    "M6 12.5V19a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19v-6.5",
    "M12 8.5v12",
    "M12 8.5C10.5 5 7 4.5 7 6.5s3 2 5 2zM12 8.5c1.5-3.5 5-4 5-2s-3 2-5 2z",
  ],
  truck: [
    "M5.75 17.5H3.5v-11H14v11H9.25",
    "M14 9.5h3.5l3 3.5v4.5h-2.25",
    { c: [7.5, 17.5, 1.75] },
    { c: [16.5, 17.5, 1.75] },
  ],
  package: ["M12 3.5l7.5 4v9l-7.5 4-7.5-4v-9z", "M4.5 7.5l7.5 4 7.5-4M12 11.5v9", "M8.25 5.5l7.5 4"],
  store: [
    "M4 9.5l1.5-5h13l1.5 5",
    "M4 9.5a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0 2.67 2.67 0 0 0 5.33 0",
    "M5.5 12.5v7.5h13v-7.5",
    "M10 20v-4.5h4V20",
  ],
  card: [{ r: [3.5, 6, 17, 12, 1.5] }, "M3.5 10h17M7 14.5h3"],
  wallet: [
    { r: [3.5, 6.5, 17, 13, 2] },
    "M5 6.6l10.5-2.1a1.5 1.5 0 0 1 1.8 1.5v.5",
    "M20.5 11h-4a2 2 0 0 0 0 4h4",
  ],
  scan: [
    "M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16",
    "M8 9v6M11 9v6M13.5 9v6M16 9v6",
  ],
  flash: ["M13 3.5L5.5 13.5H12l-1 7 7.5-10H12z"],
  timer: [
    "M7 3.5h10M7 20.5h10",
    "M8 3.5v3a4 4 0 0 0 1.6 3.2L12 12l2.4-2.3A4 4 0 0 0 16 6.5v-3",
    "M8 20.5v-3a4 4 0 0 1 1.6-3.2L12 12l2.4 2.3a4 4 0 0 1 1.6 3.2v3",
  ],

  // 紙品（SunUI 招牌）
  coupon: [
    "M3.5 7A1.5 1.5 0 0 1 5 5.5h14A1.5 1.5 0 0 1 20.5 7v2.5a2.5 2.5 0 0 0 0 5V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17v-2.5a2.5 2.5 0 0 0 0-5z",
    { d: "M15 7.5v9", dash: "1.5 2" },
    { d: "M8 14.5l3.5-5", accent: true },
  ],
  receipt: [
    "M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z",
    "M9 8h6M9 11.5h6M9 15h3.5",
  ],
  ticket: [
    "M6.5 3.5h11v4.25a1.75 1.75 0 0 0 0 3.5v9.25h-11v-9.25a1.75 1.75 0 0 0 0-3.5z",
    { d: "M8.5 9.5h7", dash: "1.5 2" },
    "M9.5 14h5M9.5 17h3",
  ],
  stamp: [
    { c: [12, 12, 8.5], accent: true },
    { c: [12, 12, 6], dash: "2 1.6", accent: true },
    { d: "M8.75 12.6l6.5-1.2", accent: true },
  ],
  "stamp-check": [{ c: [12, 12, 8.5], accent: true }, { d: "M8 12.6l2.8 2.6 5.4-6", accent: true }],
  "stamp-tool": [
    { c: [12, 6, 2.5] },
    "M10.5 8.5v4M13.5 8.5v4",
    { r: [5, 12.5, 14, 3.5, 1] },
    { d: "M6.5 19.5h11", accent: true },
  ],
  "punch-card": [
    { r: [3.5, 5.5, 17, 13, 1.5] },
    { c: [8, 10, 1.5], fill: true, accent: true },
    { c: [12, 10, 1.5], fill: true, accent: true },
    { c: [16, 10, 1.5], fill: true, accent: true },
    { c: [8, 14.5, 1.5], fill: true, accent: true },
    { c: [12, 14.5, 1.5] },
    { c: [16, 14.5, 1.5] },
  ],
  scissors: [{ c: [6.5, 7, 2.5] }, { c: [6.5, 17, 2.5] }, "M8.6 8.4L20 17M8.6 15.6L20 7"],
  envelope: [
    { r: [5, 3.5, 14, 17, 1.5] },
    "M5 8.5c2 2 4.5 3 7 3s5-1 7-3",
    { c: [12, 11.5, 1.75], fill: true, accent: true },
  ],

  // 產品工具
  activity: ["M3.5 12H7l2.5-6 5 12 2.5-6h3.5"],
  "chart-bar": ["M4.5 19.5h15", "M7.5 16v-5M12 16V7M16.5 16v-3"],
  gauge: ["M4.5 16a7.5 7.5 0 1 1 15 0", { d: "M12 16l3.5-4", accent: true }, { c: [12, 16, 1], fill: true }],
  terminal: [{ r: [3.5, 5, 17, 14, 1.5] }, "M7.5 10l2.5 2-2.5 2M12.5 14.5h4"],
  window: [{ r: [3.5, 4.5, 17, 15, 1.5] }, "M3.5 8.5h17", { c: [6.25, 6.5, 0.6], fill: true }, { c: [8.25, 6.5, 0.6], fill: true }],
  key: [{ c: [8, 15.5, 3.5] }, "M10.5 13l8-8M15.5 8l2 2M17.5 6l2 2"],
  layers: ["M12 3.5L3.5 8 12 12.5 20.5 8z", "M3.5 12L12 16.5 20.5 12", "M3.5 16L12 20.5 20.5 16"],
  inbox: [
    "M3.5 13.5h5l1.5 2.5h4l1.5-2.5h5",
    "M5.7 5.7L3.5 13.5v5A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.5-1.5v-5l-2.2-7.8a1.5 1.5 0 0 0-1.4-1.2H7.1a1.5 1.5 0 0 0-1.4 1.2z",
  ],
  shield: ["M12 3.5L5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z", "M9 12l2 2 4-4.5"],
  loader: [{ c: [12, 12, 8.5], dash: "1.5 2.4" }, { d: "M12 3.5a8.5 8.5 0 0 1 8.5 8.5", accent: true }],
  status: [{ c: [12, 12, 3], fill: true, accent: true }, { c: [12, 12, 7.5], dash: "1.5 2.4" }],
  mic: [{ r: [9, 3.5, 6, 11, 3] }, "M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"],
  caption: [
    { r: [3.5, 5.5, 17, 13, 2] },
    "M10.5 10.5a2 2 0 1 0 0 3M16.5 10.5a2 2 0 1 0 0 3",
  ],

  // 故事
  play: ["M8 5.5v13l10.5-6.5z"],
  pause: ["M8.5 5.5v13M15.5 5.5v13"],
  skip: ["M6.5 5.5v13l9-6.5z", "M18 5.5v13"],
  volume: ["M4.5 9.5v5h3l4.5 4v-13l-4.5 4z", "M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"],
  book: ["M12 6.5c-1.8-1.3-4.5-2-8.5-2v13c4 0 6.7.7 8.5 2 1.8-1.3 4.5-2 8.5-2v-13c-4 0-6.7.7-8.5 2z", "M12 6.5v13"],
  bookmark: ["M7 4.5h10V20l-5-3.5L7 20z"],
  dialogue: [
    "M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v9a1.5 1.5 0 0 1-1.5 1.5h-7l-4 3.5v-3.5H6A1.5 1.5 0 0 1 4.5 15z",
    "M8.5 9h7M8.5 12h4",
  ],
  lantern: [
    "M10 3.5h4M12 3.5v2",
    "M9 5.5h6c2 1.5 3 3.5 3 6s-1 4.5-3 6H9c-2-1.5-3-3.5-3-6s1-4.5 3-6z",
    "M10 5.5c-1 1.8-1.5 3.8-1.5 6s.5 4.2 1.5 6M14 5.5c1 1.8 1.5 3.8 1.5 6s-.5 4.2-1.5 6",
    "M12 17.5v3",
    { c: [12, 11.5, 1.25], fill: true, accent: true },
  ],
  scroll: [
    "M8 14.5v-8a2 2 0 0 1 2-2h8.5",
    "M18.5 4.5a2 2 0 0 1 2 2V8H16",
    "M16 6.5v11a2 2 0 0 1-2 2H6.5a2.5 2.5 0 0 1 0-5H12v3a2 2 0 0 0 2 2",
  ],
  quill: ["M19.5 4.5C13 4.5 8.5 8 8.5 15.5c7.5 0 11-4.5 11-11z", "M4.5 19.5l9-9"],
  map: ["M9 5L3.5 7v12.5L9 17.5l6 2 5.5-2V5L15 7z", "M9 5v12.5M15 7v12.5"],
} satisfies Record<string, IconNode[]>;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  /** 寬高（px 或任何 CSS 長度），預設 24 */
  size?: number | string;
  /** 線寬，預設 1.5；放大到 32px 以上時可降到 1.25 保持紙感的細線 */
  strokeWidth?: number;
  /** 提供時圖示會被讀出；不提供時視為裝飾，aria-hidden */
  title?: string;
};

const ACCENT = "var(--sunui-icon-accent, currentColor)";

export function Icon({ name, size = 24, strokeWidth = 1.5, title, ...rest }: IconProps) {
  const nodes: readonly IconNode[] = icons[name];
  return (
    <svg
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
      {...rest}
    >
      {title && <title>{title}</title>}
      {nodes.map((node, i) => renderNode(node, i))}
    </svg>
  );
}

function renderNode(node: IconNode, key: number) {
  if (typeof node === "string") return <path key={key} d={node} />;
  const paint = node.accent ? ACCENT : "currentColor";
  const props = {
    key,
    stroke: node.fill ? "none" : node.accent ? paint : undefined,
    fill: node.fill ? paint : undefined,
    strokeDasharray: node.dash,
  };
  if ("d" in node) return <path {...props} d={node.d} />;
  if ("c" in node) return <circle {...props} cx={node.c[0]} cy={node.c[1]} r={node.c[2]} />;
  const [x, y, width, height, rx] = node.r;
  return <rect {...props} x={x} y={y} width={width} height={height} rx={rx} />;
}
