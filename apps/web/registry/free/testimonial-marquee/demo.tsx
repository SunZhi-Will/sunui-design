"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { TestimonialMarquee, type Testimonial, type TestimonialTagTone } from "./testimonial-marquee";

type Copy = {
  eyebrow: string;
  heading: string;
  breakdown: [string, string, string];
  course: string;
  role: string;
  recommend: string;
  purchased: string;
  people: [string, string, string, string];
  courses: [string, string, string, string, string];
  quotes: [string, string, string, string];
};

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Copy> = {
  en: {
    eyebrow: "Student voices",
    heading: "What learners say after class",
    breakdown: ["Overall", "Content", "Teaching"],
    course: "Course",
    role: "Role",
    recommend: "Highly recommend",
    purchased: "Purchased",
    people: ["Mia Chen", "Daniel Wu", "Ivy Lin", "Kevin Huang"],
    courses: ["Prompt Craft Basics", "Agents in Practice", "Vibe Coding a Landing Page", "Automate Your Week", "Data Stories with AI"],
    quotes: [
      "I finally understand how to break a task into prompts the model can actually follow. Shipped my first internal tool the week after.",
      "Clear pacing, real examples, and the handouts are worth keeping. The agents section alone paid for the ticket.",
      "Went in skeptical, came out with three automations running on my laptop. Would love a follow-up on deployment.",
      "The replay library is the best part. I rewatch the data storytelling session before every quarterly review.",
    ],
  },
  "zh-TW": {
    eyebrow: "學員心聲",
    heading: "上完課，學員怎麼說",
    breakdown: ["整體", "內容", "教學"],
    course: "課程",
    role: "職務",
    recommend: "強力推薦",
    purchased: "已購買",
    people: ["陳怡安", "吳大年", "林依依", "黃凱文"],
    courses: ["提示詞入門", "AI 代理實戰", "用 Vibe Coding 做一頁式網站", "自動化你的一週", "用 AI 說資料故事"],
    quotes: [
      "終於懂得怎麼把任務拆成模型真的照做的提示詞。隔週就上線了第一個內部工具。",
      "節奏清楚、範例實在，講義也值得留著。光是 AI 代理那一段就值回票價。",
      "本來半信半疑，結果帶著三個在筆電上跑的自動化流程離開。很期待部署的進階課。",
      "回放影片庫是最棒的部分。每次季度報告前我都會重看資料敘事那一堂。",
    ],
  },
  "zh-CN": {
    eyebrow: "学员心声",
    heading: "上完课，学员怎么说",
    breakdown: ["整体", "内容", "教学"],
    course: "课程",
    role: "职位",
    recommend: "强烈推荐",
    purchased: "已购买",
    people: ["陈怡安", "吴大年", "林依依", "黄凯文"],
    courses: ["提示词入门", "AI 智能体实战", "用 Vibe Coding 做落地页", "自动化你的一周", "用 AI 讲数据故事"],
    quotes: [
      "终于明白怎么把任务拆成模型真能照做的提示词。第二周就上线了第一个内部工具。",
      "节奏清晰、案例实在，讲义也值得保存。光是智能体那一部分就值回票价。",
      "本来将信将疑，结果带着三个在笔记本上跑的自动化流程离开。很期待部署方面的进阶课。",
      "回放视频库是最棒的部分。每次季度汇报前我都会重看数据叙事那一节。",
    ],
  },
  ja: {
    eyebrow: "受講者の声",
    heading: "受講後のリアルな感想",
    breakdown: ["総合", "内容", "教え方"],
    course: "講座",
    role: "職種",
    recommend: "強くおすすめ",
    purchased: "購入済み",
    people: ["佐藤美亜", "鈴木大介", "林あい", "高橋健"],
    courses: ["プロンプト設計の基本", "実践 AI エージェント", "Vibe Coding でランディングページ", "1週間を自動化する", "AI で伝えるデータストーリー"],
    quotes: [
      "モデルが本当に従えるプロンプトにタスクを分解する方法が、やっとわかりました。翌週には初めての社内ツールを公開できました。",
      "テンポがよく、例も実践的で、配布資料はずっと手元に置いておきたい内容です。エージェントの章だけでも元が取れました。",
      "半信半疑で参加しましたが、終わる頃にはノート PC で3つの自動化が動いていました。デプロイ編の続きもぜひ。",
      "アーカイブ動画がいちばんの魅力です。四半期レビューの前には毎回データストーリーの回を見直しています。",
    ],
  },
};

function buildTestimonials(c: Copy): Testimonial[] {
  const breakdown = (a: number, b: number, d: number) => [
    { label: c.breakdown[0], value: a },
    { label: c.breakdown[1], value: b },
    { label: c.breakdown[2], value: d },
  ];
  const tag = (label: string, tone: TestimonialTagTone) => ({ label, tone });
  return [
    { id: "1", author: { name: c.people[0] }, rating: 5, quote: c.quotes[0], ratingBreakdown: breakdown(5, 5, 5), meta: [{ label: c.course, value: c.courses[0] }], tag: tag(c.recommend, "free") },
    { id: "2", author: { name: c.people[1] }, rating: 4.5, quote: c.quotes[1], ratingBreakdown: breakdown(5, 4, 5), meta: [{ label: c.course, value: c.courses[1] }], tag: tag(c.purchased, "info") },
    { id: "3", author: { name: c.people[2] }, rating: 5, quote: "", meta: [{ label: c.course, value: c.courses[2] }] },
    { id: "4", author: { name: c.people[3] }, rating: 4, quote: c.quotes[2], ratingBreakdown: breakdown(4, 4, 4), meta: [{ label: c.course, value: c.courses[3] }, { label: c.role, value: "PM" }] },
    { id: "5", author: { name: null }, rating: 5, quote: c.quotes[3], meta: [{ label: c.course, value: c.courses[4] }], tag: tag(c.purchased, "info") },
  ];
}

export default function TestimonialMarqueeDemo() {
  const locale = useDemoLocale();
  const c = useDemoText(copy);
  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-black py-12">
      <div className="mb-6 px-6 text-center">
        <p className="mb-2 text-[12px] font-bold tracking-[0.2em] text-[#F5C045] uppercase">{c.eyebrow}</p>
        <h2 className="text-[24px] font-black text-white/95 sm:text-[28px]">{c.heading}</h2>
      </div>
      <TestimonialMarquee testimonials={buildTestimonials(c)} rows={2} fixed={false} locale={locale} />
    </section>
  );
}
