"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AddonChecklist } from "./addon-checklist";

const copy = {
  en: { title: "Linen Throw Blanket", wrap: "Gift wrap", card: "Handwritten card", care: "Care kit" },
  "zh-TW": { title: "亞麻蓋毯", wrap: "禮物包裝", card: "手寫卡片", care: "保養組" },
  "zh-CN": { title: "亚麻盖毯", wrap: "礼品包装", card: "手写卡片", care: "护理套装" },
  ja: { title: "リネンのブランケット", wrap: "ギフトラッピング", card: "手書きカード", care: "お手入れキット" },
};

/** 型錄卡片：一張加購收據，勾選加購品，小計跟著滾動。 */
export default function AddonChecklistCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="mx-auto w-72">
      <AddonChecklist
        key={locale}
        locale={locale}
        title={t.title}
        basePrice={68}
        defaultValue={["wrap"]}
        items={[
          { id: "wrap", label: t.wrap, price: 4 },
          { id: "card", label: t.card, price: 0 },
          { id: "care", label: t.care, price: 12 },
        ]}
        className="min-w-0"
      />
    </div>
  );
}
