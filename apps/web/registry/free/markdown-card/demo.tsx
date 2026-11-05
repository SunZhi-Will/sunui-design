"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { MarkdownCard } from "./markdown-card";

const notes = {
  en: `# Sprint 14 retro

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
`,
  "zh-TW": `# Sprint 14 回顧

看板：**CardFlow 畫布**，週四

## 做得好的地方
- 連結卡片現在會顯示 *Open Graph* 預覽
- 貼上 YouTube 網址就會變成影片卡片

## 下次想試試
1. 卡片對齊 16 px 格線
2. 快捷鍵 \`M\` 新增 Markdown 卡片

> 小步出貨，每週五展示。

\`\`\`ts
const size = getDefaultSize("markdown"); // 400 x 300
\`\`\`
`,
  "zh-CN": `# Sprint 14 复盘

看板：**CardFlow 画布**，周四

## 做得好的地方
- 链接卡片现在会显示 *Open Graph* 预览
- 粘贴 YouTube 链接就会变成视频卡片

## 下次想试试
1. 卡片吸附到 16 px 网格
2. 快捷键 \`M\` 新增 Markdown 卡片

> 小步发布，每周五演示。

\`\`\`ts
const size = getDefaultSize("markdown"); // 400 x 300
\`\`\`
`,
  ja: `# Sprint 14 ふりかえり

ボード：**CardFlow キャンバス**、木曜日

## よかったこと
- リンクカードに *Open Graph* のプレビューが出るようになった
- YouTube の URL を貼ると動画カードになる

## 次に試すこと
1. カードを 16 px グリッドにスナップ
2. ショートカット \`M\` で Markdown カードを追加

> 小さく出して、毎週金曜にデモ。

\`\`\`ts
const size = getDefaultSize("markdown"); // 400 x 300
\`\`\`
`,
};

export default function MarkdownCardDemo() {
  const locale = useDemoLocale();
  // 切換語言時換一份範例內容
  return <Board key={locale} />;
}

function Board() {
  const locale = useDemoLocale();
  const initial = useDemoText(notes);
  const [content, setContent] = useState(initial);

  return (
    <div className="w-full max-w-lg min-w-0 rounded-xl bg-[#f3f4f6] p-4 sm:p-6">
      <div className="h-[380px] min-w-0">
        <MarkdownCard value={content} onValueChange={setContent} locale={locale} />
      </div>
    </div>
  );
}
