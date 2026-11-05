"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Book3D } from "./book-3d";

interface Volume {
  ordinal: string;
  name: string;
  prose: string[];
  closing: string;
}

interface BookCopy {
  title: string;
  summary: string;
  date: string;
  kicker: string;
  meta: string;
  volumes: Volume[];
  epilogue: string;
  finalLine: string;
  end: string;
}

// 原創短篇：一輪旅程走完後收進書裡的回憶錄
const copy: { en: BookCopy; "zh-TW": BookCopy; "zh-CN": BookCopy; ja: BookCopy } = {
  en: {
    title: "Homecoming",
    summary: "Prologue to Volume One · 2 volumes · 7 choices",
    date: "September 1 to September 19, 2026",
    kicker: "Where the Mountains Await · Memoir",
    meta: "Prologue to Volume One · 2 volumes",
    volumes: [
      {
        ordinal: "Prologue",
        name: "The Lamp at the Gate",
        prose: [
          "In the winter of his eleventh year away from the mountain, a letter in his late master's own hand reached the ferry landing. The paper had yellowed, yet the ink looked as if it had been written only last night.",
          "Pei Du walked through the snow for three days before he saw the mountain gate. The gate was shut, but the lamp beneath the eaves was still burning, as if someone came every night to add oil.",
          "The old charcoal carrier said no one had lived on the mountain for years. Yet on the first of every month he left a basket of charcoal on the stone steps, and by the next day it was always empty.",
        ],
        closing: "While the lamp still burns, someone is still waiting.",
      },
      {
        ordinal: "Volume One",
        name: "White Reed Ferry",
        prose: [
          "The night boats at White Reed Ferry carry no lanterns. The boatman took the silver and asked only one thing: “Does the place you are going still have a name?”",
          "In the cabin Pei Du found half of a prescription, written in the very same hand as his master's letter. The names of the herbs had been scraped away with a blade, leaving a single word: “Return.”",
          "He tucked the prescription into his sleeve. As the boat touched the shore, someone deep in the reeds gave one short whistle, and then all was silent again.",
        ],
        closing: "A name that is erased always leaves a trace somewhere else.",
      },
    ],
    epilogue: "Epilogue",
    finalLine: "The mountain gate opened once more. This time, the lamp beneath the eaves was one he had lit himself.",
    end: "(The End)",
  },
  "zh-TW": {
    title: "歸山",
    summary: "序章至第一卷・共 2 卷・7 次抉擇",
    date: "2026年9月1日 至 2026年9月19日",
    kicker: "山河未歸・回憶錄",
    meta: "序章至第一卷・共 2 卷",
    volumes: [
      {
        ordinal: "序章",
        name: "山門燈未滅",
        prose: [
          "離山第十一年的冬天，一封亡師的親筆信送到渡口。信紙泛黃，墨色卻像昨夜才寫成。",
          "裴渡在雪裡走了三日，才看見山門。門是關著的，簷下那盞燈卻還亮著，像有人每夜都來添油。",
          "送炭的老人說，山上早就沒人了。可每個月初一，炭簍放在石階上，第二天總是空的。",
        ],
        closing: "燈還亮著，就還有人在等。",
      },
      {
        ordinal: "第一卷",
        name: "白蘆渡",
        prose: [
          "白蘆渡的夜船不點燈。船夫收了銀子，只問一句：「客官要去的地方，還有名字嗎？」",
          "裴渡在船艙裡找到半張藥方，筆跡與師父的信一模一樣。藥名被人用刀刮去，只留下一個「歸」字。",
          "他把藥方收進袖裡。船靠岸時，蘆葦深處有人吹了一聲短哨，又很快沒了聲息。",
        ],
        closing: "被抹去的名字，總會在別處留下痕跡。",
      },
    ],
    epilogue: "尾聲",
    finalLine: "山門重新開了。簷下的燈，這一次是他親手點的。",
    end: "（全書完）",
  },
  "zh-CN": {
    title: "归山",
    summary: "序章至第一卷・共 2 卷・7 次抉择",
    date: "2026年9月1日 至 2026年9月19日",
    kicker: "山河未归・回忆录",
    meta: "序章至第一卷・共 2 卷",
    volumes: [
      {
        ordinal: "序章",
        name: "山门灯未灭",
        prose: [
          "离山第十一年的冬天，一封亡师的亲笔信送到渡口。信纸泛黄，墨色却像昨夜才写成。",
          "裴渡在雪里走了三日，才看见山门。门是关着的，檐下那盏灯却还亮着，像有人每夜都来添油。",
          "送炭的老人说，山上早就没人了。可每个月初一，炭篓放在石阶上，第二天总是空的。",
        ],
        closing: "灯还亮着，就还有人在等。",
      },
      {
        ordinal: "第一卷",
        name: "白芦渡",
        prose: [
          "白芦渡的夜船不点灯。船夫收了银子，只问一句：“客官要去的地方，还有名字吗？”",
          "裴渡在船舱里找到半张药方，笔迹与师父的信一模一样。药名被人用刀刮去，只留下一个“归”字。",
          "他把药方收进袖里。船靠岸时，芦苇深处有人吹了一声短哨，又很快没了声息。",
        ],
        closing: "被抹去的名字，总会在别处留下痕迹。",
      },
    ],
    epilogue: "尾声",
    finalLine: "山门重新开了。檐下的灯，这一次是他亲手点的。",
    end: "（全书完）",
  },
  ja: {
    title: "帰山",
    summary: "序章から第一巻・全 2 巻・選択 7 回",
    date: "2026年9月1日 から 2026年9月19日",
    kicker: "山河未帰・回想録",
    meta: "序章から第一巻・全 2 巻",
    volumes: [
      {
        ordinal: "序章",
        name: "山門の灯は消えず",
        prose: [
          "山を離れて十一年目の冬、亡き師の直筆の手紙が渡し場に届いた。紙は黄ばんでいるのに、墨の色はまるで昨夜書かれたばかりのようだった。",
          "裴渡は雪の中を三日歩き、ようやく山門を目にした。門は閉ざされていたが、軒下の灯はまだともっていた。毎晩誰かが油を足しに来ているかのように。",
          "炭を届ける老人は、山にはとうに誰もいないと言う。それでも毎月一日、石段に置いた炭かごは、翌日には決まって空になっていた。",
        ],
        closing: "灯がともる限り、待つ人はまだいる。",
      },
      {
        ordinal: "第一巻",
        name: "白蘆の渡し",
        prose: [
          "白蘆の渡しの夜舟は灯をともさない。船頭は銀を受け取ると、ひとつだけ尋ねた。「お客さんの行き先には、まだ名前がありますか」",
          "裴渡は船室で半分に破れた処方箋を見つけた。筆跡は師の手紙とまったく同じだった。薬の名は刃物で削り取られ、「帰」の一字だけが残っていた。",
          "彼は処方箋を袖にしまった。舟が岸に着いたとき、葦の奥で誰かが短く口笛を吹き、すぐにまた静まり返った。",
        ],
        closing: "消された名は、必ずどこかに痕跡を残す。",
      },
    ],
    epilogue: "終章",
    finalLine: "山門は再び開かれた。軒下の灯は、今度は彼自身の手でともしたものだった。",
    end: "（完）",
  },
};

export default function Book3DDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-4xl min-w-0 overflow-hidden rounded-[4px]">
      <Book3D locale={locale} title={t.title} summary={t.summary} date={t.date} className="h-[40rem]">
        <section className="novella-title-page">
          <div className="novella-title-kicker">{t.kicker}</div>
          <h2 className="novella-title">{t.title}</h2>
          <div className="novella-ornament" aria-hidden="true">◆</div>
          <p className="novella-title-meta">{t.meta}</p>
          <p className="novella-title-date">{t.date}</p>
        </section>
        {t.volumes.map((volume) => (
          <section key={volume.name} className="novella-break">
            <h3 className="novella-chapter-heading">
              <span className="novella-chapter-ordinal">{volume.ordinal}</span>
              {volume.name}
            </h3>
            {volume.prose.map((paragraph) => (
              <p key={paragraph} className="novella-prose">{paragraph}</p>
            ))}
            <blockquote className="novella-closing">{volume.closing}</blockquote>
          </section>
        ))}
        <section className="novella-break">
          <h3 className="novella-chapter-heading">
            <span className="novella-chapter-ordinal">{t.epilogue}</span>
            {t.title}
          </h3>
          <p className="novella-final-line">{t.finalLine}</p>
          <p className="novella-end-mark" data-book-end>{t.end}</p>
        </section>
      </Book3D>
    </div>
  );
}
