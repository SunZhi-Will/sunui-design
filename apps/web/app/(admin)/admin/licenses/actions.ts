"use server";

import { isAdmin } from "@/lib/admin";
import { sendReissuedKey } from "@/lib/mailer";
import { reissueLicense } from "@/lib/orders";

export type ReissueState = { key?: string; emailed?: boolean; error?: string };

/**
 * 後台「重發」：撤銷這把授權碼、發一把新的取代它（同訂單、同方案、同到期日、同 Team 席位）。
 * 用在 Team 成員離職，或發現授權碼外流。新的授權碼寄給購買人，也只在這裡顯示一次。
 * 不重新整理列表：列表一刷新，舊的那一列就變成「已撤銷」，按鈕連同新的授權碼一起消失。
 */
export async function reissue(_prev: ReissueState, formData: FormData): Promise<ReissueState> {
  if (!(await isAdmin())) return { error: "請先登入。" };
  const secret = process.env.SUNUI_ADMIN_TOKEN;
  if (!secret) return { error: "SUNUI_ADMIN_TOKEN 沒有設定。" };
  const licenseId = String(formData.get("licenseId") ?? "");
  if (!/^lic_[0-9a-f]{16}$/.test(licenseId)) return { error: "授權 id 不正確。" };
  try {
    const result = await reissueLicense(licenseId, secret);
    if (!result) return { error: "找不到這把授權，或它已經撤銷。" };
    const emailed = await sendReissuedKey(result.old, result.key);
    return { key: result.key, emailed };
  } catch {
    return { error: "讀寫 Redis 失敗。" };
  }
}
