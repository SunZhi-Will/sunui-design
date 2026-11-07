"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SlidingTabs } from "./sliding-tabs";

const copy = {
  en: {
    tabs: [
      { value: "details", label: "Details", content: "Midweight merino, 18.5 micron. Ribbed cuffs and hem, relaxed fit." },
      { value: "care", label: "Care", content: "Hand wash cold or use the wool cycle. Dry flat, away from heat." },
      { value: "reviews", label: "Reviews", count: 128, content: "4.8 out of 5. Runs true to size and softens after one wash." },
    ],
  },
  "zh-TW": {
    tabs: [
      { value: "details", label: "說明", content: "中厚磅美麗諾羊毛，纖維 18.5 微米。羅紋袖口與下襬，身形寬鬆。" },
      { value: "care", label: "洗滌", content: "冷水手洗或使用羊毛洗程，平放陰乾，避免直接加熱。" },
      { value: "reviews", label: "評價", count: 128, content: "平均 4.8 分。尺寸正常，洗過一次後更柔軟。" },
    ],
  },
  "zh-CN": {
    tabs: [
      { value: "details", label: "详情", content: "中厚美丽诺羊毛，纤维 18.5 微米。罗纹袖口与下摆，版型宽松。" },
      { value: "care", label: "洗涤", content: "冷水手洗或使用羊毛洗程，平铺晾干，避免直接加热。" },
      { value: "reviews", label: "评价", count: 128, content: "平均 4.8 分。尺码标准，洗过一次后更柔软。" },
    ],
  },
  ja: {
    tabs: [
      { value: "details", label: "詳細", content: "中厚手のメリノウール、18.5 マイクロン。リブ編みの袖口と裾。" },
      { value: "care", label: "お手入れ", content: "冷水で手洗い、またはウールコースで。平干しで熱を避けて。" },
      { value: "reviews", label: "レビュー", count: 128, content: "平均 4.8。サイズ感は標準、洗うと柔らかくなる。" },
    ],
  },
};

/** 型錄卡片：商品頁的分頁，點標籤看底線滑過去、內容跟著方向換頁。 */
export default function SlidingTabsCard() {
  const t = useDemoText(copy);
  return (
    <div className="mx-auto w-80 rounded-lg border bg-background p-4">
      <SlidingTabs
        items={t.tabs.map((tab) => ({ ...tab, content: <p className="pt-4 text-sm leading-relaxed text-muted-foreground">{tab.content}</p> }))}
        contentClassName="min-h-24"
      />
    </div>
  );
}
