import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// SHOPLINE 付款完成後導回這裡，再轉到完成頁。入帳以付款通知為準，完成頁會等它。
export function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("o") ?? "";
  const safe = /^SU[0-9a-f]{22}$/.test(id) ? id : "";
  return Response.redirect(`${siteUrl()}/checkout/done${safe ? `?o=${safe}` : ""}`, 303);
}
