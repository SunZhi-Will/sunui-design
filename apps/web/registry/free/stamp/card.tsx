"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Stamp } from "./stamp";

const copy = {
  en: { title: "Coupons", claim: "Claim", claimed: "Claimed", soldOut: "Sold out", rows: [["$5 off", "Orders over $40"], ["Free shipping", "Any order this week"], ["15% off knitwear", "First 100 people"]] },
  "zh-TW": { title: "優惠券", claim: "領取", claimed: "已領取", soldOut: "已領完", rows: [["折 $150", "滿 $1,200 可用"], ["免運券", "本週任何訂單"], ["針織 85 折", "限前 100 名"]] },
  "zh-CN": { title: "优惠券", claim: "领取", claimed: "已领取", soldOut: "已领完", rows: [["减 ¥30", "满 ¥299 可用"], ["包邮券", "本周任意订单"], ["针织 85 折", "限前 100 名"]] },
  ja: { title: "クーポン", claim: "獲得", claimed: "獲得済み", soldOut: "配布終了", rows: [["500円引き", "5,000円以上で利用可"], ["送料無料", "今週のご注文すべて"], ["ニット 15% オフ", "先着 100 名"]] },
};

/** 型錄卡片：優惠券清單，按「領取」後按鈕換成一枚蓋上去的「已領取」印章，領完的券是淡墨章。 */
export default function StampCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [claimed, setClaimed] = useState<number[]>([0]);

  return (
    <div lang={locale} className="mx-auto w-72 rounded-md border border-[#e2e2e2] bg-[#f7f7f7] text-[#171717] dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]">
      <p className="border-b border-[#e2e2e2] px-4 py-2.5 text-sm font-semibold tracking-tight dark:border-[#333333]">{t.title}</p>
      <ul className="divide-y divide-dashed divide-[#e2e2e2] dark:divide-[#333333]">
        {t.rows.map(([name, note], i) => (
          <li key={name} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-[#171717]/60 dark:text-[#ededed]/60">{note}</p>
            </div>
            {i === 2 ? (
              <Stamp tone="ink" appear={false}>{t.soldOut}</Stamp>
            ) : claimed.includes(i) ? (
              <Stamp appear={i !== 0}>{t.claimed}</Stamp>
            ) : (
              <button
                type="button"
                onClick={() => setClaimed((c) => [...c, i])}
                className="shrink-0 rounded-md border border-[#171717] bg-[#171717] px-3 py-1 text-xs font-medium text-[#f7f7f7] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:border-[#ededed] dark:bg-[#ededed] dark:text-[#1c1c1c]"
              >
                {t.claim}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
