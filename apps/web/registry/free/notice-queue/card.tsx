"use client";

import { useRef, type CSSProperties } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { NoticeQueue, storyThemes, useNoticeQueue, type StoryNotice } from "./notice-queue";

// 山河未歸的探索場景；zh-TW 為原文
const hotspotsByLocale: Record<"en" | "zh-TW" | "zh-CN" | "ja", { id: string; label: string; notices: StoryNotice[] }[]> = {
  en: [
    {
      id: "lamp",
      label: "Take down the wall lamp",
      notices: [
        { id: "lamp", glyph: "◆", kicker: "Item obtained", title: "Brass storm lantern" },
        { id: "calm", glyph: "♡", kicker: "Composure restored", title: "Mind: Clear" },
      ],
    },
    {
      id: "talk",
      label: "Talk to Wen Ying, the boatwoman",
      notices: [{ id: "bond", variant: "line", name: "Wen Ying", title: "Bond +6", detail: "Relationship: willing to travel with you" }],
    },
  ],
  "zh-TW": [
    {
      id: "lamp",
      label: "取下壁燈",
      notices: [
        { id: "lamp", glyph: "物", kicker: "獲得物品", title: "銅殼風燈" },
        { id: "calm", glyph: "心", kicker: "心境回穩", title: "心境・澄明" },
      ],
    },
    {
      id: "talk",
      label: "與船娘溫鶯說話",
      notices: [{ id: "bond", variant: "line", name: "溫鶯", title: "羈絆 +6", detail: "關係變化：願意同行" }],
    },
  ],
  "zh-CN": [
    {
      id: "lamp",
      label: "取下壁灯",
      notices: [
        { id: "lamp", glyph: "物", kicker: "获得物品", title: "铜壳风灯" },
        { id: "calm", glyph: "心", kicker: "心境回稳", title: "心境・澄明" },
      ],
    },
    {
      id: "talk",
      label: "与船娘温莺说话",
      notices: [{ id: "bond", variant: "line", name: "温莺", title: "羁绊 +6", detail: "关系变化：愿意同行" }],
    },
  ],
  ja: [
    {
      id: "lamp",
      label: "壁の灯りを外す",
      notices: [
        { id: "lamp", glyph: "物", kicker: "アイテム入手", title: "銅張りの風灯" },
        { id: "calm", glyph: "心", kicker: "心が落ち着いた", title: "心境・澄明" },
      ],
    },
    {
      id: "talk",
      label: "渡し守の温鶯と話す",
      notices: [{ id: "bond", variant: "line", name: "温鶯", title: "絆 +6", detail: "関係の変化：同行してくれる" }],
    },
  ],
};

const places = { en: "Places to investigate", "zh-TW": "可調查的地點", "zh-CN": "可调查的地点", ja: "調べられる場所" };

/** 型錄卡片：點熱點取得物品，通知依序從右上滑入、排隊、自己收走。 */
export default function NoticeQueueCard() {
  const { notices, push, dismiss } = useNoticeQueue();
  // 每次點擊都給新的 id，熱點可以一直按
  const seq = useRef(0);
  const locale = useDemoLocale();
  const hotspots = useDemoText(hotspotsByLocale);
  const placesLabel = useDemoText(places);

  return (
    <div
      className="relative mx-auto flex h-56 w-72 flex-col justify-end overflow-hidden rounded-[4px] border p-4"
      style={{
        ...(storyThemes.ink as unknown as CSSProperties),
        background: "var(--story-bg)",
        borderColor: "var(--story-line)",
        color: "var(--story-text)",
        fontFamily: "var(--story-font)",
      }}
    >
      <NoticeQueue notices={notices} onDismiss={dismiss} locale={locale} />
      <div role="group" aria-label={placesLabel} className="flex flex-col gap-2">
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => {
              seq.current += 1;
              h.notices.forEach((n) => push({ ...n, id: `${n.id}-${seq.current}` }));
            }}
            className="min-w-0 rounded-[2px] border-l-2 px-3 py-2 text-left text-sm tracking-[0.05em] outline-none hover:text-[var(--story-accent-bright)] focus-visible:text-[var(--story-accent-bright)]"
            style={{ borderColor: "var(--story-accent-dim)", background: "linear-gradient(90deg, rgb(8 10 13 / 0.84), rgb(8 10 13 / 0.18))" }}
          >
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}
