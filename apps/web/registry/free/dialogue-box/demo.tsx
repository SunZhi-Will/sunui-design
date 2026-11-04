"use client";

import { useState } from "react";

import { DialogueBox, type DialogueChoice } from "./dialogue-box";

type Line = { id: string; speaker?: string; text: string; choices?: DialogueChoice[]; next?: string[] };

// 原創短篇：雨夜渡口，一段對話接一組關鍵選擇
const script: Line[] = [
  { id: "l1", text: "夜雨落在寒水渡的篷頂上，一聲一聲，像有人在數。" },
  { id: "l2", speaker: "溫鶯", text: "客官，這麼晚了還要過河？最後一班船，半個時辰前就走了。" },
  { id: "l3", text: "她把燈往你這邊推了推。燈影裡，她的袖口沾著一點未乾的墨。" },
  {
    id: "l4",
    speaker: "溫鶯",
    text: "你若真急，我可以撐你過去。只是，你得告訴我：對岸有誰在等你？",
    choices: [
      { id: "c1", text: "「一位故人。他欠我一句話。」" },
      { id: "c2", text: "「沒有人等我。我是去追人的。」", requirement: "膽識" },
      { id: "c3", text: "「你袖口的墨，是從帳房沾來的吧？」", requirement: "洞察", locked: true, lockedHint: "洞察達到「明」之後可選" },
      { id: "c4", text: "「算了，我等天亮。」", seen: true },
    ],
    next: ["l5a", "l5b", "l5a", "l5c"],
  },
  { id: "l5a", speaker: "溫鶯", text: "故人啊。那就上船吧，雨大，別讓人家等太久。" },
  { id: "l5b", speaker: "溫鶯", text: "追人？那你可得坐穩了。這條河，夜裡不好走。" },
  { id: "l5c", text: "她沒有再說什麼，只是把燈芯撥亮了些，留給你一盞。" },
];

const byId = (id: string) => script.findIndex((l) => l.id === id);

export default function DialogueBoxDemo() {
  const [index, setIndex] = useState(0);
  const [read, setRead] = useState<string[]>([]);
  const [log, setLog] = useState<Line[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const line = script[index];

  const goTo = (next: number) => {
    setLog((l) => [...l, line]);
    setIndex(next);
  };

  return (
    <div
      className="relative h-[28rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px]"
      style={{
        background:
          "radial-gradient(ellipse at 70% 25%, rgb(231 196 137 / 0.18), transparent 35%), linear-gradient(180deg, #1a1d24 0%, #101318 55%, #08090c 100%)",
      }}
    >
      {/* 場景：遠處燈火與水面 */}
      <svg aria-hidden="true" className="absolute inset-x-0 top-[38%] h-24 w-full opacity-60" viewBox="0 0 400 60" preserveAspectRatio="none">
        <path d="M0 40 Q100 30 200 38 T400 34 V60 H0Z" fill="#0c0f14" />
        <path d="M0 44 Q120 40 240 46 T400 42" stroke="rgb(201 160 99 / 0.25)" fill="none" />
        <circle cx="280" cy="22" r="3" fill="#e7c489" />
      </svg>

      <DialogueBox
        speaker={line.speaker}
        text={line.text}
        lineId={line.id}
        choices={line.choices}
        read={read.includes(line.id)}
        onLineRead={(id) => setRead((r) => (r.includes(id) ? r : [...r, id]))}
        hidden={logOpen}
        onOpenLog={() => setLogOpen(true)}
        onAdvance={() => {
          if (line.choices) return;
          goTo(line.id.startsWith("l5") ? 0 : index + 1);
        }}
        onChoose={(i) => goTo(byId(line.next![i]))}
      />

      {logOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="劇情回顧"
          className="absolute inset-0 z-40 flex flex-col gap-3 overflow-y-auto p-6"
          style={{ background: "rgba(6, 7, 10, 0.9)", color: "#eae4d6", fontFamily: '"Noto Serif TC", "Songti TC", serif' }}
          onKeyDown={(e) => e.key === "Escape" && setLogOpen(false)}
        >
          <button
            type="button"
            autoFocus
            onClick={() => setLogOpen(false)}
            className="self-end rounded-[3px] border px-4 py-1.5 text-sm tracking-[0.12em] outline-none hover:text-[#e7c489] focus-visible:text-[#e7c489]"
            style={{ borderColor: "rgba(234, 228, 214, 0.14)" }}
          >
            返回
          </button>
          {log.length === 0 && <p style={{ color: "#837d6f" }}>還沒有讀過的台詞。</p>}
          {log.map((l, i) => (
            <p key={i} className="max-w-[34em] text-[15px] leading-[1.8]">
              {l.speaker && <span className="mr-3 tracking-[0.2em]" style={{ color: "#c9a063" }}>{l.speaker}</span>}
              {l.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
