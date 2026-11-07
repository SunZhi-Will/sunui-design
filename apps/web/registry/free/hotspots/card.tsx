"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Hotspots } from "./hotspots";

const copy = {
  en: [
    { id: "collar", x: 50, y: 10, title: "Corduroy collar", description: "Turns up in wind." },
    { id: "wax", x: 30, y: 40, title: "Waxed cotton", description: "Sheds rain. Rewax once a year." },
    { id: "pocket", x: 68, y: 77, title: "Hand-warmer pockets", description: "Fleece-lined." },
  ],
  "zh-TW": [
    { id: "collar", x: 50, y: 10, title: "燈芯絨領", description: "起風時可以立起來。" },
    { id: "wax", x: 30, y: 40, title: "上蠟棉布", description: "能擋小雨，每年補蠟一次。" },
    { id: "pocket", x: 68, y: 77, title: "暖手口袋", description: "刷毛內裡。" },
  ],
  "zh-CN": [
    { id: "collar", x: 50, y: 10, title: "灯芯绒领", description: "起风时可以立起来。" },
    { id: "wax", x: 30, y: 40, title: "上蜡棉布", description: "能挡小雨，每年补蜡一次。" },
    { id: "pocket", x: 68, y: 77, title: "暖手口袋", description: "抓绒内衬。" },
  ],
  ja: [
    { id: "collar", x: 50, y: 10, title: "コーデュロイの襟", description: "風の日は立てられます。" },
    { id: "wax", x: 30, y: 40, title: "ワックスコットン", description: "小雨をはじく。年に一度リプルーフを。" },
    { id: "pocket", x: 68, y: 77, title: "ハンドウォーマー", description: "フリース裏地。" },
  ],
};

// 和完整 demo 同一張照片，裁成正方形（上下各裁 10%），熱點座標已換算
function Jacket() {
  return (
    <img
      src="/blocks/hotspots/jacket.webp"
      alt=""
      draggable={false}
      className="block aspect-square w-full object-cover select-none"
    />
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
