"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AddonChecklist } from "./addon-checklist";

const copy = {
  en: {
    heading: "Finish your order",
    intro: "Pick the extras you want. The subtotal updates as you go.",
    blanket: "Linen Throw Blanket",
    wrap: "Gift wrap",
    wrapNote: "Kraft paper and cotton twine",
    card: "Handwritten card",
    care: "Care kit",
    careNote: "Linen wash and mesh bag",
    warranty: "2-year cover",
    studio: "Studio Session",
    booking: "Booking fee",
    prints: "Printed photos",
    printsNote: "Set of 6, 4 x 6 in",
    parking: "Parking pass",
  },
  "zh-TW": {
    heading: "完成你的訂單",
    intro: "挑選想要的加購項目，小計會即時更新。",
    blanket: "亞麻蓋毯",
    wrap: "禮物包裝",
    wrapNote: "牛皮紙搭配棉繩",
    card: "手寫卡片",
    care: "保養組",
    careNote: "亞麻洗劑與洗衣網",
    warranty: "兩年保固",
    studio: "攝影棚拍攝",
    booking: "預約手續費",
    prints: "照片沖印",
    printsNote: "6 張一組，4 x 6 吋",
    parking: "停車券",
  },
  "zh-CN": {
    heading: "完成你的订单",
    intro: "挑选想要的加购项目，小计会实时更新。",
    blanket: "亚麻盖毯",
    wrap: "礼品包装",
    wrapNote: "牛皮纸配棉绳",
    card: "手写卡片",
    care: "护理套装",
    careNote: "亚麻洗涤剂和洗衣袋",
    warranty: "两年保修",
    studio: "影棚拍摄",
    booking: "预约手续费",
    prints: "照片冲印",
    printsNote: "6 张一套，4 x 6 英寸",
    parking: "停车券",
  },
  ja: {
    heading: "ご注文の仕上げ",
    intro: "必要なオプションを選んでください。小計はすぐに更新されます。",
    blanket: "リネンのブランケット",
    wrap: "ギフトラッピング",
    wrapNote: "クラフト紙とコットンひも",
    card: "手書きカード",
    care: "お手入れキット",
    careNote: "リネン用洗剤と洗濯ネット",
    warranty: "2 年保証",
    studio: "スタジオ撮影",
    booking: "予約手数料",
    prints: "プリント写真",
    printsNote: "6 枚セット、4 x 6 インチ",
    parking: "駐車券",
  },
};

export default function AddonChecklistDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section aria-labelledby="addon-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="addon-heading" className="text-xl font-semibold tracking-tight">
          {t.heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <AddonChecklist
          key={`a-${locale}`}
          locale={locale}
          title={t.blanket}
          basePrice={68}
          defaultValue={["wrap"]}
          items={[
            { id: "wrap", label: t.wrap, note: t.wrapNote, price: 4 },
            { id: "card", label: t.card, price: 0 },
            { id: "care", label: t.care, note: t.careNote, price: 12 },
            { id: "warranty", label: t.warranty, price: 9.5 },
          ]}
        />
        <AddonChecklist
          key={`b-${locale}`}
          locale={locale}
          title={t.studio}
          basePrice={48}
          items={[
            { id: "booking", label: t.booking, price: 2, required: true },
            { id: "prints", label: t.prints, note: t.printsNote, price: 15 },
            { id: "parking", label: t.parking, price: 6 },
          ]}
        />
      </div>
    </section>
  );
}
