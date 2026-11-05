"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { DialogueBox, type DialogueChoice } from "./dialogue-box";

type Line = { id: string; speaker?: string; text: string; choices?: DialogueChoice[]; next?: string[] };

// 取 demo 雨夜渡口的短版：兩句對話接一組選擇
const scripts: { en: Line[]; "zh-TW": Line[]; "zh-CN": Line[]; ja: Line[] } = {
  en: [
    { id: "l1", speaker: "Wen Ying", text: "Crossing the river this late?" },
    {
      id: "l2",
      speaker: "Wen Ying",
      text: "Who waits for you across the water?",
      choices: [
        { id: "c1", text: "“An old friend.”" },
        { id: "c2", text: "“I'm going after someone.”", requirement: "Courage" },
      ],
      next: ["l3a", "l3b"],
    },
    { id: "l3a", speaker: "Wen Ying", text: "Then climb aboard, don't keep him waiting." },
    { id: "l3b", speaker: "Wen Ying", text: "Then hold on tight." },
  ],
  "zh-TW": [
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
  ],
  "zh-CN": [
    { id: "l1", speaker: "温莺", text: "客官，这么晚了还要过河？" },
    {
      id: "l2",
      speaker: "温莺",
      text: "对岸有谁在等你？",
      choices: [
        { id: "c1", text: "“一位故人。”" },
        { id: "c2", text: "“我是去追人的。”", requirement: "胆识" },
      ],
      next: ["l3a", "l3b"],
    },
    { id: "l3a", speaker: "温莺", text: "那就上船吧，别让人家等太久。" },
    { id: "l3b", speaker: "温莺", text: "那你可得坐稳了。" },
  ],
  ja: [
    { id: "l1", speaker: "温鶯", text: "こんな夜更けに川を渡るのかい？" },
    {
      id: "l2",
      speaker: "温鶯",
      text: "向こう岸で誰が待ってるんだい？",
      choices: [
        { id: "c1", text: "「古い友だ。」" },
        { id: "c2", text: "「人を追っているんだ。」", requirement: "胆力" },
      ],
      next: ["l3a", "l3b"],
    },
    { id: "l3a", speaker: "温鶯", text: "なら乗りな。待たせちゃいけないよ。" },
    { id: "l3b", speaker: "温鶯", text: "なら、しっかりつかまってな。" },
  ],
};

/** 型錄卡片：一段逐字打出的對話，點一下推進，最後做一次選擇。 */
export default function DialogueBoxCard() {
  const locale = useDemoLocale();
  const script = useDemoText(scripts);
  const [index, setIndex] = useState(0);
  const [read, setRead] = useState<string[]>([]);
  const line = script[index];

  return (
    <div
      className="relative mx-auto h-56 w-72 overflow-hidden rounded-[4px]"
      style={{ background: "linear-gradient(180deg, #1a1d24 0%, #101318 55%, #08090c 100%)" }}
    >
      <DialogueBox
        locale={locale}
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
