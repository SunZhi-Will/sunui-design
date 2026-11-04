"use client";

import { useState } from "react";

import { SpeedReader } from "./speed-reader";

const texts = {
  en: {
    label: "English",
    title: "Why we stopped asking you to confirm",
    body: "Last spring we removed almost every confirm dialog from the app. Instead of asking whether you are sure, we now let you undo for a few seconds. Support tickets about lost work dropped by a third, and people finished checkout faster. The lesson was simple: a dialog asks you to think at the worst moment, while undo lets you notice your mistake when it actually matters. We kept one exception. Payments still ask twice, because money that leaves your account cannot wait in a queue.",
  },
  zh: {
    label: "中文",
    title: "我們為什麼不再問你「確定嗎」",
    body: "去年春天，我們拿掉了 App 裡幾乎所有的確認對話框。與其問你是否確定，現在改成給你幾秒鐘可以復原。關於資料遺失的客服單少了三分之一，結帳也更快完成。道理很簡單：對話框在最糟的時機要你思考，而復原讓你在真正需要時發現自己的錯誤。我們只留下一個例外，付款仍然會問兩次，因為離開帳戶的錢沒辦法排隊等你反悔。",
  },
};

type Lang = keyof typeof texts;

export default function SpeedReaderDemo() {
  const [lang, setLang] = useState<Lang>("en");
  const current = texts[lang];

  return (
    <article className="w-full max-w-xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Product blog · 2 min read</p>
          <h2 className="mt-1 text-lg font-semibold">{current.title}</h2>
        </div>
        <div role="radiogroup" aria-label="Article language" className="inline-flex rounded-md border border-border p-0.5 text-sm">
          {(Object.keys(texts) as Lang[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={lang === k}
              onClick={() => setLang(k)}
              className="rounded px-3 py-1 text-muted-foreground aria-checked:bg-muted aria-checked:text-foreground"
            >
              {texts[k].label}
            </button>
          ))}
        </div>
      </header>
      <SpeedReader key={lang} text={current.body} defaultWpm={lang === "zh" ? 350 : 300} />
      <p className="text-xs text-muted-foreground">Click the reader, then press Space to start. Press ? for all shortcuts.</p>
    </article>
  );
}
