"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import {
  BrowserFrame,
  BrowserStack,
  Stage,
  WindowFrame,
  type BrowserStackSlide,
} from "./browser-frame";

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
    prompt:
      "Summarise last week's orders as 3 bullets: total, top product, refunds.",
    answer: "> 412 orders, $18.2k. Top: Stoneware Mug. 6 refunds.",
    eyebrow: "Selected work",
    heading: "Three client stores we built this year.",
    sites: ["Ceramics studio", "Type foundry", "Bookshop"],
  },
  "zh-TW": {
    title: "訂單",
    badge: "模擬",
    names: ["陳美玲", "林立言", "王安娜"],
    status: "通過",
    prompt: "用 3 個重點總結上週訂單：總數、最熱賣商品、退款。",
    answer: "> 412 筆訂單，$18.2k。最熱賣：陶瓷馬克杯。6 筆退款。",
    eyebrow: "精選作品",
    heading: "今年替客戶做的三間線上商店。",
    sites: ["陶藝工作室", "字體工作室", "獨立書店"],
  },
  "zh-CN": {
    title: "订单",
    badge: "模拟",
    names: ["陈美玲", "林立言", "王安娜"],
    status: "通过",
    prompt: "用 3 个要点总结上周订单：总数、最畅销商品、退款。",
    answer: "> 412 笔订单，$18.2k。最畅销：陶瓷马克杯。6 笔退款。",
    eyebrow: "精选作品",
    heading: "今年为客户做的三家线上商店。",
    sites: ["陶艺工作室", "字体工作室", "独立书店"],
  },
  ja: {
    title: "注文",
    badge: "シミュレーション",
    names: ["佐藤 美緒", "鈴木 蓮", "高橋 杏奈"],
    status: "問題なし",
    prompt: "先週の注文を 3 点で要約して：合計、売れ筋商品、返金。",
    answer: "> 注文 412 件、$18.2k。売れ筋：陶器のマグ。返金 6 件。",
    eyebrow: "制作実績",
    heading: "今年制作したクライアントのオンラインストア 3 件。",
    sites: ["陶芸スタジオ", "書体ファウンドリ", "書店"],
  },
};

const orders = [
  ["SU-20481", "$128.00"],
  ["SU-20480", "$64.50"],
  ["SU-20479", "$219.00"],
];

/** 替身畫面：用中性色塊畫出三個網站首頁的輪廓 */
function SiteShot({ layout }: { layout: "hero" | "grid" | "split" }) {
  const bar = "rounded-full bg-[var(--wf-line-strong)]";
  return (
    <div
      aria-hidden="true"
      className="flex size-full flex-col gap-[6%] bg-[var(--wf-surface)] p-[6%]"
    >
      <div className="flex items-center justify-between border-b border-[var(--wf-line)] pb-[3%]">
        <span className="h-2 w-12 rounded-full bg-[var(--wf-fg)] opacity-70" />
        <span className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn("h-1.5 w-6", bar)} />
          ))}
        </span>
      </div>
      {layout === "hero" && (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <span className="h-4 w-3/4 rounded-sm bg-[var(--wf-fg)] opacity-80" />
          <span className="h-4 w-1/2 rounded-sm bg-[var(--wf-fg)] opacity-80" />
          <span className={cn("h-2 w-2/3", bar)} />
          <span className="mt-2 h-6 w-24 rounded-full bg-[var(--wf-fg)]" />
        </div>
      )}
      {layout === "grid" && (
        <div className="grid flex-1 grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="flex flex-col justify-end gap-1 rounded-md bg-[var(--wf-sunken)] p-2"
            >
              <span className={cn("h-1.5 w-2/3", bar)} />
              <span className={cn("h-1.5 w-1/3", bar)} />
            </span>
          ))}
        </div>
      )}
      {layout === "split" && (
        <div className="grid flex-1 grid-cols-2 gap-4">
          <div className="flex flex-col justify-center gap-2">
            <span className="h-3 w-full rounded-sm bg-[var(--wf-fg)] opacity-80" />
            <span className="h-3 w-2/3 rounded-sm bg-[var(--wf-fg)] opacity-80" />
            <span className={cn("h-2 w-3/4", bar)} />
          </div>
          <span className="rounded-lg bg-[var(--wf-sunken)]" />
        </div>
      )}
    </div>
  );
}

const shots = [
  { url: "hollow-kiln.studio", layout: "hero" },
  { url: "fieldnotes-type.com", layout: "grid" },
  { url: "lanebooks.example", layout: "split" },
] as const;

/** 文章裡的一段示範：左邊是後台網頁（瀏覽器外框），右邊是拿來總結的提示詞（視窗外框） */
export default function BrowserFrameDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const slides: BrowserStackSlide[] = shots.map((s, i) => ({
    url: s.url,
    title: t.sites[i],
    content: <SiteShot layout={s.layout} />,
  }));
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-6">
      <Stage className="grid w-full min-w-0 items-start gap-4 p-3 sm:p-6 md:grid-cols-[1.15fr_1fr]">
        <BrowserFrame
          url="shop.example.com/admin/orders"
          title={t.title}
          badge={t.badge}
          locale={locale}
        >
          <div className="divide-y divide-[var(--wf-line)] text-sm">
            {orders.map(([id, total], i) => (
              <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-mono text-xs text-[var(--wf-fg-muted)]">
                  {id}
                </span>
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
      <section className="grid min-w-0 items-center gap-8 md:grid-cols-[1fr_1.4fr]">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {t.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
            {t.heading}
          </h2>
        </div>
        <BrowserStack slides={slides} locale={locale} />
      </section>
    </div>
  );
}
