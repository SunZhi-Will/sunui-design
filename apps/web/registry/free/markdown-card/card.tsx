"use client";

import { useState } from "react";

import { MarkdownCard } from "./markdown-card";

const notes = `## Sprint 14 retro

- Link cards show the *Open Graph* preview
- Press \`M\` to add a **markdown** card

> Ship smaller, demo every Friday.
`;

/** 型錄卡片：一張畫布上的 Markdown 卡，點一下選取、再點進去就能直接編輯。 */
export default function MarkdownCardCard() {
  const [content, setContent] = useState(notes);

  return (
    <div className="mx-auto w-72 rounded-xl bg-[#f3f4f6] p-3">
      <div className="h-48 min-w-0">
        <MarkdownCard value={content} onValueChange={setContent} fontSize={13} />
      </div>
    </div>
  );
}
