"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ContentGate, PaywallOverlay } from "./content-gate";

const copy = {
  en: { title: "Claude, Not Just Chat", subtitle: "Hands-on workshop", signIn: "Sign in to unlock", slide: "Slide 3 / 24", buy: "Buy to keep watching" },
  "zh-TW": { title: "Claude 不只是聊天", subtitle: "實作工作坊", signIn: "登入以解鎖", slide: "第 3 張 / 共 24 張", buy: "購買後繼續觀看" },
  "zh-CN": { title: "Claude 不只是聊天", subtitle: "实操工作坊", signIn: "登录以解锁", slide: "第 3 张 / 共 24 张", buy: "购买后继续观看" },
  ja: { title: "Claude はチャットだけじゃない", subtitle: "ハンズオンワークショップ", signIn: "ログインして解除", slide: "スライド 3 / 24", buy: "購入して続きを見る" },
};

/** 型錄卡片：上鎖的課程卡（按登入鈕看轉圈狀態），下方是試看到上限的播放器覆蓋層。 */
export default function ContentGateCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 登入狀態在元件內部，換 key 讓卡片在示範後回到初始狀態
  const [round, setRound] = useState(0);

  return (
    <div className="mx-auto flex w-72 flex-col gap-3">
      <div className="overflow-hidden rounded-xl">
        <ContentGate
          key={round}
          title={t.title}
          subtitle={t.subtitle}
          state="anon"
          locale={locale}
          onSignIn={() => setTimeout(() => setRound((r) => r + 1), 1800)}
          contactHref="#"
          labels={{ body: () => null, signIn: () => t.signIn }}
          className="p-0 [&>div:nth-child(2)]:p-4 [&_.h-14]:size-10 [&_.mb-5]:mb-3 [&_.mb-7]:mb-3 [&_p.mt-5]:mt-3"
        />
      </div>
      <div className="relative h-36 overflow-hidden rounded-xl border border-border bg-muted">
        <p className="p-3 text-xs text-muted-foreground tabular-nums">{t.slide}</p>
        <PaywallOverlay
          locale={locale}
          previewCount={3}
          href="#"
          labels={{ title: t.buy, body: () => null }}
          className="gap-2.5 [&>div:first-child]:size-8"
        />
      </div>
    </div>
  );
}
