import type { IconName } from "@/registry/icons/sunui-icons";
import type { PixelIconName } from "@/registry/icons/sunui-pixel-icons";

export type IconGroup = { id: string; title: string; note: string; icons: IconName[] };

// 分組與搜尋關鍵字只給網站用，不會隨圖示庫安裝到使用者專案
export const iconGroups: IconGroup[] = [
  {
    id: "paper",
    title: "Paper",
    note: "SunUI signatures: notched coupons, zigzag receipts, tilted stamps.",
    icons: ["coupon", "receipt", "ticket", "stamp", "stamp-check", "stamp-tool", "punch-card", "scissors", "envelope"],
  },
  {
    id: "commerce",
    title: "Commerce",
    note: "Carts, tags, shipping and payment.",
    icons: ["cart", "bag", "tag", "percent", "gift", "truck", "package", "store", "card", "wallet", "scan", "flash", "timer", "coin"],
  },
  {
    id: "interface",
    title: "Interface",
    note: "The everyday controls every block needs.",
    icons: [
      "check", "close", "plus", "minus", "chevron-left", "chevron-right", "chevron-up", "chevron-down",
      "arrow-left", "arrow-right", "external", "search", "menu", "more", "sliders", "copy", "link", "undo",
      "retry", "download", "upload", "trash", "edit", "info", "alert", "lock", "unlock", "eye", "eye-off",
      "bell", "star", "heart", "share", "user", "calendar", "clock", "image", "file", "grid", "sun", "moon",
      "home", "filter", "mail", "phone", "globe", "map-pin", "sparkle",
    ],
  },
  {
    id: "product",
    title: "Product UI",
    note: "Quiet tool UI: status, jobs, quotas.",
    icons: ["status", "loader", "activity", "chart-bar", "gauge", "terminal", "window", "key", "layers", "inbox", "shield", "mic", "caption"],
  },
  {
    id: "story",
    title: "Story",
    note: "Ink and lantern UI for narrative games.",
    icons: ["play", "pause", "skip", "volume", "book", "bookmark", "dialogue", "lantern", "scroll", "quill", "map", "gem", "trophy"],
  },
];

export type PixelIconGroup = { id: string; title: string; note: string; icons: PixelIconName[] };

// 像素圖示的分組；標題與說明由字典 iconGallery.groups 的 pixel-* 覆蓋
export const pixelIconGroups: PixelIconGroup[] = [
  {
    id: "pixel-interface",
    title: "Interface",
    note: "Controls drawn on a 16px grid, 2px strokes for glyphs.",
    icons: [
      "check", "close", "plus", "minus", "arrow-left", "arrow-right", "arrow-up", "arrow-down",
      "chevron-left", "chevron-right", "chevron-up", "chevron-down", "search", "menu", "home", "user",
      "lock", "settings", "trash", "mail", "download", "upload", "eye", "info", "alert", "bell",
      "heart", "star", "clock", "calendar",
    ],
  },
  {
    id: "pixel-paper",
    title: "Paper",
    note: "The coupon, receipt and stamp signatures, in pixels.",
    icons: ["coupon", "receipt", "stamp", "stamp-check", "punch-card", "envelope", "scissors"],
  },
  {
    id: "pixel-commerce",
    title: "Commerce",
    note: "Carts, tags, shipping and payment.",
    icons: ["cart", "bag", "tag", "gift", "truck", "package", "store", "card", "wallet", "coin"],
  },
  {
    id: "pixel-game",
    title: "Game",
    note: "Loot, items and HUD bits for retro and story games.",
    icons: [
      "sword", "shield", "potion", "key", "gem", "crown", "chest", "trophy", "bomb", "flag",
      "gamepad", "cursor", "hourglass", "sparkle", "battery", "flash", "book",
    ],
  },
];

export const iconKeywords: Partial<Record<IconName | PixelIconName, string>> = {
  coupon: "voucher discount promo 優惠券 折價",
  receipt: "invoice bill order 收據 發票",
  ticket: "stub admission event 票根",
  stamp: "seal chop claimed 印章",
  "stamp-check": "claimed redeemed done 已領取 已兌換",
  "stamp-tool": "rubber stamp redeem 蓋章",
  "punch-card": "loyalty points stamp card 集點卡",
  scissors: "cut clip coupon 剪下",
  envelope: "red envelope hongbao lucky money 紅包",
  cart: "basket checkout 購物車",
  bag: "shopping 購物袋",
  tag: "price label sale 價格標",
  percent: "discount off sale 折扣",
  gift: "present reward 禮物",
  truck: "shipping delivery 運送",
  package: "box parcel order 包裹",
  store: "shop merchant 商店",
  card: "credit payment 信用卡",
  wallet: "balance pay 錢包",
  scan: "barcode qr 條碼",
  flash: "flash sale lightning 限時",
  timer: "hourglass reservation countdown 倒數",
  close: "x dismiss 關閉",
  check: "done success ok 完成",
  more: "ellipsis dots options",
  sliders: "filter settings adjust 篩選",
  retry: "refresh reload 重試",
  undo: "back revert return 復原",
  alert: "warning error 警告",
  info: "help about 說明",
  status: "dot online live 狀態",
  loader: "spinner loading 載入",
  gauge: "quota meter usage 用量",
  inbox: "queue tray jobs 佇列",
  shield: "privacy safe sensitive 隱私",
  caption: "subtitles cc 字幕",
  dialogue: "speech chat bubble 對話",
  lantern: "light lamp 燈籠",
  quill: "feather write 羽毛筆",
  scroll: "parchment story 卷軸",
  home: "house start 首頁",
  filter: "funnel refine 篩選",
  mail: "email message inbox 信件",
  phone: "mobile device 手機",
  globe: "world language web 語言 地球",
  "map-pin": "location place address 地點",
  sparkle: "new ai magic shine 閃亮 新",
  coin: "money currency point 金幣 點數",
  gem: "diamond jewel premium 寶石",
  trophy: "award winner prize 獎盃",
  settings: "gear preferences 設定",
  user: "account profile 使用者",
  sword: "weapon attack rpg 劍",
  potion: "flask hp heal 藥水",
  key: "unlock password 鑰匙",
  crown: "king vip premium 皇冠",
  chest: "treasure loot 寶箱",
  bomb: "explode danger 炸彈",
  flag: "goal checkpoint report 旗",
  gamepad: "controller game play 手把",
  cursor: "pointer mouse arrow 游標",
  hourglass: "wait timer sand 沙漏",
  battery: "energy power hp 電量",
  book: "read story guide 書",
};
