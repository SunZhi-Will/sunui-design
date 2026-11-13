// Standard Webhooks 簽章驗證（Polar 用這套），只用 Web Crypto，不加套件。
// 簽章內容是 `${webhook-id}.${webhook-timestamp}.${body}`，HMAC-SHA256 後 base64，
// 標頭格式為以空白分隔的 `v1,<base64>`。
// Polar 的密鑰有兩種：2026-09-08 以前產生的以整串 `whsec_…` 的 UTF-8 位元組當 HMAC key（Polar HMAC），
// 之後產生的照標準把 `whsec_` 後面的 base64 解碼當 key。兩種都試，任一符合即通過。

const TOLERANCE_SECONDS = 5 * 60;

export type WebhookHeaders = { id: string | null; timestamp: string | null; signature: string | null };

function base64ToBytes(b64: string) {
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function bytesToBase64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function candidateKeys(secret: string): Uint8Array[] {
  const keys = [new TextEncoder().encode(secret)];
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    keys.push(base64ToBytes(raw));
  } catch {
    // 不是 base64，只用 UTF-8 版本
  }
  return keys;
}

async function hmac(key: Uint8Array, content: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(content)));
}

/** 長度固定時間比較，避免從回應時間猜出簽章。 */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyWebhook(body: string, headers: WebhookHeaders, secret: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false;

  const provided = signature
    .split(" ")
    .map((part) => part.split(","))
    .filter(([version, sig]) => version === "v1" && sig)
    .map(([, sig]) => sig);
  if (provided.length === 0) return false;

  const content = `${id}.${timestamp}.${body}`;
  for (const key of candidateKeys(secret)) {
    const expected = await hmac(key, content);
    if (provided.some((sig) => safeEqual(sig, expected))) return true;
  }
  return false;
}

/** 測試用：產生標頭值。 */
export async function signWebhook(body: string, id: string, timestamp: string, key: Uint8Array) {
  return `v1,${await hmac(key, `${id}.${timestamp}.${body}`)}`;
}
