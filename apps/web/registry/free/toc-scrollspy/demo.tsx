"use client";

import { useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TocScrollspy } from "./toc-scrollspy";

const copy = {
  en: {
    toc: "On this page",
    title: "Care guide: merino knitwear",
    sections: [
      { id: "washing", label: "Washing", body: "Turn the garment inside out. Hand wash in cold water with a wool detergent, or use the wool cycle at 30°C. Do not wring or twist." },
      { id: "drying", label: "Drying", body: "Roll it in a towel to press out water, then dry flat in the shade. Hanging stretches the shoulders and direct heat can shrink the fibres." },
      { id: "pilling", label: "Pilling", level: 2 as const, body: "Light pilling in the first weeks is normal where the fabric rubs. Remove it with a wool comb, working in one direction." },
      { id: "storage", label: "Storage", body: "Fold rather than hang. Keep it in a breathable bag with cedar between seasons, away from damp." },
      { id: "repairs", label: "Repairs", body: "Small holes can be darned. Send it to us within two years for a free repair of any seam that opens." },
    ],
  },
  "zh-TW": {
    toc: "本頁內容",
    title: "保養指南：美麗諾針織",
    sections: [
      { id: "washing", label: "洗滌", body: "翻面後以冷水加羊毛專用洗劑手洗，或使用 30°C 羊毛洗程。不要用力擰轉。" },
      { id: "drying", label: "晾乾", body: "用毛巾捲起壓出水分，再平放陰乾。吊掛會把肩線拉長，直接加熱可能讓纖維縮水。" },
      { id: "pilling", label: "起毛球", level: 2 as const, body: "剛開始穿的幾週，摩擦處輕微起毛球是正常的。用羊毛梳往同一個方向梳掉即可。" },
      { id: "storage", label: "收納", body: "折疊收納，不要吊掛。換季時放進透氣袋並夾一塊雪松木，遠離潮濕。" },
      { id: "repairs", label: "修補", body: "小破洞可以織補。兩年內任何縫線脫開，寄回給我們免費修理。" },
    ],
  },
  "zh-CN": {
    toc: "本页内容",
    title: "保养指南：美丽诺针织",
    sections: [
      { id: "washing", label: "洗涤", body: "翻面后用冷水加羊毛专用洗涤剂手洗，或使用 30°C 羊毛洗程。不要用力拧。" },
      { id: "drying", label: "晾干", body: "用毛巾卷起压出水分，再平铺阴干。悬挂会拉长肩线，直接加热可能让纤维缩水。" },
      { id: "pilling", label: "起球", level: 2 as const, body: "刚开始穿的几周，摩擦处轻微起球是正常的。用羊毛梳朝同一方向梳掉即可。" },
      { id: "storage", label: "收纳", body: "折叠收纳，不要悬挂。换季时放进透气袋并放一块雪松木，远离潮湿。" },
      { id: "repairs", label: "修补", body: "小破洞可以织补。两年内任何缝线开裂，寄回给我们免费修理。" },
    ],
  },
  ja: {
    toc: "このページの内容",
    title: "お手入れガイド：メリノニット",
    sections: [
      { id: "washing", label: "洗う", body: "裏返して、冷水とウール用洗剤で手洗いするか、30°C のウールコースで。絞ったりねじったりしないでください。" },
      { id: "drying", label: "干す", body: "タオルで巻いて水気を取り、日陰で平干しに。吊るすと肩が伸び、直接の熱は縮みの原因になります。" },
      { id: "pilling", label: "毛玉", level: 2 as const, body: "着始めの数週間、こすれる部分に軽い毛玉ができるのは自然なことです。ウール用ブラシで一方向にとかしてください。" },
      { id: "storage", label: "しまう", body: "吊るさずにたたんで。シーズンオフは通気性のある袋に杉材と一緒に、湿気を避けて保管します。" },
      { id: "repairs", label: "直す", body: "小さな穴はダーニングで。2 年以内に縫い目がほつれたら、無料で修理します。" },
    ],
  },
};

export default function TocScrollspyDemo() {
  const t = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="grid h-[28rem] w-full max-w-3xl grid-cols-1 overflow-hidden rounded-lg border bg-background sm:grid-cols-[11rem_1fr]">
      <aside className="hidden border-r p-5 sm:block">
        <TocScrollspy title={t.toc} items={t.sections} container={scroller} offset={48} />
      </aside>
      <div ref={scroller} className="relative overflow-y-auto px-6 pb-[16rem] pt-6">
        <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
        {t.sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-8 scroll-mt-12 outline-none">
            <h2 className={s.level === 2 ? "text-sm font-semibold" : "text-base font-semibold"}>{s.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            <div aria-hidden="true" className="mt-4 h-24 rounded-md bg-muted" />
          </section>
        ))}
      </div>
    </div>
  );
}
