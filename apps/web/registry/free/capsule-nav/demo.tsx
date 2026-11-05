"use client";

import { useMemo, useRef } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CapsuleNav, type CapsuleNavItem } from "./capsule-nav";

const ids = ["capsule-work", "capsule-services", "capsule-about"] as const;

const copy = {
  en: {
    brandLabel: "Northlight home",
    cta: "Start a project",
    hero: "Small team, finished products",
    sections: [
      { label: "Work", body: "A booking system for a ceramics studio and a live caption tool for streamers." },
      { label: "Services", body: "Product sites, internal tools and small automations. Fixed scope, weekly demos." },
      { label: "About", body: "Design and engineering in the same room, so what you approve is what ships." },
    ],
  },
  "zh-TW": {
    brandLabel: "Northlight 首頁",
    cta: "開始合作",
    hero: "小團隊，做完整的產品",
    sections: [
      { label: "作品", body: "為陶藝工作室打造的預約系統，以及給實況主用的即時字幕工具。" },
      { label: "服務", body: "產品網站、內部工具與小型自動化。範圍固定，每週展示進度。" },
      { label: "關於", body: "設計與工程坐在同一個房間，你核准的就是最後上線的。" },
    ],
  },
  "zh-CN": {
    brandLabel: "Northlight 首页",
    cta: "开始合作",
    hero: "小团队，做完整的产品",
    sections: [
      { label: "作品", body: "为陶艺工作室打造的预约系统，以及给主播用的实时字幕工具。" },
      { label: "服务", body: "产品官网、内部工具和小型自动化。范围固定，每周演示进度。" },
      { label: "关于", body: "设计和工程在同一个房间，你批准的就是最终上线的。" },
    ],
  },
  ja: {
    brandLabel: "Northlight ホーム",
    cta: "相談する",
    hero: "小さなチームで、完成したプロダクトを",
    sections: [
      { label: "実績", body: "陶芸スタジオの予約システムと、配信者向けのリアルタイム字幕ツール。" },
      { label: "サービス", body: "プロダクトサイト、社内ツール、小さな自動化。範囲は固定、毎週デモ。" },
      { label: "私たち", body: "デザインとエンジニアリングが同じ部屋に。承認したものがそのまま届きます。" },
    ],
  },
};

export default function CapsuleNavDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const sections = t.sections.map((s, i) => ({ ...s, id: ids[i] }));
  const items = useMemo<CapsuleNavItem[]>(
    () => t.sections.map((s, i) => ({ key: ids[i], label: s.label, href: `#${ids[i]}`, sectionId: ids[i] })),
    [t],
  );

  return (
    <div className="relative w-full max-w-[56rem] min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-white text-slate-900 dark:border-white/10 dark:bg-black dark:text-white/90">
      <div ref={scrollRef} className="h-[28rem] overflow-y-auto overscroll-contain">
        <CapsuleNav
          fixed={false}
          scrollContainer={scrollRef}
          hideOnScroll
          locale={locale}
          brand={<span className="font-bold">Northlight</span>}
          brandHref="#"
          brandLabel={t.brandLabel}
          items={items}
          cta={{ label: t.cta, href: "#capsule-about" }}
        />
        <div className="px-6 pt-28 pb-16 text-center">
          <h2 className="mx-auto max-w-md text-3xl font-black tracking-tight">{t.hero}</h2>
        </div>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="min-h-[24rem] scroll-mt-20 border-t border-black/5 px-6 py-14 sm:px-10 dark:border-white/[0.06]">
            <h3 className="text-xl font-bold tracking-tight">{s.label}</h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-white/55">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
