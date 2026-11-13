"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type Series = { key: string; label: string; values: { day: string; value: number }[] };

/**
 * 每日長條圖，可切換指標。滑過某一天時其他長條變淡、上方讀數顯示「日期 · 數值 · 期間合計」；
 * 方向鍵也能逐日移動。可以切成表格看原始數字。資料由舊到新。
 */
export function DailyChart({ series }: { series: Series[] }) {
  const [active, setActive] = useState(series[0]?.key);
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const current = series.find((s) => s.key === active) ?? series[0];
  if (!current) return null;

  const values = current.values;
  const total = values.reduce((s, d) => s + d.value, 0);
  const max = niceMax(Math.max(0, ...values.map((d) => d.value)));
  const focus = hover !== null ? values[hover] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="指標" className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={s.key === current.key}
              onClick={() => setActive(s.key)}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                s.key === current.key ? "bg-card font-medium shadow-[0_0_0_1px_var(--line)]" : "text-subtle hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setAsTable((v) => !v)} className="text-xs text-subtle underline-offset-4 hover:text-fg hover:underline">
          {asTable ? "看圖表" : "看表格"}
        </button>
      </div>

      <p className="mt-3 text-sm tabular-nums" aria-live="polite">
        {focus ? (
          <>
            <span className="text-subtle">{focus.day}</span>
            <span className="ml-2 font-medium">{focus.value}</span>
          </>
        ) : (
          <>
            <span className="text-subtle">期間合計</span>
            <span className="ml-2 font-medium">{total}</span>
          </>
        )}
      </p>

      {asTable ? (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {[...values].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="px-3 py-1.5 text-subtle tabular-nums">{d.day}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="relative mt-3 h-40 outline-none"
          tabIndex={0}
          role="group"
          aria-label={`${current.label}，每日，共 ${values.length} 天`}
          onMouseLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setHover((h) => Math.min(values.length - 1, (h ?? -1) + 1));
            else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? values.length) - 1));
            else if (e.key === "Escape") setHover(null);
            else return;
            e.preventDefault();
          }}
        >
          {/* 上緣與中線的虛線格線 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
          <span className="pointer-events-none absolute -top-2 right-0 bg-card pl-1 text-[10px] text-subtle tabular-nums">{max}</span>
          <div className="absolute inset-0 flex items-end gap-px">
            {values.map((d, i) => (
              <div
                key={d.day}
                onMouseEnter={() => setHover(i)}
                className={cn("flex h-full flex-1 items-end rounded-t-[3px]", hover === i && "bg-muted")}
              >
                <div
                  className={cn(
                    "w-full rounded-t-[3px] bg-fg transition-opacity",
                    hover !== null && hover !== i ? "opacity-20" : "opacity-70",
                  )}
                  style={{ height: d.value ? `${Math.max(2, (d.value / max) * 100)}%` : "1px" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {!asTable && (
        <div className="mt-1.5 flex justify-between text-[10px] text-subtle tabular-nums">
          <span>{values[0]?.day}</span>
          <span>{values[values.length - 1]?.day}</span>
        </div>
      )}
    </div>
  );
}

/** 把最大值往上取到好讀的整數（1、2、5 的倍數）。 */
function niceMax(n: number) {
  if (n <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(n));
  const unit = [1, 2, 5, 10].find((u) => u * pow >= n)!;
  return unit * pow;
}
