// SunUI 自己發的 Pro 授權碼：產生、雜湊、加密。沒有 I/O，方便單元測試。
// Redis 只存授權碼的 SHA-256；完成頁要再顯示一次給買家，所以訂單裡另存一份 AES-GCM 加密版，
// 金鑰由 SUNUI_ADMIN_TOKEN 衍生。換掉 token 只會讓舊訂單的完成頁無法再顯示授權碼，授權本身照常有效。

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // 去掉容易看錯的 0 o 1 l i

/** 例如 sunui_k7m2-p9qx-4hct-8vwn-3jrz（約 120 bits 隨機）。 */
export function generateLicenseKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `sunui_${chars.match(/.{4}/g)!.slice(0, 6).join("-")}`;
}

export const LICENSE_KEY_PATTERN = /^sunui_[a-z2-9]{4}(-[a-z2-9]{4}){5}$/;

export async function hashLicenseKey(key: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`sunui-license:${key.trim()}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 後台與錯誤訊息只顯示最後 4 碼。 */
export function displayKey(key: string) {
  return `sunui_…${key.slice(-4)}`;
}

function toB64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(text: string) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

async function aesKey(secret: string) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`sunui-license-enc:${secret}`));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptLicenseKey(key: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret), new TextEncoder().encode(key));
  return `${toB64(iv)}.${toB64(new Uint8Array(sealed))}`;
}

export async function decryptLicenseKey(value: string, secret: string) {
  try {
    const [iv, sealed] = value.split(".");
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, await aesKey(secret), fromB64(sealed));
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
