"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { SidePanel } from "./side-panel";

const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const paperUnder = "bg-[#efefef] dark:bg-[#262626]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";

const prices = [128, 96, 84, 42];
const bagPrices = [128, 84];
const sizes = ["XS", "S", "M", "L", "XL"];
const colorIds = ["undyed", "oat", "charcoal", "olive"] as const;

const copy = {
  en: {
    products: ["Linen overshirt", "Wide-leg trousers", "Washed linen shirt", "Linen apron"],
    productColors: ["Oat", "Charcoal", "Undyed", "Olive"],
    bag: [
      { name: "Linen overshirt", detail: "Oat, M" },
      { name: "Washed linen shirt", detail: "Undyed, L" },
    ],
    colors: ["Undyed", "Oat", "Charcoal", "Olive"],
    filters: "Filters",
    collection: "Linen, autumn",
    bagLabel: "Bag",
    filtersDesc: "24 pieces in linen.",
    clear: "Clear all",
    show: "Show results",
    size: "Size",
    color: "Color",
    bagTitle: "Your bag",
    bagDesc: "Free shipping over $80.",
    subtotal: "Subtotal",
    checkout: "Checkout",
    sep: ", ",
  },
  "zh-TW": {
    products: ["亞麻罩衫", "寬褲", "水洗亞麻襯衫", "亞麻圍裙"],
    productColors: ["燕麥", "炭灰", "原色", "橄欖"],
    bag: [
      { name: "亞麻罩衫", detail: "燕麥，M" },
      { name: "水洗亞麻襯衫", detail: "原色，L" },
    ],
    colors: ["原色", "燕麥", "炭灰", "橄欖"],
    filters: "篩選",
    collection: "亞麻．秋季",
    bagLabel: "購物袋",
    filtersDesc: "共 24 件亞麻單品。",
    clear: "全部清除",
    show: "查看結果",
    size: "尺寸",
    color: "顏色",
    bagTitle: "你的購物袋",
    bagDesc: "滿 $80 免運費。",
    subtotal: "小計",
    checkout: "結帳",
    sep: "，",
  },
  "zh-CN": {
    products: ["亚麻罩衫", "阔腿裤", "水洗亚麻衬衫", "亚麻围裙"],
    productColors: ["燕麦", "炭灰", "本色", "橄榄"],
    bag: [
      { name: "亚麻罩衫", detail: "燕麦，M" },
      { name: "水洗亚麻衬衫", detail: "本色，L" },
    ],
    colors: ["本色", "燕麦", "炭灰", "橄榄"],
    filters: "筛选",
    collection: "亚麻·秋季",
    bagLabel: "购物袋",
    filtersDesc: "共 24 件亚麻单品。",
    clear: "全部清除",
    show: "查看结果",
    size: "尺码",
    color: "颜色",
    bagTitle: "你的购物袋",
    bagDesc: "满 $80 包邮。",
    subtotal: "小计",
    checkout: "去结算",
    sep: "，",
  },
  ja: {
    products: ["リネンのシャツジャケット", "ワイドパンツ", "洗いざらしリネンシャツ", "リネンエプロン"],
    productColors: ["オート", "チャコール", "生成り", "オリーブ"],
    bag: [
      { name: "リネンのシャツジャケット", detail: "オート、M" },
      { name: "洗いざらしリネンシャツ", detail: "生成り、L" },
    ],
    colors: ["生成り", "オート", "チャコール", "オリーブ"],
    filters: "絞り込み",
    collection: "リネン、秋",
    bagLabel: "バッグ",
    filtersDesc: "リネンのアイテム 24 点。",
    clear: "すべてクリア",
    show: "結果を表示",
    size: "サイズ",
    color: "カラー",
    bagTitle: "ショッピングバッグ",
    bagDesc: "$80 以上で送料無料。",
    subtotal: "小計",
    checkout: "レジに進む",
    sep: "、",
  },
};

const money = (n: number) => `$${n}`;
const trigger =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium outline-none hover:underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring";
const primary =
  "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function SidePanelDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [panel, setPanel] = useState<"filters" | "bag" | null>(null);
  const [picked, setPicked] = useState<string[]>(["M"]);
  const close = (open: boolean) => !open && setPanel(null);
  const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <div className={cn("relative h-[30rem] w-full max-w-3xl overflow-hidden rounded-md border", paper, edge, ink)}>
      <header className={cn("flex items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5", edge)}>
        <button type="button" onClick={() => setPanel("filters")} className={trigger}>
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" />
          </svg>
          {t.filters}
          {picked.length > 0 && <span className={cn("tabular-nums", inkMuted)}>({picked.length})</span>}
        </button>
        <span className="text-sm font-semibold tracking-tight">{t.collection}</span>
        <button type="button" onClick={() => setPanel("bag")} className={trigger}>
          {t.bagLabel} <span className={cn("tabular-nums", inkMuted)}>({bagPrices.length})</span>
        </button>
      </header>

      <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
        {t.products.map((name, i) => (
          <li key={i} className="text-sm">
            <div aria-hidden="true" className={cn("aspect-[4/3] rounded-[3px]", paperUnder)} />
            <p className="mt-2 font-medium">{name}</p>
            <p className={cn("tabular-nums", inkMuted)}>
              {t.productColors[i]}
              {t.sep}
              {money(prices[i])}
            </p>
          </li>
        ))}
      </ul>

      <SidePanel
        open={panel === "filters"}
        onOpenChange={close}
        side="left"
        size="sm"
        portal={false}
        locale={locale}
        title={t.filters}
        description={t.filtersDesc}
        footer={
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => setPicked([])} className={cn(trigger, "px-0")}>
              {t.clear}
            </button>
            <button type="button" onClick={() => setPanel(null)} className={primary}>
              {t.show}
            </button>
          </div>
        }
      >
        <fieldset className="space-y-2.5">
          <legend className={cn("mb-2.5 text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.size}</legend>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <label key={s} className={cn("relative cursor-pointer rounded-[3px] border px-2.5 py-1 text-sm tabular-nums has-[:checked]:border-[#171717] has-[:checked]:bg-[#171717] has-[:checked]:text-[#f7f7f7] dark:has-[:checked]:border-[#ededed] dark:has-[:checked]:bg-[#ededed] dark:has-[:checked]:text-[#1c1c1c] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", edge)}>
                <input type="checkbox" checked={picked.includes(s)} onChange={() => toggle(s)} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className={cn("mb-2.5 text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.color}</legend>
          <div className="space-y-2 text-sm">
            {colorIds.map((id, i) => (
              <label key={id} className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} className="size-4 accent-[#171717] dark:accent-[#ededed]" />
                {t.colors[i]}
              </label>
            ))}
          </div>
        </fieldset>
      </SidePanel>

      <SidePanel
        open={panel === "bag"}
        onOpenChange={close}
        side="right"
        size="sm"
        portal={false}
        locale={locale}
        title={t.bagTitle}
        description={t.bagDesc}
        footer={
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={inkMuted}>{t.subtotal}</span>
              <span className="font-semibold tabular-nums">{money(bagPrices.reduce((n, p) => n + p, 0))}</span>
            </div>
            <button type="button" className={cn(primary, "w-full")}>
              {t.checkout}
            </button>
          </div>
        }
      >
        <ul className={cn("divide-y", "divide-[#e2e2e2] dark:divide-[#333333]")}>
          {t.bag.map((b, i) => (
            <li key={i} className="flex gap-3 py-3 first:pt-0">
              <div aria-hidden="true" className={cn("h-16 w-13 shrink-0 rounded-[3px]", paperUnder)} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{b.name}</p>
                <p className={inkMuted}>{b.detail}</p>
              </div>
              <span className="text-sm tabular-nums">{money(bagPrices[i])}</span>
            </li>
          ))}
        </ul>
      </SidePanel>
    </div>
  );
}
