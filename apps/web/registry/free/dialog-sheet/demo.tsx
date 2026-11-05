"use client";

import { useDemoText } from "@/lib/demo-locale";

import { DialogSheet } from "./dialog-sheet";

const copy = {
  en: {
    product: "Merino crew neck",
    price: "$68",
    sizeGuide: "Size guide",
    sizeTitle: "Find your size",
    sizeDesc: "Measured flat across the chest, in centimetres.",
    rows: [["S", "48"], ["M", "51"], ["L", "54"], ["XL", "57"]],
    chest: "Chest",
    shipping: "Delivery and returns",
    shipTitle: "Delivery and returns",
    shipDesc: "Drag the handle down to close.",
    shipBody: ["Free standard delivery over $50, 2 to 4 working days.", "Express next day for $9 when ordered before 2 pm.", "Returns are free within 30 days, unworn with tags."],
    close: "Close",
    done: "Got it",
  },
  "zh-TW": {
    product: "美麗諾圓領針織衫",
    price: "NT$1,980",
    sizeGuide: "尺寸表",
    sizeTitle: "找到你的尺寸",
    sizeDesc: "平放量測胸寬，單位公分。",
    rows: [["S", "48"], ["M", "51"], ["L", "54"], ["XL", "57"]],
    chest: "胸寬",
    shipping: "配送與退貨",
    shipTitle: "配送與退貨",
    shipDesc: "往下拖曳把手即可關閉。",
    shipBody: ["滿 NT$1,500 免運，2 至 4 個工作天送達。", "下午 2 點前下單，加 NT$150 隔日到貨。", "30 天內未穿著、吊牌完整可免費退貨。"],
    close: "關閉",
    done: "知道了",
  },
  "zh-CN": {
    product: "美丽诺圆领针织衫",
    price: "¥468",
    sizeGuide: "尺码表",
    sizeTitle: "找到你的尺码",
    sizeDesc: "平铺测量胸宽，单位厘米。",
    rows: [["S", "48"], ["M", "51"], ["L", "54"], ["XL", "57"]],
    chest: "胸宽",
    shipping: "配送与退货",
    shipTitle: "配送与退货",
    shipDesc: "向下拖动把手即可关闭。",
    shipBody: ["满 ¥299 包邮，2 至 4 个工作日送达。", "下午 2 点前下单，加 ¥20 次日达。", "30 天内未穿着、吊牌完好可免费退货。"],
    close: "关闭",
    done: "知道了",
  },
  ja: {
    product: "メリノ クルーネック",
    price: "¥9,900",
    sizeGuide: "サイズ表",
    sizeTitle: "サイズを選ぶ",
    sizeDesc: "平置きで測った身幅（cm）です。",
    rows: [["S", "48"], ["M", "51"], ["L", "54"], ["XL", "57"]],
    chest: "身幅",
    shipping: "配送と返品",
    shipTitle: "配送と返品",
    shipDesc: "ハンドルを下にドラッグすると閉じます。",
    shipBody: ["5,000 円以上で送料無料、2〜4 営業日でお届け。", "14 時までのご注文は 900 円で翌日配送。", "未着用・タグ付きなら 30 日以内の返品無料。"],
    close: "閉じる",
    done: "OK",
  },
};

const buttonClass =
  "rounded-md border border-[#e7e0d0] bg-[#faf7f0] px-3 py-2 text-sm font-medium text-[#1c1917] transition-colors hover:bg-[#e7e0d0]/60 dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]";

export default function DialogSheetDemo() {
  const t = useDemoText(copy);
  return (
    <div className="relative h-[30rem] w-full max-w-[44rem] overflow-hidden rounded-lg border bg-background">
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_1.1fr]">
        <div aria-hidden="true" className="aspect-[4/5] rounded-md bg-muted" />
        <div>
          <p className="text-xl font-semibold tracking-tight">{t.product}</p>
          <p className="mt-1 tabular-nums text-muted-foreground">{t.price}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <DialogSheet
              position="contained"
              variant="center"
              closeLabel={t.close}
              trigger={<button type="button" className={buttonClass}>{t.sizeGuide}</button>}
              title={t.sizeTitle}
              description={t.sizeDesc}
            >
              <table className="w-full text-left tabular-nums">
                <thead>
                  <tr className="border-b border-dashed border-[#e7e0d0] text-xs text-[#1c1917]/60 dark:border-[#38332b] dark:text-[#ece7dc]/60">
                    <th className="py-2 font-medium" />
                    <th className="py-2 font-medium">{t.chest}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map(([size, chest]) => (
                    <tr key={size} className="border-b border-dashed border-[#e7e0d0] last:border-0 dark:border-[#38332b]">
                      <td className="py-2 font-medium">{size}</td>
                      <td className="py-2">{chest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DialogSheet>
            <DialogSheet
              position="contained"
              variant="sheet"
              closeLabel={t.close}
              trigger={<button type="button" className={buttonClass}>{t.shipping}</button>}
              title={t.shipTitle}
              description={t.shipDesc}
            >
              <ul className="space-y-2 pb-2">
                {t.shipBody.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </DialogSheet>
          </div>
        </div>
      </div>
    </div>
  );
}
