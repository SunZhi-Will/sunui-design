"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Bookshelf3D, type Bookshelf3DItem } from "./bookshelf-3d";

type Copy = {
  game: string;
  /** 書脊上的直書書名；英文太長放不下就留空 */
  spine?: string;
  library: string;
  count: (n: number) => string;
  shelf: string;
  hint: string;
  opened: (title: string) => string;
  /** 各本書的題簽、書名與卷數說明 */
  books: { label: string; title: string; meta: string }[];
};

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Copy> = {
  en: {
    game: "Where the Mountains Await",
    library: "Memoir Library",
    count: (n) => `${n} books`,
    shelf: "Memoir bookshelf",
    hint: "One journey, one book. Point at a spine to see its title, click to pull it out",
    opened: (title) => `Opened "${title}"`,
    books: [
      { label: "Home", title: "Where the Mountains Await · Homeward", meta: "Prologue to finale · 6 volumes · Sep 1, 2026 to Sep 19, 2026" },
      { label: "Lamp", title: "Where the Mountains Await · The Lamp Still Burns", meta: "Prologue to Volume 4 · 5 volumes · Sep 22, 2026 to Oct 3, 2026" },
      { label: "TBC", title: "Where the Mountains Await · To Be Continued", meta: "Prologue to Volume 2 · 3 volumes · Oct 8, 2026" },
      { label: "Ferry", title: "Where the Mountains Await · Lone Boat by Night", meta: "Prologue to finale · 6 volumes · Oct 12, 2026 to Oct 30, 2026" },
    ],
  },
  "zh-TW": {
    game: "山河未歸",
    spine: "山河未歸",
    library: "回憶錄書庫",
    count: (n) => `已收錄 ${n} 本`,
    shelf: "回憶錄書架",
    hint: "一輪旅程一本書。指向書脊看書名，點一下抽出來翻開",
    opened: (title) => `已翻開《${title}》`,
    books: [
      { label: "歸山", title: "山河未歸・歸山", meta: "序章至終卷・共 6 卷・2026年9月1日 至 2026年9月19日" },
      { label: "燈未滅", title: "山河未歸・燈未滅", meta: "序章至第四卷・共 5 卷・2026年9月22日 至 2026年10月3日" },
      { label: "未完待續", title: "山河未歸・未完待續", meta: "序章至第二卷・共 3 卷・2026年10月8日" },
      { label: "孤舟夜渡", title: "山河未歸・孤舟夜渡", meta: "序章至終卷・共 6 卷・2026年10月12日 至 2026年10月30日" },
    ],
  },
  "zh-CN": {
    game: "山河未归",
    spine: "山河未归",
    library: "回忆录书库",
    count: (n) => `已收录 ${n} 本`,
    shelf: "回忆录书架",
    hint: "一轮旅程一本书。指向书脊看书名，点一下抽出来翻开",
    opened: (title) => `已翻开《${title}》`,
    books: [
      { label: "归山", title: "山河未归・归山", meta: "序章至终卷・共 6 卷・2026年9月1日 至 2026年9月19日" },
      { label: "灯未灭", title: "山河未归・灯未灭", meta: "序章至第四卷・共 5 卷・2026年9月22日 至 2026年10月3日" },
      { label: "未完待续", title: "山河未归・未完待续", meta: "序章至第二卷・共 3 卷・2026年10月8日" },
      { label: "孤舟夜渡", title: "山河未归・孤舟夜渡", meta: "序章至终卷・共 6 卷・2026年10月12日 至 2026年10月30日" },
    ],
  },
  ja: {
    game: "山河未帰",
    spine: "山河未帰",
    library: "回想録の書庫",
    count: (n) => `${n} 冊収録`,
    shelf: "回想録の本棚",
    hint: "旅ひとつに本一冊。背表紙を指すと書名が出て、クリックで引き出して開きます",
    opened: (title) => `『${title}』を開きました`,
    books: [
      { label: "帰山", title: "山河未帰・帰山", meta: "序章から終巻・全 6 巻・2026年9月1日〜2026年9月19日" },
      { label: "灯未滅", title: "山河未帰・灯未滅", meta: "序章から第四巻・全 5 巻・2026年9月22日〜2026年10月3日" },
      { label: "未完", title: "山河未帰・未完", meta: "序章から第二巻・全 3 巻・2026年10月8日" },
      { label: "孤舟夜渡", title: "山河未帰・孤舟夜渡", meta: "序章から終巻・全 6 巻・2026年10月12日〜2026年10月30日" },
    ],
  },
};

// 第 3 格空著，第 4 格是未完之書
const slots: Pick<Bookshelf3DItem, "slot" | "id" | "status">[] = [
  { slot: 1, id: "b1" },
  { slot: 2, id: "b2" },
  { slot: 4, id: "b3", status: "paused" },
  { slot: 5, id: "b4" },
];

export default function Bookshelf3DDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const books: Bookshelf3DItem[] = slots.map((s, i) => ({ ...s, ...t.books[i] }));
  const [previewId, setPreviewId] = useState<string | undefined>();
  const [openedId, setOpenedId] = useState<string | undefined>();
  const preview = books.find((b) => b.id === previewId);
  const opened = books.find((b) => b.id === openedId);

  return (
    <section className="w-full max-w-3xl min-w-0 rounded-[3px] bg-[#070605] px-4 py-4 text-[#f1e7d1] sm:px-8">
      <header className="flex items-end justify-between gap-4 border-b border-[rgba(224,194,145,0.22)] pb-3">
        <div className="min-w-0">
          <div className="text-xs tracking-[0.34em] text-[#d6b57f]">{t.game}</div>
          <h2 className="mt-1 text-xl tracking-[0.24em]">{t.library}</h2>
        </div>
        <span className="shrink-0 text-sm tracking-[0.18em] text-[#d6b57f]">{t.count(books.length)}</span>
      </header>

      <div className="my-4 rounded-[3px] border-[0.5rem] border-[#2a1c12] bg-[linear-gradient(90deg,rgba(0,0,0,0.55),transparent_8%,transparent_92%,rgba(0,0,0,0.55)),linear-gradient(180deg,#1a120c,#110b07)] px-2 shadow-[inset_0_0_2.5rem_rgba(0,0,0,0.8),0_1.2rem_2.5rem_rgba(0,0,0,0.6)] sm:px-5">
        <Bookshelf3D
          items={books}
          spineTitle={t.spine}
          onPick={(_, item) => setOpenedId(item?.id)}
          onPreview={(_, item) => setPreviewId(item?.id)}
          locale={locale}
          labels={{ shelf: t.shelf }}
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
          <span className="text-sm tracking-[0.14em] text-[rgba(241,231,209,0.6)]">{opened ? t.opened(opened.title) : t.hint}</span>
        )}
      </footer>
    </section>
  );
}
