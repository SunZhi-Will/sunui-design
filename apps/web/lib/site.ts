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

/** Polar 結帳連結；未設定時頁面改導向 waitlist。 */
export const checkoutUrls = {
  founding: process.env.NEXT_PUBLIC_CHECKOUT_FOUNDING_URL,
  pro: process.env.NEXT_PUBLIC_CHECKOUT_PRO_URL,
  team: process.env.NEXT_PUBLIC_CHECKOUT_TEAM_URL,
};
