"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PrintPreview } from "./print-preview";

const copy = {
  en: {
    region: "Resume A4 preview",
    pages: (n: number) => (n === 1 ? "1 page" : `${n} pages`),
    name: "Mia Chen",
    contact: "Frontend engineer, Taipei. mia.chen@example.com, github.com/miachen",
    summary: "Frontend engineer with 8 years of experience building fast, accessible product interfaces, from design systems to performance work.",
    roles: [
      ["Senior Frontend Engineer, Northwind Labs", "2023 to present", "Rebuilt checkout in Next.js, cutting time to interactive from 4.1s to 1.6s.", "Designed a component library used by 6 product teams.", "Introduced visual regression tests that caught 120+ regressions.", "Mentored 4 engineers through promotion."],
      ["Frontend Engineer, Harbor Analytics", "2020 to 2023", "Built a real-time dashboard rendering 50k points with canvas and workers.", "Brought the product to WCAG 2.1 AA across 30 screens.", "Reduced bundle size by 38% with route-level code splitting."],
      ["Web Developer, Kiln & Co. Studio", "2018 to 2020", "Shipped 25+ marketing and e-commerce sites for small businesses.", "Set up a headless CMS so clients publish without developer help.", "Automated image optimisation, saving 1.2 MB per page."],
      ["Frontend Intern, Brightline Media", "2017 to 2018", "Built interactive story pages for the newsroom.", "Wrote the first internal style guide for front-end code."],
    ],
    degree: "B.S. Computer Science",
    school: ", National Taiwan University, 2014 to 2018",
  },
  "zh-TW": {
    region: "履歷 A4 預覽",
    pages: (n: number) => `共 ${n} 頁`,
    name: "陳美玲",
    contact: "前端工程師，台北。mia.chen@example.com，github.com/miachen",
    summary: "8 年前端經驗，擅長打造快速、無障礙的產品介面，從設計系統到效能優化都有涉獵。",
    roles: [
      ["資深前端工程師，Northwind Labs", "2023 年至今", "以 Next.js 重寫結帳流程，可互動時間從 4.1 秒降到 1.6 秒。", "設計元件庫，供 6 個產品團隊使用。", "導入視覺回歸測試，攔下 120 多個回歸問題。", "帶領 4 位工程師順利升遷。"],
      ["前端工程師，Harbor Analytics", "2020 至 2023 年", "用 canvas 與 worker 打造可即時繪製 5 萬個資料點的儀表板。", "讓產品 30 個畫面全數達到 WCAG 2.1 AA。", "以路由層級的程式碼分割，將套件大小減少 38%。"],
      ["網頁開發者，Kiln & Co. Studio", "2018 至 2020 年", "為小型企業上線 25 個以上的行銷與電商網站。", "建置 headless CMS，客戶不需工程師也能自行發布。", "自動化圖片最佳化，每頁省下 1.2 MB。"],
      ["前端實習生，Brightline Media", "2017 至 2018 年", "為新聞編輯室製作互動式專題頁面。", "撰寫第一份內部前端程式碼風格指南。"],
    ],
    degree: "資訊工程學士",
    school: "，國立臺灣大學，2014 至 2018 年",
  },
  "zh-CN": {
    region: "简历 A4 预览",
    pages: (n: number) => `共 ${n} 页`,
    name: "陈美玲",
    contact: "前端工程师，台北。mia.chen@example.com，github.com/miachen",
    summary: "8 年前端经验，擅长打造快速、无障碍的产品界面，从设计系统到性能优化都有涉猎。",
    roles: [
      ["高级前端工程师，Northwind Labs", "2023 年至今", "用 Next.js 重写结算流程，可交互时间从 4.1 秒降到 1.6 秒。", "设计组件库，供 6 个产品团队使用。", "引入视觉回归测试，拦下 120 多个回归问题。", "带领 4 位工程师顺利晋升。"],
      ["前端工程师，Harbor Analytics", "2020 至 2023 年", "用 canvas 和 worker 打造可实时绘制 5 万个数据点的仪表盘。", "让产品 30 个页面全部达到 WCAG 2.1 AA。", "通过路由级代码分割，将包体积减少 38%。"],
      ["网页开发者，Kiln & Co. Studio", "2018 至 2020 年", "为小企业上线 25 个以上的营销与电商网站。", "搭建 headless CMS，客户无需开发者也能自行发布。", "自动化图片优化，每页节省 1.2 MB。"],
      ["前端实习生，Brightline Media", "2017 至 2018 年", "为新闻编辑部制作交互式专题页面。", "编写第一份内部前端代码风格指南。"],
    ],
    degree: "计算机科学学士",
    school: "，台湾大学，2014 至 2018 年",
  },
  ja: {
    region: "履歴書 A4 プレビュー",
    pages: (n: number) => `${n} ページ`,
    name: "陳美玲（ミア・チェン）",
    contact: "フロントエンドエンジニア、台北。mia.chen@example.com、github.com/miachen",
    summary: "高速でアクセシブルなプロダクト UI づくりに 8 年携わるフロントエンドエンジニア。デザインシステムからパフォーマンス改善まで担当。",
    roles: [
      ["シニアフロントエンドエンジニア、Northwind Labs", "2023 年から現在", "Next.js で購入フローを作り直し、操作可能になるまでの時間を 4.1 秒から 1.6 秒に短縮。", "6 つのプロダクトチームが使うコンポーネントライブラリを設計。", "ビジュアル回帰テストを導入し、120 件以上の不具合を検出。", "エンジニア 4 名の昇進を支援。"],
      ["フロントエンドエンジニア、Harbor Analytics", "2020 年から 2023 年", "canvas と worker で 5 万点をリアルタイム描画するダッシュボードを構築。", "30 画面すべてを WCAG 2.1 AA に準拠。", "ルート単位のコード分割でバンドルサイズを 38% 削減。"],
      ["Web 開発者、Kiln & Co. Studio", "2018 年から 2020 年", "中小企業向けにマーケティングサイトや EC サイトを 25 件以上公開。", "ヘッドレス CMS を導入し、開発者なしで更新できる体制に。", "画像最適化を自動化し、1 ページあたり 1.2 MB を削減。"],
      ["フロントエンドインターン、Brightline Media", "2017 年から 2018 年", "編集部向けにインタラクティブな特集ページを制作。", "社内初のフロントエンドコードのスタイルガイドを作成。"],
    ],
    degree: "コンピュータサイエンス学士",
    school: "、国立台湾大学、2014 年から 2018 年",
  },
};

export default function PrintPreviewDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [pages, setPages] = useState(1);

  return (
    <section aria-label={t.region} className="w-full min-w-0 space-y-3 rounded-xl bg-[#f3f4f6] p-3 sm:p-6">
      <p className="text-right text-xs text-gray-500 tabular-nums">{t.pages(pages)}</p>
      <PrintPreview locale={locale} onPagesChange={setPages} fontFamily="ui-sans-serif, system-ui, sans-serif" layoutKey={locale}>
        <header>
          <h1 className="mt-0 mb-3 border-b-2 border-[#2563eb99] pb-3 text-[18pt] font-semibold tracking-tight text-gray-900">{t.name}</h1>
          <p className="mb-2.5 text-gray-700">{t.contact}</p>
        </header>
        <p className="mb-2.5 text-gray-700">{t.summary}</p>
        {t.roles.map(([title, period, ...points]) => (
          <div key={title}>
            <h3 className="mt-4 mb-2 border-l-[3px] border-[#2563eb] pl-3 leading-snug font-semibold text-gray-800">{title}</h3>
            <p className="mb-1 text-[0.72rem] font-semibold tracking-wide text-gray-500 uppercase">{period}</p>
            <ul className="mb-3 list-disc space-y-1.5 pl-5 text-gray-700">
              {points.map((p) => (
                <li key={p} className="leading-relaxed">{p}</li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mb-2.5 text-gray-700">
          <strong className="font-semibold text-gray-900">{t.degree}</strong>
          {t.school}
        </p>
      </PrintPreview>
    </section>
  );
}
