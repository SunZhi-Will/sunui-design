"use client";

import { useState } from "react";

import { DialogueBox, type DialogueChoice } from "./dialogue-box";

type Line = { id: string; speaker?: string; text: string; choices?: DialogueChoice[]; next?: string[] };

// 原創短篇：雨夜渡口，一段對話接一組關鍵選擇
const script: Line[] = [
  { id: "l1", text: "夜雨落在寒水渡的篷頂上，一聲一聲，像有人在數。" },
  { id: "l2", speaker: "溫鶯", text: "客官，這麼晚了還要過河？最後一班船，半個時辰前就走了。" },
  {
    id: "l3",
    speaker: "溫鶯",
    text: "你若真急，我可以撐你過去。只是，你得告訴我：對岸有誰在等你？",
    choices: [
      { id: "c1", text: "「一位故人。他欠我一句話。」" },
      { id: "c2", text: "「沒有人等我。我是去追人的。」", requirement: "膽識" },
      { id: "c3", text: "「你袖口的墨，是從帳房沾來的吧？」", requirement: "洞察", locked: true, lockedHint: "洞察達到「明」之後可選" },
    ],
    next: ["l4a", "l4b", "l4a"],
  },
  { id: "l4a", speaker: "溫鶯", text: "故人啊。那就上船吧，雨大，別讓人家等太久。" },
  { id: "l4b", speaker: "溫鶯", text: "追人？那你可得坐穩了。這條河，夜裡不好走。" },
];

export default function DialogueBoxDemo() {
  const [index, setIndex] = useState(0);
  const [read, setRead] = useState<string[]>([]);
  const line = script[index];

  return (
    <div
      className="relative h-[26rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px]"
      style={{ background: "radial-gradient(ellipse at 70% 25%, rgb(231 196 137 / 0.18), transparent 35%), linear-gradient(180deg, #1a1d24 0%, #101318 55%, #08090c 100%)" }}
    >
      <DialogueBox
        speaker={line.speaker}
        text={line.text}
        lineId={line.id}
        choices={line.choices}
        read={read.includes(line.id)}
        onLineRead={(id) => setRead((r) => (r.includes(id) ? r : [...r, id]))}
        onAdvance={() => !line.choices && setIndex(line.id.startsWith("l4") ? 0 : index + 1)}
        onChoose={(i) => setIndex(script.findIndex((l) => l.id === line.next![i]))}
      />
    </div>
  );
}
