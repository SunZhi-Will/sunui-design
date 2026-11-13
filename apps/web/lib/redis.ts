// Upstash Redis REST 的最小封裝：無套件依賴，edge（middleware）與 Node route 都能用。
// 未設定環境變數時 pipeline 回 null，呼叫端要能在沒有 Redis 的情況下照常運作。

/** 統計資料預設保留 180 天。 */
export const RETENTION_SECONDS = 180 * 24 * 60 * 60;

export type RedisCommand = (string | number)[];
export type RedisReply = { result?: unknown; error?: string };

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export function redisEnabled() {
  return redisConfig() !== null;
}

export async function pipeline(commands: RedisCommand[]): Promise<RedisReply[] | null> {
  const config = redisConfig();
  if (!config || commands.length === 0) return null;
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Redis responded ${response.status}`);
  return (await response.json()) as RedisReply[];
}

/** 統計一律用 UTC 日期，和既有的 installs:* 資料一致。 */
export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** 今天往回 N 天（含今天）的日期，新的在前。 */
export function lastDays(days: number, now = new Date()) {
  return Array.from({ length: days }, (_, i) => dayKey(new Date(now.getTime() - i * 86_400_000)));
}

/** HGETALL 回傳的扁平陣列轉成物件。 */
export function hashToRecord(result: unknown) {
  const record: Record<string, number> = {};
  if (!Array.isArray(result)) return record;
  for (let i = 0; i + 1 < result.length; i += 2) record[String(result[i])] = Number(result[i + 1]) || 0;
  return record;
}

export function sumRecords(records: Record<string, number>[]) {
  const total: Record<string, number> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) total[key] = (total[key] ?? 0) + value;
  }
  return total;
}

/** SHA-256 十六進位字串（Web Crypto，edge 與 Node 都有）。用來把 key、IP 變成不可還原的識別。 */
export async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** HGETALL 回傳的扁平陣列轉成字串物件（不轉數字）。 */
export function hashToStrings(result: unknown) {
  const record: Record<string, string> = {};
  if (!Array.isArray(result)) return record;
  for (let i = 0; i + 1 < result.length; i += 2) record[String(result[i])] = String(result[i + 1]);
  return record;
}

/** 隨機十六進位字串。 */
export function randomHex(bytes: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
}
