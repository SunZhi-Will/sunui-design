// /admin 登入：session cookie 與 email 登入連結。HMAC key 都由 SUNUI_ADMIN_TOKEN 衍生（用途不同、key 不同）。
// session cookie：`<到期秒數>.<簽章>`；換 token 等於讓所有舊 cookie 失效。
// 登入連結：`<email base64url>.<到期秒數>.<簽章>`，簽章綁定一個只存在申請登入那個瀏覽器 cookie 裡的 nonce，
// 所以連結被轉寄、或被信箱的連結掃描器先點開都無法登入。只用 Web Crypto，方便單元測試。

export const ADMIN_COOKIE = "sunui_admin";
/** 側欄收合狀態（"1" = 收合）。放在這裡而不是 sidebar.tsx：server component 從 "use client" 檔案匯入常數會拿到 client reference。 */
export const RAIL_COOKIE = "sunui_admin_rail";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const LOGIN_NONCE_COOKIE = "sunui_admin_login";
export const LOGIN_LINK_TTL_SECONDS = 15 * 60;

function toBase64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string) {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  return new TextDecoder().decode(Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0)));
}

async function sign(payload: string, token: string, purpose: "cookie" | "login-link" = "cookie") {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`sunui-admin-${purpose}:${token}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(token: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const expires = String(nowSeconds + SESSION_TTL_SECONDS);
  return `${expires}.${await sign(expires, token)}`;
}

export async function verifySession(value: string | undefined, token: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!value || !token) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) <= nowSeconds) return false;
  return safeEqual(signature, await sign(expires, token));
}

/** 比對登入輸入的 token：先各自雜湊成等長字串再做固定時間比較，不洩漏長度。 */
export async function tokenMatches(input: string, token: string) {
  const hash = async (text: string) =>
    toBase64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return safeEqual(await hash(input), await hash(token));
}

/** 白名單：SUNUI_ADMIN_EMAILS，逗號分隔，不分大小寫。 */
export function emailAllowed(email: string, allowList: string | undefined) {
  const target = email.trim().toLowerCase();
  if (!target) return false;
  return (allowList ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}

/** 隨機 nonce，存在申請登入的瀏覽器 cookie。 */
export function createNonce() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(24)).buffer as ArrayBuffer);
}

export async function createLoginLink(email: string, nonce: string, token: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const encoded = toBase64Url(new TextEncoder().encode(email.trim().toLowerCase()).buffer as ArrayBuffer);
  const expires = String(nowSeconds + LOGIN_LINK_TTL_SECONDS);
  return `${encoded}.${expires}.${await sign(`${encoded}.${expires}.${nonce}`, token, "login-link")}`;
}

/** 驗證登入連結，成功回傳 email。 */
export async function verifyLoginLink(
  value: string | null | undefined,
  nonce: string | undefined,
  token: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!value || !nonce || !token) return null;
  const [encoded, expires, signature] = value.split(".");
  if (!encoded || !expires || !signature || !/^\d+$/.test(expires)) return null;
  if (Number(expires) <= nowSeconds) return null;
  if (!safeEqual(signature, await sign(`${encoded}.${expires}.${nonce}`, token, "login-link"))) return null;
  try {
    return fromBase64Url(encoded);
  } catch {
    return null;
  }
}
