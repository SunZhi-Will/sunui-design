"use client";

import { useMemo } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TiltedMarqueeBackground } from "./tilted-marquee-background";

// 沒有圖片時沿用原站封面磚的漸層畫法：兩顆模糊光球加漸層標題
const COLORS = [
  { from: "#da7756", to: "#f4c7a1" },
  { from: "#6366f1", to: "#a5b4fc" },
  { from: "#10b981", to: "#a7f3d0" },
  { from: "#f59e0b", to: "#fde68a" },
  { from: "#ec4899", to: "#fbcfe8" },
  { from: "#0ea5e9", to: "#bae6fd" },
];

const copy = {
  en: {
    courses: [
      ["Prompt Craft Basics", "Starter"],
      ["Agents in Practice", "Workshop"],
      ["Vibe Coding a Landing Page", "Hands-on"],
      ["Data Stories with AI", "Analytics"],
      ["Voice and Video Tools", "Creator"],
      ["Automate Your Week", "Productivity"],
    ],
    heading: "Every course, one membership",
    body: "Unlock every paid course, replays and handouts, plus everything we publish next.",
    cta: "Become a member",
  },
  "zh-TW": {
    courses: [
      ["提示詞基本功", "入門"],
      ["AI 代理實戰", "工作坊"],
      ["用 Vibe Coding 做形象頁", "實作"],
      ["用 AI 說資料故事", "數據分析"],
      ["語音與影片工具", "創作者"],
      ["讓一週自動化", "效率"],
    ],
    heading: "所有課程，一個會員搞定",
    body: "解鎖全部付費課程、回放與講義，之後推出的內容也都包含在內。",
    cta: "成為會員",
  },
  "zh-CN": {
    courses: [
      ["提示词基本功", "入门"],
      ["AI 智能体实战", "工作坊"],
      ["用 Vibe Coding 做落地页", "实操"],
      ["用 AI 讲数据故事", "数据分析"],
      ["语音与视频工具", "创作者"],
      ["让一周自动化", "效率"],
    ],
    heading: "所有课程，一个会员全包",
    body: "解锁全部付费课程、回放与讲义，之后上线的内容也都包含在内。",
    cta: "成为会员",
  },
  ja: {
    courses: [
      ["プロンプト設計の基本", "入門"],
      ["AI エージェント実践", "ワークショップ"],
      ["Vibe Coding で LP 制作", "ハンズオン"],
      ["AI でデータを語る", "データ分析"],
      ["音声と動画のツール", "クリエイター"],
      ["一週間を自動化する", "効率化"],
    ],
    heading: "すべての講座を、ひとつのメンバーシップで",
    body: "有料講座、アーカイブ、資料がすべて見放題。これから公開する内容も含まれます。",
    cta: "メンバーになる",
  },
};

// 沒有圖片時沿用原站封面磚的漸層畫法：兩顆模糊光球加漸層標題
function cover(title: string, sub: string, { from, to }: (typeof COLORS)[number]) {
  return {
    key: title,
    content: (
      <>
        <div className="absolute" style={{ top: "-25%", right: "-12%", width: "60%", paddingTop: "60%", borderRadius: "50%", background: `radial-gradient(circle, ${from}66 0%, transparent 65%)`, filter: "blur(28px)" }} />
        <div className="absolute" style={{ bottom: "-25%", left: "-12%", width: "45%", paddingTop: "45%", borderRadius: "50%", background: `radial-gradient(circle, ${to}4d 0%, transparent 65%)`, filter: "blur(24px)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <div className="mb-1.5 text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: from, opacity: 0.9 }}>{sub}</div>
          <div className="text-[19px] leading-tight font-black" style={{ background: `linear-gradient(135deg, #fff 0%, ${to} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{title}</div>
        </div>
      </>
    ),
  };
}

export default function TiltedMarqueeBackgroundDemo() {
  const t = useDemoText(copy);
  const covers = useMemo(() => t.courses.map(([title, sub], i) => cover(title, sub, COLORS[i])), [t]);
  return (
    <section className="relative flex min-h-[30rem] w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-black px-5 py-16">
      <TiltedMarqueeBackground covers={covers} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse 70% 56% at 50% 42%, rgba(0,0,0,0.65) 0%, transparent 68%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "linear-gradient(to bottom, #000, transparent 10%, transparent 90%, #000)" }} />
      <div className="relative z-10 mx-auto max-w-md min-w-0 text-center">
        <h1 className="mb-3 text-[28px] leading-tight font-black text-white/95 sm:text-[32px]">
          {t.heading}
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-white/60">
          {t.body}
        </p>
        <a href="#" className="inline-flex rounded-xl bg-[#E0A100] px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90">
          {t.cta}
        </a>
      </div>
    </section>
  );
}
