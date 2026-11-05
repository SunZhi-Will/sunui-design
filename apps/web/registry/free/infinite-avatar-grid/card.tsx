"use client";

import { useEffect, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { InfiniteAvatarGrid } from "./infinite-avatar-grid";

/** 型錄卡片：一小塊無限頭像畫布，可拖曳平移、滾輪縮放。 */
export default function InfiniteAvatarGridCard() {
  const locale = useDemoLocale();
  // 與 demo 相同：畫布就緒後 300ms 才讓頭像冒出
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative mx-auto h-56 w-72 overflow-hidden rounded-xl border border-border bg-background">
      <InfiniteAvatarGrid locale={locale} visible={show} fixed={false} showModal={false} cellSize={110} avatarSize={64} />
    </div>
  );
}
