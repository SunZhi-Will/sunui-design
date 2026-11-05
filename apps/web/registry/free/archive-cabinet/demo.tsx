"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ArchiveCabinet, type ArchiveCabinetItem } from "./archive-cabinet";

const slots: Pick<ArchiveCabinetItem, "slot" | "id" | "status">[] = [
  { slot: 1, id: "f1" },
  { slot: 2, id: "f2" },
  { slot: 3, id: "f3", status: "paused" },
  { slot: 6, id: "f4" },
];

// 檔案內容依 slots 順序：[標籤, 完整名稱, 日期]
const copy = {
  en: {
    game: "Death's Blessing",
    room: "Mission archive",
    filed: (n: number) => `${n} filed`,
    files: [
      ["Crossing", "Death's Blessing: Crossing", "Sep 1 to Sep 19, 2026"],
      ["The End", "Death's Blessing: The End", "Sep 22 to Oct 3, 2026"],
      ["Unfinished", "Death's Blessing: To Be Continued", "Oct 8, 2026"],
      ["Red Thread", "Death's Blessing: Red Thread", "Oct 12 to Oct 30, 2026"],
    ],
    opened: (t: string) => `Pulled out "${t}"`,
    idle: "Finish a run, keep a file. Click a folder to pull it out and open it.",
  },
  "zh-TW": {
    game: "死神的祝福",
    room: "任務檔案室",
    filed: (n: number) => `已歸檔 ${n} 份`,
    files: [
      ["渡河", "死神的祝福・渡河", "2026年9月1日 至 2026年9月19日"],
      ["終", "死神的祝福・終", "2026年9月22日 至 2026年10月3日"],
      ["未完待續", "死神的祝福・未完待續", "2026年10月8日"],
      ["紅線", "死神的祝福・紅線", "2026年10月12日 至 2026年10月30日"],
    ],
    opened: (t: string) => `已抽出《${t}》`,
    idle: "看完一次，留下一份。點一下檔案就能抽出來翻開",
  },
  "zh-CN": {
    game: "死神的祝福",
    room: "任务档案室",
    filed: (n: number) => `已归档 ${n} 份`,
    files: [
      ["渡河", "死神的祝福・渡河", "2026年9月1日 至 2026年9月19日"],
      ["终", "死神的祝福・终", "2026年9月22日 至 2026年10月3日"],
      ["未完待续", "死神的祝福・未完待续", "2026年10月8日"],
      ["红线", "死神的祝福・红线", "2026年10月12日 至 2026年10月30日"],
    ],
    opened: (t: string) => `已抽出《${t}》`,
    idle: "看完一次，留下一份。点一下档案就能抽出来翻开",
  },
  ja: {
    game: "死神の祝福",
    room: "任務資料室",
    filed: (n: number) => `${n}件を保管`,
    files: [
      ["渡河", "死神の祝福・渡河", "2026年9月1日〜2026年9月19日"],
      ["終", "死神の祝福・終", "2026年9月22日〜2026年10月3日"],
      ["つづく", "死神の祝福・つづく", "2026年10月8日"],
      ["赤い糸", "死神の祝福・赤い糸", "2026年10月12日〜2026年10月30日"],
    ],
    opened: (t: string) => `『${t}』を取り出しました`,
    idle: "一度見終えたら、一部残す。ファイルをクリックすると取り出して開けます",
  },
};

export default function ArchiveCabinetDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const files: ArchiveCabinetItem[] = slots.map((s, i) => {
    const [label, title, meta] = t.files[i];
    return { ...s, label, title, meta };
  });
  const [previewId, setPreviewId] = useState<string | undefined>();
  const [openedId, setOpenedId] = useState<string | undefined>();
  const preview = files.find((f) => f.id === previewId);
  const opened = files.find((f) => f.id === openedId)?.title;

  return (
    <section className="w-full max-w-3xl min-w-0 rounded-[2px] bg-[radial-gradient(ellipse_at_50%_34%,#18223a_0%,#0a0e18_74%)] px-4 py-4 text-[#d7deeb] sm:px-8">
      <header className="flex items-end justify-between gap-4 border-b border-[rgba(160,178,209,0.22)] pb-3">
        <div className="min-w-0">
          <div className="text-xs tracking-[0.14em] text-[#8fa3c6]">{t.game}</div>
          <h2 className="mt-1 text-xl tracking-[0.1em]">{t.room}</h2>
        </div>
        <span className="shrink-0 text-sm tracking-[0.07em] text-[#8fa3c6]">{t.filed(files.length)}</span>
      </header>

      <div className="my-4 rounded-[2px] border border-[rgba(143,157,182,0.42)] bg-[#0f131c] p-2 shadow-[0_1.2rem_2.5rem_rgba(0,0,0,0.6)] sm:p-3.5">
        <ArchiveCabinet
          className="h-64 sm:h-80"
          locale={locale}
          items={files}
          onPick={(_, item) => setOpenedId(item?.id)}
          onPreview={(_, item) => setPreviewId(item?.id)}
        />
      </div>

      {/* 指到哪一份，這裡就讀出完整名稱 */}
      <footer className="flex min-h-10 min-w-0 flex-col justify-center gap-0.5" aria-hidden="true">
        {preview ? (
          <>
            <span className="truncate tracking-[0.06em] text-[#ccd7e9]">{preview.title}</span>
            <span className="truncate text-xs tracking-[0.08em] text-[rgba(158,177,209,0.8)]">{preview.meta}</span>
          </>
        ) : (
          <span className="text-sm tracking-[0.06em] text-[rgba(215,222,235,0.6)]">{opened ? t.opened(opened) : t.idle}</span>
        )}
      </footer>
    </section>
  );
}
