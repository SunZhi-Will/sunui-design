"use client";

import { useEffect, useRef, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeButton } from "./anime-button";

const copy = {
  en: { title: "Publish chapter 12?", body: "Readers following the series get a notification.", publish: "Publish", cancel: "Not yet", published: "Published" },
  "zh-TW": { title: "發布第 12 話？", body: "追蹤這部作品的讀者會收到通知。", publish: "發布", cancel: "先不要", published: "已發布" },
  "zh-CN": { title: "发布第 12 话？", body: "关注这部作品的读者会收到通知。", publish: "发布", cancel: "先不要", published: "已发布" },
  ja: { title: "第12話を公開しますか？", body: "この作品をフォローしている読者に通知が届きます。", publish: "公開する", cancel: "あとで", published: "公開しました" },
};

export default function AnimeButtonDemo() {
  const t = useDemoText(copy);
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const publish = () => {
    timers.current.forEach(clearTimeout);
    setStatus("idle");
    // Pretend the request takes a moment, then report success
    timers.current = [window.setTimeout(() => setStatus("done"), 650), window.setTimeout(() => setStatus("idle"), 2600)];
  };

  return (
    <div className="w-full max-w-sm px-2 py-16">
      <h2 className="text-lg font-semibold tracking-tight">{t.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <AnimeButton onClick={publish} status={status}>
          {status === "done" ? t.published : t.publish}
        </AnimeButton>
        <AnimeButton variant="secondary">{t.cancel}</AnimeButton>
      </div>
    </div>
  );
}
