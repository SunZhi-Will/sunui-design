// /account 的登入連結：不做帳號系統，寄一封帶簽章的連結到訂閱的 email，24 小時內有效。
// token = `${licenseId}.${expiresMs}.${HMAC-SHA256(SUNUI_ADMIN_TOKEN, "account:" + licenseId + "." + expiresMs)}`
// 拿到連結的人可以取消、恢復續扣、換卡（換卡要再刷一次卡，拿到連結也不能動到錢）。

const TTL_MS = 24 * 60 * 60 * 1000;

function secret() {
  return process.env.SUNUI_ADMIN_TOKEN ?? (process.env.NODE_ENV !== "production" ? "dev-secret" : "");
}

async function hmacHex(key: string, content: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(content));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signAccountToken(licenseId: string, now = Date.now()) {
  const key = secret();
  if (!key) return null;
  const expires = now + TTL_MS;
  return `${licenseId}.${expires}.${await hmacHex(key, `account:${licenseId}.${expires}`)}`;
}

/** 驗證連結，回傳授權 id；過期、簽章不對都回 null。 */
export async function verifyAccountToken(token: string, now = Date.now()) {
  const key = secret();
  const match = /^(lic_[0-9a-f]{16})\.(\d{13})\.([0-9a-f]{64})$/.exec(token ?? "");
  if (!key || !match) return null;
  const [, licenseId, expires, sig] = match;
  if (Number(expires) < now) return null;
  return safeEqual(sig, await hmacHex(key, `account:${licenseId}.${expires}`)) ? licenseId : null;
}
