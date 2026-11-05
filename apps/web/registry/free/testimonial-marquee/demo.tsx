"use client";

import { TestimonialMarquee, type Testimonial } from "./testimonial-marquee";

const breakdown = (a: number, b: number, c: number) => [
  { label: "Overall", value: a },
  { label: "Content", value: b },
  { label: "Teaching", value: c },
];

const TESTIMONIALS: Testimonial[] = [
  { id: "1", author: { name: "Mia Chen" }, rating: 5, quote: "I finally understand how to break a task into prompts the model can actually follow. Shipped my first internal tool the week after.", ratingBreakdown: breakdown(5, 5, 5), meta: [{ label: "Course", value: "Prompt Craft Basics" }], tag: { label: "Highly recommend", tone: "free" } },
  { id: "2", author: { name: "Daniel Wu" }, rating: 4.5, quote: "Clear pacing, real examples, and the handouts are worth keeping. The agents section alone paid for the ticket.", ratingBreakdown: breakdown(5, 4, 5), meta: [{ label: "Course", value: "Agents in Practice" }], tag: { label: "Purchased", tone: "info" } },
  { id: "3", author: { name: "Ivy Lin" }, rating: 5, quote: "", meta: [{ label: "Course", value: "Vibe Coding a Landing Page" }] },
  { id: "4", author: { name: "Kevin Huang" }, rating: 4, quote: "Went in skeptical, came out with three automations running on my laptop. Would love a follow-up on deployment.", ratingBreakdown: breakdown(4, 4, 4), meta: [{ label: "Course", value: "Automate Your Week" }, { label: "Role", value: "PM" }] },
  { id: "5", author: { name: null }, rating: 5, quote: "The replay library is the best part. I rewatch the data storytelling session before every quarterly review.", meta: [{ label: "Course", value: "Data Stories with AI" }], tag: { label: "Purchased", tone: "info" } },
];

export default function TestimonialMarqueeDemo() {
  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-black py-12">
      <div className="mb-6 px-6 text-center">
        <p className="mb-2 text-[12px] font-bold tracking-[0.2em] text-[#F5C045] uppercase">Student voices</p>
        <h2 className="text-[24px] font-black text-white/95 sm:text-[28px]">What learners say after class</h2>
      </div>
      <TestimonialMarquee testimonials={TESTIMONIALS} rows={2} fixed={false} />
    </section>
  );
}
