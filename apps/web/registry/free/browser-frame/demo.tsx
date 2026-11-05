"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { BrowserFrame, Stage, WindowFrame } from "./browser-frame";

function DocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
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
    title: "Orders",
    badge: "Simulated",
    names: ["Mia Chen", "Leo Park", "Ana Ruiz"],
    status: "clear",
    prompt: "Summarise last week's orders as 3 bullets: total, top product, refunds.",
    answer: "> 412 orders, $18.2k. Top: Stoneware Mug. 6 refunds.",
  },
  "zh-TW": {
    title: "訂單",
    badge: "模擬",
    names: ["陳美玲", "林立言", "王安娜"],
    status: "通過",
    prompt: "用 3 個重點總結上週訂單：總數、最熱賣商品、退款。",
    answer: "> 412 筆訂單，$18.2k。最熱賣：陶瓷馬克杯。6 筆退款。",
  },
  "zh-CN": {
    title: "订单",
    badge: "模拟",
    names: ["陈美玲", "林立言", "王安娜"],
    status: "通过",
    prompt: "用 3 个要点总结上周订单：总数、最畅销商品、退款。",
    answer: "> 412 笔订单，$18.2k。最畅销：陶瓷马克杯。6 笔退款。",
  },
  ja: {
    title: "注文",
    badge: "シミュレーション",
    names: ["佐藤 美緒", "鈴木 蓮", "高橋 杏奈"],
    status: "問題なし",
    prompt: "先週の注文を 3 点で要約して：合計、売れ筋商品、返金。",
    answer: "> 注文 412 件、$18.2k。売れ筋：陶器のマグ。返金 6 件。",
  },
};

const orders = [
  ["SU-20481", "$128.00"],
  ["SU-20480", "$64.50"],
  ["SU-20479", "$219.00"],
];

/** 文章裡的一段示範：左邊是後台網頁（瀏覽器外框），右邊是拿來總結的提示詞（視窗外框） */
export default function BrowserFrameDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <Stage className="grid w-full max-w-4xl min-w-0 items-start gap-4 p-3 sm:p-6 md:grid-cols-[1.15fr_1fr]">
      <BrowserFrame url="shop.example.com/admin/orders" title={t.title} badge={t.badge} locale={locale}>
        <div className="divide-y divide-[var(--wf-line)] text-sm">
          {orders.map(([id, total], i) => (
            <div key={id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="font-mono text-xs text-[var(--wf-fg-muted)]">{id}</span>
              <span className="min-w-0 flex-1 truncate">{t.names[i]}</span>
              <span className="tabular-nums">{total}</span>
            </div>
          ))}
        </div>
      </BrowserFrame>
      <WindowFrame
        title="prompt-v2.md"
        icon={<DocIcon />}
        tone="success"
        right={<span className="text-[11px] whitespace-nowrap text-emerald-600 dark:text-emerald-400">{t.status}</span>}
      >
        <div className="space-y-2 p-4 font-mono text-[13px] leading-relaxed">
          <p>{t.prompt}</p>
          <p className="text-[var(--wf-fg-muted)]">{t.answer}</p>
        </div>
      </WindowFrame>
    </Stage>
  );
}
