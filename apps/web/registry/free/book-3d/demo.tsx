"use client";

import { Book3D } from "./book-3d";

// 原創短篇：一輪旅程走完後收進書裡的回憶錄
const volumes = [
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
];

export default function Book3DDemo() {
  return (
    <div className="w-full max-w-4xl min-w-0 overflow-hidden rounded-[4px]">
      <Book3D
        title="歸山"
        summary="序章至第一卷・共 2 卷・7 次抉擇"
        date="2026年9月1日 至 2026年9月19日"
        className="h-[40rem]"
      >
        <section className="novella-title-page">
          <div className="novella-title-kicker">山河未歸・回憶錄</div>
          <h2 className="novella-title">歸山</h2>
          <div className="novella-ornament" aria-hidden="true">◆</div>
          <p className="novella-title-meta">序章至第一卷・共 2 卷</p>
          <p className="novella-title-date">2026年9月1日 至 2026年9月19日</p>
        </section>
        {volumes.map((volume) => (
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
            <span className="novella-chapter-ordinal">尾聲</span>
            歸山
          </h3>
          <p className="novella-final-line">山門重新開了。簷下的燈，這一次是他親手點的。</p>
          <p className="novella-end-mark" data-book-end>（全書完）</p>
        </section>
      </Book3D>
    </div>
  );
}
