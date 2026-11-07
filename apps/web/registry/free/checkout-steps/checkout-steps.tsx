"use client";

import { LayoutGroup, motion, useReducedMotion, type Transition } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * 結帳步驟：步驟會記得答案。
 * - 完成的步驟收成一行答案（「7-Eleven 取貨」「Visa ·· 4242」）加小勾，給 onStepClick 就能點回去改
 * - 目前步驟展開成帶名稱的膠囊（唯一的強調色 primary）
 * - 未來步驟只剩安靜的編號刻度
 * 換步時同一條軌道變形（layout，gentle 彈簧），底下的墨線跟著推進；左端是錨點，不動。
 * 容器窄於 420px 改成「2/4 付款」加分段條，完成的答案仍可點。需要 Tailwind v4 的容器查詢。
 * 顏色全用 shadcn token，跟著網站明暗。
 */

export type CheckoutStepsTheme = "light" | "dark" | "system";

const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const instant: Transition = { duration: 0 };

export interface CheckoutStepsProps {
  /** 步驟名稱，例如 ["確認訂單", "配送", "付款", "完成"] */
  steps: string[];
  /** 目前步驟的 index（從 0 起算），之前的步驟顯示為已完成 */
  current: number;
  /** 每個已完成步驟的答案，例如 ["2 件 · NT$1,280", "7-11 信義店取貨"]；沒有就顯示步驟名稱 */
  summaries?: (ReactNode | null | undefined)[];
  /** 給了之後，已完成的步驟變成按鈕，點了回到那一步 */
  onStepClick?: (index: number) => void;
  /** ol 的無障礙名稱，優先於 labels.label */
  label?: string;
  /** 已完成步驟附加給螢幕閱讀器的字，優先於 labels.done */
  doneLabel?: string;
  /**
   * system（預設）與 light 跟著網站的 token；dark 在外層加上 `dark` class，
   * 讓 shadcn 的 .dark token 在元件內生效。元件本身沒有底色。
   */
  theme?: CheckoutStepsTheme;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CheckoutStepsLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface CheckoutStepsLabels {
  label: string;
  done: string;
  /** 已完成步驟按鈕的動作前綴，例如「修改」 */
  edit?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<CheckoutStepsLabels>> = {
  en: { label: "Checkout steps", done: "completed", edit: "Edit" },
  "zh-TW": { label: "結帳步驟", done: "已完成", edit: "修改" },
  "zh-CN": { label: "结账步骤", done: "已完成", edit: "修改" },
  ja: { label: "購入手続きのステップ", done: "完了", edit: "変更" },
};

// 線寬 1.5 的勾
function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface DoneProps {
  index: number;
  name: string;
  summary: ReactNode;
  onStepClick?: (index: number) => void;
  sep: { comma: string; colon: string };
  doneLabel: string;
  editLabel: string;
  className?: string;
}

/** 已完成的步驟：小勾加答案；有 onStepClick 時是按鈕 */
function DoneStep({ index, name, summary, onStepClick, sep, doneLabel, editLabel, className }: DoneProps) {
  const hasSummary = summary != null && summary !== false && summary !== "";
  const body = (
    <>
      <CheckIcon />
      <span className="min-w-0 truncate">
        {hasSummary && (
          <span className="sr-only">
            {onStepClick ? `${editLabel} ` : ""}
            {name}
            {sep.colon}
          </span>
        )}
        {!hasSummary && onStepClick && <span className="sr-only">{editLabel} </span>}
        {hasSummary ? summary : name}
        <span className="sr-only">
          {sep.comma}
          {doneLabel}
        </span>
      </span>
    </>
  );
  const base = "flex min-w-0 items-center gap-1 text-muted-foreground";
  if (!onStepClick) {
    return (
      <span className={cn(base, className)} title={name}>
        {body}
      </span>
    );
  }
  return (
    <button
      type="button"
      title={name}
      onClick={() => onStepClick(index)}
      className={cn(
        base,
        "cursor-pointer rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {body}
    </button>
  );
}

/** 結帳步驟：完成的步驟留下答案，目前步驟是膠囊，未來步驟是刻度。 */
export function CheckoutSteps({
  steps,
  current,
  summaries,
  onStepClick,
  label: labelProp,
  doneLabel: doneLabelProp,
  theme = "system",
  locale = "en",
  labels,
  className,
  style,
}: CheckoutStepsProps) {
  const reduce = useReducedMotion();
  const loc = resolveLocale(locale);
  const t = { ...MESSAGES[loc], ...labels };
  const label = labelProp ?? t.label;
  const doneLabel = doneLabelProp ?? t.done;
  const editLabel = t.edit ?? MESSAGES[loc].edit;
  const sep = loc === "en" ? { comma: ", ", colon: ": " } : { comma: "，", colon: "：" };
  const total = steps.length;
  const at = Math.min(Math.max(current, 0), Math.max(total - 1, 0));
  const spring = reduce ? instant : gentle;

  const done = (i: number, cls?: string) => (
    <DoneStep
      index={i}
      name={steps[i]}
      summary={summaries?.[i]}
      onStepClick={onStepClick}
      sep={sep}
      doneLabel={doneLabel}
      editLabel={editLabel}
      className={cls}
    />
  );

  return (
    <div className={cn("@container w-full min-w-0 text-[13px]", theme === "dark" && "dark", className)} style={style}>
      {/* 寬版：一條會變形的軌道 */}
      <LayoutGroup>
        <ol aria-label={label} className="relative hidden min-w-0 items-center border-b border-border @min-[420px]:flex">
          {steps.map((s, i) => {
            const state = i < at ? "done" : i === at ? "current" : "next";
            return (
              <motion.li
                key={i}
                layout={!reduce}
                transition={spring}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "relative flex h-10 items-center px-1.5",
                  state === "done" ? "min-w-0 shrink" : "shrink-0",
                )}
              >
                <motion.span layout={reduce ? false : "position"} transition={spring} className="flex min-w-0 items-center">
                  {state === "done" && done(i, "max-w-[9rem]")}
                  {state === "current" && (
                    <span
                      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary pr-3 pl-2 font-medium text-primary-foreground"
                    >
                      <span className="tabular-nums opacity-70">{i + 1}</span>
                      <span className="whitespace-nowrap">{s}</span>
                    </span>
                  )}
                  {state === "next" && (
                    <span className="grid size-5 place-items-center rounded-full border border-border text-[11px] text-muted-foreground tabular-nums">
                      <span aria-hidden>{i + 1}</span>
                      <span className="sr-only">{s}</span>
                    </span>
                  )}
                </motion.span>
                {/* 墨線：完成與目前的步驟底下畫滿，從左往右推進 */}
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ scaleX: state === "next" ? 0 : 1 }}
                  transition={spring}
                  className="absolute inset-x-0 -bottom-px h-px origin-left bg-foreground"
                />
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>

      {/* 窄版：「2/4 付款」加分段條，完成的答案排在下面 */}
      <div className="@min-[420px]:hidden">
        <p aria-hidden className="flex min-w-0 items-baseline gap-2">
          <span className="text-muted-foreground tabular-nums">
            {at + 1}/{total}
          </span>
          <span className="truncate font-medium text-foreground">{steps[at]}</span>
        </p>
        <div aria-hidden className="mt-2 flex gap-1">
          {steps.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <motion.span
                initial={false}
                animate={{ scaleX: i <= at ? 1 : 0 }}
                transition={spring}
                className={cn("block h-full origin-left", i === at ? "bg-primary" : "bg-foreground")}
              />
            </span>
          ))}
        </div>
        <ol aria-label={label} className="mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[12px]">
          {steps.map((s, i) =>
            i < at ? (
              <li key={i} className="flex min-w-0 max-w-full">
                {done(i, "max-w-full")}
              </li>
            ) : (
              <li key={i} aria-current={i === at ? "step" : undefined} className="sr-only">
                {s}
              </li>
            ),
          )}
        </ol>
      </div>
    </div>
  );
}
