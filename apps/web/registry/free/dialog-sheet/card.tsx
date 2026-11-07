"use client";

import { useDemoText } from "@/lib/demo-locale";

import { DialogSheet } from "./dialog-sheet";

const copy = {
  en: { product: "Merino crew neck", price: "$68", sizeGuide: "Size guide", sizeTitle: "Find your size", sizeDesc: "Chest, measured flat, in cm.", rows: [["S", "48"], ["M", "51"], ["L", "54"]], chest: "Chest", close: "Close" },
  "zh-TW": { product: "美麗諾圓領針織衫", price: "NT$1,980", sizeGuide: "尺寸表", sizeTitle: "找到你的尺寸", sizeDesc: "平放量測胸寬，單位公分。", rows: [["S", "48"], ["M", "51"], ["L", "54"]], chest: "胸寬", close: "關閉" },
  "zh-CN": { product: "美丽诺圆领针织衫", price: "¥468", sizeGuide: "尺码表", sizeTitle: "找到你的尺码", sizeDesc: "平铺测量胸宽，单位厘米。", rows: [["S", "48"], ["M", "51"], ["L", "54"]], chest: "胸宽", close: "关闭" },
  ja: { product: "メリノ クルーネック", price: "¥9,900", sizeGuide: "サイズ表", sizeTitle: "サイズを選ぶ", sizeDesc: "平置きの身幅（cm）です。", rows: [["S", "48"], ["M", "51"], ["L", "54"]], chest: "身幅", close: "閉じる" },
};

const buttonClass =
  "rounded-md border border-[#e2e2e2] bg-[#f7f7f7] px-3 py-1.5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#e2e2e2]/60 dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]";

/** 型錄卡片：手機寬的商品頁，點「尺寸表」從底部拉起一張面板，往下拖或點遮罩關閉。 */
export default function DialogSheetCard() {
  const t = useDemoText(copy);
  return (
    <div className="relative mx-auto h-[280px] w-80 overflow-hidden rounded-lg border bg-background">
      <div className="grid grid-cols-[7rem_1fr] gap-4 p-4">
        <div aria-hidden="true" className="aspect-[4/5] rounded-md bg-muted" />
        <div>
          <p className="font-semibold tracking-tight">{t.product}</p>
          <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">{t.price}</p>
          <div className="mt-4">
            <DialogSheet
              position="contained"
              variant="sheet"
              closeLabel={t.close}
              trigger={<button type="button" className={buttonClass}>{t.sizeGuide}</button>}
              title={t.sizeTitle}
              description={t.sizeDesc}
            >
              <table className="w-full text-left tabular-nums">
                <thead>
                  <tr className="border-b border-dashed border-[#e2e2e2] text-xs text-[#171717]/60 dark:border-[#333333] dark:text-[#ededed]/60">
                    <th className="py-1.5 font-medium" />
                    <th className="py-1.5 font-medium">{t.chest}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map(([size, chest]) => (
                    <tr key={size} className="border-b border-dashed border-[#e2e2e2] last:border-0 dark:border-[#333333]">
                      <td className="py-1.5 font-medium">{size}</td>
                      <td className="py-1.5">{chest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DialogSheet>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="mx-4 space-y-2">
        <div className="h-2 w-3/4 rounded-full bg-muted" />
        <div className="h-2 w-1/2 rounded-full bg-muted" />
      </div>
    </div>
  );
}
