"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Book3D } from "./book-3d";

const copy = {
  en: {
    title: "Homecoming",
    summary: "Prologue · 1 volume",
    date: "September 2026",
    kicker: "Where the Mountains Await · Memoir",
    ordinal: "Prologue",
    chapter: "The Lamp at the Gate",
    prose: "Pei Du walked through the snow for three days before he saw the mountain gate. The gate was shut, but the lamp beneath the eaves was still burning.",
    closing: "While the lamp still burns, someone is still waiting.",
  },
  "zh-TW": {
    title: "歸山",
    summary: "序章・共 1 卷",
    date: "2026年9月",
    kicker: "山河未歸・回憶錄",
    ordinal: "序章",
    chapter: "山門燈未滅",
    prose: "裴渡在雪裡走了三日，才看見山門。門是關著的，簷下那盞燈卻還亮著，像有人每夜都來添油。",
    closing: "燈還亮著，就還有人在等。",
  },
  "zh-CN": {
    title: "归山",
    summary: "序章・共 1 卷",
    date: "2026年9月",
    kicker: "山河未归・回忆录",
    ordinal: "序章",
    chapter: "山门灯未灭",
    prose: "裴渡在雪里走了三日，才看见山门。门是关着的，檐下那盏灯却还亮着，像有人每夜都来添油。",
    closing: "灯还亮着，就还有人在等。",
  },
  ja: {
    title: "帰山",
    summary: "序章・全 1 巻",
    date: "2026年9月",
    kicker: "山河未帰・回想録",
    ordinal: "序章",
    chapter: "山門の灯は消えず",
    prose: "裴渡は雪の中を三日歩き、ようやく山門を目にした。門は閉ざされていたが、軒下の灯はまだともっていた。",
    closing: "灯がともる限り、待つ人はまだいる。",
  },
};

/**
 * 型錄卡片：完整 demo 是 640px 高的直式舞台，塞進卡片會被寬度卡住、再縮成一小本。
 * 這裡給和卡片同為 5:4 的橫式舞台，書的比例才對；內文只留一章，翻開就讀得到。
 */
export default function Book3DCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="w-[440px] overflow-hidden rounded-[4px]">
      <Book3D locale={locale} title={t.title} summary={t.summary} date={t.date} keyboard="self" className="h-[352px]">
        <section className="novella-title-page">
          <div className="novella-title-kicker">{t.kicker}</div>
          <h2 className="novella-title">{t.title}</h2>
          <div className="novella-ornament" aria-hidden="true">◆</div>
          <p className="novella-title-date">{t.date}</p>
        </section>
        <section className="novella-break">
          <h3 className="novella-chapter-heading">
            <span className="novella-chapter-ordinal">{t.ordinal}</span>
            {t.chapter}
          </h3>
          <p className="novella-prose">{t.prose}</p>
          <blockquote className="novella-closing" data-book-end>{t.closing}</blockquote>
        </section>
      </Book3D>
    </div>
  );
}
