"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Stage, WindowFrame } from "./window-frame";

function DocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

const copy = {
  en: {
    status: "clear",
    prompt: "Summarise last week's orders as 3 bullets: total, top product, refunds.",
    answer: "> 412 orders, $18.2k. Top: Stoneware Mug. 6 refunds.",
  },
  "zh-TW": {
    status: "通過",
    prompt: "用 3 個重點總結上週訂單：總數、最熱賣商品、退款。",
    answer: "> 412 筆訂單，$18.2k。最熱賣：陶瓷馬克杯。6 筆退款。",
  },
  "zh-CN": {
    status: "通过",
    prompt: "用 3 个要点总结上周订单：总数、最畅销商品、退款。",
    answer: "> 412 笔订单，$18.2k。最畅销：陶瓷马克杯。6 笔退款。",
  },
  ja: {
    status: "問題なし",
    prompt: "先週の注文を 3 点で要約して：合計、売れ筋商品、返金。",
    answer: "> 注文 412 件、$18.2k。売れ筋：陶器のマグ。返金 6 件。",
  },
};

export default function WindowFrameDemo() {
  const t = useDemoText(copy);
  return (
    <Stage className="w-full max-w-xl p-4 sm:p-6">
      <WindowFrame
        title="prompt-v2.md"
        icon={<DocIcon />}
        tone="success"
        right={
          <span className="text-[11px] whitespace-nowrap text-emerald-600 dark:text-emerald-400">
            {t.status}
          </span>
        }
      >
        <div className="space-y-2 p-4 font-mono text-[13px] leading-relaxed">
          <p>{t.prompt}</p>
          <p className="text-[var(--wf-fg-muted)]">{t.answer}</p>
        </div>
      </WindowFrame>
    </Stage>
  );
}
