"use client";

import { useDemoText } from "@/lib/demo-locale";

import { buttonEffects, EffectButton, type ButtonEffect } from "./button-effects";

type Hint = "hover" | "press" | "near" | "loop";

export const hints: Record<ButtonEffect, Hint> = {
  "rolling-text": "hover",
  "direction-fill": "hover",
  "shine-sweep": "loop",
  "rotating-border": "loop",
  ripple: "press",
  magnetic: "near",
  jelly: "hover",
  "press-3d": "press",
  "icon-slide": "hover",
  "expand-label": "hover",
  "border-draw": "hover",
  "neon-glow": "loop",
  "background-sweep": "hover",
  "shutter-fill": "hover",
  "underline-reveal": "hover",
  "send-feedback": "press",
};

export const copy = {
  en: {
    title: "Button effects",
    intro: "16 hover and press effects on a real button. Switch them with the effect prop.",
    hints: { hover: "Hover", press: "Press", near: "Move close", loop: "Always on, faster on hover" },
    labels: {
      "rolling-text": "Get started",
      "direction-fill": "Explore",
      "shine-sweep": "Upgrade",
      "rotating-border": "New release",
      ripple: "Press me",
      magnetic: "Come closer",
      jelly: "Boing",
      "press-3d": "Push",
      "icon-slide": "Continue",
      "expand-label": "Add item",
      "border-draw": "Outline",
      "neon-glow": "Go live",
      "background-sweep": "Learn more",
      "shutter-fill": "Book now",
      "underline-reveal": "Read the docs",
      "send-feedback": "Send",
    },
    status: { loading: "Sending", done: "Sent" },
  },
  "zh-TW": {
    title: "按鈕效果",
    intro: "16 種懸停與按壓效果，都是真正的 button。用 effect prop 切換。",
    hints: { hover: "懸停", press: "按下", near: "靠近", loop: "常駐，懸停時加快" },
    labels: {
      "rolling-text": "開始使用",
      "direction-fill": "探索",
      "shine-sweep": "升級方案",
      "rotating-border": "新版上線",
      ripple: "按我",
      magnetic: "靠近一點",
      jelly: "彈一下",
      "press-3d": "按下去",
      "icon-slide": "繼續",
      "expand-label": "加入項目",
      "border-draw": "描邊",
      "neon-glow": "開始直播",
      "background-sweep": "了解更多",
      "shutter-fill": "立即預約",
      "underline-reveal": "閱讀文件",
      "send-feedback": "送出",
    },
    status: { loading: "送出中", done: "已送出" },
  },
  "zh-CN": {
    title: "按钮效果",
    intro: "16 种悬停与按压效果，都是真正的 button。用 effect prop 切换。",
    hints: { hover: "悬停", press: "按下", near: "靠近", loop: "常驻，悬停时加快" },
    labels: {
      "rolling-text": "开始使用",
      "direction-fill": "探索",
      "shine-sweep": "升级方案",
      "rotating-border": "新版上线",
      ripple: "按我",
      magnetic: "靠近一点",
      jelly: "弹一下",
      "press-3d": "按下去",
      "icon-slide": "继续",
      "expand-label": "添加项目",
      "border-draw": "描边",
      "neon-glow": "开始直播",
      "background-sweep": "了解更多",
      "shutter-fill": "立即预约",
      "underline-reveal": "阅读文档",
      "send-feedback": "发送",
    },
    status: { loading: "发送中", done: "已发送" },
  },
  ja: {
    title: "ボタンエフェクト",
    intro: "本物の button に付けるホバーと押下のエフェクト 16 種。effect prop で切り替えます。",
    hints: { hover: "ホバー", press: "押す", near: "近づける", loop: "常時、ホバーで加速" },
    labels: {
      "rolling-text": "はじめる",
      "direction-fill": "見てみる",
      "shine-sweep": "アップグレード",
      "rotating-border": "新リリース",
      ripple: "押してみて",
      magnetic: "近づいて",
      jelly: "ぷるん",
      "press-3d": "押す",
      "icon-slide": "次へ",
      "expand-label": "追加",
      "border-draw": "アウトライン",
      "neon-glow": "配信開始",
      "background-sweep": "詳しく見る",
      "shutter-fill": "今すぐ予約",
      "underline-reveal": "ドキュメント",
      "send-feedback": "送信",
    },
    status: { loading: "送信中", done: "送信しました" },
  },
};

export default function ButtonEffectsDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-5xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {buttonEffects.map((effect) => (
          <div key={effect} className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 text-card-foreground">
            <div className="flex items-baseline justify-between gap-2">
              <code className="font-mono text-xs">{effect}</code>
              <span className="text-xs text-muted-foreground">{t.hints[hints[effect]]}</span>
            </div>
            <div className="grid min-h-24 place-items-center">
              <EffectButton effect={effect} statusLabels={t.status}>
                {t.labels[effect]}
              </EffectButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
