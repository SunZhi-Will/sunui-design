"use client";

import { RecordsThreadBoard, type RecordsAchievement, type RecordsEnding } from "./records-thread-board";

const endings: RecordsEnding[] = [
  { id: "april", title: "四月二十六日", description: "原著結局。任的最後一天。", seen: true },
  { id: "ferry", title: "渡口無人", description: "沒有人來接她，船自己開走了。", seen: false },
];

const achievements: RecordsAchievement[] = [
  { id: "finished_once", title: "走到最後一天", description: "看完全篇。", hint: "把故事看完。", done: true, icon: "M20 4c-7 0-13 5-14 12l-2 4M6 16l9-9M9 13h6M12 10h5" },
  { id: "shelved_book", title: "留下一份", description: "把回憶錄歸檔。", hint: "看完結局後，留下那份檔案。", done: true, icon: "M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14" },
  { id: "finished_twice", title: "再送一次", description: "第二次看完全篇。", hint: "再從頭看一次。", done: true, icon: "M5 12a7 7 0 0 1 12-5l2 2M19 5v4h-4M19 12a7 7 0 0 1-12 5l-2-2M5 19v-4h4" },
  { id: "other_question", title: "換個問法", description: "兩輪用不同的問題先問守。", hint: "換一個問題，先問守。", done: false, icon: "M4 5h16v11H10l-4 4v-4H4zM12 13h.01M10 8.5a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.3" },
  { id: "other_memory", title: "換一段記憶", description: "兩輪從不同的記憶讀起。", hint: "換一段記憶，先讀。", done: true, icon: "M3 13l7-1 3-7 2 7 6 2-7 1-2 5-3-6z" },
  {
    id: "all_memories",
    title: "每段都先讀過",
    description: "四段記憶都曾第一個讀。",
    hint: "讓每一段記憶都排一次第一。",
    done: false,
    icon: "M12 3a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM12 13a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM3 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0zM13 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0z",
  },
];

export default function RecordsThreadBoardDemo() {
  return (
    <div className="w-full max-w-3xl min-w-0 bg-[radial-gradient(ellipse_at_50%_30%,#18223a_0%,#0a0e18_74%)] p-3 sm:p-6">
      <RecordsThreadBoard endings={endings} achievements={achievements} />
    </div>
  );
}
