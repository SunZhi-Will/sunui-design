// 後台共用元件。版型照 VideoAligner（萬寶箱）後台：分層的深色表面、獨立的圓角卡片、
// 很淡的白邊、數字一律 tabular-nums、狀態用圓點加文字。顏色 token 在 ../admin.css。
// 後台保持安靜：數字不跑動畫。

import Link from "next/link";

import { polarConfigured } from "@/lib/polar";
import { redisEnabled } from "@/lib/redis";
import { shoplineConfigured } from "@/lib/site";
import { cn } from "@/lib/utils";

import { Icon, type IconName } from "./icons";

export const NUM = "text-right tabular-nums whitespace-nowrap";

/* ---------- 頁首與期間切換 ---------- */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-[13px] text-subtle">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
    <nav aria-label="統計期間" className="flex gap-1.5">
      {RANGES.map((days) => (
        <Link key={days} href={`${basePath}?days=${days}`} aria-current={days === value ? "true" : undefined} scroll={false} className="a-chip tabular-nums">
          {days} 天
        </Link>
      ))}
    </nav>
  );
}

/* ---------- 待處理 ---------- */

export type QueueItem = { label: string; hint: string; count: number; href?: string; tone?: "warn" | "bad" };

/** 總覽最上面：每一項都一直在，有事的格子染上狀態色，沒事的是灰的；全部清空時上面多一條「一切正常」。 */
export function QueueSection({ items }: { items: QueueItem[] }) {
  const open = items.filter((item) => item.count > 0).length;
  return (
    <section aria-labelledby="queue-h" className="mb-8">
      <h2 id="queue-h" className="mb-3 text-[13px] font-semibold text-subtle">
        待處理
      </h2>
      {open === 0 && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-[var(--ok-soft)] px-4 py-3 text-[13px] text-[var(--ok)]">
          <Icon name="check" className="size-4" />
          目前沒有需要你處理的事。
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const on = item.count > 0;
          const tone = item.tone ?? "warn";
          const body = (
            <>
              <Icon name="alert" className={cn("size-[18px] shrink-0", on ? (tone === "bad" ? "text-[var(--bad)]" : "text-[var(--warn)]") : "text-[var(--faint)]")} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{item.label}</span>
                <span className="block truncate text-xs text-subtle" title={item.hint}>
                  {item.hint}
                </span>
              </span>
              <span
                className={cn(
                  "text-[22px] font-semibold tabular-nums",
                  on ? (tone === "bad" ? "text-[var(--bad)]" : "text-[var(--warn)]") : "text-[var(--faint)]",
                )}
              >
                {item.count}
              </span>
            </>
          );
          const className = cn(
            "a-card flex items-center gap-3 px-4 py-3.5 text-fg transition-colors",
            on && (tone === "bad" ? "border-transparent bg-[var(--bad-soft)]" : "border-transparent bg-[var(--warn-soft)]"),
            item.href && "hover:border-[var(--line-strong)]",
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
    </section>
  );
}

/* ---------- KPI ---------- */

/** 數字卡的格線：每張卡獨立，hero 卡佔兩格。 */
export function KpiGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 3 | 4 }) {
  return (
    <section aria-label="重點數字" className={cn("mb-8 grid gap-3 sm:grid-cols-2", cols === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3")}>
      {children}
    </section>
  );
}

export type Delta = { current: number; previous: number; upIsGood?: boolean };

function DeltaLine({ delta, label }: { delta: Delta; label: string }) {
  const { current, previous, upIsGood = true } = delta;
  if (previous === 0) {
    return <span className="text-[var(--faint)]">{current === 0 ? "與前期持平" : "前期沒有資料可比"}</span>;
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return <span className="text-subtle">與{label}持平</span>;
  const good = change > 0 === upIsGood;
  const shown = Math.min(Math.abs(change), 999).toFixed(Math.abs(change) < 10 ? 1 : 0);
  return (
    <span className={cn("font-medium tabular-nums", good ? "text-[var(--ok)]" : "text-[var(--bad)]")}>
      {change > 0 ? "▲" : "▼"} {shown}%{Math.abs(change) > 999 ? "+" : ""}
      <span className="ml-1 font-normal text-[var(--faint)]">vs {label}</span>
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  delta,
  deltaLabel = "前期",
  trend,
  tone,
  href,
  hero = false,
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: Delta;
  deltaLabel?: string;
  trend?: number[];
  tone?: "warn";
  href?: string;
  /** 最重要的那個數字：佔兩格、字更大 */
  hero?: boolean;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] text-subtle">{label}</span>
        {href && <Icon name="arrow" className="size-3.5 text-[var(--faint)] opacity-0 transition-opacity group-hover:opacity-100" />}
      </div>
      <div
        className={cn(
          "mt-1.5 leading-none font-semibold tracking-tight tabular-nums",
          hero ? "text-[34px]" : "text-[26px]",
          tone === "warn" && "text-[var(--warn)]",
        )}
      >
        {value}
      </div>
      <div className="mt-2 flex min-h-[18px] flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {delta && <DeltaLine delta={delta} label={deltaLabel} />}
        {hint && <span className="text-subtle">{hint}</span>}
      </div>
      {trend && trend.length > 1 && <Sparkline values={trend} label={`${label} 每日趨勢`} />}
      {children}
    </>
  );
  const className = cn("a-card group block p-4 text-fg", hero && "sm:col-span-2", href && "transition-colors hover:border-[var(--line-strong)]");
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** 折線加往下漸隱的面積，用前景色（SunUI 只用黑白灰）。 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  // 伺服器元件不能用 hook，漸層 id 由標籤推出來（同一頁的標籤不重複）
  const id = [...label].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
  const w = 120;
  const h = 34;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - (v / max) * (h - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label} className="-mx-1 mt-3 block w-[calc(100%+0.5rem)]" style={{ height: h }}>
      <defs>
        <linearGradient id={`sg${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--fg)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--fg)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${w},${h}L0,${h}Z`} fill={`url(#sg${id})`} />
      <path d={line} fill="none" stroke="var(--fg)" strokeOpacity="0.8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Progress({ value, max, mark }: { value: number; max: number; mark?: number }) {
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="relative mt-3 h-1.5 rounded-full bg-[var(--raised-2)]">
      <div className="h-full rounded-full bg-fg" style={{ width: pct(value) }} />
      {mark !== undefined && (
        <div className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-subtle" style={{ left: pct(mark) }} title={`門檻 ${mark}`} />
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
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  /** 內容是表格時去掉內距，讓表格貼齊外框 */
  flush?: boolean;
  className?: string;
}) {
  return (
    <section id={id} className={cn("a-card min-w-0 scroll-mt-20 overflow-hidden md:scroll-mt-8", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-[var(--faint)]">{description}</p>}
        </div>
        {aside}
      </header>
      <div className={flush ? "border-t border-line" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

export type Column = { label: string; num?: boolean; hideOnMobile?: boolean };

export function DataTable({ columns, rows, empty }: { columns: Column[]; rows: React.ReactNode[][]; empty?: EmptyProps }) {
  if (rows.length === 0) return <EmptyState {...(empty ?? { title: "沒有資料" })} />;
  return (
    <div className="overflow-x-auto">
      <table className="a-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} scope="col" className={cn(c.num && "text-right", c.hideOnMobile && "max-sm:hidden")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={cn(columns[j]?.num && NUM, columns[j]?.hideOnMobile && "max-sm:hidden")}>
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

const DOT = { ok: "bg-[var(--ok)]", warn: "bg-[var(--warn)]", bad: "bg-[var(--bad)]", idle: "bg-[var(--faint)]" } as const;

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
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--raised-2)] text-[var(--faint)]">
        <Icon name={icon} className="size-[18px]" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-subtle">{description}</p>}
    </div>
  );
}

/* ---------- 資料來源未設定 ---------- */

export type SetupItem = { label: string; unlocks: string; env: string[]; ok: boolean };

/** 後台用到的三個資料來源。env 只在未設定時顯示，放在面板裡而不是頁首提示。 */
export function setupItems(): SetupItem[] {
  return [
    {
      label: "Upstash Redis",
      unlocks: "訂單、授權、安裝數與購買漏斗",
      env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      ok: redisEnabled(),
    },
    {
      label: "SHOPLINE Payments",
      unlocks: "新台幣收款",
      env: ["SHOPLINE_MERCHANT_ID", "SHOPLINE_API_KEY", "SHOPLINE_SIGN_KEY"],
      ok: shoplineConfigured(),
    },
    {
      label: "Polar",
      unlocks: "美金收款",
      env: ["POLAR_ACCESS_TOKEN", "POLAR_WEBHOOK_SECRET", "POLAR_PRODUCT_IDS"],
      ok: polarConfigured(),
    },
  ];
}

/** 資料來源沒接上時取代整頁內容：一張卡片說清楚缺什麼，不擺一排空的數字卡。 */
export function SetupRequired({ title, description, items }: { title: string; description: string; items: SetupItem[] }) {
  return (
    <section className="a-card overflow-hidden">
      <header className="flex items-start gap-3 px-5 pt-5 pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--raised-2)] text-[var(--faint)]">
          <Icon name="pulse" className="size-[18px]" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <p className="mt-0.5 text-[13px] text-subtle">{description}</p>
        </div>
      </header>
      <ul className="border-t border-line">
        {items.map((item) => (
          <li key={item.label} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-4 last:border-b-0">
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="mt-0.5 text-[13px] text-subtle">{item.unlocks}</p>
              {!item.ok && (
                <p className="mt-2.5 flex flex-wrap gap-1.5">
                  {item.env.map((name) => (
                    <code key={name} className="rounded-md border border-line bg-[var(--rail)] px-1.5 py-0.5 font-mono text-xs text-subtle">
                      {name}
                    </code>
                  ))}
                </p>
              )}
            </div>
            <StatusDot tone={item.ok ? "ok" : "idle"}>
              <span className={cn("text-xs", item.ok ? "text-fg" : "text-subtle")}>{item.ok ? "已設定" : "未設定"}</span>
            </StatusDot>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "bad" }) {
  return (
    <p
      className={cn(
        "mb-6 flex items-start gap-2 rounded-xl px-4 py-3 text-[13px]",
        tone === "bad" ? "bg-[var(--bad-soft)] text-[var(--bad)]" : "border border-line bg-card text-subtle",
      )}
    >
      <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
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
          <div className="mt-1.5 h-1.5 rounded-full bg-[var(--raised-2)]">
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
            <div className="mt-1.5 h-2 rounded-full bg-[var(--raised-2)]">
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
