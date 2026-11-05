"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AvatarStack, type AvatarStackPerson } from "./avatar-stack";

const buyersByLocale: { en: AvatarStackPerson[] } & Record<"zh-TW" | "zh-CN" | "ja", AvatarStackPerson[]> = {
  en: [
    { id: "1", name: "Mina P.", note: "Taipei, 2 hours ago" },
    { id: "2", name: "Leo C.", note: "Osaka, 5 hours ago" },
    { id: "3", name: "Ava L.", note: "Seoul, yesterday" },
    { id: "4", name: "Noah W.", note: "Taichung, yesterday" },
    { id: "5", name: "Sara K.", note: "Singapore, 2 days ago" },
  ],
  "zh-TW": [
    { id: "1", name: "林美娜", note: "台北，2 小時前" },
    { id: "2", name: "陳立歐", note: "大阪，5 小時前" },
    { id: "3", name: "李艾娃", note: "首爾，昨天" },
    { id: "4", name: "王諾亞", note: "台中，昨天" },
    { id: "5", name: "柯莎拉", note: "新加坡，2 天前" },
  ],
  "zh-CN": [
    { id: "1", name: "林美娜", note: "台北，2 小时前" },
    { id: "2", name: "陈立欧", note: "大阪，5 小时前" },
    { id: "3", name: "李艾娃", note: "首尔，昨天" },
    { id: "4", name: "王诺亚", note: "台中，昨天" },
    { id: "5", name: "柯莎拉", note: "新加坡，2 天前" },
  ],
  ja: [
    { id: "1", name: "佐藤美奈", note: "台北、2 時間前" },
    { id: "2", name: "中村玲央", note: "大阪、5 時間前" },
    { id: "3", name: "鈴木彩", note: "ソウル、昨日" },
    { id: "4", name: "渡辺直人", note: "台中、昨日" },
    { id: "5", name: "加藤沙羅", note: "シンガポール、2 日前" },
  ],
};

const copy = {
  en: { bought: "bought in the last 30 days" },
  "zh-TW": { bought: "人在過去 30 天購買" },
  "zh-CN": { bought: "人在过去 30 天购买" },
  ja: { bought: "人が過去 30 日間に購入" },
};

/** 型錄卡片：一排買家頭像，滑過任一個會抬起並顯示名字。 */
export default function AvatarStackCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const buyers = useDemoText(buyersByLocale);

  return (
    <div className="mx-auto flex w-64 flex-col items-center gap-3 pt-12 text-foreground">
      <AvatarStack people={buyers} total={1284} max={4} size="lg" locale={locale} />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">{new Intl.NumberFormat(locale).format(1284)}</span> {t.bought}
      </p>
    </div>
  );
}
