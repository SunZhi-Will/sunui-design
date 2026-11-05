"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { TierProgress, type MembershipTier } from "./tier-progress";

const copy = {
  en: {
    heading: "Rewards",
    intro: "Earn 1 point for every $1 spent. Tiers are based on points earned this year.",
    footnote: "Points reset on Dec 31, 2026.",
    tiers: [
      { id: "member", name: "Member", min: 0 },
      { id: "silver", name: "Silver", min: 1000, perks: ["Free shipping on orders over $30", "Early access to sales"] },
      { id: "gold", name: "Gold", min: 3000, perks: ["Free shipping on every order", "Double points in your birthday month", "Free returns pickup"] },
      { id: "black", name: "Black", min: 8000, perks: ["Personal stylist appointments", "Members-only restocks"] },
    ],
  },
  "zh-TW": {
    heading: "會員回饋",
    intro: "每消費 $1 累積 1 點，等級依今年累積的點數計算。",
    footnote: "點數將於 2026 年 12 月 31 日歸零。",
    tiers: [
      { id: "member", name: "一般會員", min: 0 },
      { id: "silver", name: "銀卡", min: 1000, perks: ["單筆滿 $30 免運", "優先參加特賣"] },
      { id: "gold", name: "金卡", min: 3000, perks: ["每筆訂單都免運", "生日當月點數加倍", "退貨免費到府收件"] },
      { id: "black", name: "黑卡", min: 8000, perks: ["專屬造型顧問預約", "會員限定補貨"] },
    ],
  },
  "zh-CN": {
    heading: "会员回馈",
    intro: "每消费 $1 累积 1 积分，等级按今年累积的积分计算。",
    footnote: "积分将于 2026 年 12 月 31 日清零。",
    tiers: [
      { id: "member", name: "普通会员", min: 0 },
      { id: "silver", name: "银卡", min: 1000, perks: ["单笔满 $30 包邮", "优先参加特卖"] },
      { id: "gold", name: "金卡", min: 3000, perks: ["每笔订单都包邮", "生日当月积分翻倍", "退货免费上门取件"] },
      { id: "black", name: "黑卡", min: 8000, perks: ["专属造型顾问预约", "会员专享补货"] },
    ],
  },
  ja: {
    heading: "リワード",
    intro: "$1 のお買い物ごとに 1 pt。ランクは今年獲得したポイントで決まります。",
    footnote: "ポイントは 2026年12月31日にリセットされます。",
    tiers: [
      { id: "member", name: "メンバー", min: 0 },
      { id: "silver", name: "シルバー", min: 1000, perks: ["$30 以上のご注文で送料無料", "セールへの先行アクセス"] },
      { id: "gold", name: "ゴールド", min: 3000, perks: ["すべてのご注文で送料無料", "誕生月はポイント2倍", "返品の無料集荷"] },
      { id: "black", name: "ブラック", min: 8000, perks: ["パーソナルスタイリストの予約", "会員限定の再入荷"] },
    ],
  },
} satisfies Record<string, { heading: string; intro: string; footnote: string; tiers: MembershipTier[] }>;

export default function TierProgressDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section aria-labelledby="tier-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="tier-heading" className="text-xl font-semibold tracking-tight">
          {t.heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-3">
        <TierProgress tiers={t.tiers} points={1760} locale={locale} footnote={t.footnote} />
        <TierProgress tiers={t.tiers} points={420} locale={locale} />
        <TierProgress tiers={t.tiers} points={9150} locale={locale} />
      </div>
    </section>
  );
}
