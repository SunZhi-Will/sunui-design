"use client";

import { useState } from "react";

import { Typewriter, type TypewriterProps } from "./typewriter";

const carets: NonNullable<TypewriterProps["caret"]>[] = ["bar", "block", "underscore"];

export default function TypewriterDemo() {
  const [caret, setCaret] = useState<NonNullable<TypewriterProps["caret"]>>("bar");

  return (
    <div className="w-full max-w-2xl space-y-8 rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">
      <Typewriter
        as="h3"
        prefix="We design"
        phrases={["calm dashboards.", "honest pricing pages.", "interfaces people trust."]}
        phraseClassName="text-primary"
        caret={caret}
      />

      <Typewriter
        as="h3"
        lang="zh-Hant"
        prefix="一起打造"
        phrases={["安靜而清楚的介面。", "讓人信任的產品。", "支援 CJK 的 React 元件。"]}
        phraseClassName="text-amber-600 dark:text-amber-400"
        caret={caret}
        className="tracking-wide"
      />

      <div role="radiogroup" aria-label="Caret style" className="flex w-fit rounded-full border border-border p-0.5 text-sm">
        {carets.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={caret === c}
            onClick={() => setCaret(c)}
            className={
              caret === c
                ? "rounded-full bg-muted px-3 py-1 text-foreground"
                : "rounded-full px-3 py-1 text-muted-foreground hover:text-foreground"
            }
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
