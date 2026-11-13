import type { Metadata } from "next";

import { formatDate, formatMoney, maskEmail, requireAdmin } from "@/lib/admin";
import { isCounted, listOrders, planOf, polarConfigured, type Plan, type PolarOrder } from "@/lib/polar";

import { BarList, DataTable, EmptyState, KpiStrip, Notice, PageHeader, pct, Section, StatTile, StatusDot } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "訂單" };

const PLAN_LABEL: Record<Plan, string> = { founding: "Founding", pro: "Pro", team: "Team", other: "其他" };
const STATUS: Record<PolarOrder["status"], { label: string; tone: "ok" | "warn" | "bad" | "idle" }> = {
  paid: { label: "已付款", tone: "ok" },
  partially_refunded: { label: "部分退款", tone: "warn" },
  refunded: { label: "已退款", tone: "bad" },
  pending: { label: "處理中", tone: "idle" },
  draft: { label: "草稿", tone: "idle" },
  void: { label: "作廢", tone: "idle" },
};

export default async function AdminOrders() {
  await requireAdmin();
  const header = <PageHeader title="訂單" description="來自 Polar，金額未稅。退款與發票請到 Polar 後台處理。" />;

  if (!polarConfigured()) {
    return (
      <>
        {header}
        <div className="rounded-xl border border-dashed border-line">
          <EmptyState icon="orders" title="尚未連接 Polar" description="設定 POLAR_ACCESS_TOKEN 與 POLAR_ORGANIZATION_ID 後，訂單會出現在這裡。" />
        </div>
      </>
    );
  }

  const orders = await listOrders();
  if (!orders.ok) {
    return (
      <>
        {header}
        <Notice tone="bad">Polar 讀取失敗：{orders.error}</Notice>
      </>
    );
  }

  const all = orders.data.filter((o) => o.status !== "draft" && o.status !== "void");
  const counted = all.filter(isCounted);
  const refunded = all.filter((o) => o.status === "refunded" || o.status === "partially_refunded");
  const currency = all[0]?.currency ?? "usd";
  const amount = (o: PolarOrder) => o.net_amount - o.refunded_amount;
  const sales = counted.reduce((s, o) => s + amount(o), 0);

  const byPlan = new Map<Plan, { count: number; amount: number }>();
  for (const o of counted) {
    const plan = planOf(o.product?.name);
    const row = byPlan.get(plan) ?? { count: 0, amount: 0 };
    row.count += 1;
    row.amount += amount(o);
    byPlan.set(plan, row);
  }
  const byCountry = new Map<string, number>();
  for (const o of counted) {
    const country = o.billing_address?.country ?? "未知";
    byCountry.set(country, (byCountry.get(country) ?? 0) + 1);
  }

  return (
    <>
      {header}

      <KpiStrip cols={4}>
        <StatTile icon="orders" label="有效訂單" value={counted.length} hint="已付款與部分退款" />
        <StatTile icon="dollar" label="銷售額" value={formatMoney(sales, currency)} hint="已扣退款，未扣 Polar 手續費" />
        <StatTile
          icon="users"
          label="客單價"
          value={counted.length ? formatMoney(Math.round(sales / counted.length), currency) : "–"}
        />
        <StatTile
          icon="alert"
          label="退款率"
          value={pct(refunded.length, all.length)}
          hint={`${refunded.length} 筆全額或部分退款`}
          tone={all.length >= 10 && refunded.length / all.length > 0.1 ? "warn" : undefined}
        />
      </KpiStrip>

      <div className="grid gap-x-6 lg:grid-cols-2">
        <Section title="方案組合" description="依金額排序">
          <BarList
            items={[...byPlan.entries()]
              .sort((a, b) => b[1].amount - a[1].amount)
              .map(([plan, row]) => ({ label: PLAN_LABEL[plan], value: row.count, extra: formatMoney(row.amount, currency) }))}
            empty={{ title: "還沒有訂單", icon: "orders" }}
          />
        </Section>
        <Section title="國家分布" description="依帳單地址，報稅與換匯費用估算用">
          <BarList
            items={[...byCountry.entries()].sort((a, b) => b[1] - a[1]).map(([country, count]) => ({ label: country, value: count }))}
            empty={{ title: "還沒有訂單", icon: "orders" }}
          />
        </Section>
      </div>

      <Section title="訂單明細" description={`最近 ${orders.data.length} 筆（最多讀 500 筆），時間為台北時間`} flush>
        <DataTable
          columns={[
            { label: "時間" },
            { label: "方案" },
            { label: "客戶" },
            { label: "國家", hideOnMobile: true },
            { label: "金額", num: true },
            { label: "退款", num: true, hideOnMobile: true },
            { label: "狀態" },
          ]}
          rows={all.map((o) => [
            <span key="t" className="whitespace-nowrap text-subtle tabular-nums">
              {formatDate(o.created_at)}
            </span>,
            PLAN_LABEL[planOf(o.product?.name)],
            maskEmail(o.customer.email),
            o.billing_address?.country ?? "",
            formatMoney(o.net_amount, o.currency),
            o.refunded_amount ? formatMoney(o.refunded_amount, o.currency) : "",
            <StatusDot key="s" tone={STATUS[o.status].tone}>
              {STATUS[o.status].label}
            </StatusDot>,
          ])}
          empty={{ title: "還沒有訂單", description: "Founding 2026-11-27 開賣後，第一筆會出現在這裡。", icon: "orders" }}
        />
      </Section>
    </>
  );
}
