"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { MarkdownCard } from "./markdown-card";

const notes = {
  en: `## Sprint 14 retro

- Link cards show the *Open Graph* preview
- Press \`M\` to add a **markdown** card

> Ship smaller, demo every Friday.
`,
  "zh-TW": `## Sprint 14 回顧

- 連結卡片會顯示 *Open Graph* 預覽
- 按 \`M\` 新增 **Markdown** 卡片

> 小步出貨，每週五展示。
`,
  "zh-CN": `## Sprint 14 复盘

- 链接卡片会显示 *Open Graph* 预览
- 按 \`M\` 新增 **Markdown** 卡片

> 小步发布，每周五演示。
`,
  ja: `## Sprint 14 ふりかえり

- リンクカードに *Open Graph* のプレビュー
- \`M\` で **Markdown** カードを追加

> 小さく出して、毎週金曜にデモ。
`,
};

/** 型錄卡片：一張畫布上的 Markdown 卡，點一下選取、再點進去就能直接編輯。 */
export default function MarkdownCardCard() {
  const locale = useDemoLocale();
  // 切換語言時換一份範例內容
  return <Sheet key={locale} />;
}

function Sheet() {
  const locale = useDemoLocale();
  const initial = useDemoText(notes);
  const [content, setContent] = useState(initial);

  return (
    <div className="mx-auto w-72 rounded-xl bg-[#f3f4f6] p-3">
      <div className="h-48 min-w-0">
        <MarkdownCard value={content} onValueChange={setContent} fontSize={13} locale={locale} />
      </div>
    </div>
  );
}
