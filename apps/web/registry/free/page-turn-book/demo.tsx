"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PageTurnBook, type BookPage } from "./page-turn-book";

// 夾著旅人手記與手繪地圖的書：第 1 頁文字、第 2 頁紙條、第 3 頁地圖，最後一頁「完」
const copy = {
  en: {
    title: "A Traveller's Notebook",
    heading: "Misty Hollow · Bookshelf",
    day12: "Day twelve. The old road is cut again, so I go round. Food for three more days.",
    note: "Past the twin pines, under the white stone, a door hums at night.",
    stamp: "Marked on map",
    chart: "Two days east of the shelf, where the ridge drops into fog.",
    day13: "Day thirteen. I did not go. Some places are best heard about.\nI leave this page for the next curious soul.",
  },
  "zh-TW": {
    title: "旅人手記",
    heading: "晨霧村・書架",
    day12: "第十二天。舊路又斷了，只好繞道。糧食還夠三天。",
    note: "過了雙松，白石底下，有一扇門夜裡會嗡嗡作響。",
    stamp: "已標在地圖上",
    chart: "從書架往東走兩天，山脊沒入霧裡的地方。",
    day13: "第十三天。我沒有去。有些地方，聽說就好。\n這一頁留給下一個好奇的人。",
  },
  "zh-CN": {
    title: "旅人手记",
    heading: "晨雾村・书架",
    day12: "第十二天。旧路又断了，只好绕道。粮食还够三天。",
    note: "过了双松，白石底下，有一扇门夜里会嗡嗡作响。",
    stamp: "已标在地图上",
    chart: "从书架往东走两天，山脊没入雾里的地方。",
    day13: "第十三天。我没有去。有些地方，听说就好。\n这一页留给下一个好奇的人。",
  },
  ja: {
    title: "旅人の手帳",
    heading: "朝霧の村・本棚",
    day12: "十二日目。古い道がまた途切れていたので、回り道をする。食料はあと三日分。",
    note: "双子の松を過ぎ、白い石の下。夜になると唸る扉がある。",
    stamp: "地図に記入済み",
    chart: "本棚から東へ二日。尾根が霧の中へ落ちていくあたり。",
    day13: "十三日目。行かなかった。噂で聞くだけがいい場所もある。\nこのページは次の物好きのために残しておく。",
  },
};

export default function PageTurnBookDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const pages: BookPage[] = [
    { kind: "text", text: t.day12 },
    { kind: "note", text: t.note, stamp: t.stamp },
    { kind: "chart", text: t.chart, bearing: Math.PI * 0.62 },
    { kind: "text", text: t.day13 },
    { kind: "end" },
  ];

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
        title={t.title}
        heading={t.heading}
        cover={1}
        special
        pages={pages}
        indent={locale.startsWith("zh")}
        locale={locale}
      />
    </div>
  );
}
