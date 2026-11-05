"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FloatingButton, type SocialButtonConfig } from "./classic-floating-button";

// 原版 Storybook 的社群按鈕配色
const socialButtons: SocialButtonConfig[] = [
  { type: "github", href: "https://github.com", className: "bg-gradient-to-r from-gray-600 to-gray-800 hover:shadow-gray-500/50" },
  { type: "twitter", href: "https://twitter.com", className: "bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-blue-500/50" },
  { type: "linkedin", href: "https://linkedin.com", className: "bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-blue-600/50" },
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
    <div ref={dragArea} className="relative isolate h-[380px] w-full max-w-md min-w-0 overflow-hidden rounded-xl bg-gray-50 text-gray-800">
      <div className="p-5">
        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">{t.eyebrow}</p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">{t.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{t.bio}</p>
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
