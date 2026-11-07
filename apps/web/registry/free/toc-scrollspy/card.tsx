"use client";

import { useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TocScrollspy } from "./toc-scrollspy";

const copy = {
  en: {
    toc: "On this page",
    sections: [
      { id: "washing", label: "Washing", body: "Hand wash cold with a wool detergent. Do not wring." },
      { id: "drying", label: "Drying", body: "Roll in a towel, then dry flat in the shade." },
      { id: "pilling", label: "Pilling", level: 2 as const, body: "Light pilling is normal. Use a wool comb." },
      { id: "storage", label: "Storage", body: "Fold, never hang. Keep it away from damp." },
    ],
  },
  "zh-TW": {
    toc: "本頁內容",
    sections: [
      { id: "washing", label: "洗滌", body: "冷水加羊毛專用洗劑手洗，不要用力擰轉。" },
      { id: "drying", label: "晾乾", body: "用毛巾捲起壓出水分，再平放陰乾。" },
      { id: "pilling", label: "起毛球", level: 2 as const, body: "輕微起毛球是正常的，用羊毛梳梳掉。" },
      { id: "storage", label: "收納", body: "折疊收納，不要吊掛，遠離潮濕。" },
    ],
  },
  "zh-CN": {
    toc: "本页内容",
    sections: [
      { id: "washing", label: "洗涤", body: "冷水加羊毛专用洗涤剂手洗，不要用力拧。" },
      { id: "drying", label: "晾干", body: "用毛巾卷起压出水分，再平铺阴干。" },
      { id: "pilling", label: "起球", level: 2 as const, body: "轻微起球是正常的，用羊毛梳梳掉。" },
      { id: "storage", label: "收纳", body: "折叠收纳，不要悬挂，远离潮湿。" },
    ],
  },
  ja: {
    toc: "目次",
    sections: [
      { id: "washing", label: "洗う", body: "冷水とウール用洗剤で手洗い。絞らないで。" },
      { id: "drying", label: "干す", body: "タオルで水気を取り、日陰で平干しに。" },
      { id: "pilling", label: "毛玉", level: 2 as const, body: "軽い毛玉は自然なこと。ブラシでとかします。" },
      { id: "storage", label: "しまう", body: "吊るさずにたたんで、湿気を避けて保管。" },
    ],
  },
};

/** 型錄卡片：左邊目錄、右邊保養文章，捲動文章時目錄的指示條跟著移到目前段落，點目錄跳過去。 */
export default function TocScrollspyCard() {
  const t = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="mx-auto grid h-60 w-[22rem] grid-cols-[7rem_1fr] overflow-hidden rounded-lg border bg-background">
      <aside className="border-r p-3">
        <TocScrollspy title={t.toc} items={t.sections} container={scroller} offset={32} />
      </aside>
      <div ref={scroller} className="relative overflow-y-auto px-4 pt-3 pb-36">
        {t.sections.map((s, i) => (
          <section key={s.id} id={s.id} className={i ? "mt-5 scroll-mt-3 outline-none" : "scroll-mt-3 outline-none"}>
            <h2 className="text-sm font-semibold">{s.label}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            <div aria-hidden="true" className="mt-2 h-14 rounded-md bg-muted" />
          </section>
        ))}
      </div>
    </div>
  );
}
