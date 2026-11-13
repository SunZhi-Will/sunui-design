import type { Metadata } from "next";

import { formatDate, maskEmail, requireAdmin } from "@/lib/admin";
import { listOrders, webhookLog, type Order } from "@/lib/orders";
import { redisEnabled } from "@/lib/redis";
import type { Plan } from "@/lib/site";

import { BarList, DataTable, EmptyState, KpiStrip, Notice, PageHeader, pct, Section, StatTile, StatusDot } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "訂單" };

const PLAN_LABEL: Record<Plan, string> = { founding: "Founding", pro: "Pro", team: "Team" };
const STATUS: Record<Order["status"], { label: string; tone: "ok" | "warn" | "bad" | "idle" }> = {
  paid: { label: "已付款", tone: "ok" },
  pending: { label: "未完成", tone: "idle" },
  refunded: { label: "已退款", tone: "bad" },
  amount_mismatch: { label: "金額不符", tone: "warn" },
  disputed: { label: "爭議中", tone: "bad" },
};
const RESULT_TONE: Record<string, "ok" | "warn" | "bad" | "idle"> = {
  paid: "ok",
  refunded: "warn",
  duplicate: "idle",
  foreign: "idle",
  ignored: "idle",
  dispute: "bad",
  amount_mismatch: "bad",
  refund_review: "warn",
  order_not_found: "bad",
  bad_signature: "bad",
  store_failed: "bad",
};

const twd = (n: number) => `NT$${n.toLocaleString("en-US")}`;

export default async function AdminOrders() {
  await requireAdmin();
  const header = <PageHeader title="訂單" description="SHOPLINE Payments 收款，訂單與授權存在 Upstash Redis。金額為新台幣。退款請到 SHOPLINE 後台操作，付款通知會自動撤銷授權。" />;

  if (!redisEnabled()) {
    return (
      <>
        {header}
        <div className="rounded-xl border border-dashed border-line">
          <EmptyState icon="orders" title="尚未設定 Upstash Redis" description="訂單和授權碼都存在 Redis，設定後訂單會出現在這裡。" />
        </div>
      </>
    );
  }

  const [orders, log] = await Promise.all([listOrders().catch(() => null), webhookLog(30).catch(() => [])]);
  if (!orders) {
    return (
      <>
        {header}
        <Notice tone="bad">讀不到 Redis 的訂單資料。</Notice>
      </>
    );
  }

  const paid = orders.filter((o) => o.status === "paid");
  const refunded = orders.filter((o) => o.status === "refunded");
  const finished = orders.filter((o) => o.status !== "pending");
  const sales = paid.reduce((s, o) => s + o.amountTwd, 0);
  const attention = orders.filter((o) => o.status === "amount_mismatch" || o.status === "disputed");

  const byPlan = new Map<Plan, { count: number; amount: number }>();
  for (const o of paid) {
    const row = byPlan.get(o.plan) ?? { count: 0, amount: 0 };
    row.count += 1;
    row.amount += o.amountTwd;
    byPlan.set(o.plan, row);
  }

  return (
    <>
      {header}
      {attention.length > 0 && (
        <Notice tone="bad">有 {attention.length} 筆訂單需要處理（金額不符或爭議中），請到 SHOPLINE 後台確認。</Notice>
      )}

      <KpiStrip cols={4}>
        <StatTile icon="orders" label="有效訂單" value={paid.length} hint={`另有 ${orders.length - finished.length} 筆未完成付款`} />
        <StatTile icon="dollar" label="銷售額" value={twd(sales)} hint="已扣退款，未扣金流手續費" />
        <StatTile
          icon="check"
          label="付款完成率"
          value={pct(finished.length, orders.length)}
          hint="填完 email 前往付款後，實際付款的比例"
        />
        <StatTile
          icon="alert"
          label="退款率"
          value={pct(refunded.length, paid.length + refunded.length)}
          hint={`${refunded.length} 筆全額退款`}
          tone={paid.length + refunded.length >= 10 && refunded.length / (paid.length + refunded.length) > 0.1 ? "warn" : undefined}
        />
      </KpiStrip>

      <Section title="方案組合" description="已付款訂單，依金額排序">
        <BarList
          items={[...byPlan.entries()]
            .sort((a, b) => b[1].amount - a[1].amount)
            .map(([plan, row]) => ({ label: PLAN_LABEL[plan], value: row.count, extra: twd(row.amount) }))}
          empty={{ title: "還沒有付款完成的訂單", icon: "orders" }}
        />
      </Section>

      <Section title="訂單明細" description={`最近 ${orders.length} 筆（最多 500 筆），時間為台北時間`} flush>
        <DataTable
          columns={[
            { label: "時間" },
            { label: "訂單" , hideOnMobile: true },
            { label: "方案" },
            { label: "客戶" },
            { label: "金額", num: true },
            { label: "狀態" },
          ]}
          rows={orders.map((o) => [
            <span key="t" className="whitespace-nowrap text-subtle tabular-nums">
              {formatDate(o.createdAt)}
            </span>,
            <code key="i" className="font-mono text-xs text-subtle">
              {o.id}
            </code>,
            PLAN_LABEL[o.plan],
            maskEmail(o.email),
            twd(o.amountTwd),
            <StatusDot key="s" tone={STATUS[o.status].tone}>
              {STATUS[o.status].label}
            </StatusDot>,
          ])}
          empty={{ title: "還沒有訂單", description: "有人在結帳頁填完 email 前往付款後，訂單就會出現在這裡。", icon: "orders" }}
        />
      </Section>

      <Section title="付款通知紀錄" description="SHOPLINE 送來的最近 30 則通知與處理結果，用來對帳與排查。" flush>
        <DataTable
          columns={[{ label: "時間" }, { label: "事件" }, { label: "訂單", hideOnMobile: true }, { label: "結果" }]}
          rows={log.map((e) => [
            <span key="t" className="whitespace-nowrap text-subtle tabular-nums">
              {formatDate(e.at)}
            </span>,
            <code key="e" className="font-mono text-xs">
              {e.type || "（無）"}
            </code>,
            <code key="o" className="font-mono text-xs text-subtle">
              {e.order ?? ""}
            </code>,
            <StatusDot key="r" tone={RESULT_TONE[e.result] ?? "idle"}>
              {e.result}
            </StatusDot>,
          ])}
          empty={{ title: "還沒收到付款通知", icon: "pulse" }}
        />
      </Section>
    </>
  );
}
