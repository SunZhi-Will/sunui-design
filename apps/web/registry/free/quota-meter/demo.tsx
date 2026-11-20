"use client";

import { useEffect, useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { QuotaMeter, toQuotaUsage, useQuotaUsage } from "./quota-meter";

const copy = {
  en: { nav: "App", items: ["Create", "My images", "Characters", "Plans"], generating: "1 image generating", done: "Generation finished" },
  "zh-TW": { nav: "應用程式", items: ["建立", "我的圖片", "角色", "方案"], generating: "1 張圖片生成中", done: "生成完成" },
  "zh-CN": { nav: "应用", items: ["创作", "我的图片", "角色", "方案"], generating: "1 张图片生成中", done: "生成完成" },
  ja: { nav: "アプリ", items: ["作成", "マイ画像", "キャラクター", "プラン"], generating: "1 枚を生成中", done: "生成が完了しました" },
};

// Quota at the bottom of the sidebar: reloads once an image finishes generating (fewer running tasks)
export default function QuotaMeterDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const left = useRef(18);
  const [active, setActive] = useState(1);

  // Simulates a generation in progress; it finishes after a few seconds and uses up one image
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      left.current -= 1;
      setActive(0);
    }, 4000);
    return () => clearTimeout(id);
  }, [active]);

  const usage = useQuotaUsage(
    () => Promise.resolve(toQuotaUsage({ enforced: true, total: 30, left: left.current, checkin: 5 })),
    { refreshKey: active },
  );

  return (
    <nav aria-label={t.nav} className="flex w-full max-w-[14rem] min-w-0 flex-col rounded-xl border border-border bg-[#FAFAFA] p-2 dark:bg-[#09090B]">
      {t.items.map((item, i) => (
        <span key={item} className={i === 0 ? "rounded-md bg-muted px-2 py-1.5 text-sm font-medium" : "px-2 py-1.5 text-sm text-muted-foreground"}>
          {item}
        </span>
      ))}
      <div className="mt-6 border-t border-border pt-2">
        <p className="px-0.5 pb-1 text-[11px] text-muted-foreground" aria-live="polite">
          {active ? t.generating : t.done}
        </p>
        <QuotaMeter usage={usage} href="#plans" locale={locale} />
      </div>
    </nav>
  );
}
