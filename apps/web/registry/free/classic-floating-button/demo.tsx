"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FloatingButton, type SocialButtonConfig } from "./classic-floating-button";

// 原版 Storybook 的社群按鈕，沿用元件的中性預設樣式
const socialButtons: SocialButtonConfig[] = [
  { type: "github", href: "https://github.com" },
  { type: "twitter", href: "https://twitter.com" },
  { type: "linkedin", href: "https://linkedin.com" },
];

const copy = {
  en: { eyebrow: "Portfolio", name: "Mira Chen", bio: "Product designer based in Taipei. Say hi on any of the links below." },
  "zh-TW": { eyebrow: "作品集", name: "陳米拉", bio: "住在台北的產品設計師。歡迎從下方任一連結打聲招呼。" },
  "zh-CN": { eyebrow: "作品集", name: "陈米拉", bio: "常驻台北的产品设计师。欢迎通过下方任意链接打个招呼。" },
  ja: { eyebrow: "ポートフォリオ", name: "ミラ・チェン", bio: "台北を拠点に活動するプロダクトデザイナー。下のリンクからお気軽にどうぞ。" },
};

export default function ClassicFloatingButtonDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const dragArea = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div ref={dragArea} className="relative isolate h-[380px] w-full max-w-md min-w-0 overflow-hidden rounded-xl border border-border bg-muted/40 text-foreground">
      <div className="p-5">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.eyebrow}</p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{t.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t.bio}</p>
      </div>
      <FloatingButton
        fixed={false}
        locale={locale}
        buttons={socialButtons}
        position="bottom-right"
        variant="petal"
        draggable
        dragConstraints={dragArea}
        defaultPosition={pos}
        onPositionChange={(x, y) => setPos({ x, y })}
      />
    </div>
  );
}
