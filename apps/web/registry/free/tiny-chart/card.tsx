"use client";

import { useMemo } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TinyChart, type TinyChartCopy, type TinyMachine } from "./tiny-chart";

type Text = { ui: Partial<TinyChartCopy>; title: string; sub: string; s: string[]; e: [string, string, string] };

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Text> = {
  en: {
    ui: {},
    title: "A monthly box",
    sub: "a loop, and the one way off it",
    s: ["Active", "Packed", "Delivered", "Renewal", "Paused", "Cancelled"],
    e: ["skip", "resume", "cancel"],
  },
  "zh-TW": {
    ui: {
      play: "全部播放",
      next: "下一步",
      step: (n, t) => `第 ${n} 步，共 ${t} 步`,
      idle: "按「全部播放」或「下一步」。",
      done: "已經是最後一步，按「全部播放」再看一次。",
      choose: (c) => `先選一個：${c}。`,
      notHere: (e, w) => `現在不行：「${e}」只會在「${w}」發生。`,
      stuck: "這裡沒有下一步。",
    },
    title: "每月訂閱盒",
    sub: "一個循環，和唯一的出口",
    s: ["訂閱中", "已裝箱", "已送達", "續訂日", "暫停中", "已取消"],
    e: ["跳過", "恢復", "取消"],
  },
  "zh-CN": {
    ui: {
      play: "全部播放",
      next: "下一步",
      step: (n, t) => `第 ${n} 步，共 ${t} 步`,
      idle: "按「全部播放」或「下一步」。",
      done: "已经是最后一步，按「全部播放」再看一次。",
      choose: (c) => `先选一个：${c}。`,
      notHere: (e, w) => `现在不行：「${e}」只会在「${w}」发生。`,
      stuck: "这里没有下一步。",
    },
    title: "每月订阅盒",
    sub: "一个循环，和唯一的出口",
    s: ["订阅中", "已装箱", "已送达", "续订日", "暂停中", "已取消"],
    e: ["跳过", "恢复", "取消"],
  },
  ja: {
    ui: {
      play: "すべて再生",
      next: "次へ",
      step: (n, t) => `${t} ステップ中 ${n}`,
      idle: "「すべて再生」か「次へ」を押してください。",
      done: "これが最後のステップです。「すべて再生」でもう一度。",
      choose: (c) => `先にどちらかを選んでください：${c}。`,
      notHere: (e, w) => `今はできません：「${e}」は「${w}」のときだけ起こります。`,
      stuck: "ここから先はありません。",
    },
    title: "毎月の定期便",
    sub: "ループと、ひとつだけの出口",
    s: ["契約中", "梱包済み", "お届け済み", "更新日", "一時停止", "解約済み"],
    e: ["スキップ", "再開", "解約"],
  },
};

function boxMachine(t: Text): TinyMachine {
  const ids = ["active", "packed", "delivered", "renewal", "paused", "cancelled"];
  return {
    initial: "active",
    states: ids.map((id, i) => ({ id, label: t.s[i], final: id === "cancelled" })),
    transitions: [
      { from: "active", to: "packed" },
      { from: "packed", to: "delivered" },
      { from: "delivered", to: "renewal" },
      { from: "renewal", to: "active" },
      { from: "active", to: "paused", on: "skip" },
      { from: "paused", to: "renewal", on: "resume" },
      { from: "renewal", to: "cancelled", on: "cancel" },
    ],
    events: { skip: t.e[0], resume: t.e[1], cancel: t.e[2] },
    play: ["next", "next", "next", "next", "skip", "resume", "cancel"],
  };
}

/** 型錄卡片：一張訂閱盒的循環狀態圖，按「全部播放」看它繞一圈再從唯一出口離開，或一步一步按。 */
export default function TinyChartCard() {
  const t = useDemoText(copy);
  const machine = useMemo(() => boxMachine(t), [t]);
  return (
    // 狀態圖預設跟著寬度長高；卡片裡限制圖的高度（viewBox 等比置中），事件按鈕也縮短成一個詞，排得下一行
    <div className="mx-auto w-[28rem] [&_svg[role=img]]:h-48">
      <TinyChart machine={machine} layout="cycle" title={t.title} subtitle={t.sub} copy={t.ui} showLogic={false} />
    </div>
  );
}
