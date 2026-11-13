// /admin 登入 cookie：`<到期秒數>.<HMAC-SHA256 base64url>`，HMAC key 由 SUNUI_ADMIN_TOKEN 衍生。
// 換 token 等於讓所有舊 cookie 失效。只用 Web Crypto，沒有其他依賴，方便單元測試。

export const ADMIN_COOKIE = "sunui_admin";
/** 側欄收合狀態（"1" = 收合）。放在這裡而不是 sidebar.tsx：server component 從 "use client" 檔案匯入常數會拿到 client reference。 */
export const RAIL_COOKIE = "sunui_admin_rail";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function toBase64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string, token: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`sunui-admin-cookie:${token}`),
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
