// 後台共用元件。風格沿用作者其他後台（ComfyUI、usermeld、VideoAligner、Vtuber）的共通做法：
// 中性底色、hairline 邊框、單一強調色只用在圖表重點、數字一律 tabular-nums、狀態用小圓點而不是彩色膠囊。
// 後台保持安靜：數字不跑動畫。

import Link from "next/link";

import { cn } from "@/lib/utils";

import { Icon, type IconName } from "./icons";

export const NUM = "text-right tabular-nums whitespace-nowrap";

/* ---------- 頁首與期間切換 ---------- */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-subtle">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined, fallback: Range = 30): Range {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : fallback;
}

/** 7 / 30 / 90 天切換，狀態放在網址上（?days=），可以分享、重新整理不會跑掉。 */
export function RangeTabs({ value, basePath }: { value: Range; basePath: string }) {
  return (
    <nav aria-label="統計期間" className="inline-flex rounded-lg bg-muted p-0.5 text-sm">
      {RANGES.map((days) => (
        <Link
          key={days}
          href={`${basePath}?days=${days}`}
          aria-current={days === value ? "true" : undefined}
          scroll={false}
          className={cn(
            "rounded-md px-3 py-1 tabular-nums transition-colors",
            days === value ? "bg-card font-medium shadow-[0_0_0_1px_var(--line)]" : "text-subtle hover:text-fg",
          )}
        >
          {days} 天
        </Link>
      ))}
    </nav>
  );
}

/* ---------- 待辦提示列 ---------- */

export type QueueItem = { label: string; hint: string; count: number; href?: string; tone?: "warn" | "bad" };

/** 放在 KPI 上方：有事要處理的格子會上色，全部清空時收成一條「一切正常」。 */
export function QueueStrip({ items }: { items: QueueItem[] }) {
  const open = items.filter((item) => item.count > 0);
  if (open.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-subtle">
        <Icon name="check" className="size-4 text-emerald-600 dark:text-emerald-400" />
        目前沒有需要處理的事。
      </div>
    );
  }
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {open.map((item) => {
        const body = (
          <>
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{item.label}</span>
              <span className="block text-xs opacity-80">{item.hint}</span>
            </span>
            <span className="text-lg font-semibold tabular-nums">{item.count}</span>
            {item.href && <Icon name="arrow" className="mt-1 size-4 shrink-0 opacity-60" />}
          </>
        );
        const className = cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
          item.tone === "bad"
            ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
            : "border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/15 dark:text-amber-300",
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className={className}>
            {body}
          </Link>
        ) : (
          <div key={item.label} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- KPI ---------- */

/** 一個外框切成多格（gap-px 露出底色當分隔線），比一堆獨立卡片安靜。 */
export function KpiStrip({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-xl border border-line bg-line [&>*]:bg-card",
        cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {children}
    </div>
  );
}

export type Delta = { current: number; previous: number; upIsGood?: boolean };

function DeltaLine({ delta, label }: { delta: Delta; label: string }) {
  const { current, previous, upIsGood = true } = delta;
  if (previous === 0) {
    return <span className="text-subtle">{current === 0 ? "與前期持平" : "前期沒有資料可比"}</span>;
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return <span className="text-subtle">與{label}持平</span>;
  const good = change > 0 === upIsGood;
  const shown = Math.min(Math.abs(change), 999).toFixed(Math.abs(change) < 10 ? 1 : 0);
  return (
    <span className={good ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>
      {change > 0 ? "▲" : "▼"} {shown}%{Math.abs(change) > 999 ? "+" : ""}
      <span className="text-subtle"> 較{label}</span>
    </span>
  );
}

export function StatTile({
  icon,
  label,
  value,
  hint,
  delta,
  deltaLabel = "前期",
  trend,
  tone,
  href,
  children,
}: {
  icon?: IconName;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: Delta;
  deltaLabel?: string;
  trend?: number[];
  tone?: "warn";
  href?: string;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-xs font-medium text-subtle">
        {icon && <Icon name={icon} className="size-3.5" />}
        {label}
        {href && <Icon name="arrow" className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />}
      </p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight tabular-nums", tone === "warn" && "text-destructive")}>
        {value}
      </p>
      {delta && (
        <p className="mt-0.5 text-xs">
          <DeltaLine delta={delta} label={deltaLabel} />
        </p>
      )}
      {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
      {trend && trend.length > 1 && <Sparkline values={trend} label={`${label} 每日趨勢`} />}
      {children}
    </>
  );
  return href ? (
    <Link href={href} className="group block px-5 py-4 transition-colors hover:bg-muted/40">
      {body}
    </Link>
  ) : (
    <div className="px-5 py-4">{body}</div>
  );
}

/** 灰色折線，只有最後一段與端點用前景色：一眼看出「最近」的方向。 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 200;
  const h = 28;
  const max = Math.max(1, ...values);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 2 - (v / max) * (h - 4)] as const);
  const line = (list: readonly (readonly [number, number])[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label} className="mt-3 h-7 w-full overflow-visible">
      <polyline points={line(pts)} fill="none" stroke="var(--subtle)" strokeOpacity="0.45" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <polyline points={line(pts.slice(-2))} fill="none" stroke="var(--fg)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="2.5" fill="var(--fg)" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Progress({ value, max, mark }: { value: number; max: number; mark?: number }) {
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="relative mt-3 h-1.5 rounded-full bg-muted">
      <div className="h-full rounded-full bg-fg" style={{ width: pct(value) }} />
      {mark !== undefined && (
        <div className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-amber-500" style={{ left: pct(mark) }} title={`門檻 ${mark}`} />
      )}
    </div>
  );
}

/* ---------- 區塊與表格 ---------- */

export function Section({
  id,
  title,
  description,
  aside,
  children,
  flush,
}: {
  id?: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  /** 內容是表格時去掉內距，讓表格貼齊外框 */
  flush?: boolean;
}) {
  return (
    <section id={id} className="mt-6 scroll-mt-20 overflow-hidden rounded-xl border border-line bg-card lg:scroll-mt-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
        </div>
        {aside}
      </header>
      <div className={flush ? undefined : "p-4"}>{children}</div>
    </section>
  );
}

export type Column = { label: string; num?: boolean; hideOnMobile?: boolean };

export function DataTable({ columns, rows, empty }: { columns: Column[]; rows: React.ReactNode[][]; empty?: EmptyProps }) {
  if (rows.length === 0) return <EmptyState {...(empty ?? { title: "沒有資料" })} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-subtle">
          <tr>
            {columns.map((c) => (
              <th
                key={c.label}
                scope="col"
                className={cn("px-4 py-2 text-left font-medium whitespace-nowrap", c.num && "text-right", c.hideOnMobile && "max-sm:hidden")}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-muted/40">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn("px-4 py-2.5 align-top", columns[j]?.num && NUM, columns[j]?.hideOnMobile && "max-sm:hidden")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DOT = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-destructive", idle: "bg-subtle/50" } as const;

export function StatusDot({ tone, children }: { tone: keyof typeof DOT; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}

type EmptyProps = { title: string; description?: string; icon?: IconName };

export function EmptyState({ title, description, icon = "pulse" }: EmptyProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-subtle">
        <Icon name={icon} className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-subtle">{description}</p>}
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "bad" }) {
  return (
    <div
      className={cn(
        "mb-4 rounded-xl border border-dashed px-4 py-3 text-sm",
        tone === "bad" ? "border-destructive/40 text-destructive" : "border-line text-subtle",
      )}
    >
      {children}
    </div>
  );
}

/* ---------- 排行與漏斗 ---------- */

/** 排行清單：每列下方一條細長比例條。 */
export function BarList({ items, empty }: { items: { label: string; value: number; extra?: string }[]; empty?: EmptyProps }) {
  if (items.length === 0) return <EmptyState {...(empty ?? { title: "沒有資料" })} />;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 tabular-nums">
              {item.value}
              {item.extra && <span className="ml-1.5 text-xs text-subtle">{item.extra}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-fg/80" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 漏斗：每一步是一條比例條，右邊標出對上一步的轉換率。 */
export function Funnel({ steps }: { steps: { label: string; value: number | undefined; source: string }[] }) {
  const first = steps.find((s) => s.value !== undefined)?.value ?? 0;
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const prev = steps[i - 1]?.value;
        const rate = i > 0 && step.value !== undefined && prev ? pct(step.value, prev) : undefined;
        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                {step.label}
                <span className="ml-2 text-xs text-subtle">{step.source}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {step.value ?? "–"}
                {rate && <span className="ml-2 inline-block w-12 text-right text-xs text-subtle">{rate}</span>}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-fg/80"
                style={{ width: step.value && first ? `${Math.min(100, (step.value / first) * 100)}%` : "0%" }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function pct(part: number, whole: number) {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–";
}
