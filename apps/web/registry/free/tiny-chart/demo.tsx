"use client";

import { useMemo } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TinyChart, type TinyChartCopy, type TinyMachine } from "./tiny-chart";

type Text = {
  ui: Partial<TinyChartCopy>;
  order: { title: string; sub: string; s: string[]; say: string[]; e: [string, string, string]; g: [string, string]; l: string[] };
  pre: { title: string; sub: string; s: string[]; d: string[]; e: [string, string] };
  box: { title: string; sub: string; s: string[]; e: [string, string, string]; rule: [string, string] };
};

const en: Text = {
  ui: {},
  order: {
    title: "Where your order is",
    sub: "from checkout to your door",
    s: ["Placed", "Paid", "Payment failed", "Packed", "Shipped", "Out for delivery", "Missed", "Delivered"],
    say: ["", "Payment cleared. The warehouse has it.", "The card was declined. Nothing ships yet.", "Boxed and labelled.", "Handed to the courier.", "On the van today.", "Nobody home. A card goes through the door.", "Signed for. Done."],
    e: ["card declined", "nobody home", "try again"],
    g: ["card OK", "card declined"],
    l: ["picked and boxed", "label scanned", "next morning", "tomorrow"],
  },
  pre: {
    title: "A pre-order, to scale",
    sub: "the longer the stretch, the longer the wait",
    s: ["Ordered", "Made to order", "Quality check", "Shipped", "Delivered"],
    d: ["1 day", "14 days", "2 days", "3 days"],
    e: ["fails the check", "passes"],
  },
  box: {
    title: "A monthly box",
    sub: "a loop, and the one way off it",
    s: ["Active", "Packed", "Delivered", "Renewal", "Paused", "Cancelled"],
    e: ["skip a month", "resume", "cancel"],
    rule: ["You can only cancel between boxes", "Once a box is packed, it ships. Cancel waits for the renewal date."],
  },
};

const zhTW: Text = {
  ui: {
    play: "全部播放",
    next: "下一步",
    logic: "背後的規則",
    step: (n, t) => `第 ${n} 步，共 ${t} 步`,
    idle: "按「全部播放」或「下一步」。",
    done: "已經是最後一步，按「全部播放」再看一次。",
    choose: (c) => `先選一個：${c}。`,
    notHere: (e, w) => `現在不行：「${e}」只會在「${w}」發生。`,
    stuck: "這裡沒有下一步。",
    moves: "所有路徑",
    checks: { ids: "每條箭頭都接著真的步驟", reach: "每一步都能從起點走到", exits: "沒有死路，每一步都還能走完", oneWay: "同一步的同一個按鈕只做一件事" },
  },
  order: {
    title: "你的訂單到哪了",
    sub: "從結帳到送到你家",
    s: ["已下單", "已付款", "付款失敗", "已包裝", "已出貨", "配送中", "未遇收件人", "已送達"],
    say: ["", "付款成功，倉庫收到訂單了。", "刷卡被拒，還不會出貨。", "裝箱、貼好標籤。", "交給物流了。", "今天會送到。", "沒人在家，留下招領單。", "已簽收，完成。"],
    e: ["刷卡被拒", "沒人在家", "重新付款"],
    g: ["刷卡成功", "刷卡被拒"],
    l: ["揀貨裝箱", "掃描標籤", "隔天早上", "明天再送"],
  },
  pre: {
    title: "預購商品，照比例",
    sub: "線越長，等越久",
    s: ["已下單", "接單製作", "品質檢查", "已出貨", "已送達"],
    d: ["1 天", "14 天", "2 天", "3 天"],
    e: ["檢查不合格", "檢查通過"],
  },
  box: {
    title: "每月訂閱盒",
    sub: "一個循環，和唯一的出口",
    s: ["訂閱中", "已裝箱", "已送達", "續訂日", "暫停中", "已取消"],
    e: ["跳過一個月", "恢復訂閱", "取消"],
    rule: ["只能在兩盒之間取消", "裝箱後一定會寄出，取消要等到續訂日。"],
  },
};

const zhCN: Text = {
  ui: {
    ...zhTW.ui,
    play: "全部播放",
    logic: "背后的规则",
    step: (n, t) => `第 ${n} 步，共 ${t} 步`,
    idle: "按「全部播放」或「下一步」。",
    done: "已经是最后一步，按「全部播放」再看一次。",
    choose: (c) => `先选一个：${c}。`,
    notHere: (e, w) => `现在不行：「${e}」只会在「${w}」发生。`,
    stuck: "这里没有下一步。",
    moves: "所有路径",
    checks: { ids: "每条箭头都连着真实的步骤", reach: "每一步都能从起点走到", exits: "没有死路，每一步都还能走完", oneWay: "同一步的同一个按钮只做一件事" },
  },
  order: {
    title: "你的订单到哪了",
    sub: "从结账到送到你家",
    s: ["已下单", "已付款", "付款失败", "已打包", "已发货", "派送中", "未遇收件人", "已送达"],
    say: ["", "付款成功，仓库收到订单了。", "银行卡被拒，还不会发货。", "装箱、贴好面单。", "交给快递了。", "今天会送到。", "没人在家，留下取件通知。", "已签收，完成。"],
    e: ["卡被拒", "没人在家", "重新付款"],
    g: ["付款成功", "卡被拒"],
    l: ["拣货装箱", "扫描面单", "第二天早上", "明天再送"],
  },
  pre: {
    title: "预售商品，按比例",
    sub: "线越长，等越久",
    s: ["已下单", "接单制作", "质量检查", "已发货", "已送达"],
    d: ["1 天", "14 天", "2 天", "3 天"],
    e: ["检查不合格", "检查通过"],
  },
  box: {
    title: "每月订阅盒",
    sub: "一个循环，和唯一的出口",
    s: ["订阅中", "已装箱", "已送达", "续订日", "暂停中", "已取消"],
    e: ["跳过一个月", "恢复订阅", "取消"],
    rule: ["只能在两盒之间取消", "装箱后一定会寄出，取消要等到续订日。"],
  },
};

const ja: Text = {
  ui: {
    play: "すべて再生",
    next: "次へ",
    logic: "ルールを見る",
    step: (n, t) => `${t} ステップ中 ${n}`,
    idle: "「すべて再生」か「次へ」を押してください。",
    done: "これが最後のステップです。「すべて再生」でもう一度。",
    choose: (c) => `先にどちらかを選んでください：${c}。`,
    notHere: (e, w) => `今はできません：「${e}」は「${w}」のときだけ起こります。`,
    stuck: "ここから先はありません。",
    moves: "すべての経路",
    checks: { ids: "どの矢印も実在するステップをつなぐ", reach: "どのステップにも最初からたどり着ける", exits: "行き止まりがなく、どこからでも終われる", oneWay: "同じステップで同じボタンは一つの動きだけ" },
  },
  order: {
    title: "ご注文の現在地",
    sub: "購入からお届けまで",
    s: ["注文済み", "支払い済み", "支払い失敗", "梱包済み", "発送済み", "配達中", "不在", "お届け済み"],
    say: ["", "支払いが完了し、倉庫に届きました。", "カードが通りませんでした。まだ発送されません。", "箱詰めしてラベルを貼りました。", "配送業者に渡しました。", "本日お届け予定です。", "ご不在のため、不在票を入れました。", "受け取り完了です。"],
    e: ["カード拒否", "不在", "再度支払う"],
    g: ["カード OK", "カード拒否"],
    l: ["ピッキングと梱包", "ラベル読み取り", "翌朝", "翌日再配達"],
  },
  pre: {
    title: "予約商品、縮尺どおり",
    sub: "線が長いほど、待ち時間も長い",
    s: ["注文済み", "受注生産", "品質検査", "発送済み", "お届け済み"],
    d: ["1 日", "14 日", "2 日", "3 日"],
    e: ["検査不合格", "検査合格"],
  },
  box: {
    title: "毎月の定期便",
    sub: "ループと、ひとつだけの出口",
    s: ["契約中", "梱包済み", "お届け済み", "更新日", "一時停止", "解約済み"],
    e: ["1か月スキップ", "再開", "解約"],
    rule: ["解約できるのは箱と箱のあいだだけ", "梱包後は必ず発送されます。解約は更新日を待ちます。"],
  },
};

function orderMachine(t: Text["order"]): TinyMachine {
  const ids = ["placed", "paid", "failed", "packed", "shipped", "out", "missed", "delivered"];
  return {
    initial: "placed",
    states: ids.map((id, i) => ({
      id,
      label: t.s[i],
      say: t.say[i] || undefined,
      final: id === "delivered",
      at: ([[0, 0], [0, 1], [1, 1], [0, 2], [0, 3], [0, 4], [1, 5], [0, 5]] as [number, number][])[i],
    })),
    transitions: [
      { from: "placed", to: "paid", guard: t.g[0] },
      { from: "placed", to: "failed", on: "declined", guard: t.g[1] },
      { from: "failed", to: "paid", on: "retry" },
      { from: "paid", to: "packed", label: t.l[0] },
      { from: "packed", to: "shipped", label: t.l[1] },
      { from: "shipped", to: "out", label: t.l[2] },
      { from: "out", to: "delivered" },
      { from: "out", to: "missed", on: "away" },
      { from: "missed", to: "out", label: t.l[3] },
    ],
    events: { declined: t.e[0], away: t.e[1], retry: t.e[2] },
  };
}

function preorderMachine(t: Text["pre"]): TinyMachine {
  const ids = ["ordered", "making", "qc", "shipped", "delivered"];
  const days = [1, 14, 2, 3];
  return {
    initial: "ordered",
    states: ids.map((id, i) => ({ id, label: t.s[i], duration: days[i], final: id === "delivered" })),
    transitions: [
      { from: "ordered", to: "making", label: t.d[0] },
      { from: "making", to: "qc", label: t.d[1] },
      { from: "qc", to: "making", on: "fail", label: t.e[0] },
      { from: "qc", to: "shipped", on: "pass", label: t.d[2] },
      { from: "shipped", to: "delivered", label: t.d[3] },
    ],
    events: { fail: t.e[0], pass: t.e[1] },
    play: ["next", "next", "pass", "next"],
  };
}

function boxMachine(t: Text["box"]): TinyMachine {
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
    rules: [{ rule: t.rule[0], says: t.rule[1] }],
  };
}

export default function TinyChartDemo() {
  const t = useDemoText({ en, "zh-TW": zhTW, "zh-CN": zhCN, ja });
  const machines = useMemo(() => ({ order: orderMachine(t.order), pre: preorderMachine(t.pre), box: boxMachine(t.box) }), [t]);

  return (
    <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-2">
      <TinyChart machine={machines.order} title={t.order.title} subtitle={t.order.sub} copy={t.ui} className="lg:row-span-2" />
      <TinyChart machine={machines.pre} layout="timeline" title={t.pre.title} subtitle={t.pre.sub} copy={t.ui} />
      <TinyChart machine={machines.box} layout="cycle" title={t.box.title} subtitle={t.box.sub} copy={t.ui} />
    </div>
  );
}
