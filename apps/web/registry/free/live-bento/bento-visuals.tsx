"use client";

// Bento 格裡的小動畫。每個視覺都自帶 useTicker 或 useInView，只在畫面內播放。
// 需要放在 <LiveBento> 裡面（它負責注入 lb-* 動畫樣式）。

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useInView, useTicker } from "./live-bento";

const icon = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg {...icon} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg {...icon} className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg {...icon} className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function CompareIcon({ className }: { className?: string }) {
  return (
    <svg {...icon} className={className}>
      <circle cx="5" cy="6" r="3" />
      <path d="M12 6h5a2 2 0 0 1 2 2v7" />
      <path d="m15 9-3-3 3-3" />
      <circle cx="19" cy="18" r="3" />
      <path d="M12 18H7a2 2 0 0 1-2-2V9" />
      <path d="m9 15 3 3-3 3" />
    </svg>
  );
}

export function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg {...icon} className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

/* ---------- 版本歷史：節點依序亮起，最後浮出比較按鈕 ---------- */

export function VersionTimeline({
  versions,
  action,
  period = 6000,
}: {
  versions: { v: string; label: ReactNode; note: ReactNode }[];
  /** 最後浮出的膠囊內容 */
  action?: ReactNode;
  period?: number;
}) {
  const { ref, tick } = useTicker(period);
  return (
    <div ref={ref} className="w-full">
      <div key={tick}>
        <div className="relative">
          <div className="absolute top-4 right-[16%] left-[16%] h-px bg-border" />
          <div className="lb-grow-x absolute top-4 right-[16%] left-[16%] h-px origin-left bg-foreground" style={{ animationDuration: "1600ms" }} />
          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${versions.length}, minmax(0, 1fr))` }}>
            {versions.map((item, i) => (
              <li key={item.v} className="flex min-w-0 flex-col items-center text-center">
                <span
                  className="lb-pop flex size-8 items-center justify-center rounded-full border border-border bg-card font-mono text-xs font-medium shadow-sm"
                  style={{ animationDelay: `${i * 600}ms` }}
                >
                  {item.v}
                </span>
                <span className="lb-swap-in mt-3 text-sm" style={{ animationDelay: `${i * 600 + 150}ms` }}>
                  {item.label}
                </span>
                <span
                  className={cn(
                    "lb-swap-in mt-1 rounded-full px-2 py-0.5 text-[11px]",
                    i === 0 ? "bg-muted text-muted-foreground" : "bg-(--lb-warning)/10 text-(--lb-warning)",
                  )}
                  style={{ animationDelay: `${i * 600 + 250}ms` }}
                >
                  {item.note}
                </span>
              </li>
            ))}
          </ol>
        </div>
        {action ? (
          <div
            className="lb-swap-in mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs shadow-sm"
            style={{ animationDelay: "2000ms" }}
          >
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- 決定性：每次執行打出相同的雜湊值 ---------- */

export function MatchingRuns({
  runs,
  value,
  result,
  period = 5200,
}: {
  runs: ReactNode[];
  /** 逐字打出的值，8 個字元剛好配 steps(8) */
  value: string;
  result: ReactNode;
  period?: number;
}) {
  const { ref, tick } = useTicker(period);
  return (
    <div ref={ref} className="w-full">
      <div key={tick} className="w-full space-y-2 font-mono text-xs">
        {runs.map((label, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="font-sans text-muted-foreground">{label}</span>
            <span className="lb-type" style={{ animationDelay: `${i * 900}ms` }}>
              {value}
            </span>
          </div>
        ))}
        <p className="lb-swap-in flex items-center justify-center gap-1.5 pt-1 font-sans text-sm text-(--lb-success)" style={{ animationDelay: "2000ms" }}>
          <CheckIcon className="size-4" />
          {result}
        </p>
      </div>
    </div>
  );
}

/* ---------- 無解說明：缺人的格子紅色虛線呼吸，下方寫原因 ---------- */

export function GapAlert({
  cells,
  message,
}: {
  cells: { label: ReactNode; value: ReactNode; short?: boolean }[];
  message: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  return (
    <div ref={ref} className="w-full">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            className={cn(
              "min-w-0 rounded-xl border p-2 text-center text-xs transition-colors duration-500",
              cell.short && inView ? "lb-pulse-red border-dashed border-destructive/70 bg-destructive/5" : "border-border bg-muted/40",
            )}
          >
            <p className="truncate text-muted-foreground">{cell.label}</p>
            <p className="mt-1 font-medium">{cell.value}</p>
          </div>
        ))}
      </div>
      <p
        className={cn("mt-3 flex items-start gap-1.5 text-xs text-destructive transition-opacity duration-500", inView ? "opacity-100" : "opacity-0")}
        style={{ transitionDelay: "600ms" }}
      >
        <AlertIcon className="mt-px size-3.5 shrink-0" />
        {message}
      </p>
    </div>
  );
}

/* ---------- 兩種做法的長條比較 ---------- */

export function CompareBars({
  legend,
  rows,
}: {
  /** [淡色那一組, 實心那一組] */
  legend: [ReactNode, ReactNode];
  /** a、b 為 0 到 1 的比例 */
  rows: { label: ReactNode; a: number; b: number; format?: (v: number) => string }[];
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  return (
    <div ref={ref} className="w-full">
      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-foreground/25" />
          {legend[0]}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-foreground" />
          {legend[1]}
        </span>
      </div>
      <div className="space-y-4">
        {rows.map((row, i) => {
          const fmt = row.format ?? ((v: number) => `${Math.round(v * 100)}%`);
          return (
            <div key={i} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3">
              <span className="text-sm">{row.label}</span>
              <div className="space-y-1.5">
                {(["a", "b"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full origin-left rounded-full transition-transform duration-[1100ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                          k === "b" ? "bg-foreground" : "bg-foreground/25",
                        )}
                        style={{ transform: `scaleX(${inView ? row[k] : 0})`, transitionDelay: `${i * 140 + (k === "b" ? 100 : 0)}ms` }}
                      />
                    </div>
                    <span className={cn("w-9 text-right text-xs tabular-nums", k === "a" && "text-muted-foreground")}>{fmt(row[k])}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 手機畫面：高亮逐列移動 ---------- */

export function PhoneList({
  title,
  rows,
  footer,
  period = 900,
}: {
  title: ReactNode;
  rows: { label: ReactNode; value: ReactNode }[];
  /** 列表最後的合計列 */
  footer?: { label: ReactNode; value: ReactNode };
  period?: number;
}) {
  const { ref, tick } = useTicker(period);
  const current = tick % rows.length;
  return (
    <div ref={ref} className="w-44 rounded-[28px] border-[5px] border-foreground/85 bg-background p-2.5 shadow-lg">
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-foreground/15" />
      <p className="px-1 text-[11px] font-semibold">{title}</p>
      <ul className="mt-2 space-y-1">
        {rows.map((row, i) => (
          <li
            key={i}
            className={cn(
              "flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
              i === current ? "bg-foreground text-background" : "bg-muted/60",
            )}
          >
            <span>{row.label}</span>
            <span className={cn("tabular-nums", i === current ? "" : "text-muted-foreground")}>{row.value}</span>
          </li>
        ))}
        {footer ? (
          <li className="flex items-center justify-between px-2 pt-1 text-[11px] font-semibold">
            <span>{footer.label}</span>
            <span className="tabular-nums">{footer.value}</span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/* ---------- 鎖定：周圍的人一直換，被鎖定的那格不動 ---------- */

export function LockGrid({
  pool,
  locked,
  lockedIndex = 4,
  cells = 6,
  period = 1400,
}: {
  pool: { name: string; color: string }[];
  locked: string;
  lockedIndex?: number;
  cells?: number;
  period?: number;
}) {
  const { ref, tick } = useTicker(period);
  return (
    <div ref={ref} className="grid w-full max-w-[14rem] grid-cols-3 gap-1.5">
      {Array.from({ length: cells }, (_, i) => {
        if (i === lockedIndex) {
          return (
            <span key="locked" className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-foreground bg-foreground text-xs font-medium text-background">
              <LockIcon className="size-3 shrink-0" />
              <span className="truncate">{locked}</span>
            </span>
          );
        }
        const p = pool[(i + tick) % pool.length];
        return (
          <span
            key={`${i}-${p.name}-${tick}`}
            className="lb-swap-in flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="truncate">{p.name}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ---------- 申請卡片：送出 → 蓋上核准印章 → 接著做下一步 ---------- */

export function StampCard({
  name,
  color,
  kind,
  detail,
  stamp,
  footer,
  period = 5000,
}: {
  name: ReactNode;
  /** 名字前的識別色 */
  color?: string;
  /** 右上角的小字，例如「Leave request」 */
  kind?: ReactNode;
  detail: ReactNode;
  stamp: ReactNode;
  /** 卡片下方延遲浮出的說明 */
  footer?: ReactNode;
  period?: number;
}) {
  const { ref, tick } = useTicker(period);
  return (
    <div ref={ref} className="w-full max-w-[16rem]">
      <div key={tick}>
        <div className="lb-swap-in relative rounded-2xl border border-border bg-background p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            {color ? <span className="size-2 rounded-full" style={{ backgroundColor: color }} /> : null}
            <span className="text-sm font-medium">{name}</span>
            {kind ? <span className="ml-auto text-[11px] text-muted-foreground">{kind}</span> : null}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          <span
            className="lb-stamp absolute top-3 right-3 rounded-md border-2 border-(--lb-success) px-2 py-0.5 text-xs font-semibold text-(--lb-success)"
            style={{ animationDelay: "1100ms" }}
          >
            {stamp}
          </span>
        </div>
        {footer ? (
          <p className="lb-swap-in mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground" style={{ animationDelay: "1800ms" }}>
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- 機密欄位一個一個被劃掉 ---------- */

export function StrikeList({ fields, tag, period = 5600 }: { fields: string[]; tag: ReactNode; period?: number }) {
  const { ref, tick } = useTicker(period);
  return (
    <div ref={ref} className="w-full max-w-[15rem]">
      <div key={tick} className="flex flex-col gap-1.5">
        {fields.map((f, i) => (
          <div key={f} className="relative flex h-8 items-center gap-2 overflow-hidden rounded-lg border border-border bg-background px-3 font-mono text-[11px]">
            <span className="truncate text-muted-foreground">{f}</span>
            <span className="lb-strike absolute right-2 left-2 h-px origin-left bg-destructive" style={{ animationDelay: `${400 + i * 360}ms` }} />
            <span className="lb-swap-in ml-auto shrink-0 text-[10px] text-muted-foreground" style={{ animationDelay: `${600 + i * 360}ms` }}>
              {tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 開關切換，旁邊多一筆紀錄 ---------- */

export function ConsentToggle({
  label,
  onLog,
  offLog,
  period = 5200,
}: {
  label: ReactNode;
  onLog: ReactNode;
  offLog: ReactNode;
  period?: number;
}) {
  const { ref, tick } = useTicker(period);
  // 每一輪先開著，1.9 秒後關掉；記下是哪一輪關的，換輪自動回到開
  const [offTick, setOffTick] = useState(-1);
  useEffect(() => {
    const t = window.setTimeout(() => setOffTick(tick), 1900);
    return () => window.clearTimeout(t);
  }, [tick]);
  const on = offTick !== tick;
  return (
    <div ref={ref} className="w-full max-w-[16rem]">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
        <span className="min-w-0 flex-1 text-xs">{label}</span>
        <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300", on ? "bg-foreground" : "bg-muted")}>
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-background shadow transition-[left] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              on ? "left-[1.125rem]" : "left-0.5",
            )}
          />
        </span>
      </div>
      <ul className="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-(--lb-success)" />
          {onLog}
        </li>
        {!on ? (
          <li key={tick} className="lb-slide-in-right flex items-center gap-1.5 text-foreground">
            <span className="size-1.5 rounded-full bg-destructive" />
            {offLog}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
