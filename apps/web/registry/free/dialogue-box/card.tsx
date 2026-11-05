"use client";

import { useState } from "react";

import { DialogueBox, type DialogueChoice } from "./dialogue-box";

type Line = { id: string; speaker?: string; text: string; choices?: DialogueChoice[]; next?: string[] };

// 取 demo 雨夜渡口的短版：兩句對話接一組選擇
const script: Line[] = [
  { id: "l1", speaker: "溫鶯", text: "客官，這麼晚了還要過河？" },
  {
    id: "l2",
    speaker: "溫鶯",
    text: "對岸有誰在等你？",
    choices: [
      { id: "c1", text: "「一位故人。」" },
      { id: "c2", text: "「我是去追人的。」", requirement: "膽識" },
    ],
    next: ["l3a", "l3b"],
  },
  { id: "l3a", speaker: "溫鶯", text: "那就上船吧，別讓人家等太久。" },
  { id: "l3b", speaker: "溫鶯", text: "那你可得坐穩了。" },
];

/** 型錄卡片：一段逐字打出的對話，點一下推進，最後做一次選擇。 */
export default function DialogueBoxCard() {
  const [index, setIndex] = useState(0);
  const [read, setRead] = useState<string[]>([]);
  const line = script[index];

  return (
    <div
      className="relative mx-auto h-56 w-72 overflow-hidden rounded-[4px]"
      style={{ background: "linear-gradient(180deg, #1a1d24 0%, #101318 55%, #08090c 100%)" }}
    >
      <DialogueBox
        speaker={line.speaker}
        text={line.text}
        lineId={line.id}
        choices={line.choices}
        read={read.includes(line.id)}
        onLineRead={(id) => setRead((r) => (r.includes(id) ? r : [...r, id]))}
        onAdvance={() => !line.choices && setIndex(line.id.startsWith("l3") ? 0 : index + 1)}
        onChoose={(i) => setIndex(script.findIndex((l) => l.id === line.next![i]))}
      />
    </div>
  );
}
