"use client";

import { useState } from "react";

import { Bookshelf3D, type Bookshelf3DItem } from "./bookshelf-3d";

const books: Bookshelf3DItem[] = [
  { slot: 1, id: "b1", label: "歸山", title: "山河未歸・歸山", meta: "序章至終卷・共 6 卷・2026年9月1日 至 2026年9月19日" },
  { slot: 2, id: "b2", label: "燈未滅", title: "山河未歸・燈未滅", meta: "序章至第四卷・共 5 卷・2026年9月22日 至 2026年10月3日" },
  { slot: 4, id: "b3", label: "未完待續", title: "山河未歸・未完待續", meta: "序章至第二卷・共 3 卷・2026年10月8日", status: "paused" },
  { slot: 5, id: "b4", label: "孤舟夜渡", title: "山河未歸・孤舟夜渡", meta: "序章至終卷・共 6 卷・2026年10月12日 至 2026年10月30日" },
];

export default function Bookshelf3DDemo() {
  const [preview, setPreview] = useState<Bookshelf3DItem | undefined>();
  const [opened, setOpened] = useState<string | undefined>();

  return (
    <section className="w-full max-w-3xl min-w-0 rounded-[3px] bg-[#070605] px-4 py-4 text-[#f1e7d1] sm:px-8">
      <header className="flex items-end justify-between gap-4 border-b border-[rgba(224,194,145,0.22)] pb-3">
        <div className="min-w-0">
          <div className="text-xs tracking-[0.34em] text-[#d6b57f]">山河未歸</div>
          <h2 className="mt-1 text-xl tracking-[0.24em]">回憶錄書庫</h2>
        </div>
        <span className="shrink-0 text-sm tracking-[0.18em] text-[#d6b57f]">已收錄 {books.length} 本</span>
      </header>

      <div className="my-4 rounded-[3px] border-[0.5rem] border-[#2a1c12] bg-[linear-gradient(90deg,rgba(0,0,0,0.55),transparent_8%,transparent_92%,rgba(0,0,0,0.55)),linear-gradient(180deg,#1a120c,#110b07)] px-2 shadow-[inset_0_0_2.5rem_rgba(0,0,0,0.8),0_1.2rem_2.5rem_rgba(0,0,0,0.6)] sm:px-5">
        <Bookshelf3D
          items={books}
          spineTitle="山河未歸"
          onPick={(_, item) => setOpened(item?.title)}
          onPreview={(_, item) => setPreview(item)}
          labels={{ shelf: "回憶錄書架", slot: (n) => `第 ${n} 格`, empty: "空位" }}
        />
      </div>

      {/* 書脊很窄放不下完整書名：指到哪一本，這裡就讀出那一本 */}
      <footer className="flex min-h-10 min-w-0 flex-col justify-center gap-0.5" aria-hidden="true">
        {preview ? (
          <>
            <span className="truncate tracking-[0.14em] text-[#f3e3c2]">{preview.title}</span>
            <span className="truncate text-xs tracking-[0.08em] text-[rgba(226,194,141,0.8)]">{preview.meta}</span>
          </>
        ) : (
          <span className="text-sm tracking-[0.14em] text-[rgba(241,231,209,0.6)]">
            {opened ? `已翻開《${opened}》` : "一輪旅程一本書。指向書脊看書名，點一下抽出來翻開"}
          </span>
        )}
      </footer>
    </section>
  );
}
