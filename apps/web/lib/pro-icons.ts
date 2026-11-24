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
  {
    id: "christmas",
    title: "Christmas",
    component: "Christmas",
    scenes: [],
    addedAt: "2026-11-25",
    icons: [
      { name: "stocking", keywords: "christmas stocking sock fireplace gifts 聖誕襪 襪子 圣诞袜 クリスマスの靴下", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "gingerbread", keywords: "gingerbread man cookie baking 薑餅人 姜饼人 餅乾 ジンジャーブレッド", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "wreath", keywords: "wreath door garland holly 花圈 聖誕花圈 圣诞花环 リース", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "ornament", keywords: "ornament bauble ball decoration tree 聖誕球 吊飾 装饰球 オーナメント", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "sleigh", keywords: "sleigh sled santa delivery 雪橇 聖誕老人 そり", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "reindeer", keywords: "reindeer deer antlers red nose rudolph 馴鹿 驯鹿 紅鼻子 トナカイ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "santa-hat", keywords: "santa hat cap christmas 聖誕帽 圣诞帽 サンタ帽", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "mitten", keywords: "mitten glove winter knit 手套 毛線手套 ミトン 手袋", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "hot-cocoa", keywords: "hot cocoa chocolate drink mug marshmallow 熱可可 熱巧克力 热可可 ココア", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "mistletoe", keywords: "mistletoe kiss holly berries 槲寄生 ヤドリギ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "snow-globe", keywords: "snow globe snowglobe winter gift 雪花球 水晶球 雪球 スノードーム", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "fireplace", keywords: "fireplace hearth fire cozy chimney 壁爐 暖爐 壁炉 暖炉", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
    ],
    items: [
      {
        name: "sunui-christmas-icons",
        title: "Christmas Icons",
        description:
          "Christmas line icons on SunUI's 24px grid with a 1.5 stroke: stocking, gingerbread man, wreath, ornament, sleigh, reindeer, Santa hat, mitten, hot cocoa, mistletoe, snow globe and fireplace. One accent part each via --sunui-icon-accent. Tree, snowman, candy cane, bell and gift are in the free set.",
        style: "line",
        animated: false,
        source: "registry/pro/icons/sunui-christmas-icons.tsx",
        target: "components/ui/sunui-christmas-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-christmas-icons",
        title: "Animated Christmas Icons",
        description:
          "Every Christmas line icon animated on the same geometry: the stocking and ornament swing, the gingerbread man dances, the sleigh slides, the reindeer's nose glows, the snow globe shakes and the fire flickers when their button is hovered or focused. Respects reduced motion.",
        style: "line",
        animated: true,
        source: "registry/pro/icons/sunui-animated-christmas-icons.tsx",
        target: "components/ui/sunui-animated-christmas-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-christmas-icons"],
      },
      {
        name: "sunui-christmas-twotone-icons",
        title: "Christmas Two-tone Icons",
        description:
          "Christmas two-tone icons on the same 24px grid and names as the line set: a solid light body plus currentColor details, like the free sunui-twotone-icons. Mono by default; set color and --sunui-icon-body to paint each object (red stocking, green wreath, brown reindeer).",
        style: "twotone",
        animated: false,
        source: "registry/pro/icons/sunui-christmas-twotone-icons.tsx",
        target: "components/ui/sunui-christmas-twotone-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-christmas-twotone-icons",
        title: "Animated Christmas Two-tone Icons",
        description:
          "Every Christmas two-tone icon animated: swinging stocking and ornament, dancing gingerbread man, sliding sleigh, glowing reindeer nose, rising cocoa steam, shaken snow globe and a flickering fire on hover or focus. Respects reduced motion.",
        style: "twotone",
        animated: true,
        source: "registry/pro/icons/sunui-animated-christmas-twotone-icons.tsx",
        target: "components/ui/sunui-animated-christmas-twotone-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-christmas-twotone-icons"],
      },
      {
        name: "sunui-christmas-pixel-icons",
        title: "Christmas Pixel Icons",
        description:
          "Christmas pixel sprites on SunUI's 16px grid with outline, fill, shade and a white shine. Ink by default; tone=\"pigment\" paints each object in its own colors (red stocking with a white cuff, green wreath with a red bow, a fire in a brick hearth).",
        style: "pixel",
        animated: false,
        source: "registry/pro/icons/sunui-christmas-pixel-icons.tsx",
        target: "components/ui/sunui-christmas-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-pixel-icons"],
      },
      {
        name: "sunui-animated-christmas-pixel-icons",
        title: "Animated Christmas Pixel Icons",
        description:
          "Every Christmas pixel icon animated frame by frame: the stocking and ornament sway, the sleigh slides, the Santa hat's pompom flicks, cocoa steam rises, the snow globe shakes and the fire flickers. Frames are derived from the static sprites. No animation library; respects reduced motion.",
        style: "pixel",
        animated: true,
        source: "registry/pro/icons/sunui-animated-christmas-pixel-icons.tsx",
        target: "components/ui/sunui-animated-christmas-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-animated-pixel-icons", "@sunui-pro/sunui-christmas-pixel-icons"],
      },
    ],
  },  {
    id: "halloween",
    title: "Halloween",
    component: "Halloween",
    scenes: [],
    addedAt: "2026-11-25",
    icons: [
      { name: "witch-hat", keywords: "witch hat pointed magic costume 巫師帽 女巫帽 巫婆 魔女の帽子", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "cauldron", keywords: "cauldron pot potion brew witch 大鍋 魔藥 坩堝 大釜", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "spider", keywords: "spider creepy crawly bug 蜘蛛 クモ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "spiderweb", keywords: "spider web cobweb haunted 蜘蛛網 蜘蛛网 クモの巣", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "tombstone", keywords: "tombstone grave headstone rip cemetery 墓碑 墳墓 墓 お墓", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "broom", keywords: "broom broomstick witch fly 掃帚 飛天掃帚 扫帚 ほうき", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "haunted-house", keywords: "haunted house spooky mansion 鬼屋 鬼宅 お化け屋敷", motion: "toggle", pixelMotion: "toggle", twotoneMotion: "toggle" },
      { name: "mummy", keywords: "mummy bandage monster 木乃伊 ミイラ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "eyeball", keywords: "eyeball eye creepy watch 眼球 眼睛 目玉", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "crystal-ball", keywords: "crystal ball fortune teller magic orb 水晶球 占卜 占い 水晶玉", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "owl", keywords: "owl night bird wise 貓頭鷹 猫头鹰 フクロウ", motion: "hover", pixelMotion: "hover", twotoneMotion: "hover" },
      { name: "coffin", keywords: "coffin vampire casket 棺材 棺 吸血鬼", motion: "toggle", pixelMotion: "toggle", twotoneMotion: "toggle" },
    ],
    items: [
      {
        name: "sunui-halloween-icons",
        title: "Halloween Icons",
        description:
          "Halloween line icons on SunUI's 24px grid with a 1.5 stroke: witch hat, cauldron, spider, spiderweb, tombstone, broom, haunted house, mummy, eyeball, crystal ball, owl and coffin. One accent part each via --sunui-icon-accent. Pumpkin, bat, ghost and skull are in the free set.",
        style: "line",
        animated: false,
        source: "registry/pro/icons/sunui-halloween-icons.tsx",
        target: "components/ui/sunui-halloween-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-halloween-icons",
        title: "Animated Halloween Icons",
        description:
          "Every Halloween line icon animated on the same geometry: the haunted house's windows go dark and the coffin lid slides with an active prop; the spider drops on its thread, the cauldron bubbles, the eyeball looks around, the owl blinks and the broom sweeps when their button is hovered or focused. Respects reduced motion.",
        style: "line",
        animated: true,
        source: "registry/pro/icons/sunui-animated-halloween-icons.tsx",
        target: "components/ui/sunui-animated-halloween-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-halloween-icons"],
      },
      {
        name: "sunui-halloween-twotone-icons",
        title: "Halloween Two-tone Icons",
        description:
          "Halloween two-tone icons on the same 24px grid and names as the line set: a solid light body plus currentColor details, like the free sunui-twotone-icons. Mono by default; set color and --sunui-icon-body to paint each object (violet witch hat, grey tombstone, brown owl).",
        style: "twotone",
        animated: false,
        source: "registry/pro/icons/sunui-halloween-twotone-icons.tsx",
        target: "components/ui/sunui-halloween-twotone-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-icons"],
      },
      {
        name: "sunui-animated-halloween-twotone-icons",
        title: "Animated Halloween Two-tone Icons",
        description:
          "Every Halloween two-tone icon animated: windows that go dark and a coffin lid that slides with an active prop; a dropping spider, bubbling cauldron, roving eyeball, swirling crystal ball and blinking owl on hover or focus. Respects reduced motion.",
        style: "twotone",
        animated: true,
        source: "registry/pro/icons/sunui-animated-halloween-twotone-icons.tsx",
        target: "components/ui/sunui-animated-halloween-twotone-icons.tsx",
        dependencies: ["framer-motion"],
        registryDependencies: ["sunui-animated-icons", "@sunui-pro/sunui-halloween-twotone-icons"],
      },
      {
        name: "sunui-halloween-pixel-icons",
        title: "Halloween Pixel Icons",
        description:
          "Halloween pixel sprites on SunUI's 16px grid with outline, fill, shade and a white shine. Ink by default; tone=\"pigment\" paints each object in its own colors (violet witch hat with a green band, green-eyed mummy, a haunted house with lit windows).",
        style: "pixel",
        animated: false,
        source: "registry/pro/icons/sunui-halloween-pixel-icons.tsx",
        target: "components/ui/sunui-halloween-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-pixel-icons"],
      },
      {
        name: "sunui-animated-halloween-pixel-icons",
        title: "Animated Halloween Pixel Icons",
        description:
          "Every Halloween pixel icon animated frame by frame: the haunted house's lights go out and the coffin lid lifts with an active prop; the spider drops, the cauldron bubbles, the eyeball looks around and the owl blinks. Frames are derived from the static sprites. No animation library; respects reduced motion.",
        style: "pixel",
        animated: true,
        source: "registry/pro/icons/sunui-animated-halloween-pixel-icons.tsx",
        target: "components/ui/sunui-animated-halloween-pixel-icons.tsx",
        dependencies: [],
        registryDependencies: ["sunui-animated-pixel-icons", "@sunui-pro/sunui-halloween-pixel-icons"],
      },
    ],
  },
];

/**
 * 場景精靈包（2026-11-25）：給像素 Pro 場景共用的 32 × 32 多影格精靈，不是 16/24px 圖示，所以只有像素一種風格、
 * 不進 /icons 的檔期切換。規則見 ICONS.md「Pro 檔期圖示組」第 10 條。
 */
export const proSpriteItems: ProIconItem[] = [
  {
    name: "sunui-quest-sprites",
    title: "Quest Sprite Kit",
    description:
      "32px pixel sprites for game-style campaign scenes: a chest that opens, gacha capsule, slime king, tag golem, coupon scroll, gold pile, gem shard, voucher card, sapling that grows into a tree, market stall and quest board. Object colors with one shared outline and light; chests, capsules, gems and vouchers recolor by rarity (common steel, rare blue, legendary gold). Every sprite animates frame by frame; respects reduced motion.",
    style: "pixel",
    animated: true,
    source: "registry/pro/icons/sunui-quest-sprites.tsx",
    target: "components/ui/sunui-quest-sprites.tsx",
    dependencies: ["framer-motion"],
    registryDependencies: ["sunui-pixel-icons"],
  },
];

export const proIconItems = [...proIconSets.flatMap((set) => set.items), ...proSpriteItems];

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
