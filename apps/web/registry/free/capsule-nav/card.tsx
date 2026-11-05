"use client";

import { useMemo, useRef } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CapsuleNav, type CapsuleNavItem } from "./capsule-nav";

const ids = ["capsule-card-work", "capsule-card-services", "capsule-card-about"] as const;

const copy = {
  en: { labels: ["Work", "Services", "About"], brandLabel: "Northlight home", cta: "Start a project", hint: "Scroll down" },
  "zh-TW": { labels: ["作品", "服務", "關於"], brandLabel: "Northlight 首頁", cta: "開始合作", hint: "往下捲動" },
  "zh-CN": { labels: ["作品", "服务", "关于"], brandLabel: "Northlight 首页", cta: "开始合作", hint: "向下滚动" },
  ja: { labels: ["実績", "サービス", "私たち"], brandLabel: "Northlight ホーム", cta: "相談する", hint: "下にスクロール" },
};

/** 型錄卡片：在小視窗裡往下捲，滿版標頭收成浮起的膠囊。 */
export default function CapsuleNavCard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const sections = t.labels.map((label, i) => ({ id: ids[i], label }));
  const items = useMemo<CapsuleNavItem[]>(
    () => t.labels.map((label, i) => ({ key: ids[i], label, href: `#${ids[i]}`, sectionId: ids[i] })),
    [t],
  );

  return (
    <div className="relative mx-auto w-72 overflow-hidden rounded-2xl border border-black/10 bg-white text-slate-900 dark:border-white/10 dark:bg-black dark:text-white/90">
      <div ref={scrollRef} className="h-[220px] overflow-y-auto overscroll-contain">
        <CapsuleNav
          fixed={false}
          scrollContainer={scrollRef}
          locale={locale}
          brand={<span className="font-bold">Northlight</span>}
          brandHref="#"
          brandLabel={t.brandLabel}
          items={items}
          cta={{ label: t.cta, href: "#capsule-card-about" }}
        />
        <p className="px-5 pt-20 pb-10 text-center text-xs text-slate-500 dark:text-white/50">{t.hint}</p>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="min-h-[14rem] border-t border-black/5 px-5 py-8 dark:border-white/[0.06]">
            <h3 className="text-base font-bold tracking-tight">{s.label}</h3>
          </section>
        ))}
      </div>
    </div>
  );
}
