"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { Typewriter } from "./typewriter";

const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";

const copy = {
  en: {
    eyebrow: "Autumn edit",
    prefix: "Linen made for",
    sr: "Linen made for slow mornings, long commutes and the first cold week.",
    phrases: ["slow mornings.", "long commutes.", "the first cold week."],
    body: "Washed linen shirts, trousers and overshirts in five undyed colors. Free shipping on orders over $80.",
    popular: "Popular now:",
    popularSr: "Popular searches: overshirt, wide-leg trousers, linen bedding.",
    searches: ["overshirt", "wide-leg trousers", "linen bedding"],
  },
  "zh-TW": {
    eyebrow: "秋季選品",
    prefix: "亞麻，獻給",
    sr: "亞麻，獻給慢慢來的早晨、漫長的通勤，以及入秋第一個冷週。",
    phrases: ["慢慢來的早晨。", "漫長的通勤。", "入秋第一個冷週。"],
    body: "水洗亞麻襯衫、長褲與罩衫，五種未染色系。訂單滿 $80 免運費。",
    popular: "熱門搜尋：",
    popularSr: "熱門搜尋：罩衫、寬褲、亞麻寢具。",
    searches: ["罩衫", "寬褲", "亞麻寢具"],
  },
  "zh-CN": {
    eyebrow: "秋季精选",
    prefix: "亚麻，献给",
    sr: "亚麻，献给慢悠悠的早晨、漫长的通勤，以及入秋后的第一个冷周。",
    phrases: ["慢悠悠的早晨。", "漫长的通勤。", "入秋后的第一个冷周。"],
    body: "水洗亚麻衬衫、长裤与罩衫，五种未染色系。订单满 $80 包邮。",
    popular: "热门搜索：",
    popularSr: "热门搜索：罩衫、阔腿裤、亚麻床品。",
    searches: ["罩衫", "阔腿裤", "亚麻床品"],
  },
  ja: {
    eyebrow: "秋のセレクト",
    prefix: "リネンを、",
    sr: "リネンを、ゆっくりした朝に、長い通勤に、最初の寒い週に。",
    phrases: ["ゆっくりした朝に。", "長い通勤に。", "最初の寒い週に。"],
    body: "洗いざらしのリネンシャツ、パンツ、シャツジャケットを、染めない 5 色で。$80 以上のご注文で送料無料。",
    popular: "人気の検索：",
    popularSr: "人気の検索：シャツジャケット、ワイドパンツ、リネン寝具。",
    searches: ["シャツジャケット", "ワイドパンツ", "リネン寝具"],
  },
};

export default function TypewriterDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section className={cn("w-full max-w-2xl rounded-md border p-6 sm:p-10", paper, edge, ink)}>
      <p className={cn("text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.eyebrow}</p>
      <Typewriter
        key={locale}
        as="h2"
        locale={locale}
        prefix={<span className={inkMuted}>{t.prefix}</span>}
        srText={t.sr}
        phrases={t.phrases}
        className="mt-3 text-[1.75rem] leading-tight sm:text-4xl"
      />
      <p className={cn("mt-4 max-w-md text-sm leading-relaxed", inkMuted)}>{t.body}</p>

      <div className={cn("mt-8 flex items-center gap-3 border-t pt-5 text-sm", edge)}>
        <svg viewBox="0 0 16 16" className={cn("size-4 shrink-0", inkMuted)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" strokeLinecap="round" />
        </svg>
        <Typewriter
          key={locale}
          locale={locale}
          prefix={<span className={inkMuted}>{t.popular}</span>}
          srText={t.popularSr}
          phrases={t.searches}
          typeSpeed={55}
          pause={1100}
          className="text-sm font-normal tracking-normal"
        />
      </div>
    </section>
  );
}
