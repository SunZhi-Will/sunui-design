"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ScrollProgress } from "./scroll-progress";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/65 dark:text-[#ece7dc]/65";

const copy = {
  en: [
  { id: "card-care-wash", label: "Wash", body: "Machine wash at 30°C on a gentle cycle. Linen softens with every wash, so skip the fabric softener. Turn shirts inside out and fasten the buttons." },
  { id: "card-care-dry", label: "Dry", body: "Line dry in the shade. Give each piece a firm shake before hanging; most creases fall out on their own. Expect up to 3% shrinkage after the first wash." },
  { id: "card-care-store", label: "Store", body: "Store clean and completely dry, folded loosely. Avoid plastic covers; linen needs air to stay fresh between seasons." },
],
  "zh-TW": [
    { id: "card-care-wash", label: "洗滌", body: "以 30°C 溫和行程機洗。亞麻每洗一次就更柔軟，不需要柔軟精。襯衫翻面並扣好鈕扣。" },
    { id: "card-care-dry", label: "晾乾", body: "在陰涼處吊掛晾乾。晾之前用力甩幾下，大部分皺褶會自己消失。第一次洗後可能縮水約 3%。" },
    { id: "card-care-store", label: "收納", body: "洗淨並完全乾燥後輕輕摺疊收納。避免塑膠套，亞麻需要透氣才能在換季之間保持清爽。" },
  ],
  "zh-CN": [
    { id: "card-care-wash", label: "洗涤", body: "用 30°C 轻柔模式机洗。亚麻每洗一次就更柔软，不需要柔顺剂。衬衫翻面并扣好纽扣。" },
    { id: "card-care-dry", label: "晾干", body: "在阴凉处挂起晾干。晾之前用力抖几下，大部分褶皱会自然消失。首次洗涤后可能缩水约 3%。" },
    { id: "card-care-store", label: "收纳", body: "洗净并完全干透后轻轻折叠收纳。避免塑料罩，亚麻需要透气才能在换季期间保持清爽。" },
  ],
  ja: [
    { id: "card-care-wash", label: "洗濯", body: "30°C の弱水流で洗濯機洗い。リネンは洗うたびに柔らかくなるので柔軟剤は不要です。シャツは裏返してボタンを留めて。" },
    { id: "card-care-dry", label: "乾燥", body: "日陰で吊るして干します。干す前にしっかり振れば、しわはほとんど自然に取れます。初回の洗濯で最大 3% ほど縮みます。" },
    { id: "card-care-store", label: "保管", body: "清潔で完全に乾いた状態でゆるくたたんで保管。ビニールカバーは避けて、通気を保ちましょう。" },
  ],
};

/** 型錄卡片：框內捲動一篇短文，上方墨線跟著前進，點刻度跳到該章。 */
export default function ScrollProgressCard() {
  const locale = useDemoLocale();
  const chapters = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <article className={cn("mx-auto w-72 overflow-hidden rounded-md border", paper, edge, ink)}>
      <header className={cn("border-b px-4 pt-6 pb-2", edge)}>
        <ScrollProgress container={scroller} sections={chapters} position="static" showPercent locale={locale} />
      </header>
      <div ref={scroller} className="relative h-[160px] overflow-y-auto px-4 py-4">
        <div className="space-y-6">
          {chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="scroll-mt-4">
              <h3 className="flex items-baseline gap-2 text-sm font-semibold">
                <span className={cn("font-mono text-xs tabular-nums", inkMuted)}>{String(i + 1).padStart(2, "0")}</span>
                {c.label}
              </h3>
              <p className={cn("mt-2 text-sm leading-6", inkMuted)}>{c.body}</p>
            </section>
          ))}
          <div className="h-24" />
        </div>
      </div>
    </article>
  );
}
