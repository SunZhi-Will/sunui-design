"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { RecordsThreadBoard, type RecordsAchievement, type RecordsEnding } from "./records-thread-board";

// 結局與成就的固定資料；文字依語言另外放
const endingMeta = [
  { id: "april", seen: true },
  { id: "ferry", seen: false },
];

const achievementMeta = [
  { id: "finished_once", done: true, icon: "M20 4c-7 0-13 5-14 12l-2 4M6 16l9-9M9 13h6M12 10h5" },
  { id: "shelved_book", done: true, icon: "M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14" },
  { id: "finished_twice", done: true, icon: "M5 12a7 7 0 0 1 12-5l2 2M19 5v4h-4M19 12a7 7 0 0 1-12 5l-2-2M5 19v-4h4" },
  { id: "other_question", done: false, icon: "M4 5h16v11H10l-4 4v-4H4zM12 13h.01M10 8.5a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.3" },
  { id: "other_memory", done: true, icon: "M3 13l7-1 3-7 2 7 6 2-7 1-2 5-3-6z" },
  {
    id: "all_memories",
    done: false,
    icon: "M12 3a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM12 13a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM3 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0zM13 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0z",
  },
];

type Text = { endings: [string, string][]; achievements: [string, string, string][] };

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Text> = {
  en: {
    endings: [
      ["April 26", "The original ending. Ren's last day."],
      ["No One at the Ferry", "No one came for her, and the boat left on its own."],
    ],
    achievements: [
      ["To the Last Day", "Finish the whole story.", "See the story through."],
      ["Keep a Copy", "File the memoir.", "After the ending, keep that file."],
      ["See Her Off Again", "Finish the story a second time.", "Read it again from the start."],
      ["Ask It Differently", "Open with a different question for Shou in two playthroughs.", "Ask Shou a different question first."],
      ["Another Memory", "Start from a different memory in two playthroughs.", "Read a different memory first."],
      ["Every Memory First", "Read each of the four memories first at least once.", "Let every memory take a turn at the front."],
    ],
  },
  "zh-TW": {
    endings: [
      ["四月二十六日", "原著結局。任的最後一天。"],
      ["渡口無人", "沒有人來接她，船自己開走了。"],
    ],
    achievements: [
      ["走到最後一天", "看完全篇。", "把故事看完。"],
      ["留下一份", "把回憶錄歸檔。", "看完結局後，留下那份檔案。"],
      ["再送一次", "第二次看完全篇。", "再從頭看一次。"],
      ["換個問法", "兩輪用不同的問題先問守。", "換一個問題，先問守。"],
      ["換一段記憶", "兩輪從不同的記憶讀起。", "換一段記憶，先讀。"],
      ["每段都先讀過", "四段記憶都曾第一個讀。", "讓每一段記憶都排一次第一。"],
    ],
  },
  "zh-CN": {
    endings: [
      ["四月二十六日", "原著结局。任的最后一天。"],
      ["渡口无人", "没有人来接她，船自己开走了。"],
    ],
    achievements: [
      ["走到最后一天", "看完全篇。", "把故事看完。"],
      ["留下一份", "把回忆录归档。", "看完结局后，留下那份档案。"],
      ["再送一次", "第二次看完全篇。", "再从头看一次。"],
      ["换个问法", "两轮用不同的问题先问守。", "换一个问题，先问守。"],
      ["换一段记忆", "两轮从不同的记忆读起。", "换一段记忆，先读。"],
      ["每段都先读过", "四段记忆都曾第一个读。", "让每一段记忆都排一次第一。"],
    ],
  },
  ja: {
    endings: [
      ["四月二十六日", "原作の結末。任の最後の一日。"],
      ["誰もいない渡し場", "誰も迎えに来ず、舟はひとりでに出ていった。"],
    ],
    achievements: [
      ["最後の一日まで", "物語を最後まで読む。", "物語を読み終える。"],
      ["一部を残す", "回想録を保管する。", "結末を見たあと、そのファイルを残す。"],
      ["もう一度見送る", "2回目の完読。", "もう一度最初から読む。"],
      ["別の聞き方", "2周で、守への最初の質問を変える。", "別の質問を、先に守にする。"],
      ["別の記憶", "2周で、読み始める記憶を変える。", "別の記憶から先に読む。"],
      ["どの記憶も最初に", "4つの記憶すべてを、一度は最初に読む。", "どの記憶にも一度は先頭を任せる。"],
    ],
  },
};

export default function RecordsThreadBoardDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const endings: RecordsEnding[] = endingMeta.map((m, i) => ({ ...m, title: t.endings[i][0], description: t.endings[i][1] }));
  const achievements: RecordsAchievement[] = achievementMeta.map((m, i) => ({
    ...m,
    title: t.achievements[i][0],
    description: t.achievements[i][1],
    hint: t.achievements[i][2],
  }));
  return (
    <div className="w-full max-w-3xl min-w-0 bg-[radial-gradient(ellipse_at_50%_30%,#18223a_0%,#0a0e18_74%)] p-3 sm:p-6">
      <RecordsThreadBoard endings={endings} achievements={achievements} locale={locale} />
    </div>
  );
}
