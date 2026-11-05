"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SpineShelf, type SpineItem } from "./spine-shelf";

// 示範封面：SVG data URI，平面色塊與幾何圖樣，不讀外部圖片
const plates: [string, string, string][] = [
  ["#2f3e46", "#cad2c5", "#84a98c"],
  ["#7f5539", "#ede0d4", "#b08968"],
  ["#283618", "#fefae0", "#dda15e"],
  ["#3d405b", "#f4f1de", "#e07a5f"],
  ["#1d3557", "#f1faee", "#a8dadc"],
  ["#5e503f", "#eae0d5", "#c6ac8f"],
  ["#14213d", "#e5e5e5", "#fca311"],
  ["#4a4e69", "#f2e9e4", "#c9ada7"],
  ["#264653", "#e9f5f2", "#2a9d8f"],
  ["#6b705c", "#ffe8d6", "#cb997e"],
];

function cover(i: number) {
  const [bg, paper, accent] = plates[i % plates.length];
  const motifs = [
    `<circle cx='170' cy='190' r='70' fill='${accent}'/><rect x='60' y='300' width='220' height='3' fill='${paper}'/>`,
    `<path d='M40 330 L170 120 L300 330Z' fill='${accent}'/><circle cx='240' cy='130' r='26' fill='${paper}'/>`,
    `<rect x='80' y='110' width='180' height='180' fill='none' stroke='${paper}' stroke-width='3'/><rect x='120' y='150' width='100' height='100' fill='${accent}'/>`,
    `<path d='M40 260 Q170 120 300 260' fill='none' stroke='${accent}' stroke-width='18'/><path d='M40 310 Q170 170 300 310' fill='none' stroke='${paper}' stroke-width='3'/>`,
    `<g fill='${accent}'><circle cx='110' cy='160' r='34'/><circle cx='230' cy='160' r='34'/><circle cx='170' cy='260' r='34'/></g>`,
  ];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 340 500' preserveAspectRatio='xMidYMid slice'><rect width='340' height='500' fill='${bg}'/>${motifs[i % motifs.length]}<rect x='60' y='392' width='140' height='10' fill='${paper}'/><rect x='60' y='414' width='90' height='6' fill='${paper}' opacity='.6'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Book = { title: string; author: string; price: string };

const copy: { en: Copy } & Partial<Record<"zh-TW" | "zh-CN" | "ja", Copy>> = {
  en: {
    eyebrow: "Staff picks",
    heading: "This month on the shelf",
    shelf: "Staff picks shelf",
    previous: "Previous book",
    next: "Next book",
    inStock: "In stock",
    books: [
      { title: "Salt and Silence", author: "Mara Ellison", price: "$18.00" },
      { title: "The Night Ferry", author: "Jun Oh", price: "$22.50" },
      { title: "A Field Guide to Rain", author: "Ines Varga", price: "$16.00" },
      { title: "Small Fires", author: "Tomas Riel", price: "$19.90" },
      { title: "Harbor Lights", author: "Ana Costa", price: "$24.00" },
      { title: "Paper Gardens", author: "Lena Park", price: "$15.50" },
      { title: "North of Quiet", author: "Elias Brandt", price: "$21.00" },
      { title: "The Tea Merchant", author: "Wen Li", price: "$17.80" },
      { title: "Tidewater", author: "Sofia Marsh", price: "$20.00" },
      { title: "Letters in Autumn", author: "Hugo Lind", price: "$14.90" },
    ],
  },
  "zh-TW": {
    eyebrow: "店員推薦",
    heading: "本月上架",
    shelf: "店員推薦書架",
    previous: "上一本",
    next: "下一本",
    inStock: "現貨",
    books: [
      { title: "鹽與沉默", author: "林夏", price: "NT$420" },
      { title: "夜航渡輪", author: "吳俊", price: "NT$480" },
      { title: "雨的田野筆記", author: "陳以恩", price: "NT$360" },
      { title: "小小的火", author: "周牧", price: "NT$400" },
      { title: "港口燈火", author: "許安", price: "NT$520" },
      { title: "紙上庭園", author: "蘇蓮", price: "NT$350" },
      { title: "安靜以北", author: "高以理", price: "NT$450" },
      { title: "茶商", author: "李文", price: "NT$380" },
      { title: "潮間帶", author: "馬素", price: "NT$420" },
      { title: "秋天的信", author: "林雨果", price: "NT$320" },
    ],
  },
  "zh-CN": {
    eyebrow: "店员推荐",
    heading: "本月上架",
    shelf: "店员推荐书架",
    previous: "上一本",
    next: "下一本",
    inStock: "现货",
    books: [
      { title: "盐与沉默", author: "林夏", price: "¥68" },
      { title: "夜航渡轮", author: "吴俊", price: "¥78" },
      { title: "雨的田野笔记", author: "陈以恩", price: "¥58" },
      { title: "小小的火", author: "周牧", price: "¥64" },
      { title: "港口灯火", author: "许安", price: "¥88" },
      { title: "纸上庭园", author: "苏莲", price: "¥56" },
      { title: "安静以北", author: "高以理", price: "¥72" },
      { title: "茶商", author: "李文", price: "¥62" },
      { title: "潮间带", author: "马素", price: "¥68" },
      { title: "秋天的信", author: "林雨果", price: "¥52" },
    ],
  },
  ja: {
    eyebrow: "スタッフのおすすめ",
    heading: "今月の棚",
    shelf: "スタッフおすすめの棚",
    previous: "前の本",
    next: "次の本",
    inStock: "在庫あり",
    books: [
      { title: "塩と沈黙", author: "林 夏", price: "¥2,200" },
      { title: "夜のフェリー", author: "呉 俊", price: "¥2,640" },
      { title: "雨のフィールドノート", author: "陳 以恩", price: "¥1,980" },
      { title: "小さな火", author: "周 牧", price: "¥2,310" },
      { title: "港のあかり", author: "許 安", price: "¥2,860" },
      { title: "紙の庭", author: "蘇 蓮", price: "¥1,870" },
      { title: "静けさの北", author: "高 以理", price: "¥2,420" },
      { title: "茶商人", author: "李 文", price: "¥2,090" },
      { title: "潮だまり", author: "馬 素", price: "¥2,200" },
      { title: "秋の手紙", author: "林 ユーゴ", price: "¥1,760" },
    ],
  },
};

type Copy = {
  eyebrow: string;
  heading: string;
  shelf: string;
  previous: string;
  next: string;
  inStock: string;
  books: Book[];
};

export default function SpineShelfDemo() {
  const t = useDemoText(copy);
  const items: SpineItem[] = t.books.map((book, i) => ({
    id: `book-${i}`,
    title: book.title,
    subtitle: book.author,
    spineColor: plates[i][0],
    spineInk: plates[i][1],
    cover: cover(i),
    meta: (
      <span className="inline-flex items-center gap-2">
        <span className="font-semibold tracking-tight">{book.price}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{t.inStock}</span>
      </span>
    ),
  }));

  return (
    <section className="w-full max-w-4xl py-6">
      <div className="px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground">{t.heading}</h2>
      </div>
      <SpineShelf
        items={items}
        defaultIndex={3}
        height={260}
        label={t.shelf}
        labels={{ previous: t.previous, next: t.next }}
        className="mt-4"
      />
    </section>
  );
}
