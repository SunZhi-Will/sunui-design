"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { DialogueBox, type DialogueChoice } from "./dialogue-box";

type Line = { id: string; speaker?: string; text: string; choices?: DialogueChoice[]; next?: string[] };

// 原創短篇：雨夜渡口，一段對話接一組關鍵選擇
const scripts: { en: Line[]; "zh-TW": Line[]; "zh-CN": Line[]; ja: Line[] } = {
  en: [
    { id: "l1", text: "Night rain falls on the awning at Cold Water Ferry, drop by drop, as if someone were counting." },
    { id: "l2", speaker: "Wen Ying", text: "Crossing the river this late, traveler? The last boat left an hour ago." },
    {
      id: "l3",
      speaker: "Wen Ying",
      text: "If you're truly in a hurry, I can pole you across. But first, tell me: who is waiting for you on the far shore?",
      choices: [
        { id: "c1", text: "“An old friend. He owes me a word.”" },
        { id: "c2", text: "“No one is waiting. I'm going after someone.”", requirement: "Courage" },
        { id: "c3", text: "“That ink on your cuff, you got it in the counting house, didn't you?”", requirement: "Insight", locked: true, lockedHint: "Available once Insight reaches “Clear”" },
      ],
      next: ["l4a", "l4b", "l4a"],
    },
    { id: "l4a", speaker: "Wen Ying", text: "An old friend, then. Climb aboard. The rain is heavy, don't keep him waiting." },
    { id: "l4b", speaker: "Wen Ying", text: "Going after someone? Then hold on tight. This river is hard going at night." },
  ],
  "zh-TW": [
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
  ],
  "zh-CN": [
    { id: "l1", text: "夜雨落在寒水渡的篷顶上，一声一声，像有人在数。" },
    { id: "l2", speaker: "温莺", text: "客官，这么晚了还要过河？最后一班船，半个时辰前就走了。" },
    {
      id: "l3",
      speaker: "温莺",
      text: "你若真急，我可以撑你过去。只是，你得告诉我：对岸有谁在等你？",
      choices: [
        { id: "c1", text: "“一位故人。他欠我一句话。”" },
        { id: "c2", text: "“没有人等我。我是去追人的。”", requirement: "胆识" },
        { id: "c3", text: "“你袖口的墨，是从账房沾来的吧？”", requirement: "洞察", locked: true, lockedHint: "洞察达到“明”之后可选" },
      ],
      next: ["l4a", "l4b", "l4a"],
    },
    { id: "l4a", speaker: "温莺", text: "故人啊。那就上船吧，雨大，别让人家等太久。" },
    { id: "l4b", speaker: "温莺", text: "追人？那你可得坐稳了。这条河，夜里不好走。" },
  ],
  ja: [
    { id: "l1", text: "夜の雨が寒水渡の苫屋根を打つ。ぽつり、ぽつりと、誰かが数えているように。" },
    { id: "l2", speaker: "温鶯", text: "お客さん、こんな夜更けに川を渡るのかい？最後の舟なら、半刻前に出ちまったよ。" },
    {
      id: "l3",
      speaker: "温鶯",
      text: "本当に急ぐなら、あたしが棹をさして渡してあげる。ただ、教えておくれ。向こう岸で誰があんたを待ってるんだい？",
      choices: [
        { id: "c1", text: "「古い友だ。あいつには一言、貸しがある。」" },
        { id: "c2", text: "「誰も待っていない。人を追っているんだ。」", requirement: "胆力" },
        { id: "c3", text: "「その袖口の墨、帳場で付いたものだろう？」", requirement: "洞察", locked: true, lockedHint: "洞察が「明」に達すると選べます" },
      ],
      next: ["l4a", "l4b", "l4a"],
    },
    { id: "l4a", speaker: "温鶯", text: "古い友、ねえ。なら乗りな。雨がひどいんだ、あんまり待たせちゃいけないよ。" },
    { id: "l4b", speaker: "温鶯", text: "人を追う？なら、しっかりつかまってな。この川は、夜は難儀だよ。" },
  ],
};

export default function DialogueBoxDemo() {
  const locale = useDemoLocale();
  const script = useDemoText(scripts);
  const [index, setIndex] = useState(0);
  const [read, setRead] = useState<string[]>([]);
  const line = script[index];

  return (
    <div
      className="relative h-[26rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px]"
      style={{ background: "radial-gradient(ellipse at 70% 25%, rgb(231 196 137 / 0.18), transparent 35%), linear-gradient(180deg, #1a1d24 0%, #101318 55%, #08090c 100%)" }}
    >
      <DialogueBox
        locale={locale}
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
