import type { Metadata } from "next";

import { daysBetween, formatDate, maskEmail, requireAdmin } from "@/lib/admin";
import { DORMANT_DAYS, licenseOverview } from "@/lib/admin-data";
import { eventStats } from "@/lib/events";
import { redisEnabled } from "@/lib/redis";

import { DataTable, KpiStrip, Notice, PageHeader, parseRange, pct, RangeTabs, Section, StatTile, StatusDot } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "授權使用" };

export default async function AdminLicenses({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const days = parseRange((await searchParams).days);

  const [overview, events] = await Promise.all([
    licenseOverview(),
    eventStats(days).catch(() => null),
  ]);
  const ok = overview.ok ? overview : null;
  const now = new Date().toISOString();

  // Pro block：授權安裝對照 401（沒買但想裝）
  const names = new Set([...Object.keys(events?.pro.byBlock ?? {}), ...Object.keys(events?.intent.byBlock ?? {})]);
  const blocks = [...names]
    .map((name) => ({ name, installs: events?.pro.byBlock[name] ?? 0, intent: events?.intent.byBlock[name] ?? 0 }))
    .sort((a, b) => b.intent + b.installs - (a.intent + a.installs));

  return (
    <>
      <PageHeader
        title="授權使用"
        description="買了授權的人有沒有真的在用。只存授權碼的雜湊與最後 4 碼，不存授權碼本身。"
        actions={<RangeTabs value={days} basePath="/admin/licenses" />}
      />

      {!redisEnabled() && <Notice>尚未設定 Upstash Redis，沒有使用紀錄。</Notice>}
      {redisEnabled() && !overview.ok && <Notice tone="bad">{overview.error}</Notice>}

      <KpiStrip>
        <StatTile
          icon="license"
          label="授權啟用率"
          value={ok ? pct(ok.activated.length, ok.granted.length) : "–"}
          hint={ok ? `${ok.activated.length} / ${ok.granted.length} 把有效授權至少裝過 1 個 Pro block` : undefined}
        />
        <StatTile
          icon="clock"
          label="沉睡授權"
          value={ok?.dormant.length ?? "–"}
          hint={`購買超過 ${DORMANT_DAYS} 天仍未安裝`}
          tone={ok && ok.dormant.length > 0 ? "warn" : undefined}
          href="#dormant"
        />
        <StatTile
          icon="check"
          label="購買到首次安裝"
          value={ok?.medianFirstInstall === null || !ok ? "–" : `${ok.medianFirstInstall} 天`}
          hint="中位數，越短代表上手越順"
        />
      </KpiStrip>

      <Section id="dormant" title="沉睡名單" description="寄一封安裝教學信。email 只顯示部分。" flush>
        <DataTable
          columns={[{ label: "授權碼" }, { label: "客戶" }, { label: "購買時間", hideOnMobile: true }, { label: "已過天數", num: true }]}
          rows={(ok?.dormant ?? []).map((k) => [
            <code key="k" className="font-mono text-xs">
              {k.display}
            </code>,
            maskEmail(k.email),
            formatDate(k.createdAt),
            daysBetween(k.createdAt, now),
          ])}
          empty={{ title: "沒有沉睡授權", description: "每位買家都已經裝過至少一個 Pro block。", icon: "check" }}
        />
      </Section>

      <Section
        id="pro-blocks"
        title="Pro 區塊"
        description={`近 ${days} 天。意圖 = 沒帶授權碼想安裝的次數；意圖高、安裝低代表有興趣但被價格或說明擋住。`}
        flush
      >
        <DataTable
          columns={[{ label: "Block" }, { label: "授權安裝", num: true }, { label: "意圖（401）", num: true }, { label: "意圖佔比", num: true, hideOnMobile: true }]}
          rows={blocks.map((b) => [
            <code key="n" className="font-mono text-xs">
              {b.name}
            </code>,
            b.installs,
            b.intent,
            pct(b.intent, b.intent + b.installs),
          ])}
          empty={{ title: "還沒有 Pro 安裝紀錄", icon: "block" }}
        />
      </Section>

      <Section title="全部授權" description={ok ? `共 ${ok.rows.length} 把` : undefined} flush>
        <DataTable
          columns={[
            { label: "授權碼" },
            { label: "客戶" },
            { label: "狀態" },
            { label: "購買", hideOnMobile: true },
            { label: "首次安裝", hideOnMobile: true },
            { label: "最後使用", hideOnMobile: true },
            { label: "安裝", num: true },
            { label: "裝過的 block", hideOnMobile: true },
          ]}
          rows={(ok?.rows ?? []).map((k) => [
            <code key="k" className="font-mono text-xs">
              {k.display}
            </code>,
            maskEmail(k.email),
            <StatusDot key="s" tone={k.status === "active" ? (k.usage.count > 0 ? "ok" : "warn") : "idle"}>
              {k.status === "active" ? (k.usage.count > 0 ? "使用中" : "未安裝") : "已撤銷"}
            </StatusDot>,
            <span key="c" className="whitespace-nowrap text-subtle tabular-nums">
              {formatDate(k.createdAt)}
            </span>,
            k.usage.first ? (
              <span key="f" className="whitespace-nowrap">
                第 {daysBetween(k.createdAt, k.usage.first)} 天
              </span>
            ) : (
              ""
            ),
            <span key="l" className="whitespace-nowrap text-subtle tabular-nums">
              {formatDate(k.usage.last)}
            </span>,
            k.usage.count,
            <span key="b" className="text-xs text-subtle">
              {k.usage.blocks.join("、")}
            </span>,
          ])}
          empty={{ title: "還沒有授權", description: "有人付款完成後，SunUI 發出的授權碼會列在這裡。", icon: "license" }}
        />
      </Section>
    </>
  );
}
