import { installStats, installsEnabled } from "@/lib/installs";

export const dynamic = "force-dynamic";

// 作者自己看的安裝排行：curl -H "Authorization: Bearer $SUNUI_STATS_TOKEN" <site>/api/installs?days=7
export async function GET(request: Request) {
  const token = process.env.SUNUI_STATS_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  if (!token || header !== `Bearer ${token}`) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!installsEnabled()) {
    return Response.json({ error: "Install counting is not configured (UPSTASH_REDIS_REST_URL / TOKEN)." }, { status: 503 });
  }

  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get("days")) || 7, 1), 90);
  return Response.json(await installStats(days));
}
