"use client";

import { useDemoText } from "@/lib/demo-locale";

import { BrowserShowcase3D, type ShowcaseItem } from "./browser-showcase-3d";

const copy = {
  en: {
    eyebrow: "Selected work",
    heading: "Websites that ship, then keep earning.",
    body: "Every screen on the right is a live client site. Hover to tilt and pause.",
  },
  "zh-TW": {
    eyebrow: "精選作品",
    heading: "準時上線，上線後持續帶來收益的網站。",
    body: "右邊每個畫面都是正在營運的客戶網站。滑鼠移上去可以傾斜並暫停。",
  },
  "zh-CN": {
    eyebrow: "精选作品",
    heading: "按时上线，上线后持续带来收益的网站。",
    body: "右侧每个画面都是正在运营的客户网站。鼠标悬停可倾斜并暂停。",
  },
  ja: {
    eyebrow: "制作実績",
    heading: "公開して終わりではなく、成果を生み続けるウェブサイト。",
    body: "右の画面はすべて稼働中のクライアントサイトです。ホバーで傾き、一時停止します。",
  },
};

// 替身畫面：用中性色塊與線條畫出三個上線網站的首頁輪廓，只有一處用強調色
const ACCENT = "#d4a24c";

function SiteShot({ layout }: { layout: "hero" | "grid" | "split" }) {
  return (
    <div className="flex h-full w-full flex-col gap-[6%] bg-[#161412] p-[6%]">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-[3%]">
        <span className="h-2 w-12 rounded-full bg-[#f5f5f4]/70" />
        <span className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-6 rounded-full bg-white/15" />
          ))}
        </span>
      </div>
      {layout === "hero" && (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <span className="h-4 w-3/4 rounded-sm bg-[#f5f5f4]/80" />
          <span className="h-4 w-1/2 rounded-sm bg-[#f5f5f4]/80" />
          <span className="h-2 w-2/3 rounded-sm bg-white/20" />
          <span className="mt-2 h-6 w-24 rounded-full" style={{ background: ACCENT }} />
        </div>
      )}
      {layout === "grid" && (
        <div className="grid flex-1 grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="flex flex-col justify-end gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] p-2">
              <span className="h-1.5 w-2/3 rounded-full bg-white/25" />
              <span className="h-1.5 w-1/3 rounded-full" style={{ background: i === 1 ? ACCENT : "rgb(255 255 255 / 0.12)" }} />
            </span>
          ))}
        </div>
      )}
      {layout === "split" && (
        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="flex flex-col justify-center gap-2">
            <span className="h-3 w-full rounded-sm bg-[#f5f5f4]/80" />
            <span className="h-3 w-2/3 rounded-sm bg-[#f5f5f4]/80" />
            <span className="h-2 w-3/4 rounded-sm bg-white/20" />
            <span className="mt-1 h-px w-full bg-white/[0.08]" />
            <span className="h-2 w-1/3 rounded-sm" style={{ background: ACCENT }} />
          </div>
          <span className="rounded-lg border border-white/[0.08] bg-[#0c0a09]" />
        </div>
      )}
    </div>
  );
}

const items: ShowcaseItem[] = [
  { url: "hollow-kiln.studio", content: <SiteShot layout="hero" /> },
  { url: "fieldnotes-type.com", content: <SiteShot layout="grid" /> },
  { url: "paperlane-books.tw", content: <SiteShot layout="split" /> },
];

export default function BrowserShowcase3DDemo() {
  const t = useDemoText(copy);
  return (
    <section className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 overflow-hidden rounded-xl bg-[#0c0a09] px-6 py-12 text-[#f5f5f4] md:grid-cols-2 md:px-10">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d4a24c]">{t.eyebrow}</p>
        <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight text-balance">{t.heading}</h2>
        <p className="mt-3 text-sm text-[#a8a29e]">{t.body}</p>
      </div>
      <div className="min-w-0 py-6">
        <BrowserShowcase3D items={items} />
      </div>
    </section>
  );
}
