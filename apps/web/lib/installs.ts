// 免費 registry 的匿名安裝計數。只記 block 名稱、日期與來源類型，不存 IP 或 user agent 原文。
// 存在 Upstash Redis（REST，無套件依賴，可在 middleware 的 edge runtime 執行）；未設定時什麼都不做。

const RETENTION_SECONDS = 180 * 24 * 60 * 60;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function pipeline(commands: (string | number)[][]) {
  const config = redisConfig();
  if (!config) return null;
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Redis responded ${response.status}`);
  return (await response.json()) as { result?: unknown; error?: string }[];
}

export function installsEnabled() {
  return redisConfig() !== null;
}

/** 瀏覽器（型錄預覽、有人直接開 JSON）不算安裝；其餘視為 shadcn CLI 或 agent。 */
export function sourceKind(userAgent: string | null): "browser" | "tool" {
  return userAgent && /mozilla/i.test(userAgent) ? "browser" : "tool";
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function recordInstall(name: string, userAgent: string | null, now = new Date()) {
  const day = dayKey(now);
  const kind = sourceKind(userAgent);
  const commands: (string | number)[][] = [
    ["HINCRBY", `installs:${day}:kind`, kind, 1],
    ["EXPIRE", `installs:${day}:kind`, RETENTION_SECONDS],
  ];
  if (kind === "tool") {
    commands.push(["HINCRBY", `installs:${day}`, name, 1], ["EXPIRE", `installs:${day}`, RETENTION_SECONDS]);
  }
  await pipeline(commands);
}

function hashToRecord(result: unknown) {
  const record: Record<string, number> = {};
  if (!Array.isArray(result)) return record;
  for (let i = 0; i + 1 < result.length; i += 2) record[String(result[i])] = Number(result[i + 1]) || 0;
  return record;
}

/** 最近 N 天（含今天，UTC）的安裝排行與來源比例。 */
export async function installStats(days: number, now = new Date()) {
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(now.getTime() - i * 86_400_000)));
  const results = await pipeline(keys.flatMap((day) => [["HGETALL", `installs:${day}`], ["HGETALL", `installs:${day}:kind`]]));
  if (!results) return null;

  const blocks: Record<string, number> = {};
  const kinds: Record<string, number> = {};
  const perDay: { day: string; installs: number }[] = [];
  keys.forEach((day, i) => {
    const dayBlocks = hashToRecord(results[i * 2]?.result);
    let total = 0;
    for (const [name, count] of Object.entries(dayBlocks)) {
      blocks[name] = (blocks[name] ?? 0) + count;
      total += count;
    }
    perDay.push({ day, installs: total });
    for (const [kind, count] of Object.entries(hashToRecord(results[i * 2 + 1]?.result))) {
      kinds[kind] = (kinds[kind] ?? 0) + count;
    }
  });

  const top = Object.entries(blocks)
    .sort((a, b) => b[1] - a[1])
    .map(([name, installs]) => ({ name, installs }));
  return { days, from: keys[keys.length - 1], to: keys[0], total: top.reduce((s, b) => s + b.installs, 0), kinds, perDay, top };
}
