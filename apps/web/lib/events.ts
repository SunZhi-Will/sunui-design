// Pro 授權使用與購買漏斗的匿名計數，給 /admin 看。
// 不存 license key 本身（只存 SunUI 的授權 id）、不存 IP 或 user agent 原文。
// 寫入一律不等待、失敗不拋出：統計壞掉不能影響安裝或結帳。

import { dayKey, hashToRecord, lastDays, pipeline, RETENTION_SECONDS, sumRecords, type RedisCommand } from "./redis";

export type FunnelField = "pricing_view" | `checkout_click:${string}`;

const BOT = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse/i;

export function isBot(userAgent: string | null) {
  return !userAgent || BOT.test(userAgent);
}

function hincr(key: string, field: string): RedisCommand[] {
  return [["HINCRBY", key, field, 1], ["EXPIRE", key, RETENTION_SECONDS]];
}

async function run(commands: RedisCommand[]) {
  try {
    await pipeline(commands);
  } catch {
    // 統計失敗不影響主流程
  }
}

/** 授權成功、回傳 Pro 原始碼時呼叫。 */
export function recordProInstall(block: string, licenseId: string, now = new Date()) {
  const day = dayKey(now);
  const iso = now.toISOString();
  const lic = `lic:${licenseId}`;
  return run([
    ...hincr(`pro:${day}`, block),
    ["HSETNX", lic, "first", iso],
    ["HSET", lic, "last", iso],
    ["HINCRBY", lic, "count", 1],
    ["SADD", `${lic}:blocks`, block],
    ["SADD", "lic:all", licenseId],
  ]);
}

/** 沒帶 key（401）或授權失敗（403 / 429 / 503）時呼叫。401 依 block 記，是最直接的購買意圖。 */
export function recordProDenied(block: string, status: number, now = new Date()) {
  const day = dayKey(now);
  return run([...(status === 401 ? hincr(`pro401:${day}`, block) : []), ...hincr(`prodeny:${day}`, String(status))]);
}

export function recordFunnel(field: FunnelField, now = new Date()) {
  return run(hincr(`funnel:${dayKey(now)}`, field));
}

export function recordWebhook(type: string, now = new Date()) {
  return run([["HSET", "webhook:last", type, now.toISOString()]]);
}

export type DailyHash = { day: string; values: Record<string, number> };

/** 一次讀多個 `<prefix>:<day>` hash，回傳每日資料與加總。 */
async function readDaily(prefixes: string[], days: number, now = new Date()) {
  const keys = lastDays(days, now);
  const replies = await pipeline(prefixes.flatMap((prefix) => keys.map((day) => ["HGETALL", `${prefix}:${day}`])));
  if (!replies) return null;
  return Object.fromEntries(
    prefixes.map((prefix, p) => {
      const daily: DailyHash[] = keys.map((day, i) => ({ day, values: hashToRecord(replies[p * keys.length + i]?.result) }));
      return [prefix, { daily, total: sumRecords(daily.map((d) => d.values)) }];
    }),
  ) as Record<string, { daily: DailyHash[]; total: Record<string, number> }>;
}

export async function eventStats(days: number, now = new Date()) {
  const data = await readDaily(["pro", "pro401", "prodeny", "funnel"], days, now);
  if (!data) return null;
  const sum = (record: Record<string, number>) => Object.values(record).reduce((s, n) => s + n, 0);
  const funnel = data.funnel.total;
  const checkoutClicks = Object.entries(funnel)
    .filter(([key]) => key.startsWith("checkout_click:"))
    .reduce((s, [, n]) => s + n, 0);
  return {
    days,
    pro: { total: sum(data.pro.total), byBlock: data.pro.total, perDay: data.pro.daily.map((d) => ({ day: d.day, value: sum(d.values) })) },
    intent: { total: sum(data.pro401.total), byBlock: data.pro401.total, perDay: data.pro401.daily.map((d) => ({ day: d.day, value: sum(d.values) })) },
    denied: data.prodeny.total,
    deniedByDay: data.prodeny.daily,
    funnel: { pricingViews: funnel.pricing_view ?? 0, checkoutClicks, byField: funnel, byDay: data.funnel.daily },
  };
}

export type LicenseUsage = { first?: string; last?: string; count: number; blocks: string[] };

/** 讀多把 license 的使用紀錄（以授權 id 為鍵）。 */
export async function licenseUsage(licenseIds: string[]) {
  const usage = new Map<string, LicenseUsage>();
  if (licenseIds.length === 0) return usage;
  const replies = await pipeline(licenseIds.flatMap((id) => [["HGETALL", `lic:${id}`], ["SMEMBERS", `lic:${id}:blocks`]]));
  if (!replies) return null;
  licenseIds.forEach((id, i) => {
    const raw = replies[i * 2]?.result;
    const fields: Record<string, string> = {};
    if (Array.isArray(raw)) for (let j = 0; j + 1 < raw.length; j += 2) fields[String(raw[j])] = String(raw[j + 1]);
    const blocks = replies[i * 2 + 1]?.result;
    usage.set(id, {
      first: fields.first,
      last: fields.last,
      count: Number(fields.count) || 0,
      blocks: Array.isArray(blocks) ? blocks.map(String).sort() : [],
    });
  });
  return usage;
}

export async function webhookLast() {
  const replies = await pipeline([["HGETALL", "webhook:last"]]);
  if (!replies) return null;
  const raw = replies[0]?.result;
  const out: Record<string, string> = {};
  if (Array.isArray(raw)) for (let i = 0; i + 1 < raw.length; i += 2) out[String(raw[i])] = String(raw[i + 1]);
  return out;
}
