"use client";

import type { ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { CursorEffect, cursorEffects, type CursorEffectName, type CursorPreviewItem } from "./cursor-effects";

export const copy = {
  en: {
    title: "Cursor effects",
    intro: "7 pointer effects scoped to their own container (or the whole page with global). Hidden on touch screens.",
    move: "Move your pointer here",
    needsMouse: "Needs a mouse or trackpad",
    chips: ["Design", "Code", "Ship"],
    spotlight: "Light follows the pointer and reveals the content underneath.",
    blend: "Inverted",
    projects: ["Harbor lamp", "Field notes", "Tide clock", "Paper kite"],
    kinds: ["Lighting", "Stationery", "Objects", "Toys"],
  },
  "zh-TW": {
    title: "游標效果",
    intro: "7 種指標效果，預設只作用在自己的容器內（加 global 套用整頁）。觸控螢幕上自動隱藏。",
    move: "把指標移到這裡",
    needsMouse: "需要滑鼠或觸控板",
    chips: ["設計", "開發", "上線"],
    spotlight: "光跟著指標走，照亮底下的內容。",
    blend: "反相",
    projects: ["港口燈", "田野筆記", "潮汐鐘", "紙風箏"],
    kinds: ["燈具", "文具", "器物", "玩具"],
  },
  "zh-CN": {
    title: "光标效果",
    intro: "7 种指针效果，默认只作用在自己的容器内（加 global 应用到整页）。触屏上自动隐藏。",
    move: "把指针移到这里",
    needsMouse: "需要鼠标或触控板",
    chips: ["设计", "开发", "上线"],
    spotlight: "光跟着指针走，照亮下面的内容。",
    blend: "反相",
    projects: ["港口灯", "田野笔记", "潮汐钟", "纸风筝"],
    kinds: ["灯具", "文具", "器物", "玩具"],
  },
  ja: {
    title: "カーソルエフェクト",
    intro: "コンテナ内だけで動く 7 種のポインターエフェクト（global でページ全体）。タッチ画面では非表示です。",
    move: "ここにポインターを動かす",
    needsMouse: "マウスかトラックパッドが必要です",
    chips: ["デザイン", "開発", "公開"],
    spotlight: "光がポインターを追い、下のコンテンツを照らします。",
    blend: "反転",
    projects: ["港のランプ", "フィールドノート", "潮時計", "紙の凧"],
    kinds: ["照明", "文具", "雑貨", "玩具"],
  },
};

/** 預覽卡用的 inline SVG 插圖，不依賴外部圖片 */
function Art({ variant }: { variant: number }) {
  const shapes = [
    <circle key="a" cx="60" cy="42" r="22" />,
    <rect key="b" x="34" y="20" width="52" height="46" rx="4" />,
    <path key="c" d="M60 16l28 50H32z" />,
    <path key="d" d="M30 60l30-44 30 44-30-14z" />,
  ];
  return (
    <svg viewBox="0 0 120 90" className="size-full bg-muted text-primary" aria-hidden="true">
      <rect width="120" height="90" fill="currentColor" opacity="0.08" />
      <g fill="currentColor" opacity="0.85">
        {shapes[variant % shapes.length]}
      </g>
      <rect x="18" y="74" width="84" height="4" rx="2" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function Tile({ name, children }: { name: CursorEffectName; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-card-foreground">
      <code className="font-mono text-xs">{name}</code>
      {children}
    </div>
  );
}

/** 單一效果的互動區，示範頁與首頁型錄的單張卡共用 */
export function CursorEffectArea({ effect }: { effect: CursorEffectName }) {
  const t = useDemoText(copy);
  const area = "flex h-52 flex-col items-center justify-center gap-3 rounded-md bg-muted/40 p-4 text-center text-sm text-muted-foreground";
  const items: CursorPreviewItem[] = t.projects.map((title, i) => ({
    id: String(i),
    title,
    meta: t.kinds[i],
    preview: <Art variant={i} />,
  }));

  switch (effect) {
    case "follower":
      return (
        <CursorEffect effect="follower" hideCursor idle={{ x: 0.5, y: 0.62 }} className={area}>
          <p>{t.move}</p>
          <button type="button" className="rounded-md border border-border bg-background px-3 py-1.5 text-foreground">
            {t.chips[0]}
          </button>
        </CursorEffect>
      );
    case "trail":
      return (
        <CursorEffect effect="trail" className={area}>
          <p>{t.move}</p>
        </CursorEffect>
      );
    case "spotlight":
      return (
        <CursorEffect effect="spotlight" idle={{ x: 0.3, y: 0.4 }} className={area}>
          <p className="max-w-56 text-base font-medium text-foreground">{t.spotlight}</p>
          <div className="grid w-full max-w-56 grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-sm bg-primary/20" />
            ))}
          </div>
        </CursorEffect>
      );
    case "blend-circle":
      return (
        <CursorEffect effect="blend-circle" hideCursor idle={{ x: 0.42, y: 0.5 }} className={area}>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{t.blend}</p>
          <p>{t.move}</p>
        </CursorEffect>
      );
    case "crosshair":
      return (
        <CursorEffect effect="crosshair" idle={{ x: 0.35, y: 0.4 }} className={area}>
          <p>{t.move}</p>
        </CursorEffect>
      );
    case "image-hover":
      return (
        <CursorEffect effect="image-hover" items={items} className="rounded-md bg-muted/40 px-3 py-2" />
      );
    case "magnetic-area":
      return (
        <CursorEffect effect="magnetic-area" className={area}>
          <div className="flex flex-wrap justify-center gap-3">
            {t.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                data-magnetic
                className="inline-block rounded-full bg-primary px-4 py-2 text-primary-foreground"
              >
                {chip}
              </button>
            ))}
          </div>
          <p>{t.move}</p>
        </CursorEffect>
      );
  }
}

export default function CursorEffectsDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-5xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
        <p className="mt-1 text-xs text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:hidden">{t.needsMouse}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cursorEffects.map((effect) => (
          <Tile key={effect} name={effect}>
            <CursorEffectArea effect={effect} />
          </Tile>
        ))}
      </div>
    </div>
  );
}
