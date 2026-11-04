"use client";

import { useState, type CSSProperties } from "react";

import { NoticeQueue, storyThemes, useNoticeQueue, type StoryNotice } from "./notice-queue";

// 探索場景：點熱點取得物品與羈絆，提示依序從右上滑入
const hotspots: { id: string; label: string; notices: StoryNotice[] }[] = [
  {
    id: "lamp",
    label: "取下壁燈",
    notices: [
      { id: "lamp", glyph: "物", kicker: "獲得物品", title: "銅殼風燈", label: "收起物品通知：銅殼風燈" },
      { id: "calm", glyph: "心", kicker: "心境回穩", title: "心境・澄明" },
    ],
  },
  {
    id: "talk",
    label: "與船娘溫鶯說話",
    notices: [{ id: "bond", variant: "line", name: "溫鶯", title: "羈絆 +6", detail: "關係變化：願意同行" }],
  },
];

export default function NoticeQueueDemo() {
  const { notices, push, dismiss } = useNoticeQueue();
  const [taken, setTaken] = useState<string[]>([]);

  return (
    <div
      className="relative min-h-[22rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px] border p-5 pt-32"
      style={{
        ...(storyThemes.ink as unknown as CSSProperties),
        background: "var(--story-bg)",
        borderColor: "var(--story-line)",
        color: "var(--story-text)",
        fontFamily: "var(--story-font)",
      }}
    >
      <NoticeQueue notices={notices} onDismiss={dismiss} />
      <p className="max-w-[34em] text-[15px] leading-[1.8]">渡口的帳房還亮著一盞燈，牆上那盞風燈晃了一下。</p>
      <div role="group" aria-label="可調查的地點" className="mt-5 flex flex-col gap-2">
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            disabled={taken.includes(h.id)}
            onClick={() => {
              setTaken((t) => [...t, h.id]);
              h.notices.forEach(push);
            }}
            className="min-w-0 rounded-[2px] border-l-2 px-3 py-2 text-left text-sm tracking-[0.05em] outline-none hover:text-[var(--story-accent-bright)] focus-visible:text-[var(--story-accent-bright)] disabled:opacity-45"
            style={{ borderColor: "var(--story-accent-dim)", background: "linear-gradient(90deg, rgb(8 10 13 / 0.84), rgb(8 10 13 / 0.18))" }}
          >
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}
