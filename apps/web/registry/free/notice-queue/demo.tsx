"use client";

import { useState, type CSSProperties } from "react";

import { NoticeQueue, storyThemes, useNoticeQueue, type NoticeInput } from "./notice-queue";

const serif = '"Noto Serif TC", "Songti TC", serif';

const actions: { id: string; label: string; notice: NoticeInput }[] = [
  { id: "search", label: "Search the boathouse", notice: { variant: "clue", title: "The torn map" } },
  { id: "lantern", label: "Take the brass lantern", notice: { variant: "item", title: "Brass lantern" } },
  { id: "bread", label: "Share your bread with Wen", notice: { variant: "bond", title: "溫 記住了你的善意" } },
  { id: "rope", label: "Haul the ferry rope", notice: { variant: "stat", title: "Resolve +1" } },
];

export default function NoticeQueueDemo() {
  const { notices, push, dismiss } = useNoticeQueue();
  const [taken, setTaken] = useState<string[]>([]);
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-[1fr_15rem]">
      <div
        className="relative min-h-[19rem] overflow-hidden rounded-[4px] border p-5 pt-16"
        style={{ ...(storyThemes.ink as unknown as CSSProperties), background: "var(--story-bg)", borderColor: "var(--story-line)", color: "var(--story-text)" }}
      >
        <NoticeQueue notices={notices} onDismiss={dismiss} onOpen={(n) => setOpened(String(n.title))} />

        <p className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "var(--story-muted)" }}>
          Chapter two · The ferry at dusk
        </p>
        <p className="mt-2 max-w-[34em] text-[15px] leading-[1.8]" style={{ fontFamily: serif }}>
          The river is the colour of old pewter. Wen waits by the boathouse, counting the bells. What do you do before the ferry leaves?
        </p>

        <div role="group" aria-label="Actions" className="mt-4 flex flex-col gap-2">
          {actions.map((a, i) => {
            const done = taken.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                disabled={done}
                onClick={() => {
                  setTaken((t) => [...t, a.id]);
                  push(a.notice);
                }}
                className="flex items-center gap-3 rounded-[3px] border px-3 py-2 text-left text-sm transition-colors outline-none hover:border-[var(--story-accent)] focus-visible:border-[var(--story-accent)] disabled:opacity-40 disabled:hover:border-[var(--story-line)]"
                style={{ borderColor: "var(--story-line)", fontFamily: serif }}
              >
                <span className="text-xs tabular-nums" style={{ color: "var(--story-accent)" }}>
                  {i + 1}
                </span>
                {a.label}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="mt-4 min-h-5 text-xs" style={{ color: "var(--story-muted)" }}>
          {opened ? `Opened in your journal: ${opened}` : "Click a notice to open it in your journal."}
        </p>
      </div>

      <div
        className="flex flex-col gap-3 rounded-[4px] border p-4"
        style={{ ...(storyThemes.rice as unknown as CSSProperties), background: "var(--story-bg)", borderColor: "var(--story-line)", color: "var(--story-text)" }}
      >
        <p className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "var(--story-muted)" }}>
          Rice theme
        </p>
        <NoticeQueue inline theme="rice" duration={Infinity} notices={[{ id: "fan", variant: "item", title: "Paper fan" }]} onDismiss={() => {}} />
        <NoticeQueue inline theme="rice" duration={Infinity} notices={[{ id: "oath", variant: "bond", title: "Ilse trusts you a little more" }]} onDismiss={() => {}} />
      </div>
    </div>
  );
}
