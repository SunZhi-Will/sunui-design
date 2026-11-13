// Pro registry 的授權驗證：Polar license key + 記憶體快取 + 以 key 為單位限流。
// 限流、IP 計數與撤銷名單放在 Redis（多個 serverless instance 共用）；沒設定 Redis 時退回單一 instance 記憶體。
// Redis 裡只存 key 的 SHA-256 與加鹽雜湊後的 IP，不存原文。

import { dayKey, pipeline, redisEnabled, sha256 } from "./redis";

export type LicenseResult =
  | { ok: true; licenseId: string; displayKey: string }
  | { ok: false; status: 401 | 403 | 429 | 503; message: string };

type CacheEntry = { result: LicenseResult; expiresAt: number };

const CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 100;
// 同一把 key 在一天內出現的不同 IP 超過這個數，視為 key 被分享
const MAX_IPS_PER_DAY = 20;

const cache = new Map<string, CacheEntry>();
const hits = new Map<string, number[]>();
const ipsByKey = new Map<string, { day: string; ips: Set<string> }>();

export function readBearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const key = match?.[1]?.trim();
  // 未設定環境變數時 shadcn CLI 會送出字面值 ${SUNUI_LICENSE_KEY}
  if (!key || key.startsWith("${")) return null;
  return key;
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function checkLicense(key: string, ip: string): Promise<LicenseResult> {
  const now = Date.now();

  const shared = await sharedLimits(key, ip, now);
  const limited = shared ?? memoryLimits(key, ip, now);
  if (limited) return limited;

  const cached = cache.get(key);
  let result: LicenseResult;
  if (cached && cached.expiresAt > now) {
    result = cached.result;
  } else {
    result = await validateKey(key);
    // 只快取確定的結果，Polar 暫時失敗（503）不快取
    if (result.ok || result.status !== 503) cache.set(key, { result, expiresAt: now + CACHE_TTL_MS });
  }

  // 退款撤銷由 webhook 寫進 Redis，所有 instance 立即生效，不必等記憶體快取過期
  if (result.ok && (await isRevoked(result.licenseId))) {
    return { ok: false, status: 403, message: "This license key has been disabled or revoked." };
  }
  return result;
}

const rateLimited: LicenseResult = {
  ok: false,
  status: 429,
  message: "Too many requests for this license key. Try again in a few minutes.",
};
const tooManyIps: LicenseResult = {
  ok: false,
  status: 403,
  message: "This license key is being used from too many locations. Contact support if this is a mistake.",
};

/** Redis 版限流與 IP 計數。回傳 null 代表沒有 Redis 或 Redis 失敗，改用記憶體版；回傳 false 代表通過。 */
async function sharedLimits(key: string, ip: string, now: number): Promise<LicenseResult | false | null> {
  if (!redisEnabled()) return null;
  try {
    const day = dayKey(new Date(now));
    const keyHash = (await sha256(`license:${key}`)).slice(0, 32);
    const ipHash = (await sha256(`${process.env.SUNUI_HASH_SALT ?? ""}:${day}:${ip}`)).slice(0, 24);
    const rateKey = `rl:lic:${keyHash}:${Math.floor(now / RATE_WINDOW_MS)}`;
    const ipKey = `ips:lic:${keyHash}:${day}`;
    const replies = await pipeline([
      ["INCR", rateKey],
      ["EXPIRE", rateKey, Math.ceil(RATE_WINDOW_MS / 1000)],
      ["PFADD", ipKey, ipHash],
      ["PFCOUNT", ipKey],
      ["EXPIRE", ipKey, 2 * 24 * 60 * 60],
    ]);
    if (!replies) return null;
    if (Number(replies[0]?.result) > RATE_LIMIT) return rateLimited;
    if (Number(replies[3]?.result) > MAX_IPS_PER_DAY) return tooManyIps;
    return false;
  } catch {
    return null;
  }
}

function memoryLimits(key: string, ip: string, now: number): LicenseResult | false {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (recent.length > RATE_LIMIT) return rateLimited;

  const day = new Date(now).toISOString().slice(0, 10);
  const seen = ipsByKey.get(key);
  const ips = seen?.day === day ? seen.ips : new Set<string>();
  ips.add(ip);
  ipsByKey.set(key, { day, ips });
  if (ips.size > MAX_IPS_PER_DAY) return tooManyIps;
  return false;
}

const memoryRevoked = new Set<string>();

async function isRevoked(licenseId: string) {
  if (memoryRevoked.has(licenseId)) return true;
  try {
    const replies = await pipeline([["SISMEMBER", "revoked", licenseId]]);
    return Number(replies?.[0]?.result) === 1;
  } catch {
    // Redis 失敗時不擋付費客戶；Polar validate 本身也會回報 revoked 狀態（快取過期後）
    return false;
  }
}

/** Polar webhook 收到 benefit_grant.revoked 時呼叫（退款、手動撤銷）。 */
export async function revokeLicense(licenseId: string) {
  memoryRevoked.add(licenseId);
  await pipeline([["SADD", "revoked", licenseId]]);
}

/** 撤銷後又重新發放（benefit_grant.created / updated 且 is_granted）時呼叫。 */
export async function restoreLicense(licenseId: string) {
  memoryRevoked.delete(licenseId);
  await pipeline([["SREM", "revoked", licenseId]]);
}

async function validateKey(key: string): Promise<LicenseResult> {
  // 本機開發用的測試 key，正式環境一律忽略
  if (process.env.NODE_ENV !== "production") {
    const devKeys = (process.env.SUNUI_DEV_LICENSE_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
    if (devKeys.includes(key)) return { ok: true, licenseId: "dev", displayKey: `dev-${key.slice(-4)}` };
  }

  const organizationId = process.env.POLAR_ORGANIZATION_ID;
  if (!organizationId) {
    return { ok: false, status: 503, message: "License validation is not configured yet. Please try again later." };
  }

  const apiUrl = (process.env.POLAR_API_URL ?? "https://api.polar.sh").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/v1/customer-portal/license-keys/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, organization_id: organizationId }),
      cache: "no-store",
    });

    if (response.status === 404 || response.status === 422) {
      return { ok: false, status: 401, message: invalidKeyMessage() };
    }
    if (!response.ok) {
      return { ok: false, status: 503, message: "License server is unavailable. Please try again shortly." };
    }

    const license = (await response.json()) as { id: string; display_key: string; status: string };
    if (license.status !== "granted") {
      return { ok: false, status: 403, message: "This license key has been disabled or revoked." };
    }
    return { ok: true, licenseId: license.id, displayKey: license.display_key };
  } catch {
    return { ok: false, status: 503, message: "License server is unavailable. Please try again shortly." };
  }
}

function invalidKeyMessage() {
  return "This license key is not valid. Check SUNUI_LICENSE_KEY in your .env.local.";
}
