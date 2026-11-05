"use client";

import { PageTurnBook, type BookPage } from "./page-turn-book";

// 夾著旅人手記與手繪地圖的書：第 1 頁文字、第 2 頁紙條、第 3 頁地圖，最後一頁「完」
const pages: BookPage[] = [
  { kind: "text", text: "Day twelve. The old road is cut again, so I go round. Food for three more days." },
  {
    kind: "note",
    text: "Past the twin pines, under the white stone, a door hums at night.",
    stamp: "Marked on map",
  },
  {
    kind: "chart",
    text: "Two days east of the shelf, where the ridge drops into fog.",
    bearing: Math.PI * 0.62,
  },
  { kind: "text", text: "Day thirteen. I did not go. Some places are best heard about.\nI leave this page for the next curious soul." },
  { kind: "end" },
];

export default function PageTurnBookDemo() {
  return (
    <div
      className="relative w-full min-w-0 overflow-hidden rounded-md"
      style={{
        // 書架旁的木地板與暖光：用漸層代替遊戲場景
        background:
          "radial-gradient(ellipse at 50% 20%, rgba(255,190,110,0.22), rgba(0,0,0,0) 60%), repeating-linear-gradient(90deg, #3a2616 0 46px, #33210f 46px 48px), #2a1a0d",
      }}
    >
      <PageTurnBook
        title="A Traveller's Notebook"
        heading="Misty Hollow · Bookshelf"
        cover={1}
        special
        pages={pages}
      />
    </div>
  );
}
