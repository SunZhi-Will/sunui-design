// /admin 多個頁面共用的資料組合：SunUI 自己的授權（Redis）× 安裝使用紀錄（Redis）。

import { daysBetween } from "./admin";
import { licenseUsage, type LicenseUsage } from "./events";
import { listLicenses, type License } from "./orders";
import { redisEnabled } from "./redis";

/** 買超過這麼多天仍然 0 安裝，列入沉睡名單。 */
export const DORMANT_DAYS = 3;

export type LicenseRow = License & { usage: LicenseUsage };

export async function licenseOverview(now = new Date()) {
  if (!redisEnabled()) return { ok: false as const, error: "尚未設定 Upstash Redis" };
  let licenses: License[];
  try {
    licenses = await listLicenses();
  } catch {
    return { ok: false as const, error: "讀不到 Redis" };
  }
  const usage = licenses.length ? await licenseUsage(licenses.map((l) => l.id)).catch(() => null) : null;
  const rows: LicenseRow[] = licenses.map((l) => ({ ...l, usage: usage?.get(l.id) ?? { count: 0, blocks: [] } }));
  const iso = now.toISOString();
  const granted = rows.filter((r) => r.status === "active");
  const activated = granted.filter((r) => r.usage.count > 0);
  const dormant = granted.filter((r) => r.usage.count === 0 && daysBetween(r.createdAt, iso) >= DORMANT_DAYS);
  const firstInstallDays = activated.flatMap((r) => (r.usage.first ? [daysBetween(r.createdAt, r.usage.first)] : []));
  return { ok: true as const, rows, granted, activated, dormant, medianFirstInstall: median(firstInstallDays) };
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
