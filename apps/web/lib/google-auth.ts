// Google 登入（Google Identity Services）：前端的 Google 按鈕拿到 ID token（credential），
// 這裡交給 Google 的 tokeninfo 端點驗簽，再檢查發給我們的用戶端、發行者是 Google、email 已驗證、沒過期。
// 做法沿用作者 VideoAligner 專案（lib/auth.ts verifyGoogle），不需要 client secret 與 redirect URI。

const GOOGLE_TOKENINFO = "https://oauth2.googleapis.com/tokeninfo";

export type GoogleProfile = { email: string; name: string; picture: string };

type TokenInfo = {
  aud?: string;
  iss?: string;
  exp?: string | number;
  email?: unknown;
  email_verified?: boolean | string;
  name?: unknown;
  picture?: unknown;
};

export function googleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || undefined;
}

/** 檢查 tokeninfo 的回應。抽出來方便單元測試。 */
export function checkTokenInfo(info: TokenInfo, clientId: string, nowMs = Date.now()): GoogleProfile | null {
  const verified = info.email_verified === true || info.email_verified === "true";
  const issuerOk = info.iss === "accounts.google.com" || info.iss === "https://accounts.google.com";
  const notExpired = Number(info.exp) * 1000 > nowMs;
  if (info.aud !== clientId || !verified || !issuerOk || !notExpired || typeof info.email !== "string") return null;
  const picture = typeof info.picture === "string" && info.picture.startsWith("https://") ? info.picture.slice(0, 500) : "";
  const name = typeof info.name === "string" ? info.name.slice(0, 80) : "";
  return { email: info.email.toLowerCase(), name, picture };
}

export async function verifyGoogleCredential(credential: unknown, clientId: string): Promise<GoogleProfile | null> {
  if (typeof credential !== "string" || !/^[A-Za-z0-9._-]{100,4096}$/.test(credential)) return null;
  try {
    const response = await fetch(`${GOOGLE_TOKENINFO}?id_token=${encodeURIComponent(credential)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    return checkTokenInfo((await response.json()) as TokenInfo, clientId);
  } catch {
    return null;
  }
}
