"use client";

import { useEffect, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { InfiniteAvatarGrid } from "./infinite-avatar-grid";

export default function InfiniteAvatarGridDemo() {
  const locale = useDemoLocale();
  // 與原專案 grid 頁相同：畫布就緒後 300ms 才讓頭像冒出
  const [showCards, setShowCards] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShowCards(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative h-[520px] w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background">
      <InfiniteAvatarGrid locale={locale} visible={showCards} fixed={false} />
    </div>
  );
}
