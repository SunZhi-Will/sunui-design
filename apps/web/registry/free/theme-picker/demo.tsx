"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ThemePicker, type ThemeMode } from "./theme-picker";

const copy = {
  en: { title: "Appearance", hint: "Applies to this preview only", labels: { system: "System", light: "Light", dark: "Dark" }, product: "Linen Tote", price: "$48", add: "Add to bag" },
  "zh-TW": { title: "外觀", hint: "只套用在這個預覽", labels: { system: "跟隨系統", light: "淺色", dark: "深色" }, product: "亞麻托特包", price: "NT$1,480", add: "加入購物袋" },
  "zh-CN": { title: "外观", hint: "只应用于这个预览", labels: { system: "跟随系统", light: "浅色", dark: "深色" }, product: "亚麻托特包", price: "¥328", add: "加入购物袋" },
  ja: { title: "外観", hint: "このプレビューにだけ適用", labels: { system: "システム", light: "ライト", dark: "ダーク" }, product: "リネントート", price: "¥6,800", add: "カートに入れる" },
};

/** The demo scopes the theme to one panel. In an app, use useThemeMode() to set it on <html>. */
export default function ThemePickerDemo() {
  const t = useDemoText(copy);
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<ThemeMode>("system");

  return (
    <section className="w-full max-w-sm rounded-xl border bg-card p-5 text-card-foreground">
      <h3 className="text-sm font-semibold">{t.title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
      <ThemePicker className="mt-4" value={mode} onValueChange={setMode} labels={t.labels} aria-label={t.title} />

      <div className="relative mt-5 h-[88px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={mode}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            className={`${mode === "system" ? "" : mode} absolute inset-0 flex items-center gap-3 rounded-lg border bg-background p-3 text-foreground`}
          >
            <div className="grid size-16 shrink-0 place-items-center rounded-md bg-muted">
              <svg viewBox="0 0 24 24" className="size-7 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9h12l-1 11H7L6 9Z" />
                <path d="M9 9V7a3 3 0 0 1 6 0v2" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.product}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{t.price}</p>
            </div>
            <span className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">{t.add}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
