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

// 替身畫面：用漸層與色塊畫出三個上線網站的首頁輪廓
function SiteShot({ bg, accent, layout }: { bg: string; accent: string; layout: "hero" | "grid" | "split" }) {
  return (
    <div className="flex h-full w-full flex-col gap-[6%] p-[6%]" style={{ background: bg }}>
      <div className="flex items-center justify-between">
        <span className="h-2 w-12 rounded-full" style={{ background: accent }} />
        <span className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-6 rounded-full bg-white/20" />
          ))}
        </span>
      </div>
      {layout === "hero" && (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <span className="h-4 w-3/4 rounded bg-white/85" />
          <span className="h-4 w-1/2 rounded bg-white/85" />
          <span className="h-2 w-2/3 rounded bg-white/30" />
          <span className="mt-2 h-6 w-24 rounded-full" style={{ background: accent }} />
        </div>
      )}
      {layout === "grid" && (
        <div className="grid flex-1 grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="rounded-md bg-white/10" style={i === 1 ? { background: accent } : undefined} />
          ))}
        </div>
      )}
      {layout === "split" && (
        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="flex flex-col justify-center gap-2">
            <span className="h-3 w-full rounded bg-white/85" />
            <span className="h-3 w-2/3 rounded bg-white/85" />
            <span className="h-2 w-3/4 rounded bg-white/30" />
          </div>
          <span className="rounded-lg" style={{ background: `radial-gradient(circle at 30% 30%, ${accent}, transparent 70%), #ffffff14` }} />
        </div>
      )}
    </div>
  );
}

const items: ShowcaseItem[] = [
  { url: "northwind.studio", content: <SiteShot layout="hero" bg="linear-gradient(160deg, #1b1a24, #0c0c10)" accent="#d4af37" /> },
  { url: "kettle-and-co.shop", content: <SiteShot layout="grid" bg="linear-gradient(160deg, #1e2420, #0b0e0c)" accent="#8fbf8a" /> },
  { url: "harbor-clinic.tw", content: <SiteShot layout="split" bg="linear-gradient(160deg, #18202b, #0a0d12)" accent="#7aa7e8" /> },
];

export default function BrowserShowcase3DDemo() {
  const t = useDemoText(copy);
  return (
    <section className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 overflow-hidden rounded-xl bg-[#08080a] px-6 py-12 text-[#f7f5f0] md:grid-cols-2 md:px-10">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#e8d4a0]">{t.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{t.heading}</h2>
        <p className="mt-3 text-sm text-[#a8a296]">{t.body}</p>
      </div>
      <div className="min-w-0 py-6">
        <BrowserShowcase3D items={items} />
      </div>
    </section>
  );
}
