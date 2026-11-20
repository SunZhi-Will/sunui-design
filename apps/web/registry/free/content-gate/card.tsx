"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ContentGate } from "./content-gate";

const copy = {
  en: { title: "Claude, Not Just Chat", subtitle: "Hands-on workshop", signIn: "Sign in to unlock" },
  "zh-TW": { title: "Claude 不只是聊天", subtitle: "實作工作坊", signIn: "登入以解鎖" },
  "zh-CN": { title: "Claude 不只是聊天", subtitle: "实操工作坊", signIn: "登录以解锁" },
  ja: { title: "Claude はチャットだけじゃない", subtitle: "ハンズオンワークショップ", signIn: "ログインして解除" },
};

/** Catalog card: a locked course card. Press the sign-in button to see the spinner state, which returns to the initial state after a moment. The free-preview-limit overlay stays in the full demo. */
export default function ContentGateCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // The sign-in state lives inside the component; changing the key resets the card to its initial state after the demo
  const [round, setRound] = useState(0);

  return (
    <div className="mx-auto w-72">
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
    </div>
  );
}
