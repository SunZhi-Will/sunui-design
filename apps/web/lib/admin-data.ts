// /admin 多個頁面共用的資料組合：Polar 授權清單 × Redis 使用紀錄。

import { daysBetween } from "./admin";
import { licenseUsage, type LicenseUsage } from "./events";
import { listLicenseKeys, type PolarLicenseKey } from "./polar";

/** 買超過這麼多天仍然 0 安裝，列入沉睡名單。 */
export const DORMANT_DAYS = 3;

export type LicenseRow = PolarLicenseKey & { usage: LicenseUsage };

export async function licenseOverview(now = new Date()) {
  const keys = await listLicenseKeys();
  if (!keys.ok) return { ok: false as const, error: keys.error };
  const usage = keys.data.length ? await licenseUsage(keys.data.map((k) => k.id)).catch(() => null) : null;
  const rows: LicenseRow[] = keys.data.map((k) => ({ ...k, usage: usage?.get(k.id) ?? { count: 0, blocks: [] } }));
  const iso = now.toISOString();
  const granted = rows.filter((r) => r.status === "granted");
  const activated = granted.filter((r) => r.usage.count > 0);
  const dormant = granted.filter((r) => r.usage.count === 0 && daysBetween(r.created_at, iso) >= DORMANT_DAYS);
  const firstInstallDays = activated.flatMap((r) => (r.usage.first ? [daysBetween(r.created_at, r.usage.first)] : []));
  return { ok: true as const, rows, granted, activated, dormant, medianFirstInstall: median(firstInstallDays) };
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
