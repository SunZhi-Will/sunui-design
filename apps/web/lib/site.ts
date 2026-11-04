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

/** Polar 結帳連結；未設定時頁面改導向 waitlist。 */
export const checkoutUrls = {
  founding: process.env.NEXT_PUBLIC_CHECKOUT_FOUNDING_URL,
  pro: process.env.NEXT_PUBLIC_CHECKOUT_PRO_URL,
  team: process.env.NEXT_PUBLIC_CHECKOUT_TEAM_URL,
};
