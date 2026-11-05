"use client";

import { useDemoText } from "@/lib/demo-locale";

import { EmberParticles } from "./ember-particles";

const copy = {
  en: {
    title: "Mountains Await",
    body: "The lamps are still lit, and no one has opened the old case yet. Add it to your wishlist and wait for the night the mountain gate opens again.",
    cta: "Add to Wishlist",
  },
  "zh-TW": {
    title: "山河待我",
    body: "燈火還亮著，舊案還沒有人翻開。加入願望清單，等山門再開的那一夜。",
    cta: "加入願望清單",
  },
  "zh-CN": {
    title: "山河待我",
    body: "灯火还亮着，旧案还没有人翻开。加入愿望单，等山门再开的那一夜。",
    cta: "加入愿望单",
  },
  ja: {
    title: "山河、我を待つ",
    body: "灯はまだともり、古い事件はまだ誰にも開かれていない。ウィッシュリストに加えて、山門がふたたび開く夜を待とう。",
    cta: "ウィッシュリストに追加",
  },
};

// 結尾 CTA 的情境：墨色底、遠山與燈火光暈，餘燼從下方緩緩升起
export default function EmberParticlesDemo() {
  const t = useDemoText(copy);
  return (
    <section
      className="relative isolate w-full max-w-4xl min-w-0 overflow-hidden px-6 py-16 text-center text-[#e8e4da] sm:py-24"
      style={{
        fontFamily: '"Noto Serif TC", "Songti TC", "PMingLiU", serif',
        background: [
          "radial-gradient(ellipse 55% 40% at 50% 100%, rgba(217, 160, 91, 0.22), transparent 70%)",
          "linear-gradient(170deg, transparent 72%, #0c1119 72.4%)",
          "linear-gradient(195deg, transparent 66%, rgba(18, 26, 38, 0.9) 66.4%)",
          "linear-gradient(180deg, #070a10, #0c1119)",
        ].join(", "),
      }}
    >
      <EmberParticles />
      <div className="relative z-[2] mx-auto flex max-w-md flex-col items-center gap-5">
        <p className="text-xs tracking-[0.4em] text-[#d9a05b]">WHERE THE MOUNTAINS AWAIT</p>
        <h2 className="text-2xl font-bold tracking-[0.3em] sm:text-3xl">{t.title}</h2>
        <p className="text-sm leading-loose text-[#c3ccd8]">{t.body}</p>
        <a
          href="#wishlist"
          className="border border-[rgba(217,160,91,0.55)] bg-[rgba(217,160,91,0.14)] px-7 py-3 text-sm tracking-[0.3em] text-[#edc186] transition-colors hover:bg-[#d9a05b] hover:text-[#17130d] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#edc186]"
        >
          {t.cta}
        </a>
      </div>
    </section>
  );
}
