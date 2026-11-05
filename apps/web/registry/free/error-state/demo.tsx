"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ErrorState } from "./error-state";

const ids = ["b-31", "b-30", "b-29"];
const totals = [1840, 960, 720];

const copy = {
  en: {
    heading: "Past bills",
    title: "Couldn't load past bills",
    message: "The connection timed out. Your bills are safe, please try again.",
    bills: [
      { title: "Hotpot night", date: "Nov 2" },
      { title: "Team lunch", date: "Oct 29" },
      { title: "Ramen after the match", date: "Oct 21" },
    ],
  },
  "zh-TW": {
    heading: "過去的帳單",
    title: "無法載入過去的帳單",
    message: "連線逾時了。你的帳單都還在，請再試一次。",
    bills: [
      { title: "火鍋之夜", date: "11 月 2 日" },
      { title: "團隊午餐", date: "10 月 29 日" },
      { title: "賽後拉麵", date: "10 月 21 日" },
    ],
  },
  "zh-CN": {
    heading: "历史账单",
    title: "无法加载历史账单",
    message: "连接超时了。你的账单都还在，请重试。",
    bills: [
      { title: "火锅之夜", date: "11 月 2 日" },
      { title: "团队午餐", date: "10 月 29 日" },
      { title: "赛后拉面", date: "10 月 21 日" },
    ],
  },
  ja: {
    heading: "過去の会計",
    title: "過去の会計を読み込めませんでした",
    message: "接続がタイムアウトしました。会計データは無事です。もう一度お試しください。",
    bills: [
      { title: "鍋パーティー", date: "11月2日" },
      { title: "チームランチ", date: "10月29日" },
      { title: "試合後のラーメン", date: "10月21日" },
    ],
  },
};

export default function ErrorStateDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [failed, setFailed] = useState(true);

  return (
    <section aria-labelledby="er-history" className="w-full max-w-md min-w-0 space-y-3">
      <h2 id="er-history" className="text-sm font-semibold">
        {t.heading}
      </h2>
      {failed ? (
        <ErrorState locale={locale} title={t.title} message={t.message} onRetry={() => setFailed(false)} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
          {t.bills.map((b, i) => (
            <li key={ids[i]} className="flex min-w-0 items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{b.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{b.date}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">${totals[i].toLocaleString(locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
