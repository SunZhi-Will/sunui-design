"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { InstructorCard3D, type InstructorCardData } from "./instructor-card-3d";

// 去背人像的替身插畫：暖色剪影，貼齊名片左欄底部
function Portrait({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true">
      <path d="M10 130c4-30 24-44 50-44s46 14 50 44z" fill="#2b2f3a" />
      <path d="M48 78h24v14c0 6-24 6-24 0z" fill="#e9b48f" />
      <ellipse cx="60" cy="52" rx="24" ry="28" fill="#f2c4a0" />
      <path d="M35 50c-2-22 14-32 27-32 16 0 26 10 24 30-6-8-16-12-26-12s-19 6-25 14z" fill="#3a2a22" />
    </svg>
  );
}

const copy = {
  en: {
    card: {
      name: "Mira Chen",
      roles: ["AI workflow coach", "Product designer", "Ex-agency lead"],
      bio: "Mira has run hands-on AI workshops for 2,000+ designers and marketers. She teaches by building real deliverables in class, so every prompt you write ends up in your own toolkit.",
      chips: ["40+ workshops", "4.9 average rating", "Small cohorts"],
    },
    open: (name: string) => `Open ${name}'s instructor card`,
    eyebrow: "YOUR INSTRUCTOR",
    heading: "I teach the way I work every day",
    body: "Every exercise comes from client projects. Tap the portrait to see my card.",
  },
  "zh-TW": {
    card: {
      name: "陳米拉",
      roles: ["AI 工作流教練", "產品設計師", "前代理商主管"],
      bio: "米拉為兩千多位設計師與行銷人帶過實作型 AI 工作坊。她在課堂上帶你做出真正能交付的成品，你寫下的每一句提示詞都會留在自己的工具箱裡。",
      chips: ["40+ 場工作坊", "平均 4.9 分", "小班制"],
    },
    open: (name: string) => `開啟${name}的講師名片`,
    eyebrow: "你的講師",
    heading: "我怎麼工作，就怎麼教",
    body: "每個練習都來自真實的客戶專案。點人像看我的名片。",
  },
  "zh-CN": {
    card: {
      name: "陈米拉",
      roles: ["AI 工作流教练", "产品设计师", "前代理公司负责人"],
      bio: "米拉为两千多位设计师和营销人带过实操型 AI 工作坊。她在课堂上带你做出真正能交付的成果，你写下的每一条提示词都会留在自己的工具箱里。",
      chips: ["40+ 场工作坊", "平均 4.9 分", "小班教学"],
    },
    open: (name: string) => `打开${name}的讲师名片`,
    eyebrow: "你的讲师",
    heading: "我怎么工作，就怎么教",
    body: "每个练习都来自真实的客户项目。点击头像查看我的名片。",
  },
  ja: {
    card: {
      name: "ミラ・チェン",
      roles: ["AI ワークフローコーチ", "プロダクトデザイナー", "元エージェンシー責任者"],
      bio: "デザイナーやマーケター 2,000 人以上に実践型の AI ワークショップを開いてきました。授業で実際の成果物をつくるので、書いたプロンプトはそのまま自分の道具箱に残ります。",
      chips: ["ワークショップ 40 回以上", "平均評価 4.9", "少人数制"],
    },
    open: (name: string) => `${name}の講師カードを開く`,
    eyebrow: "担当講師",
    heading: "毎日の仕事のやり方で教えます",
    body: "演習はすべてクライアント案件から。ポートレートをタップするとカードが見られます。",
  },
};

export default function InstructorCard3DDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(false);
  const card: InstructorCardData = { ...t.card, portrait: <Portrait className="w-[96%]" />, href: "#instructor" };

  return (
    <div className="relative flex min-h-[34rem] w-full max-w-2xl min-w-0 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] p-4 text-white/90 sm:p-6">
      <section className="grid w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:grid-cols-[170px_1fr]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open(card.name)}
          className="relative flex h-44 items-end justify-center overflow-hidden sm:h-full"
          style={{ background: "linear-gradient(168deg, #fff8ee 0%, #ffecd9 54%, #f7dabd 100%)" }}
        >
          <Portrait className="w-36" />
        </button>
        <div className="min-w-0 p-6">
          <p className="text-[11px] font-black tracking-[0.2em] text-[#e0a100]">{t.eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-black leading-tight">{t.heading}</h2>
          <p className="mt-3 text-[12.5px] leading-6 text-white/55">
            {t.body}
          </p>
        </div>
      </section>
      <InstructorCard3D card={card} open={open} onClose={() => setOpen(false)} fixed={false} locale={locale} />
    </div>
  );
}
