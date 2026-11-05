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
    heading: "What people say after a Saturday at the studio",
    breakdown: ["Overall", "Content", "Teaching"],
    course: "Class",
    role: "Role",
    recommend: "Highly recommend",
    purchased: "Purchased",
    people: ["Mia Chen", "Daniel Wu", "Ivy Lin", "Kevin Huang"],
    courses: ["Wheel Throwing Basics", "Glaze Chemistry", "Bookbinding Weekend", "Lettering for Signage", "Sourdough at Home"],
    quotes: [
      "I centred clay on my own by the second hour. Took home two bowls that are now on our kitchen shelf.",
      "Clear pacing, real recipes, and the test tile notes are worth keeping. The cone 6 section alone paid for the ticket.",
      "Went in thinking I had no hand for it, left with a painted sign for my sister's cafe. Would love an advanced round.",
      "The take-home starter is still alive three months later. I bake a loaf every Sunday using the timing sheet.",
    ],
  },
  "zh-TW": {
    eyebrow: "學員心聲",
    heading: "在工作室待了一個週六，大家怎麼說",
    breakdown: ["整體", "內容", "教學"],
    course: "課程",
    role: "職務",
    recommend: "強力推薦",
    purchased: "已購買",
    people: ["陳怡安", "吳大年", "林依依", "黃凱文"],
    courses: ["拉坯入門", "釉藥化學", "週末手工裝幀", "招牌手寫字", "在家做酸種麵包"],
    quotes: [
      "第二個小時我就能自己定中心了。帶回家的兩個碗現在就擺在廚房架上。",
      "節奏清楚、配方實在，試片筆記也值得留著。光是六號錐那一段就值回票價。",
      "本來覺得自己手很笨，結果幫妹妹的咖啡店畫好了一塊招牌。很期待進階班。",
      "帶回家的酸種三個月後還活著。每個週日我都照著時間表烤一條。",
    ],
  },
  "zh-CN": {
    eyebrow: "学员心声",
    heading: "在工作室待了一个周六，大家怎么说",
    breakdown: ["整体", "内容", "教学"],
    course: "课程",
    role: "职位",
    recommend: "强烈推荐",
    purchased: "已购买",
    people: ["陈怡安", "吴大年", "林依依", "黄凯文"],
    courses: ["拉坯入门", "釉料化学", "周末手工装帧", "招牌手写字", "在家做酸种面包"],
    quotes: [
      "第二个小时我就能自己定中心了。带回家的两个碗现在就摆在厨房架上。",
      "节奏清晰、配方实在，试片笔记也值得保存。光是六号锥那一部分就值回票价。",
      "本来觉得自己手很笨，结果给妹妹的咖啡馆画好了一块招牌。很期待进阶班。",
      "带回家的酸种三个月后还活着。每个周日我都照着时间表烤一条。",
    ],
  },
  ja: {
    eyebrow: "受講者の声",
    heading: "工房で過ごした土曜日の感想",
    breakdown: ["総合", "内容", "教え方"],
    course: "クラス",
    role: "職種",
    recommend: "強くおすすめ",
    purchased: "購入済み",
    people: ["佐藤美亜", "鈴木大介", "林あい", "高橋健"],
    courses: ["ろくろ入門", "釉薬の化学", "週末の製本教室", "看板のレタリング", "おうちでサワードウ"],
    quotes: [
      "2時間目には自分で土を芯出しできるようになりました。持ち帰った2つの鉢は今も台所の棚にあります。",
      "テンポがよく、配合も実践的で、テストピースのメモはずっと手元に置いておきたい内容です。6番コーンの章だけでも元が取れました。",
      "不器用だと思っていましたが、終わる頃には妹のカフェの看板が描けていました。上級編もぜひ。",
      "持ち帰った酵母は3か月たっても元気です。毎週日曜にタイムシートどおり1本焼いています。",
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
    { id: "4", author: { name: c.people[3] }, rating: 4, quote: c.quotes[2], ratingBreakdown: breakdown(4, 4, 4), meta: [{ label: c.course, value: c.courses[3] }, { label: c.role, value: "Illustrator" }] },
    { id: "5", author: { name: null }, rating: 5, quote: c.quotes[3], meta: [{ label: c.course, value: c.courses[4] }], tag: tag(c.purchased, "info") },
  ];
}

export default function TestimonialMarqueeDemo() {
  const locale = useDemoLocale();
  const c = useDemoText(copy);
  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-[#0c0a09] py-12">
      <div className="mb-6 px-6 text-center">
        <p className="mb-2 text-[12px] font-semibold tracking-[0.2em] text-[#d4a24c] uppercase">{c.eyebrow}</p>
        <h2 className="font-serif text-[26px] font-normal tracking-[-0.01em] text-[#f5f5f4] sm:text-[30px]">{c.heading}</h2>
      </div>
      <TestimonialMarquee testimonials={buildTestimonials(c)} rows={2} fixed={false} locale={locale} />
    </section>
  );
}
