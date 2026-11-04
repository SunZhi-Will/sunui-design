"use client";

import { useState } from "react";

import { MarkdownCard } from "./markdown-card";

const notes = `# Sprint 14 retro

Board: **CardFlow canvas**, Thursday

## What went well
- Link cards now show the *Open Graph* preview
- Paste a YouTube URL and it becomes a video card

## To try next
1. Snap cards to a 16 px grid
2. Keyboard shortcut \`M\` adds a markdown card

> Ship smaller, demo every Friday.

\`\`\`ts
const size = getDefaultSize("markdown"); // 400 x 300
\`\`\`
`;

export default function MarkdownCardDemo() {
  const [content, setContent] = useState(notes);

  return (
    <div className="w-full max-w-lg min-w-0 rounded-xl bg-[#f3f4f6] p-4 sm:p-6">
      <div className="h-[380px] min-w-0">
        <MarkdownCard value={content} onValueChange={setContent} />
      </div>
    </div>
  );
}
