"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { TestimonialMarquee, type Testimonial } from "./testimonial-marquee";

const copy = {
  en: {
    eyebrow: "Student voices",
    course: "Class",
    people: ["Mia Chen", "Daniel Wu", "Ivy Lin"],
    courses: ["Wheel Throwing Basics", "Glaze Chemistry", "Lettering for Signage"],
    quotes: ["Centred clay on my own by the second hour. Two bowls now on our shelf.", "Clear pacing and real recipes. The test tile notes are worth keeping.", "Left with a painted sign for my sister's cafe."],
  },
  "zh-TW": {
    eyebrow: "學員心聲",
    course: "課程",
    people: ["陳怡安", "吳大年", "黃凱文"],
    courses: ["拉坯入門", "釉藥化學", "招牌手寫字"],
    quotes: ["第二個小時就能自己定中心，帶回的兩個碗擺在廚房架上。", "節奏清楚、配方實在，試片筆記值得留著。", "幫妹妹的咖啡店畫好了一塊招牌。"],
  },
  "zh-CN": {
    eyebrow: "学员心声",
    course: "课程",
    people: ["陈怡安", "吴大年", "黄凯文"],
    courses: ["拉坯入门", "釉料化学", "招牌手写字"],
    quotes: ["第二个小时就能自己定中心，带回的两个碗摆在厨房架上。", "节奏清晰、配方实在，试片笔记值得保存。", "给妹妹的咖啡馆画好了一块招牌。"],
  },
  ja: {
    eyebrow: "受講者の声",
    course: "クラス",
    people: ["佐藤美亜", "鈴木大介", "高橋健"],
    courses: ["ろくろ入門", "釉薬の化学", "看板のレタリング"],
    quotes: ["2時間目には自分で芯出しできました。鉢は今も台所の棚に。", "テンポがよく配合も実践的。テストピースのメモは宝物です。", "妹のカフェの看板が描けました。"],
  },
};

/** 型錄卡片：一排評價卡持續橫向捲動，滑過會停下，點一張展開完整評價。 */
export default function TestimonialMarqueeCard() {
  const locale = useDemoLocale();
  const c = useDemoText(copy);
  const testimonials: Testimonial[] = c.people.map((name, i) => ({
    id: String(i),
    author: { name },
    rating: i === 1 ? 4.5 : 5,
    quote: c.quotes[i],
    meta: [{ label: c.course, value: c.courses[i] }],
  }));

  return (
    <section className="relative w-80 overflow-hidden rounded-2xl bg-[#0a0a0a] py-5">
      <p className="mb-3 text-center text-[11px] font-semibold tracking-[0.2em] text-[#d4a24c] uppercase">{c.eyebrow}</p>
      <TestimonialMarquee testimonials={testimonials} rows={1} cardWidth={240} minCardsPerRow={3} fadeWidth={32} fixed={false} locale={locale} />
    </section>
  );
}
