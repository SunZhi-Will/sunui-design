"use client";

import { useState, type CSSProperties } from "react";

import { NoticeQueue, storyThemes, useNoticeQueue, type StoryNotice } from "./notice-queue";

// 探索場景：點熱點取得線索、物品、修練與羈絆，提示依序從右上滑入
const hotspots: { id: string; label: string; notices: StoryNotice[] }[] = [
  {
    id: "desk",
    label: "翻看帳桌",
    notices: [
      { id: "ledger", glyph: "書", kicker: "發現線索", title: "撕去半頁的渡口帳簿", category: "書證", shimmer: true, openable: true, label: "查看新線索：撕去半頁的渡口帳簿" },
    ],
  },
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
    notices: [
      { id: "bond", variant: "line", name: "溫鶯", title: "羈絆 +6", detail: "關係變化：願意同行" },
      { id: "seal", variant: "line", seal: "燈譜", title: "成就：渡口夜話", shimmer: true },
    ],
  },
];

export default function NoticeQueueDemo() {
  const { notices, push, dismiss } = useNoticeQueue();
  const [taken, setTaken] = useState<string[]>([]);
  const [detail, setDetail] = useState<StoryNotice | null>(null);
  const vars = storyThemes.ink as unknown as CSSProperties;

  return (
    <div
      className="relative min-h-[24rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px] border p-5 pt-32"
      style={{
        ...vars,
        background: "radial-gradient(ellipse at 30% 20%, rgb(201 160 99 / 0.08), transparent 60%), var(--story-bg)",
        borderColor: "var(--story-line)",
        color: "var(--story-text)",
        fontFamily: "var(--story-font)",
      }}
    >
      <NoticeQueue
        notices={notices}
        onDismiss={dismiss}
        holding={detail !== null}
        onOpen={(n) => setDetail(n)}
      />

      <p className="text-xs tracking-[0.18em]" style={{ color: "var(--story-muted)" }}>
        第二章・寒水渡　夜
      </p>
      <p className="mt-2 max-w-[34em] text-[15px] leading-[1.8]">
        渡口的帳房還亮著一盞燈。帳桌上壓著一本濕透的簿子，牆上那盞風燈晃了一下。
      </p>

      <div role="group" aria-label="可調查的地點" className="mt-5 flex flex-col gap-2">
        {hotspots.map((h) => {
          const done = taken.includes(h.id);
          return (
            <button
              key={h.id}
              type="button"
              disabled={done}
              onClick={() => {
                setTaken((t) => [...t, h.id]);
                h.notices.forEach(push);
              }}
              className="flex min-w-0 items-center gap-3 rounded-[2px] border-l-2 px-3 py-2 text-left text-sm tracking-[0.05em] transition-colors duration-[120ms] outline-none hover:text-[var(--story-accent-bright)] focus-visible:text-[var(--story-accent-bright)] disabled:opacity-45"
              style={{ borderColor: "var(--story-accent-dim)", background: "linear-gradient(90deg, rgb(8 10 13 / 0.84), rgb(8 10 13 / 0.18))" }}
            >
              {h.label}
            </button>
          );
        })}
      </div>

      {detail && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(6, 7, 10, 0.82)" }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="線索詳情"
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              dismiss(detail.id);
              setDetail(null);
            }}
            className="w-full max-w-[22rem] rounded-[4px] border p-6"
            style={{ background: "rgba(10, 12, 16, 0.94)", borderColor: "var(--story-line)", boxShadow: "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(231,196,137,0.1)" }}
          >
            <p className="text-lg tracking-[0.2em]" style={{ color: "var(--story-accent-bright)" }}>
              {detail.title}
            </p>
            <p className="mt-3 text-sm leading-[1.8]" style={{ color: "#b3aa97" }}>
              帳簿最後一頁被齊整地撕走，只留下半個朱印。撕口還是乾的，是昨夜之後的事。
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => {
                dismiss(detail.id);
                setDetail(null);
              }}
              className="mt-5 rounded-[3px] border px-5 py-2 text-sm tracking-[0.12em] outline-none hover:text-[var(--story-accent-bright)] focus-visible:text-[var(--story-accent-bright)]"
              style={{ borderColor: "var(--story-line)" }}
            >
              收起
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
