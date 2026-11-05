"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { InstructorCard3D, type InstructorCardData } from "./instructor-card-3d";

// 去背人像的替身：中性色剪影，貼齊名片左欄底部
function Portrait({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true">
      <path d="M10 130c4-30 24-44 50-44s46 14 50 44z" fill="#44403c" />
      <path d="M48 78h24v14c0 6-24 6-24 0z" fill="#78716c" />
      <ellipse cx="60" cy="52" rx="24" ry="28" fill="#a8a29e" />
      <path d="M35 50c-2-22 14-32 27-32 16 0 26 10 24 30-6-8-16-12-26-12s-19 6-25 14z" fill="#292524" />
    </svg>
  );
}

const copy = {
  en: {
    card: {
      name: "Mira Chen",
      roles: ["Studio potter", "Glaze chemist", "Hollow Kiln founder"],
      bio: "Mira has taught wheel throwing to 2,000+ beginners over twelve years. Every class ends with a pot you made yourself, and she mixes each glaze on the shelf in front of you.",
      chips: ["40+ cohorts", "4.9 average rating", "Six per class"],
    },
    open: (name: string) => `Open ${name}'s instructor card`,
    eyebrow: "YOUR INSTRUCTOR",
    heading: "I teach the way I work at the wheel",
    body: "Every exercise comes from pieces I sell in the shop. Tap the portrait to see my card.",
  },
  "zh-TW": {
    card: {
      name: "陳米拉",
      roles: ["陶藝家", "釉藥調配師", "空窯工作室創辦人"],
      bio: "米拉十二年來教過兩千多位拉坯新手。每堂課結束你都會帶走一件自己做的器物，架上每一種釉藥她都當著你的面調。",
      chips: ["40+ 期課程", "平均 4.9 分", "每班 6 人"],
    },
    open: (name: string) => `開啟${name}的講師名片`,
    eyebrow: "你的講師",
    heading: "我在轆轤前怎麼做，就怎麼教",
    body: "每個練習都來自店裡實際販售的作品。點人像看我的名片。",
  },
  "zh-CN": {
    card: {
      name: "陈米拉",
      roles: ["陶艺家", "釉料调配师", "空窑工作室创始人"],
      bio: "米拉十二年来教过两千多位拉坯新手。每节课结束你都会带走一件自己做的器物，架上每一种釉料她都当着你的面调。",
      chips: ["40+ 期课程", "平均 4.9 分", "每班 6 人"],
    },
    open: (name: string) => `打开${name}的讲师名片`,
    eyebrow: "你的讲师",
    heading: "我在拉坯机前怎么做，就怎么教",
    body: "每个练习都来自店里实际售卖的作品。点击头像查看我的名片。",
  },
  ja: {
    card: {
      name: "ミラ・チェン",
      roles: ["陶芸家", "釉薬調合師", "ホロウキルン主宰"],
      bio: "12年間で 2,000 人以上の初心者にろくろを教えてきました。毎回のクラスで自分の器を持ち帰れます。棚の釉薬はすべて目の前で調合します。",
      chips: ["40 期以上", "平均評価 4.9", "1クラス6人"],
    },
    open: (name: string) => `${name}の講師カードを開く`,
    eyebrow: "担当講師",
    heading: "ろくろの前と同じやり方で教えます",
    body: "演習はすべて店で販売している作品から。ポートレートをタップするとカードが見られます。",
  },
};

export default function InstructorCard3DDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(false);
  const card: InstructorCardData = { ...t.card, portrait: <Portrait className="w-[96%]" />, href: "#instructor" };

  return (
    <div className="relative flex min-h-[34rem] w-full max-w-2xl min-w-0 items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0a09] p-4 text-[#f5f5f4] sm:p-6">
      <section className="grid w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161412] sm:grid-cols-[170px_1fr]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open(card.name)}
          className="relative flex h-44 items-end justify-center overflow-hidden sm:h-full"
          style={{ background: "linear-gradient(180deg, #e7e5e4 0%, #d6d3d1 100%)" }}
        >
          <Portrait className="w-36" />
        </button>
        <div className="min-w-0 p-6">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#d4a24c]">{t.eyebrow}</p>
          <h2 className="mt-1 font-serif text-[24px] font-normal leading-tight">{t.heading}</h2>
          <p className="mt-3 text-[12.5px] leading-6 text-[#a8a29e]">
            {t.body}
          </p>
        </div>
      </section>
      <InstructorCard3D card={card} open={open} onClose={() => setOpen(false)} fixed={false} locale={locale} />
    </div>
  );
}
