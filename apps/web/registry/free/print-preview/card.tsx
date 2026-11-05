"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PrintPreview } from "./print-preview";

const copy = {
  en: {
    pages: (n: number) => (n === 1 ? "1 page" : `${n} pages`),
    reset: "Reset",
    add: "Add roles",
    name: "Mia Chen",
    roles: [
      ["Senior Frontend Engineer, Northwind Labs", "Rebuilt checkout in Next.js, cutting time to interactive from 4.1s to 1.6s.", "Designed a component library used by 6 product teams."],
      ["Frontend Engineer, Harbor Analytics", "Built a real-time dashboard rendering 50k points with canvas and workers.", "Brought the product to WCAG 2.1 AA across 30 screens."],
      ["Web Developer, Kiln & Co. Studio", "Shipped 25+ marketing and e-commerce sites for small businesses.", "Set up a headless CMS so clients publish without developer help."],
    ],
  },
  "zh-TW": {
    pages: (n: number) => `共 ${n} 頁`,
    reset: "重設",
    add: "加入經歷",
    name: "陳美玲",
    roles: [
      ["資深前端工程師，Northwind Labs", "以 Next.js 重寫結帳流程，可互動時間從 4.1 秒降到 1.6 秒。", "設計元件庫，供 6 個產品團隊使用。"],
      ["前端工程師，Harbor Analytics", "用 canvas 與 worker 打造可即時繪製 5 萬個資料點的儀表板。", "讓產品 30 個畫面全數達到 WCAG 2.1 AA。"],
      ["網頁開發者，Kiln & Co. Studio", "為小型企業上線 25 個以上的行銷與電商網站。", "建置 headless CMS，客戶不需工程師也能自行發布。"],
    ],
  },
  "zh-CN": {
    pages: (n: number) => `共 ${n} 页`,
    reset: "重置",
    add: "添加经历",
    name: "陈美玲",
    roles: [
      ["高级前端工程师，Northwind Labs", "用 Next.js 重写结算流程，可交互时间从 4.1 秒降到 1.6 秒。", "设计组件库，供 6 个产品团队使用。"],
      ["前端工程师，Harbor Analytics", "用 canvas 和 worker 打造可实时绘制 5 万个数据点的仪表盘。", "让产品 30 个页面全部达到 WCAG 2.1 AA。"],
      ["网页开发者，Kiln & Co. Studio", "为小企业上线 25 个以上的营销与电商网站。", "搭建 headless CMS，客户无需开发者也能自行发布。"],
    ],
  },
  ja: {
    pages: (n: number) => `${n} ページ`,
    reset: "リセット",
    add: "経歴を追加",
    name: "陳美玲",
    roles: [
      ["シニアフロントエンドエンジニア、Northwind Labs", "Next.js で購入フローを作り直し、操作可能になるまでの時間を 4.1 秒から 1.6 秒に短縮。", "6 つのプロダクトチームが使うコンポーネントライブラリを設計。"],
      ["フロントエンドエンジニア、Harbor Analytics", "canvas と worker で 5 万点をリアルタイム描画するダッシュボードを構築。", "30 画面すべてを WCAG 2.1 AA に準拠。"],
      ["Web 開発者、Kiln & Co. Studio", "中小企業向けにマーケティングサイトや EC サイトを 25 件以上公開。", "ヘッドレス CMS を導入し、開発者なしで更新できる体制に。"],
    ],
  },
};

/** 型錄卡片：A4 分頁預覽，加入經歷就看內容依區塊自動換到下一頁。 */
export default function PrintPreviewCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(3);

  return (
    <div className="mx-auto w-[300px] space-y-2 rounded-xl bg-[#f3f4f6] p-2">
      <div className="flex items-center justify-between px-1 text-xs text-gray-500 tabular-nums">
        <span>{t.pages(pages)}</span>
        <button type="button" onClick={() => setCount((c) => (c >= 12 ? 3 : c + 3))} className="font-medium text-gray-700 underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
          {count >= 12 ? t.reset : t.add}
        </button>
      </div>
      {/* 紙張是真實 A4 高度，放在內部捲動區裡瀏覽 */}
      <div className="h-[190px] overflow-y-auto overscroll-contain">
        <PrintPreview locale={locale} onPagesChange={setPages} padding="5mm" fontFamily="ui-sans-serif, system-ui, sans-serif" layoutKey={locale}>
          <h1 className="mt-0 mb-2 border-b-2 border-[#2563eb99] pb-2 text-[16pt] font-semibold tracking-tight text-gray-900">{t.name}</h1>
          {Array.from({ length: count }, (_, i) => {
            const [title, ...points] = t.roles[i % t.roles.length];
            return (
              <div key={i}>
                <h3 className="mt-3 mb-1.5 border-l-[3px] border-[#2563eb] pl-2 leading-snug font-semibold text-gray-800">{title}</h3>
                <ul className="mb-2 list-disc space-y-1 pl-5 text-gray-700">
                  {points.map((p) => (
                    <li key={p} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </PrintPreview>
      </div>
    </div>
  );
}
