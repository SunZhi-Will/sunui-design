"use client";

import { useState } from "react";

import { ContentGate } from "./content-gate";

/** 型錄卡片：一張上鎖的課程卡，按登入鈕看轉圈的登入狀態。 */
export default function ContentGateCard() {
  // 登入狀態在元件內部，換 key 讓卡片在示範後回到初始狀態
  const [round, setRound] = useState(0);

  return (
    <div className="mx-auto w-72 overflow-hidden rounded-2xl">
      <ContentGate
        key={round}
        title="Claude, Not Just Chat"
        subtitle="Hands-on workshop"
        state="anon"
        onSignIn={() => setTimeout(() => setRound((r) => r + 1), 1800)}
        contactHref="#"
        labels={{ body: () => null, signIn: () => "Sign in to unlock" }}
        className="p-0 [&>div:nth-child(2)]:p-4 [&_.h-14]:size-10 [&_.mb-5]:mb-3 [&_.mb-7]:mb-3 [&_p.mt-5]:mt-3"
      />
    </div>
  );
}
