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

const action = "rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

const copy = {
  en: { heading: "Your orders", recent: "Recent orders", pay: "Complete payment", track: "Track package", again: "Buy again", returns: "Returns", noReturns: "No returns in the last 90 days.", policy: "Read the return policy" },
  "zh-TW": { heading: "我的訂單", recent: "近期訂單", pay: "完成付款", track: "追蹤包裹", again: "再買一次", returns: "退貨", noReturns: "最近 90 天沒有退貨紀錄。", policy: "查看退貨政策" },
  "zh-CN": { heading: "我的订单", recent: "最近订单", pay: "去付款", track: "查看物流", again: "再次购买", returns: "退货", noReturns: "最近 90 天没有退货记录。", policy: "查看退货政策" },
  ja: { heading: "注文履歴", recent: "最近の注文", pay: "支払いを完了", track: "配送状況を確認", again: "もう一度購入", returns: "返品", noReturns: "過去 90 日間の返品はありません。", policy: "返品ポリシーを読む" },
};

export default function OrderHistoryDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const orders = useOrders();
  return (
    <section aria-labelledby="orders-heading" className="w-full max-w-[52rem] space-y-5">
      <h2 id="orders-heading" className="text-xl font-semibold tracking-tight">
        {t.heading}
      </h2>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <OrderHistory
          locale={locale}
          title={t.recent}
          orders={orders}
          defaultExpandedId="o2"
          renderActions={(o) =>
            o.status === "pending" ? (
              <a href="#pay" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {t.pay}
              </a>
            ) : (
              <>
                {o.status === "shipped" && (
                  <a href="#track" className={action}>
                    {t.track}
                  </a>
                )}
                <a href="#reorder" className={action}>
                  {t.again}
                </a>
              </>
            )
          }
        />
        <OrderHistory
          locale={locale}
          title={t.returns}
          orders={[]}
          labels={{ empty: t.noReturns }}
          className="md:max-w-xs"
          emptyAction={
            <a href="#policy" className="text-xs font-medium underline underline-offset-4">
              {t.policy}
            </a>
          }
        />
      </div>
    </section>
  );
}
