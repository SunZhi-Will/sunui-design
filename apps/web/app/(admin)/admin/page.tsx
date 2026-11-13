import { formatMoney, requireAdmin } from "@/lib/admin";
import { licenseOverview } from "@/lib/admin-data";
import { eventStats } from "@/lib/events";
import { installStats } from "@/lib/installs";
import { getMetrics, isCounted, listOrders, planOf, polarConfigured } from "@/lib/polar";
import { redisEnabled } from "@/lib/redis";
import { foundingState, foundingWindow } from "@/lib/site";

import { DailyChart } from "./daily-chart";
import {
  BarList,
  DataTable,
  Funnel,
  KpiStrip,
  Notice,
  PageHeader,
  parseRange,
  pct,
  Progress,
  QueueStrip,
  RangeTabs,
  Section,
  StatTile,
  StatusDot,
  type QueueItem,
} from "./ui";

export const dynamic = "force-dynamic";

// 決策門檻：reports/商業模式深度分析-2026-11-06.md
const FOUNDING_GATE = 50;

type Daily = { day: string; value: number };
type ByDay = { day: string; values: Record<string, number> }[];

/** 2N 天的每日資料（新的在前）切成本期與前期，回傳由舊到新的本期序列。 */
function split(perDay: Daily[], days: number) {
  const current = perDay.slice(0, days);
  const previous = perDay.slice(days, days * 2);
  const sum = (list: Daily[]) => list.reduce((s, d) => s + d.value, 0);
  return { series: [...current].reverse(), current: sum(current), previous: sum(previous) };
}

/** 本期（最新 N 天）各欄位加總；prefix 給定時只加以它開頭的欄位。 */
function sumPeriod(byDay: ByDay, days: number) {
  const total: Record<string, number> = {};
  for (const d of byDay.slice(0, days)) for (const [k, v] of Object.entries(d.values)) total[k] = (total[k] ?? 0) + v;
  return total;
}

const DENY_LABEL: Record<string, string> = { "401": "沒帶授權碼", "403": "撤銷或疑似分享", "429": "限流", "503": "Polar 無法連線" };

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const days = parseRange((await searchParams).days);

  const [installs, events, orders, licenses, metrics] = await Promise.all([
    installStats(days * 2).catch(() => null),
    eventStats(days * 2).catch(() => null),
    listOrders(),
    licenseOverview(),
    getMetrics(days),
  ]);

  const counted = orders.ok ? orders.data.filter(isCounted) : [];
  const founding = counted.filter((o) => planOf(o.product?.name) === "founding").length;
  const sales = counted.reduce((s, o) => s + o.net_amount - o.refunded_amount, 0);
  const currency = counted[0]?.currency ?? "usd";
  const m = metrics.ok ? metrics.data.totals : null;

  const free = installs ? split(installs.perDay.map((d) => ({ day: d.day, value: d.installs })), days) : null;
  const pro = events ? split(events.pro.perDay, days) : null;
  const intent = events ? split(events.intent.perDay, days) : null;
  const denied = events ? sumPeriod(events.deniedByDay, days) : {};
  const funnel = events ? sumPeriod(events.funnel.byDay, days) : null;
  const checkoutClicks = funnel
    ? Object.entries(funnel).filter(([k]) => k.startsWith("checkout_click:")).reduce((s, [, v]) => s + v, 0)
    : undefined;

  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((foundingWindow.closesAt.getTime() - now.getTime()) / 86_400_000));
  const behind = foundingState(now) === "open" && daysLeft < 21 && founding < FOUNDING_GATE;

  const queue: QueueItem[] = [
    {
      label: "沉睡授權",
      hint: "買了 3 天以上還沒裝過 Pro，寄一封教學信",
      count: licenses.ok ? licenses.dormant.length : 0,
      href: "/admin/licenses#dormant",
    },
    {
      label: "Founding 進度落後",
      hint: `剩 ${daysLeft} 天，距門檻 ${FOUNDING_GATE} 筆`,
      count: behind ? FOUNDING_GATE - founding : 0,
      tone: "bad",
    },
    { label: "Polar 授權伺服器失敗", hint: "付費客戶裝不到 Pro，檢查 Polar 狀態", count: denied["503"] ?? 0, tone: "bad" },
    { label: "撤銷或疑似分享", hint: "退款撤銷，或同一把 key 一天超過 20 個 IP", count: denied["403"] ?? 0 },
  ];

  const missing = [
    !redisEnabled() && "Upstash Redis（安裝、Pro 使用、漏斗計數）",
    !polarConfigured() && "Polar API（訂單、授權、結帳轉換）",
  ].filter(Boolean) as string[];
  const errors = polarConfigured()
    ? [orders, metrics, licenses].flatMap((r) => (r.ok ? [] : [r.error]))
    : [];

  return (
    <>
      <PageHeader
        title="總覽"
        description={`近 ${days} 天，與前 ${days} 天比較。日期為 UTC，Polar 資料快取 5 分鐘。`}
        actions={<RangeTabs value={days} basePath="/admin" />}
      />

      {missing.length > 0 && <Notice>尚未設定：{missing.join("、")}。相關數字會是空的。</Notice>}
      {errors.length > 0 && <Notice tone="bad">Polar 讀取失敗：{errors.join("；")}</Notice>}

      <QueueStrip items={queue} />

      <KpiStrip>
        <StatTile
          icon="users"
          label="Founding 付費"
          value={
            <>
              {founding}
              <span className="text-base font-normal text-subtle"> / {foundingWindow.seats}</span>
            </>
          }
          hint={`門檻 ${FOUNDING_GATE} 筆，截止還有 ${daysLeft} 天`}
          tone={behind ? "warn" : undefined}
          href="/admin/orders"
        >
          <Progress value={founding} max={foundingWindow.seats} mark={FOUNDING_GATE} />
        </StatTile>
        <StatTile
          icon="dollar"
          label="累計銷售額"
          value={formatMoney(sales, currency)}
          hint={
            m?.net_revenue !== undefined
              ? `${counted.length} 筆有效訂單；近 ${days} 天 Polar 淨收入 ${formatMoney(m.net_revenue, currency)}`
              : `${counted.length} 筆有效訂單，未稅、已扣退款`
          }
          href="/admin/orders"
        />
        <StatTile
          icon="license"
          label="授權啟用率"
          value={licenses.ok ? pct(licenses.activated.length, licenses.granted.length) : "–"}
          hint={licenses.ok ? `${licenses.activated.length} / ${licenses.granted.length} 把有效授權裝過 Pro` : "需要 Polar API"}
          tone={
            licenses.ok && licenses.granted.length >= 5 && licenses.activated.length / licenses.granted.length < 0.6
              ? "warn"
              : undefined
          }
          href="/admin/licenses"
        />
        <StatTile
          icon="block"
          label="Pro 購買意圖"
          value={intent?.current ?? "–"}
          delta={intent ? { current: intent.current, previous: intent.previous } : undefined}
          hint="沒帶授權碼想裝 Pro 的次數"
          trend={intent?.series.map((d) => d.value)}
          href="/admin/licenses#pro-blocks"
        />
        <StatTile
          icon="check"
          label="Pro 授權安裝"
          value={pro?.current ?? "–"}
          delta={pro ? { current: pro.current, previous: pro.previous } : undefined}
          trend={pro?.series.map((d) => d.value)}
          href="/admin/licenses"
        />
        <StatTile
          icon="download"
          label="免費安裝"
          value={free?.current ?? "–"}
          delta={free ? { current: free.current, previous: free.previous } : undefined}
          hint="shadcn CLI 與 agent，不含瀏覽器預覽"
          trend={free?.series.map((d) => d.value)}
          href="#free-installs"
        />
      </KpiStrip>

      <Section title="每日趨勢" description="滑過長條看單日數字，方向鍵也可以逐日移動。">
        {free || pro || intent ? (
          <DailyChart
            series={[
              { key: "free", label: "免費安裝", values: free?.series ?? [] },
              { key: "intent", label: "Pro 意圖", values: intent?.series ?? [] },
              { key: "pro", label: "Pro 安裝", values: pro?.series ?? [] },
            ]}
          />
        ) : (
          <p className="text-sm text-subtle">需要 Upstash Redis 才有每日資料。</p>
        )}
      </Section>

      <div className="grid gap-x-6 lg:grid-cols-2">
        <Section id="funnel" title="購買漏斗" description={`近 ${days} 天。前兩步由本站計數，後兩步來自 Polar。`}>
          <Funnel
            steps={[
              { label: "定價頁瀏覽", value: funnel?.pricing_view ?? (funnel ? 0 : undefined), source: "本站" },
              { label: "點結帳", value: checkoutClicks, source: "本站" },
              { label: "Polar 結帳建立", value: m?.checkouts, source: "Polar" },
              { label: "付款成功", value: m?.succeeded_checkouts, source: "Polar" },
            ]}
          />
        </Section>

        <Section id="free-installs" title="免費安裝排行" description={`近 ${days * 2} 天前 8 名`}>
          <BarList
            items={(installs?.top ?? []).slice(0, 8).map((b) => ({ label: b.name, value: b.installs }))}
            empty={{ title: "還沒有安裝紀錄", description: "有人用 shadcn CLI 或 agent 裝免費 block 後會出現在這裡。", icon: "download" }}
          />
        </Section>
      </div>

      <Section title="授權失敗" description={`近 ${days} 天 Pro registry 回傳的錯誤。`} flush>
        <DataTable
          columns={[{ label: "狀態" }, { label: "意思" }, { label: "次數", num: true }]}
          rows={Object.entries(denied)
            .sort()
            .map(([code, count]) => [
              <StatusDot key="s" tone={code === "503" ? "bad" : code === "401" ? "idle" : "warn"}>
                {code}
              </StatusDot>,
              DENY_LABEL[code] ?? "",
              count,
            ])}
          empty={{ title: "沒有失敗紀錄", icon: "check" }}
        />
      </Section>
    </>
  );
}
