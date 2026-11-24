// SunUI Pro 檔期圖示組的公開索引：只有名稱、分組、關鍵字與安裝資訊，沒有任何幾何。
// 幾何在私有 Pro repo（registry/pro/icons），只由 /r/pro/<name>.json 憑授權交付。
// 公開 clone 沒有 Pro 目錄也要能建置，所以 MCP 搜尋、/icons 頁的清單與安裝指令都只讀這份。
// 規劃與分層理由：reports/Pro 圖示包規劃-2026-11-08.md。新增或改名圖示時，scripts/check-icons.mjs 會比對這裡與 Pro 原始碼。

export type ProIconKind = "hover" | "toggle" | "loop";
export type ProIconStyle = "pixel" | "twotone" | "line";

export type ProIconEntry = {
  name: string;
  keywords: string;
  /** 線條動態版的動作類型；沒有就是只有靜態版 */
  motion?: ProIconKind;
  /** 像素動態版的動作類型 */
  pixelMotion?: ProIconKind;
  /** 雙色動態版的動作類型 */
  twotoneMotion?: ProIconKind;
};

export type ProIconItem = {
  name: string;
  title: string;
  description: string;
  style: ProIconStyle;
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
  /** 元件名稱的前綴：Lunar → LunarIcon、LunarPixelIcon、AnimatedLunarTwoToneIcon */
  component: string;
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
    component: "Lunar",
    scenes: ["lunar-new-year", "festival-banner"],
    addedAt: "2026-11-09",
    icons: [
      { name: "fu", keywords: "fortune luck blessing diamond upside down 福 倒福 斗方 春節 福字", motion: "toggle", pixelMotion: "toggle", twotoneMotion: "toggle" },
      { name: "firecracker", keywords: "firecrackers fireworks celebrate bang 鞭炮 爆竹 炮竹 花火", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "gold-ingot", keywords: "yuanbao sycee wealth treasure money 元寶 金元寶 招財 元宝 金塊", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "mandarin", keywords: "orange tangerine citrus fruit luck 橘子 柑橘 大吉 みかん", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "koi", keywords: "fish carp surplus abundance 錦鯉 年年有餘 鯉魚 锦鲤 鯉", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "dumpling", keywords: "jiaozi food reunion dinner 餃子 水餃 年夜飯 饺子 ぎょうざ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "plum-blossom", keywords: "flower plum spring bloom 梅花 春天 梅 花", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "couplet", keywords: "spring couplets banner door scroll 春聯 對聯 揮春 春联 対聯", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "goat", keywords: "zodiac year of the goat sheep ram 2027 羊 生肖 羊年 ひつじ 干支", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "coin-string", keywords: "coins cash money luck string 銅錢 古錢 錢串 铜钱 小判", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "tea", keywords: "tea cup gaiwan visit family 蓋碗 茶 奉茶 盖碗 お茶", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "knot", keywords: "chinese knot tassel decoration luck 中國結 中国结 吉祥 結び", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
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
          "Every Lunar New Year line icon animated on the same geometry: the fu diamond flips upside down with an active prop; firecrackers shake, the ingot hops, the koi swims, the coin spins, the goat nods and the knot's tassel swings when their button is hovered or focused. Respects reduced motion.",
        style: "line",
        animated: true,
        source: "registry/pro/icons/sunui-animated-lunar-icons.tsx",
        target: "components/ui/sunui-animated-lunar-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-lunar-icons"],
      },
      {
        name: "sunui-lunar-twotone-icons",
        title: "Lunar New Year Two-tone Icons",
        description:
          "Lunar New Year two-tone icons on the same 24px grid and names as the line set: a solid light body plus currentColor details, like the free sunui-twotone-icons. Mono by default; set color and --sunui-icon-body to paint each object (red fu, orange koi, blue-and-white gaiwan).",
        style: "twotone",
        animated: false,
        source: "registry/pro/icons/sunui-lunar-twotone-icons.tsx",
        target: "components/ui/sunui-lunar-twotone-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-lunar-twotone-icons",
        title: "Animated Lunar New Year Two-tone Icons",
        description:
          "Every Lunar New Year two-tone icon animated: the fu diamond flips with an active prop; firecrackers shake, the coin spins, the gaiwan lid lifts, the dumpling steams, the plum blossom turns and the knot's tassel swings on hover or focus. Respects reduced motion.",
        style: "twotone",
        animated: true,
        source: "registry/pro/icons/sunui-animated-lunar-twotone-icons.tsx",
        target: "components/ui/sunui-animated-lunar-twotone-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-lunar-twotone-icons"],
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
          "Every Lunar New Year pixel icon animated frame by frame: the fu diamond flips, firecrackers shake, the ingot hops, the koi swims, the coin turns, the gaiwan lid lifts and the knot sways. Frames are derived from the static sprites. No animation library; respects reduced motion.",
        style: "pixel",
        animated: true,
        source: "registry/pro/icons/sunui-animated-lunar-pixel-icons.tsx",
        target: "components/ui/sunui-animated-lunar-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-animated-pixel-icons", "@sunui-pro/sunui-lunar-pixel-icons"],
      },
    ],
  },
  {
    id: "valentines-day",
    title: "Valentine's Day",
    component: "Valentine",
    scenes: [],
    addedAt: "2026-11-25",
    icons: [
      { name: "rose", keywords: "flower red rose romance love bloom 玫瑰 紅玫瑰 花 バラ 薔薇", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "bouquet", keywords: "flowers bunch gift florist bouquet 花束 捧花 送花 花たば ブーケ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "ring-box", keywords: "engagement ring proposal diamond jewelry box 戒指 婚戒 求婚 鑽戒 指輪 プロポーズ", motion: "toggle", pixelMotion: "toggle", twotoneMotion: "toggle" },
      { name: "wax-seal", keywords: "seal stamp letter wax envelope sealed 封蠟 火漆 蠟封 封印 シーリングワックス", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "cupid-arrow", keywords: "cupid arrow heart pierced crush love 邱比特 愛神之箭 一箭穿心 キューピッド 矢", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "love-lock", keywords: "padlock heart lock forever couple bridge 愛心鎖 同心鎖 愛情鎖 鎖 南京錠", motion: "toggle", pixelMotion: "toggle", twotoneMotion: "toggle" },
      { name: "perfume", keywords: "perfume fragrance scent bottle gift 香水 香氛 香水瓶 フレグランス", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "teddy", keywords: "teddy bear plush toy gift cute 小熊 泰迪熊 玩偶 熊 くま ぬいぐるみ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "macaron", keywords: "macaron dessert sweet pastry cookie 馬卡龍 甜點 马卡龙 マカロン", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "champagne", keywords: "champagne toast cheers celebrate glasses date 香檳 乾杯 碰杯 慶祝 シャンパン 乾杯", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "candle", keywords: "candle candlelight dinner romantic flame 蠟燭 燭光晚餐 燭台 蜡烛 キャンドル", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "key-heart", keywords: "key heart key to my heart unlock love 心形鑰匙 鑰匙 钥匙 鍵 ハートの鍵", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
    ],
    items: [
      {
        name: "sunui-valentine-icons",
        title: "Valentine's Day Icons",
        description:
          "Valentine's Day line icons on SunUI's 24px grid with a 1.5 stroke: rose, bouquet, ring box, wax seal, cupid arrow, love lock, perfume, teddy, macaron, champagne, candles and a heart key. One accent part each via --sunui-icon-accent. Heart, chocolate, love letter and balloon are in the free set.",
        style: "line",
        animated: false,
        source: "registry/pro/icons/sunui-valentine-icons.tsx",
        target: "components/ui/sunui-valentine-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-valentine-icons",
        title: "Animated Valentine's Day Icons",
        description:
          "Every Valentine's Day line icon animated on the same geometry: the ring box closes and the love lock springs open with an active prop; the arrow flies into the heart, the glasses clink, the seal presses, the candles flicker and the teddy tilts its head when their button is hovered or focused. Respects reduced motion.",
        style: "line",
        animated: true,
        source: "registry/pro/icons/sunui-animated-valentine-icons.tsx",
        target: "components/ui/sunui-animated-valentine-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-valentine-icons"],
      },
      {
        name: "sunui-valentine-twotone-icons",
        title: "Valentine's Day Two-tone Icons",
        description:
          "Valentine's Day two-tone icons on the same 24px grid and names as the line set: a solid light body plus currentColor details, like the free sunui-twotone-icons. Mono by default; set color and --sunui-icon-body to paint each object (red rose, pink macaron, gold lock).",
        style: "twotone",
        animated: false,
        source: "registry/pro/icons/sunui-valentine-twotone-icons.tsx",
        target: "components/ui/sunui-valentine-twotone-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-valentine-twotone-icons",
        title: "Animated Valentine's Day Two-tone Icons",
        description:
          "Every Valentine's Day two-tone icon animated: the ring box closes and the love lock opens with an active prop; the arrow flies in, the glasses clink, the macaron lifts its top shell and the candles flicker on hover or focus. Respects reduced motion.",
        style: "twotone",
        animated: true,
        source: "registry/pro/icons/sunui-animated-valentine-twotone-icons.tsx",
        target: "components/ui/sunui-animated-valentine-twotone-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-valentine-twotone-icons"],
      },
      {
        name: "sunui-valentine-pixel-icons",
        title: "Valentine's Day Pixel Icons",
        description:
          "Valentine's Day pixel sprites on SunUI's 16px grid with outline, fill, shade and a white shine. Ink by default; tone=\"pigment\" paints each object in its own colors (red rose with green leaves, gold heart on a red wax seal, pink perfume with a gold cap).",
        style: "pixel",
        animated: false,
        source: "registry/pro/icons/sunui-valentine-pixel-icons.tsx",
        target: "components/ui/sunui-valentine-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-pixel-icons"],
      },
      {
        name: "sunui-animated-valentine-pixel-icons",
        title: "Animated Valentine's Day Pixel Icons",
        description:
          "Every Valentine's Day pixel icon animated frame by frame: the ring box closes, the lock's shackle pops open, the arrow flies, the glasses clink, the macaron opens and the candle flames sway. Frames are derived from the static sprites. No animation library; respects reduced motion.",
        style: "pixel",
        animated: true,
        source: "registry/pro/icons/sunui-animated-valentine-pixel-icons.tsx",
        target: "components/ui/sunui-animated-valentine-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-animated-pixel-icons", "@sunui-pro/sunui-valentine-pixel-icons"],
      },
    ],
  },
];

export const proIconItems = proIconSets.flatMap((set) => set.items);

export function getProIconItem(name: string) {
  return proIconItems.find((item) => item.name === name);
}

/** 安裝這組圖示的指令（像素、雙色或線條，含動態版） */
export function proIconInstall(set: ProIconSet, style: ProIconStyle, animated = false) {
  const item = set.items.find((i) => i.style === style && i.animated === animated);
  return item ? `npx shadcn@latest add @sunui-pro/${item.name}` : null;
}

/**
 * /icons 頁畫 Pro 圖示用的渲染器。實作在私有 repo 的 registry/pro/icons/showcase.tsx，
 * 由 scripts/generate-previews.mjs 產生的 loadProIconRenderers 動態載入；公開 clone 沒有它時是 null，頁面只列名稱與安裝方式。
 */
export type ProIconRenderer = {
  line: (name: string, opts: { size: number; strokeWidth: number; animated: boolean; active?: boolean; colored?: boolean }) => import("react").ReactNode;
  twotone: (name: string, opts: { size: number; animated: boolean; active?: boolean; colored?: boolean }) => import("react").ReactNode;
  pixel: (name: string, opts: { size: number; tone: "ink" | "pigment"; animated: boolean; active?: boolean }) => import("react").ReactNode;
};
