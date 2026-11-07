"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Hotspots } from "./hotspots";

const copy = {
  en: [
    { id: "collar", x: 50, y: 14, title: "Corduroy collar", description: "Turns up in wind." },
    { id: "wax", x: 32, y: 40, title: "Waxed cotton", description: "Sheds rain. Rewax once a year." },
    { id: "pocket", x: 64, y: 66, title: "Hand-warmer pockets", description: "Fleece-lined." },
  ],
  "zh-TW": [
    { id: "collar", x: 50, y: 14, title: "燈芯絨領", description: "起風時可以立起來。" },
    { id: "wax", x: 32, y: 40, title: "上蠟棉布", description: "能擋小雨，每年補蠟一次。" },
    { id: "pocket", x: 64, y: 66, title: "暖手口袋", description: "刷毛內裡。" },
  ],
  "zh-CN": [
    { id: "collar", x: 50, y: 14, title: "灯芯绒领", description: "起风时可以立起来。" },
    { id: "wax", x: 32, y: 40, title: "上蜡棉布", description: "能挡小雨，每年补蜡一次。" },
    { id: "pocket", x: 64, y: 66, title: "暖手口袋", description: "抓绒内衬。" },
  ],
  ja: [
    { id: "collar", x: 50, y: 14, title: "コーデュロイの襟", description: "風の日は立てられます。" },
    { id: "wax", x: 32, y: 40, title: "ワックスコットン", description: "小雨をはじく。年に一度リプルーフを。" },
    { id: "pocket", x: 64, y: 66, title: "ハンドウォーマー", description: "フリース裏地。" },
  ],
};

function Jacket() {
  return (
    <svg viewBox="0 0 400 400" className="block h-auto w-full" role="img" aria-hidden="true">
      <rect width="400" height="400" className="fill-[#ececec] dark:fill-[#272727]" />
      <g className="fill-[#acacac] stroke-[#171717]/50 dark:fill-[#606060] dark:stroke-[#ededed]/40" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M150 60 L120 72 L70 110 L40 300 L70 330 L95 330 L105 180 L110 360 L290 360 L295 180 L305 330 L330 330 L360 300 L330 110 L280 72 L250 60 Z" />
        <path d="M150 60 L200 120 L250 60 L235 45 L200 70 L165 45 Z" className="fill-[#7a5a3a] dark:fill-[#3b3b3b]" />
        <path d="M200 120 L200 360" fill="none" />
        <rect x="225" y="240" width="55" height="60" rx="4" />
        <rect x="120" y="240" width="55" height="60" rx="4" />
      </g>
    </svg>
  );
}

/** 型錄卡片：夾克圖上的編號熱點，點數字跳出那一處的細節小卡，再點別的數字切換。 */
export default function HotspotsCard() {
  const spots = useDemoText(copy);
  return (
    <div className="mx-auto w-80">
      <Hotspots spots={spots} defaultActive="wax" cardWidth={176} className="mx-auto w-60 overflow-visible rounded-md">
        <div className="overflow-hidden rounded-md">
          <Jacket />
        </div>
      </Hotspots>
    </div>
  );
}
