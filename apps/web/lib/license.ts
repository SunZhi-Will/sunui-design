// Pro registry 的授權驗證：Polar license key + 記憶體快取 + 以 key 為單位限流。
// 快取與計數存在單一 instance 記憶體；流量變大後改用 Redis / Edge KV。

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

  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (recent.length > RATE_LIMIT) {
    return { ok: false, status: 429, message: "Too many requests for this license key. Try again in a few minutes." };
  }

  const day = new Date(now).toISOString().slice(0, 10);
  const seen = ipsByKey.get(key);
  const ips = seen?.day === day ? seen.ips : new Set<string>();
  ips.add(ip);
  ipsByKey.set(key, { day, ips });
  if (ips.size > MAX_IPS_PER_DAY) {
    return {
      ok: false,
      status: 403,
      message: "This license key is being used from too many locations. Contact support if this is a mistake.",
    };
  }

  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.result;

  const result = await validateKey(key);
  // 只快取確定的結果，Polar 暫時失敗（503）不快取
  if (result.ok || result.status !== 503) cache.set(key, { result, expiresAt: now + CACHE_TTL_MS });
  return result;
}

/** 退款或撤銷時由 Polar webhook 呼叫，讓 key 立即失效。 */
export function invalidateLicense(key: string) {
  cache.delete(key);
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
