// SunUI Pro 檔期圖示組的公開索引：只有名稱、分組、關鍵字與安裝資訊，沒有任何幾何。
// 幾何在私有 Pro repo（registry/pro/icons），只由 /r/pro/<name>.json 憑授權交付。
// 公開 clone 沒有 Pro 目錄也要能建置，所以 MCP 搜尋、/icons 頁的清單與安裝指令都只讀這份。
// 規劃與分層理由：reports/Pro 圖示包規劃-2026-11-08.md。新增或改名圖示時，scripts/check-icons.mjs 會比對這裡與 Pro 原始碼。

export type ProIconKind = "hover" | "toggle" | "loop";

export type ProIconEntry = {
  name: string;
  keywords: string;
  /** 線條動態版的動作類型；沒有就是只有靜態版 */
  motion?: ProIconKind;
  /** 像素動態版的動作類型 */
  pixelMotion?: ProIconKind;
};

export type ProIconItem = {
  name: string;
  title: string;
  description: string;
  style: "line" | "pixel";
  animated: boolean;
  source: string;
  target: string;
  dependencies: string[];
  /** 免費圖示庫寫名稱（換成 /r/icons/<name>.json），Pro 寫 @sunui-pro/<name> */
  registryDependencies: string[];
};

export type ProIconSet = {
  id: string;
  title: string;
  /** 對應的季節包與 Pro 場景，用來在 /icons 與 MCP 導向 */
  scenes: string[];
  addedAt: string;
  icons: ProIconEntry[];
  items: ProIconItem[];
};

export const proIconSets: ProIconSet[] = [
  {
    id: "lunar-new-year",
    title: "Lunar New Year",
    scenes: ["lunar-new-year", "festival-banner"],
    addedAt: "2026-11-09",
    icons: [
      { name: "fu", keywords: "fortune luck blessing diamond upside down 福 倒福 斗方 春節 福字", motion: "toggle", pixelMotion: "toggle" },
      { name: "firecracker", keywords: "firecrackers fireworks celebrate bang 鞭炮 爆竹 炮竹 花火", motion: "hover", pixelMotion: "hover" },
      { name: "gold-ingot", keywords: "yuanbao sycee wealth treasure money 元寶 金元寶 招財 元宝 金塊", motion: "hover", pixelMotion: "hover" },
      { name: "mandarin", keywords: "orange tangerine citrus fruit luck 橘子 柑橘 大吉 みかん", motion: "hover" },
      { name: "koi", keywords: "fish carp surplus abundance 錦鯉 年年有餘 鯉魚 锦鲤 鯉", motion: "hover", pixelMotion: "hover" },
      { name: "dumpling", keywords: "jiaozi food reunion dinner 餃子 水餃 年夜飯 饺子 ぎょうざ" },
      { name: "plum-blossom", keywords: "flower plum spring bloom 梅花 春天 梅 花" },
      { name: "couplet", keywords: "spring couplets banner door scroll 春聯 對聯 揮春 春联 対聯" },
      { name: "goat", keywords: "zodiac year of the goat sheep ram 2027 羊 生肖 羊年 ひつじ 干支" },
      { name: "coin-string", keywords: "coins cash money luck string 銅錢 古錢 錢串 铜钱 小判" },
      { name: "tea", keywords: "tea cup gaiwan visit family 蓋碗 茶 奉茶 盖碗 お茶", motion: "hover" },
      { name: "knot", keywords: "chinese knot tassel decoration luck 中國結 中国结 吉祥 結び", motion: "hover", pixelMotion: "hover" },
    ],
    items: [
      {
        name: "sunui-lunar-icons",
        title: "Lunar New Year Icons",
        description:
          "Lunar New Year line icons on SunUI's 24px grid with a 1.5 stroke: fu diamond, firecrackers, gold ingot, mandarin, koi, dumpling, plum blossom, couplets, zodiac goat, coin string, gaiwan tea and a Chinese knot. One accent part each via --sunui-icon-accent. Red envelope, lantern and firework are in the free set.",
        style: "line",
        animated: false,
        source: "registry/pro/icons/sunui-lunar-icons.tsx",
        target: "components/ui/sunui-lunar-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-lunar-icons",
        title: "Animated Lunar New Year Icons",
        description:
          "Animated Lunar New Year line icons on the same geometry: the fu diamond flips upside down with an active prop, firecrackers shake, the ingot hops, the koi swims and the knot's tassel swings when their button is hovered or focused. Respects reduced motion.",
        style: "line",
        animated: true,
        source: "registry/pro/icons/sunui-animated-lunar-icons.tsx",
        target: "components/ui/sunui-animated-lunar-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-lunar-icons"],
      },
      {
        name: "sunui-lunar-pixel-icons",
        title: "Lunar New Year Pixel Icons",
        description:
          "Lunar New Year pixel sprites on SunUI's 16px grid with outline, fill, shade and a white shine. Ink by default; tone=\"pigment\" paints each object in muted festival colors (red and gold fu, orange mandarin with a green leaf, red koi with white patches).",
        style: "pixel",
        animated: false,
        source: "registry/pro/icons/sunui-lunar-pixel-icons.tsx",
        target: "components/ui/sunui-lunar-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-pixel-icons"],
      },
      {
        name: "sunui-animated-lunar-pixel-icons",
        title: "Animated Lunar New Year Pixel Icons",
        description:
          "Frame-by-frame Lunar New Year pixel icons: the fu diamond flips, firecrackers shake, the ingot hops, the koi swims and the knot sways. Frames are derived from the static sprites. No animation library; respects reduced motion.",
        style: "pixel",
        animated: true,
        source: "registry/pro/icons/sunui-animated-lunar-pixel-icons.tsx",
        target: "components/ui/sunui-animated-lunar-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-animated-pixel-icons", "@sunui-pro/sunui-lunar-pixel-icons"],
      },
    ],
  },
];

export const proIconItems = proIconSets.flatMap((set) => set.items);

export function getProIconItem(name: string) {
  return proIconItems.find((item) => item.name === name);
}

/** 安裝這組圖示的指令（線條或像素，含動態版） */
export function proIconInstall(set: ProIconSet, style: "line" | "pixel", animated = false) {
  const item = set.items.find((i) => i.style === style && i.animated === animated);
  return item ? `npx shadcn@latest add @sunui-pro/${item.name}` : null;
}

/**
 * /icons 頁畫 Pro 圖示用的渲染器。實作在私有 repo 的 registry/pro/icons/showcase.tsx，
 * 由 scripts/generate-previews.mjs 產生的 loadProIconRenderers 動態載入；公開 clone 沒有它時是 null，頁面只列名稱與安裝方式。
 */
export type ProIconRenderer = {
  line: (name: string, opts: { size: number; strokeWidth: number; animated: boolean; active?: boolean }) => import("react").ReactNode;
  pixel: (name: string, opts: { size: number; tone: "ink" | "pigment"; animated: boolean; active?: boolean }) => import("react").ReactNode;
};
