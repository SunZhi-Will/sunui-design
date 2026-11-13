export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100").replace(/\/$/, "");
}

export const githubUrl = "https://github.com/SunZhi-Will/sunui-design";

/** Founding member 只在這段期間販售（台北時間）。 */
export const foundingWindow = {
  opensAt: new Date("2026-11-27T00:00:00+08:00"),
  closesAt: new Date("2027-01-12T00:00:00+08:00"),
  seats: 150,
};

export type FoundingState = "upcoming" | "open" | "closed";

export function foundingState(now = new Date()): FoundingState {
  if (now < foundingWindow.opensAt) return "upcoming";
  if (now >= foundingWindow.closesAt) return "closed";
  return "open";
}

/** 定價（美元，一次買斷）。pricing 頁、401 訊息與 agent 說明都從這裡取。 */
export const prices = { pro: 129, team: 349, founding: 79, teamSeats: 5 };

/** 給終端機與 agent 看的一句話方案說明（英文）。 */
export function licenseSummary(now = new Date()) {
  const base = `Pro is a one-time $${prices.pro} (Team: $${prices.team} for ${prices.teamSeats} people), no subscription, and covers unlimited personal and client projects.`;
  return foundingState(now) === "open"
    ? `${base} Founding members pay $${prices.founding} for lifetime Pro until the seats run out.`
    : base;
}

/** 實際結帳金額（新台幣，SHOPLINE Payments 只收台幣）。約等於上面的美金價，網站仍以美金標價並註明以台幣結帳。 */
export const pricesTwd = { founding: 2490, pro: 4090, team: 10990 } as const;

export type Plan = keyof typeof pricesTwd;

export function isPlan(value: string): value is Plan {
  return value === "founding" || value === "pro" || value === "team";
}

/** SHOPLINE 已設定（或本機的開發模式）才開放結帳；否則定價頁改顯示 waitlist。 */
export function checkoutReady() {
  if (process.env.SHOPLINE_ENV === "dev" && process.env.NODE_ENV !== "production") return true;
  return Boolean(process.env.SHOPLINE_MERCHANT_ID && process.env.SHOPLINE_API_KEY && process.env.SHOPLINE_SIGN_KEY);
}
