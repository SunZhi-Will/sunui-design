"use client";

import { useRef, type CSSProperties } from "react";

import { NoticeQueue, storyThemes, useNoticeQueue, type StoryNotice } from "./notice-queue";

const hotspots: { id: string; label: string; notices: StoryNotice[] }[] = [
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
];

/** 型錄卡片：點熱點取得物品，通知依序從右上滑入、排隊、自己收走。 */
export default function NoticeQueueCard() {
  const { notices, push, dismiss } = useNoticeQueue();
  // 每次點擊都給新的 id，熱點可以一直按
  const seq = useRef(0);

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
      <NoticeQueue notices={notices} onDismiss={dismiss} />
      <div role="group" aria-label="可調查的地點" className="flex flex-col gap-2">
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
