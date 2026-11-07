"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SpineShelf, type SpineItem } from "./spine-shelf";

// 和完整 demo 同一組配色，只取六本，卡片寬度剛好放得下一整排
const plates: [string, string, string][] = [
  ["#2f3e46", "#cad2c5", "#84a98c"],
  ["#7f5539", "#ede0d4", "#b08968"],
  ["#283618", "#fefae0", "#dda15e"],
  ["#3d405b", "#f4f1de", "#e07a5f"],
  ["#1d3557", "#f1faee", "#a8dadc"],
  ["#14213d", "#e5e5e5", "#fca311"],
];

function cover(i: number) {
  const [bg, paper, accent] = plates[i];
  const motif =
    i % 2 === 0
      ? `<circle cx='170' cy='190' r='70' fill='${accent}'/>`
      : `<path d='M40 330 L170 120 L300 330Z' fill='${accent}'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 340 500' preserveAspectRatio='xMidYMid slice'><rect width='340' height='500' fill='${bg}'/>${motif}<rect x='60' y='392' width='140' height='10' fill='${paper}'/><rect x='60' y='414' width='90' height='6' fill='${paper}' opacity='.6'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Book = { title: string; author: string; price: string };
type Copy = { shelf: string; previous: string; next: string; books: Book[] };

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Copy> = {
  en: {
    shelf: "Staff picks shelf",
    previous: "Previous book",
    next: "Next book",
    books: [
      { title: "Salt and Silence", author: "Mara Ellison", price: "$18.00" },
      { title: "The Night Ferry", author: "Jun Oh", price: "$22.50" },
      { title: "A Field Guide to Rain", author: "Ines Varga", price: "$16.00" },
      { title: "Small Fires", author: "Tomas Riel", price: "$19.90" },
      { title: "Harbor Lights", author: "Ana Costa", price: "$24.00" },
      { title: "North of Quiet", author: "Elias Brandt", price: "$21.00" },
    ],
  },
  "zh-TW": {
    shelf: "店員推薦書架",
    previous: "上一本",
    next: "下一本",
    books: [
      { title: "鹽與沉默", author: "林夏", price: "NT$420" },
      { title: "夜航渡輪", author: "吳俊", price: "NT$480" },
      { title: "雨的田野筆記", author: "陳以恩", price: "NT$360" },
      { title: "小小的火", author: "周牧", price: "NT$400" },
      { title: "港口燈火", author: "許安", price: "NT$520" },
      { title: "安靜以北", author: "高以理", price: "NT$450" },
    ],
  },
  "zh-CN": {
    shelf: "店员推荐书架",
    previous: "上一本",
    next: "下一本",
    books: [
      { title: "盐与沉默", author: "林夏", price: "¥68" },
      { title: "夜航渡轮", author: "吴俊", price: "¥78" },
      { title: "雨的田野笔记", author: "陈以恩", price: "¥58" },
      { title: "小小的火", author: "周牧", price: "¥64" },
      { title: "港口灯火", author: "许安", price: "¥88" },
      { title: "安静以北", author: "高以理", price: "¥72" },
    ],
  },
  ja: {
    shelf: "スタッフおすすめの棚",
    previous: "前の本",
    next: "次の本",
    books: [
      { title: "塩と沈黙", author: "林 夏", price: "¥2,200" },
      { title: "夜のフェリー", author: "呉 俊", price: "¥2,640" },
      { title: "雨のフィールドノート", author: "陳 以恩", price: "¥1,980" },
      { title: "小さな火", author: "周 牧", price: "¥2,310" },
      { title: "港のあかり", author: "許 安", price: "¥2,860" },
      { title: "静けさの北", author: "高 以理", price: "¥2,420" },
    ],
  },
};

/** 型錄卡片：一排六本書脊，滑過會傾出、點一本就抽出來轉成封面，箭頭也能換書。 */
export default function SpineShelfCard() {
  const t = useDemoText(copy);
  const items: SpineItem[] = t.books.map((book, i) => ({
    id: `book-${i}`,
    title: book.title,
    subtitle: `${book.author} · ${book.price}`,
    spineColor: plates[i][0],
    spineInk: plates[i][1],
    cover: cover(i),
  }));

  return (
    <div className="w-[320px]">
      <SpineShelf
        items={items}
        defaultIndex={2}
        height={150}
        spineWidth={28}
        label={t.shelf}
        labels={{ previous: t.previous, next: t.next }}
        className="[&>div:nth-child(2)]:mt-3"
      />
    </div>
  );
}
