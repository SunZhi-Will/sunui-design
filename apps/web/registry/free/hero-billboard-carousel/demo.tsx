"use client";

import { useDemoLocale, type Locale } from "@/lib/demo-locale";

import { HeroBillboardCarousel, type HeroBillboardSlide } from "./hero-billboard-carousel";

// 示意封面：活動主視覺風格的漸層與幾何光斑，代替真實海報
function PosterArt({ from, to, id }: { from: string; to: string; id: string }) {
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`hb-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#hb-${id})`} />
      <circle cx="122" cy="30" r="40" fill="#fff" opacity="0.1" />
      <circle cx="140" cy="70" r="22" fill="#000" opacity="0.18" />
      <path d="M0 72 C40 56 80 88 160 64 L160 90 L0 90 Z" fill="#000" opacity="0.22" />
    </svg>
  );
}

type SlideText = Pick<HeroBillboardSlide, "title" | "subtitle" | "badge" | "eyebrow" | "meta" | "price" | "cta">;

const base = [
  { key: "live", overlayColor: "#F5C045", from: "#3b0764", to: "#c026d3" },
  { key: "prompt", overlayColor: "#7dd3fc", from: "#0c4a6e", to: "#0ea5e9" },
  { key: "vision", overlayColor: "#fdba74", from: "#7c2d12", to: "#f59e0b" },
  { key: "deploy", overlayColor: "#86efac", from: "#064e3b", to: "#10b981" },
];

const copy: Record<Locale, { heading: string; browse: string; slides: SlideText[] }> = {
  en: {
    heading: "Learn to build with AI",
    browse: "Browse all courses →",
    slides: [
      { title: "Build your first Gemini agent, live", subtitle: "Free live session", badge: "Open", eyebrow: "Free live session", meta: "Wed, Oct 28, 8:30 to 10:30 PM", price: "Free", cta: "Register free" },
      { title: "Prompt design basics in AI Studio", subtitle: "Free course", eyebrow: "Free course", meta: "6 lessons, 45 min", price: "Free", cta: "Start free" },
      { title: "Vision apps workshop: from photo to product", subtitle: "Workshop", eyebrow: "Workshop", meta: "3 hours, hands-on", price: "$49", cta: "View course" },
      { title: "Ship your prototype to the web", subtitle: "Free course", eyebrow: "Free course", meta: "4 lessons, 30 min", price: "Free", cta: "Start free" },
    ],
  },
  "zh-TW": {
    heading: "學習用 AI 打造產品",
    browse: "瀏覽所有課程 →",
    slides: [
      { title: "直播實作：打造你的第一個 Gemini 代理", subtitle: "免費直播", badge: "報名中", eyebrow: "免費直播", meta: "10 月 28 日（三）晚上 8:30 至 10:30", price: "免費", cta: "免費報名" },
      { title: "AI Studio 提示詞設計入門", subtitle: "免費課程", eyebrow: "免費課程", meta: "6 堂課，45 分鐘", price: "免費", cta: "免費開始" },
      { title: "視覺應用工作坊：從照片到產品", subtitle: "工作坊", eyebrow: "工作坊", meta: "3 小時，實作課", price: "$49", cta: "查看課程" },
      { title: "把你的原型部署上線", subtitle: "免費課程", eyebrow: "免費課程", meta: "4 堂課，30 分鐘", price: "免費", cta: "免費開始" },
    ],
  },
  "zh-CN": {
    heading: "学习用 AI 打造产品",
    browse: "浏览全部课程 →",
    slides: [
      { title: "直播实操：打造你的第一个 Gemini 智能体", subtitle: "免费直播", badge: "报名中", eyebrow: "免费直播", meta: "10 月 28 日（周三）晚上 8:30 至 10:30", price: "免费", cta: "免费报名" },
      { title: "AI Studio 提示词设计入门", subtitle: "免费课程", eyebrow: "免费课程", meta: "6 节课，45 分钟", price: "免费", cta: "免费开始" },
      { title: "视觉应用工作坊：从照片到产品", subtitle: "工作坊", eyebrow: "工作坊", meta: "3 小时，动手实操", price: "$49", cta: "查看课程" },
      { title: "把你的原型部署上线", subtitle: "免费课程", eyebrow: "免费课程", meta: "4 节课，30 分钟", price: "免费", cta: "免费开始" },
    ],
  },
  ja: {
    heading: "AI でつくる力を身につけよう",
    browse: "すべてのコースを見る →",
    slides: [
      { title: "ライブで作る、はじめての Gemini エージェント", subtitle: "無料ライブ", badge: "受付中", eyebrow: "無料ライブ", meta: "10月28日（水）20:30〜22:30", price: "無料", cta: "無料で登録" },
      { title: "AI Studio で学ぶプロンプト設計の基本", subtitle: "無料コース", eyebrow: "無料コース", meta: "全6回、45分", price: "無料", cta: "無料で始める" },
      { title: "ビジョンアプリ講座：写真からプロダクトへ", subtitle: "ワークショップ", eyebrow: "ワークショップ", meta: "3時間の実践講座", price: "$49", cta: "コースを見る" },
      { title: "プロトタイプを Web に公開しよう", subtitle: "無料コース", eyebrow: "無料コース", meta: "全4回、30分", price: "無料", cta: "無料で始める" },
    ],
  },
};

export default function HeroBillboardCarouselDemo() {
  const locale = useDemoLocale();
  const t = copy[locale] ?? copy.en;
  const slides: HeroBillboardSlide[] = base.map((b, i) => ({
    key: b.key,
    ...t.slides[i],
    overlayTitle: true,
    overlayColor: b.overlayColor,
    cover: <PosterArt from={b.from} to={b.to} id={b.key} />,
    accentFrom: b.from,
    accentTo: b.to,
    href: `#${b.key}`,
  }));
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl">
      <HeroBillboardCarousel
        items={slides}
        locale={locale}
        intro={
          <>
            <h1 className="text-xl font-black md:text-2xl">{t.heading}</h1>
            <a href="#courses" className="text-[14px] font-bold text-white/60 no-underline underline-offset-4 hover:underline">
              {t.browse}
            </a>
          </>
        }
      />
    </div>
  );
}
