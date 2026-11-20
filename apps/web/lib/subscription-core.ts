// 自動續扣的純判斷：寬限期、什麼時候該扣款、什麼時候放棄。沒有 I/O 也沒有 import，方便單元測試（tests/subscription.test.ts）。

/** 自動續扣的寬限期：到期後扣款還沒成功（Polar 重試中、SHOPLINE 重試排程中），這段時間內授權照常可用。 */
export const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** SHOPLINE 續扣排程：到期前 12 小時開始扣，失敗後隔 1、2、2 天重試（到期後第 0、1、3、5 天），全部在 7 天寬限期內。 */
export const RETRY_GAPS_MS = [0, 1, 2, 2].map((d) => d * 24 * 60 * 60 * 1000);
export const MAX_CHARGE_ATTEMPTS = RETRY_GAPS_MS.length;

const HOUR = 60 * 60 * 1000;

export type RenewalState = {
  status: "active" | "revoked";
  expiresAt?: string;
  autoRenew?: boolean;
  renewVia?: "shopline" | "polar";
  slpCustomer?: string;
  slpInstrument?: string;
  chargeFails?: number;
  lastChargeAt?: string;
};

/** 訂閱過了到期時間（自動續扣中的再加寬限期）。買斷永遠回 false。 */
export function licenseExpired(license: Pick<RenewalState, "expiresAt" | "autoRenew">, now = new Date()) {
  if (!license.expiresAt) return false;
  const grace = license.autoRenew ? GRACE_MS : 0;
  return new Date(license.expiresAt).getTime() + grace <= now.getTime();
}

/** 現在該扣款的 SHOPLINE 訂閱。 */
export function chargeDue(license: RenewalState, now = new Date()) {
  if (license.status !== "active" || !license.autoRenew || license.renewVia !== "shopline") return false;
  if (!license.expiresAt || !license.slpCustomer || !license.slpInstrument) return false;
  const expires = new Date(license.expiresAt).getTime();
  if (expires - now.getTime() > 12 * HOUR) return false;
  if (now.getTime() >= expires + GRACE_MS) return false;
  const fails = license.chargeFails ?? 0;
  if (fails >= MAX_CHARGE_ATTEMPTS) return false;
  if (fails === 0 || !license.lastChargeAt) return true;
  // 每天跑一次的 cron 時間會飄一點，提早一小時也算到了
  return now.getTime() - new Date(license.lastChargeAt).getTime() >= RETRY_GAPS_MS[fails] - HOUR;
}

/** 自動續扣停掉的條件：SHOPLINE 重試用完，或寬限期過了還沒扣到。 */
export function renewalGaveUp(license: RenewalState, now = new Date()) {
  if (!license.autoRenew || license.status !== "active" || !license.expiresAt) return false;
  if (license.renewVia === "shopline" && (license.chargeFails ?? 0) >= MAX_CHARGE_ATTEMPTS) return true;
  return now.getTime() >= new Date(license.expiresAt).getTime() + GRACE_MS;
}
