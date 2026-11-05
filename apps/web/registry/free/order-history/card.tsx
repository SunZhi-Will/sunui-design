"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { OrderHistory, type HistoryOrder } from "./order-history";

const names = {
  en: { sweater: "Merino crew sweater", sweaterV: "Size M, Oat", overshirt: "Wool overshirt", overshirtV: "Size L, Navy", socks: "Cotton socks, 3 pack", tote: "Canvas tote", linen: "Linen shirt", linenV: "Size M, White" },
  "zh-TW": { sweater: "美麗諾圓領毛衣", sweaterV: "M 號，燕麥色", overshirt: "羊毛襯衫外套", overshirtV: "L 號，海軍藍", socks: "棉襪三雙組", tote: "帆布托特包", linen: "亞麻襯衫", linenV: "M 號，白色" },
  "zh-CN": { sweater: "美利奴圆领毛衣", sweaterV: "M 码，燕麦色", overshirt: "羊毛衬衫外套", overshirtV: "L 码，藏青色", socks: "棉袜三双装", tote: "帆布托特包", linen: "亚麻衬衫", linenV: "M 码，白色" },
  ja: { sweater: "メリノ クルーネックセーター", sweaterV: "M サイズ、オートミール", overshirt: "ウール オーバーシャツ", overshirtV: "L サイズ、ネイビー", socks: "コットンソックス 3 足組", tote: "キャンバストート", linen: "リネンシャツ", linenV: "M サイズ、ホワイト" },
};

/** 範例訂單：商品名與日期依目前語言 */
function useOrders(): HistoryOrder[] {
  const locale = useDemoLocale();
  const n = useDemoText(names);
  const date = (m: number, d: number) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(2026, m - 1, d));
  return [
    { id: "o1", number: "SF-20481", date: date(11, 4), status: "pending", lines: [{ name: n.sweater, variant: n.sweaterV, qty: 1, price: 89 }], shipping: 6 },
    {
      id: "o2",
      number: "SF-20377",
      date: date(10, 28),
      status: "shipped",
      lines: [
        { name: n.overshirt, variant: n.overshirtV, qty: 1, price: 128 },
        { name: n.socks, qty: 2, price: 18 },
      ],
      discount: 15,
    },
    { id: "o3", number: "SF-20112", date: date(10, 9), status: "delivered", lines: [{ name: n.tote, qty: 1, price: 42 }], shipping: 6 },
    { id: "o4", number: "SF-19988", date: date(9, 30), status: "cancelled", lines: [{ name: n.linen, variant: n.linenV, qty: 1, price: 74 }] },
  ];
}

/** 型錄卡片：三筆訂單收合成一列列，點開任一筆看明細與小計。 */
export default function OrderHistoryCard() {
  const locale = useDemoLocale();
  const orders = useOrders().slice(0, 3);
  return (
    <div className="mx-auto max-h-[228px] w-72 overflow-y-auto overscroll-contain rounded-md">
      <OrderHistory locale={locale} orders={orders} />
    </div>
  );
}
