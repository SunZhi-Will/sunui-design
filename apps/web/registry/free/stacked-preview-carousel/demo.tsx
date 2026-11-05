"use client";

import { useDemoText } from "@/lib/demo-locale";

import { StackedPreviewCarousel, type StackedPreviewItem } from "./stacked-preview-carousel";

// 示意封面：投影片風格的漸層與色塊，代替課程截圖
function SlideArt({ from, to, label }: { from: string; to: string; label: string }) {
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`g-${label}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#g-${label})`} />
      <circle cx="128" cy="22" r="34" fill="#fff" opacity="0.08" />
      <rect x="12" y="14" width="22" height="3" rx="1.5" fill="#fff" opacity="0.7" />
      <rect x="12" y="24" width="78" height="8" rx="2" fill="#fff" opacity="0.92" />
      <rect x="12" y="36" width="56" height="8" rx="2" fill="#fff" opacity="0.92" />
      <rect x="12" y="56" width="64" height="2.5" rx="1.25" fill="#fff" opacity="0.45" />
      <rect x="12" y="62" width="48" height="2.5" rx="1.25" fill="#fff" opacity="0.45" />
      <rect x="96" y="48" width="50" height="30" rx="4" fill="#000" opacity="0.25" />
      <rect x="102" y="54" width="22" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      <rect x="102" y="61" width="36" height="2.5" rx="1.25" fill="#fff" opacity="0.35" />
    </svg>
  );
}

const covers = {
  prompt: <SlideArt from="#1e3a8a" to="#7c3aed" label="prompt" />,
  vision: <SlideArt from="#0f766e" to="#0ea5e9" label="vision" />,
  agents: <SlideArt from="#9a3412" to="#f59e0b" label="agents" />,
  deploy: <SlideArt from="#831843" to="#db2777" label="deploy" />,
};

type Key = keyof typeof covers;

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", { heading: string; lead: string; items: Record<Key, [string, string]> }> = {
  en: {
    heading: "Learn to build with AI, one short course at a time.",
    lead: "Slides, handouts and live sessions, all free to start.",
    items: {
      prompt: ["Free course", "Prompt design basics in AI Studio"],
      vision: ["Workshop", "Build a vision app with Gemini in one afternoon"],
      agents: ["Live session", "From chat to agents: tools, memory and evals"],
      deploy: ["Free course", "Ship your prototype to the web"],
    },
  },
  "zh-TW": {
    heading: "一次一堂短課，學會用 AI 打造產品。",
    lead: "投影片、講義與直播課程，全部免費開始。",
    items: {
      prompt: ["免費課程", "AI Studio 提示詞設計入門"],
      vision: ["工作坊", "一個下午用 Gemini 做出視覺應用"],
      agents: ["直播課程", "從聊天到代理：工具、記憶與評測"],
      deploy: ["免費課程", "把你的原型發布到網路上"],
    },
  },
  "zh-CN": {
    heading: "一次一节短课，学会用 AI 构建产品。",
    lead: "幻灯片、讲义和直播课程，全部免费开始。",
    items: {
      prompt: ["免费课程", "AI Studio 提示词设计入门"],
      vision: ["工作坊", "一个下午用 Gemini 做出视觉应用"],
      agents: ["直播课程", "从聊天到智能体：工具、记忆与评测"],
      deploy: ["免费课程", "把你的原型发布到网上"],
    },
  },
  ja: {
    heading: "短いコースを一つずつ、AI でつくる力を。",
    lead: "スライド、資料、ライブ講座。すべて無料で始められます。",
    items: {
      prompt: ["無料コース", "AI Studio で学ぶプロンプト設計の基本"],
      vision: ["ワークショップ", "Gemini で午後のうちにビジョンアプリを作る"],
      agents: ["ライブ講座", "チャットからエージェントへ：ツール、記憶、評価"],
      deploy: ["無料コース", "プロトタイプを Web に公開する"],
    },
  },
};

export default function StackedPreviewCarouselDemo() {
  const t = useDemoText(copy);
  const items: StackedPreviewItem[] = (Object.keys(covers) as Key[]).map((key) => ({ key, subtitle: t.items[key][0], title: t.items[key][1], cover: covers[key] }));
  return (
    <section
      className="grid w-full grid-cols-1 items-center gap-10 overflow-hidden rounded-2xl px-6 py-10 text-white md:grid-cols-2 md:px-10"
      style={{ background: "radial-gradient(120% 85% at 76% 6%, rgba(245,192,69,0.16), transparent 56%), linear-gradient(180deg, #0d0d11 0%, #08080b 100%)" }}
    >
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#F5C045]">AI Studio Academy</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{t.heading}</h1>
        <p className="mt-3 text-sm text-white/60">{t.lead}</p>
      </div>
      <div className="min-w-0 pb-6 pr-4">
        <StackedPreviewCarousel items={items} />
      </div>
    </section>
  );
}
