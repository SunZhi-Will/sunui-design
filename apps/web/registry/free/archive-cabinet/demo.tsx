"use client";

import { useState } from "react";

import { ArchiveCabinet, type ArchiveCabinetItem } from "./archive-cabinet";

const files: ArchiveCabinetItem[] = [
  { slot: 1, id: "f1", label: "渡河", title: "死神的祝福・渡河", meta: "2026年9月1日 至 2026年9月19日" },
  { slot: 2, id: "f2", label: "終", title: "死神的祝福・終", meta: "2026年9月22日 至 2026年10月3日" },
  { slot: 3, id: "f3", label: "未完待續", title: "死神的祝福・未完待續", meta: "2026年10月8日", status: "paused" },
  { slot: 6, id: "f4", label: "紅線", title: "死神的祝福・紅線", meta: "2026年10月12日 至 2026年10月30日" },
];

export default function ArchiveCabinetDemo() {
  const [preview, setPreview] = useState<ArchiveCabinetItem | undefined>();
  const [opened, setOpened] = useState<string | undefined>();

  return (
    <section className="w-full max-w-3xl min-w-0 rounded-[2px] bg-[radial-gradient(ellipse_at_50%_34%,#18223a_0%,#0a0e18_74%)] px-4 py-4 text-[#d7deeb] sm:px-8">
      <header className="flex items-end justify-between gap-4 border-b border-[rgba(160,178,209,0.22)] pb-3">
        <div className="min-w-0">
          <div className="text-xs tracking-[0.14em] text-[#8fa3c6]">死神的祝福</div>
          <h2 className="mt-1 text-xl tracking-[0.1em]">任務檔案室</h2>
        </div>
        <span className="shrink-0 text-sm tracking-[0.07em] text-[#8fa3c6]">已歸檔 {files.length} 份</span>
      </header>

      <div className="my-4 rounded-[2px] border border-[rgba(143,157,182,0.42)] bg-[#0f131c] p-2 shadow-[0_1.2rem_2.5rem_rgba(0,0,0,0.6)] sm:p-3.5">
        <ArchiveCabinet
          className="h-64 sm:h-80"
          items={files}
          onPick={(_, item) => setOpened(item?.title)}
          onPreview={(_, item) => setPreview(item)}
          labels={{ cabinet: "回憶錄歸檔櫃", folderTitle: "任務資料單", stamp: "失敗", slot: (n) => `第 ${n} 格`, empty: "空位" }}
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
          <span className="text-sm tracking-[0.06em] text-[rgba(215,222,235,0.6)]">
            {opened ? `已抽出《${opened}》` : "看完一次，留下一份。點一下檔案就能抽出來翻開"}
          </span>
        )}
      </footer>
    </section>
  );
}
