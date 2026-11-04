"use client";

import { useState } from "react";

import { CjkHeading, type CjkHeadingProps } from "./cjk-heading";

const modes: NonNullable<CjkHeadingProps["compress"]>[] = ["auto", "palt", "halt", "none"];

export default function CjkHeadingDemo() {
  const [compress, setCompress] = useState<NonNullable<CjkHeadingProps["compress"]>>("auto");
  const [autoSpace, setAutoSpace] = useState(true);
  const [replay, setReplay] = useState(0);

  return (
    <div className="w-full max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div role="radiogroup" aria-label="Punctuation compression" className="flex rounded-full border border-border p-0.5">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={compress === m}
              onClick={() => setCompress(m)}
              className={
                compress === m
                  ? "rounded-full bg-muted px-3 py-1 text-foreground"
                  : "rounded-full px-3 py-1 text-muted-foreground hover:text-foreground"
              }
            >
              {m}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-muted-foreground">
          <input
            type="checkbox"
            checked={autoSpace}
            onChange={(e) => setAutoSpace(e.target.checked)}
            className="size-4 accent-primary"
          />
          CJK and Latin spacing
        </label>
        <button
          type="button"
          onClick={() => setReplay((n) => n + 1)}
          className="rounded-full border border-border bg-card px-3 py-1 text-card-foreground hover:bg-muted"
        >
          Replay
        </button>
      </div>

      <div key={replay} className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8">
          <CjkHeading
            as="h3"
            text="「慢慢來」，比較快。"
            compress={compress}
            autoSpace={autoSpace}
            animate="mount"
            highlight={["比較快"]}
          />
          <CjkHeading
            as="h3"
            text="用React打造支援CJK的介面，2026年也不例外。"
            compress={compress}
            autoSpace={autoSpace}
            animate="mount"
            highlight={["CJK"]}
            highlightClassName="text-amber-600 dark:text-amber-400"
            className="text-3xl sm:text-4xl"
          />
          <CjkHeading
            as="h3"
            lang="ja"
            text="「美しい」組版を、Webでも。"
            compress={compress}
            autoSpace={autoSpace}
            animate="mount"
            className="text-2xl sm:text-3xl"
          />
        </div>

        <div className="flex justify-center rounded-2xl border border-border bg-card p-6 text-card-foreground">
          <CjkHeading
            as="h3"
            vertical
            text="山高月小，水落石出。第12回"
            compress={compress}
            autoSpace={autoSpace}
            animate="mount"
            stagger={0.07}
            highlight={["月"]}
            className="h-[320px] text-3xl sm:text-4xl"
          />
        </div>
      </div>
    </div>
  );
}
