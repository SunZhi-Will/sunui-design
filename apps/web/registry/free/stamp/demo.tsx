"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { Stamp } from "./stamp";

const copy = {
  en: {
    rows: [
      ["Small confirmation", "Copied, saved, verified, added"],
      ["Transaction status", "Claimed, applied, sold out, ended"],
      ["Win or achievement", "Winner, top tier, card complete"],
      ["Dated record", "Paid, postmark, order milestone"],
      ["Personal mark", "Invitations and member names"],
    ],
    tick: "Copied",
    claimed: "Claimed",
    soldOut: "Sold out",
    winner: "Winner",
    tier: "Gold",
    topTier: "Top tier",
    paid: "Paid",
    chop: "招待",
    chopFilled: "会員",
  },
  "zh-TW": {
    rows: [
      ["小確認", "已複製、已儲存、已驗證、已加入"],
      ["交易狀態", "已領取、已套用、已售完、已結束"],
      ["中獎與成就", "中獎、最高等級、集點完成"],
      ["有日期的紀錄", "已付款、郵戳、訂單節點"],
      ["個人落款", "邀請函與會員名"],
    ],
    tick: "已複製",
    claimed: "已領取",
    soldOut: "已售完",
    winner: "中獎",
    tier: "金卡",
    topTier: "最高等級",
    paid: "已付款",
    chop: "受邀",
    chopFilled: "會員",
  },
  "zh-CN": {
    rows: [
      ["小确认", "已复制、已保存、已验证、已加入"],
      ["交易状态", "已领取、已使用、已售罄、已结束"],
      ["中奖与成就", "中奖、最高等级、集点完成"],
      ["带日期的记录", "已付款、邮戳、订单节点"],
      ["个人落款", "邀请函与会员名"],
    ],
    tick: "已复制",
    claimed: "已领取",
    soldOut: "已售罄",
    winner: "中奖",
    tier: "金卡",
    topTier: "最高等级",
    paid: "已付款",
    chop: "受邀",
    chopFilled: "会员",
  },
  ja: {
    rows: [
      ["小さな確認", "コピー、保存、認証、追加"],
      ["取引の状態", "獲得、適用、売り切れ、終了"],
      ["当選と達成", "当選、最上位ランク、スタンプ完成"],
      ["日付つきの記録", "支払い済み、消印、注文の節目"],
      ["個人の落款", "招待状と会員名"],
    ],
    tick: "コピー済み",
    claimed: "獲得済み",
    soldOut: "売り切れ",
    winner: "当選",
    tier: "ゴールド",
    topTier: "最上位",
    paid: "支払済",
    chop: "招待",
    chopFilled: "会員",
  },
};

export default function StampDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const samples = [
    <Stamp key="tick" shape="tick">{t.tick}</Stamp>,
    <span key="box" className="flex flex-wrap items-center gap-3">
      <Stamp seed="claim-1">{t.claimed}</Stamp>
      <Stamp seed="sold-1" tone="ink">{t.soldOut}</Stamp>
    </span>,
    <span key="seal" className="flex flex-wrap items-center gap-3">
      <Stamp shape="seal" seed="win-1">{t.winner}</Stamp>
      <Stamp shape="seal" seed="tier-1" sub={t.tier}>{t.topTier}</Stamp>
    </span>,
    <Stamp key="date" shape="date" seed="order-20418" date="2026-11-05T09:30:00">{t.paid}</Stamp>,
    <span key="chop" className="flex flex-wrap items-center gap-3">
      <Stamp shape="chop" seed="invite-1">{t.chop}</Stamp>
      <Stamp shape="chop" seed="member-1" filled>{t.chopFilled}</Stamp>
    </span>,
  ];

  return (
    <div lang={locale} className="w-full max-w-[40rem] divide-y divide-dashed divide-[#e7e0d0] rounded-md border border-[#e7e0d0] bg-[#faf7f0] text-[#1c1917] dark:divide-[#38332b] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
      {t.rows.map(([title, examples], i) => (
        <div key={title} className="grid items-center gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-[#1c1917]/60 dark:text-[#ece7dc]/60">{examples}</p>
          </div>
          <div className="flex min-h-12 items-center sm:justify-end">{samples[i]}</div>
        </div>
      ))}
    </div>
  );
}
