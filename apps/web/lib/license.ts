// Pro registry 的授權驗證：SunUI 自己發的授權碼（lib/orders.ts，存在 Redis）+ 短暫記憶體快取 + 以 key 為單位限流。
// 限流與 IP 計數放在 Redis（多個 serverless instance 共用）；沒設定 Redis 時退回單一 instance 記憶體。
// Redis 裡只存 key 的 SHA-256 與加鹽雜湊後的 IP，不存原文。

import { LICENSE_KEY_PATTERN } from "./license-key";
import { notifyOwnerSharing } from "./mailer";
import { flagSharing, licenseExpired, lookupLicense } from "./orders";
import { dayKey, pipeline, redisEnabled, sha256 } from "./redis";
import { prices, siteUrl } from "./site";

export type LicenseResult =
  | { ok: true; licenseId: string; displayKey: string }
  | { ok: false; status: 401 | 403 | 429 | 503; message: string };

type CacheEntry = { result: LicenseResult; expiresAt: number };

// 只快取「無效的授權碼」，擋住亂猜的請求；有效的每次都查 Redis（很便宜），退款撤銷才會立刻生效
const CACHE_TTL_MS = 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 100;
// 同一把 key 在一天內出現的不同 IP 超過這個數，視為 key 被分享，直接擋
const MAX_IPS_PER_DAY = 20;
// 超過這個數先通知作者、在後台標記「疑似分享」，還不擋（換網路、出差、VPN 都會多幾個 IP）
const ALERT_IPS_PER_DAY = 10;

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
  const limited = shared ? shared.blocked : memoryLimits(key, ip, now);
  if (limited) return limited;

  const cached = cache.get(key);
  let result: LicenseResult;
  if (cached && cached.expiresAt > now) {
    result = cached.result;
  } else {
    result = await validateKey(key);
    if (!result.ok && result.status === 401) cache.set(key, { result, expiresAt: now + CACHE_TTL_MS });
  }
  // 疑似分享：每把 key 每天只通知一次，失敗不影響安裝
  if (result.ok && result.licenseId !== "dev" && shared && shared.ips > ALERT_IPS_PER_DAY) {
    try {
      const flagged = await flagSharing(key, shared.ips, dayKey(new Date(now)));
      if (flagged) await notifyOwnerSharing(flagged, shared.ips);
    } catch {
      // 忽略
    }
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

/**
 * Redis 版限流與 IP 計數。回傳 null 代表沒有 Redis 或 Redis 失敗，改用記憶體版；
 * blocked 為 false 代表通過，ips 是這把 key 今天出現過的不同 IP 數（估計值）。
 */
async function sharedLimits(key: string, ip: string, now: number): Promise<{ blocked: LicenseResult | false; ips: number } | null> {
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
    const ips = Number(replies[3]?.result) || 0;
    if (Number(replies[0]?.result) > RATE_LIMIT) return { blocked: rateLimited, ips };
    if (ips > MAX_IPS_PER_DAY) return { blocked: tooManyIps, ips };
    return { blocked: false, ips };
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

async function validateKey(key: string): Promise<LicenseResult> {
  // 本機開發用的測試 key，正式環境一律忽略
  if (process.env.NODE_ENV !== "production") {
    const devKeys = (process.env.SUNUI_DEV_LICENSE_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
    if (devKeys.includes(key)) return { ok: true, licenseId: "dev", displayKey: `dev-${key.slice(-4)}` };
  }

  if (!LICENSE_KEY_PATTERN.test(key)) return { ok: false, status: 401, message: invalidKeyMessage() };
  try {
    const license = await lookupLicense(key);
    if (!license) return { ok: false, status: 401, message: invalidKeyMessage() };
    if (license.status !== "active") {
      return { ok: false, status: 403, message: "This license key has been disabled or revoked." };
    }
    // 訂閱到期：已經裝進專案的 block 照常可用，只是不能再裝新的或拿更新
    if (licenseExpired(license)) {
      return {
        ok: false,
        status: 403,
        message: `This SunUI Pro subscription ended on ${license.expiresAt!.slice(0, 10)}. Blocks you already installed keep working. Renew with the same email at ${siteUrl()}/pricing (the key stays the same), or buy lifetime Pro for $${prices.pro}.`,
      };
    }
    return { ok: true, licenseId: license.id, displayKey: license.display };
  } catch {
    return { ok: false, status: 503, message: "License server is unavailable. Please try again shortly." };
  }
}

function invalidKeyMessage() {
  return "This license key is not valid. Check SUNUI_LICENSE_KEY in your .env.local.";
}
