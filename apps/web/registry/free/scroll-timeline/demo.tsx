"use client";

import { useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ScrollTimeline } from "./scroll-timeline";

const copy = {
  en: {
    order: "Order #A1042",
    eta: "Arrives Thursday",
    tracking: [
      { id: "placed", time: "Mon 09:12", title: "Order placed" },
      { id: "packed", time: "Mon 15:40", title: "Packed at our studio" },
      { id: "shipped", time: "Tue 08:05", title: "Handed to the courier" },
      { id: "out", time: "", title: "Out for delivery" },
      { id: "delivered", time: "", title: "Delivered" },
    ],
    story: "How a sweater gets made",
    steps: [
      { id: "s1", time: "Week 1", title: "Fibre", description: "Merino from one farm cooperative, scoured and combed in the same valley." },
      { id: "s2", time: "Week 2", title: "Spinning", description: "Spun into a two-ply yarn, then rested for a week so it does not twist after knitting." },
      { id: "s3", time: "Week 3", title: "Knitting", description: "Knitted panel by panel on flat machines, with each piece measured against the pattern." },
      { id: "s4", time: "Week 4", title: "Linking", description: "Seams joined stitch by stitch by hand, so they stretch with the fabric." },
      { id: "s5", time: "Week 5", title: "Finishing", description: "Washed, dried flat and steamed, then checked under daylight before folding." },
    ],
  },
  "zh-TW": {
    order: "訂單 #A1042",
    eta: "預計週四送達",
    tracking: [
      { id: "placed", time: "週一 09:12", title: "已成立訂單" },
      { id: "packed", time: "週一 15:40", title: "工作室已包裝" },
      { id: "shipped", time: "週二 08:05", title: "已交給物流" },
      { id: "out", time: "", title: "配送中" },
      { id: "delivered", time: "", title: "已送達" },
    ],
    story: "一件毛衣的誕生",
    steps: [
      { id: "s1", time: "第 1 週", title: "纖維", description: "來自同一個牧場合作社的美麗諾羊毛，在同一座山谷完成洗毛與梳理。" },
      { id: "s2", time: "第 2 週", title: "紡紗", description: "紡成雙股紗後靜置一週，織好之後才不會扭曲。" },
      { id: "s3", time: "第 3 週", title: "編織", description: "用橫機一片一片織，每片都對照版型量過尺寸。" },
      { id: "s4", time: "第 4 週", title: "縫合", description: "以手工逐針縫合，縫線能跟著布料一起伸縮。" },
      { id: "s5", time: "第 5 週", title: "整理", description: "水洗、平放晾乾、蒸氣整燙，在自然光下檢查後才折好。" },
    ],
  },
  "zh-CN": {
    order: "订单 #A1042",
    eta: "预计周四送达",
    tracking: [
      { id: "placed", time: "周一 09:12", title: "订单已提交" },
      { id: "packed", time: "周一 15:40", title: "工作室已打包" },
      { id: "shipped", time: "周二 08:05", title: "已交给快递" },
      { id: "out", time: "", title: "派送中" },
      { id: "delivered", time: "", title: "已签收" },
    ],
    story: "一件毛衣的诞生",
    steps: [
      { id: "s1", time: "第 1 周", title: "纤维", description: "来自同一个牧场合作社的美丽诺羊毛，在同一座山谷完成洗毛和梳理。" },
      { id: "s2", time: "第 2 周", title: "纺纱", description: "纺成双股纱后静置一周，织好之后才不会扭曲。" },
      { id: "s3", time: "第 3 周", title: "编织", description: "用横机一片一片织，每片都对照版型量过尺寸。" },
      { id: "s4", time: "第 4 周", title: "缝合", description: "手工逐针缝合，缝线能随面料一起伸缩。" },
      { id: "s5", time: "第 5 周", title: "整理", description: "水洗、平铺晾干、蒸汽熨烫，在自然光下检查后才叠好。" },
    ],
  },
  ja: {
    order: "注文 #A1042",
    eta: "木曜日にお届け予定",
    tracking: [
      { id: "placed", time: "月 09:12", title: "ご注文を承りました" },
      { id: "packed", time: "月 15:40", title: "アトリエで梱包しました" },
      { id: "shipped", time: "火 08:05", title: "配送業者に引き渡しました" },
      { id: "out", time: "", title: "配達中" },
      { id: "delivered", time: "", title: "お届け済み" },
    ],
    story: "セーターができるまで",
    steps: [
      { id: "s1", time: "1 週目", title: "原毛", description: "ひとつの牧場組合のメリノを、同じ谷で洗毛・コーミング。" },
      { id: "s2", time: "2 週目", title: "紡績", description: "双糸に紡いだあと 1 週間寝かせ、編んだあとにねじれないようにします。" },
      { id: "s3", time: "3 週目", title: "編み立て", description: "横編機でパーツごとに編み、型紙と寸法を照らし合わせます。" },
      { id: "s4", time: "4 週目", title: "リンキング", description: "縫い目を一目ずつ手でつなぎ、生地と一緒に伸びるようにします。" },
      { id: "s5", time: "5 週目", title: "仕上げ", description: "洗い、平干し、スチームをかけ、自然光で検品してからたたみます。" },
    ],
  },
};

export default function ScrollTimelineDemo() {
  const t = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-[1fr_1.3fr]">
      <div className="rounded-lg border border-[#e2e2e2] bg-[#f7f7f7] p-5 text-[#171717] dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]">
        <p className="font-mono text-xs tracking-[0.12em] opacity-60">{t.order}</p>
        <p className="mb-5 mt-1 text-lg font-semibold tracking-tight">{t.eta}</p>
        <ScrollTimeline mode="progress" current={2} items={t.tracking} className="space-y-5" />
      </div>
      <div ref={scroller} className="relative h-[26rem] overflow-y-auto rounded-lg border bg-background p-6">
        <p className="mb-6 text-lg font-semibold tracking-tight">{t.story}</p>
        <ScrollTimeline items={t.steps} container={scroller} anchor={0.55} className="space-y-12" />
        <div aria-hidden="true" className="h-56" />
      </div>
    </div>
  );
}
