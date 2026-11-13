import { after } from "next/server";

import { isBot, recordFunnel } from "@/lib/events";
import { clientIp } from "@/lib/license";

export const dynamic = "force-dynamic";

// 頁面 beacon（components/view-beacon.tsx）的接收端。只接受白名單事件，同一個 IP 每分鐘最多 20 次。
const EVENTS = new Set(["pricing_view"]);
const WINDOW_MS = 60 * 1000;
const MAX_PER_IP = 20;
const hits = new Map<string, number[]>();

export async function POST(request: Request) {
  const ip = clientIp(request);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  const body = (await request.json().catch(() => ({}))) as { event?: unknown };
  const event = typeof body.event === "string" ? body.event : "";
  if (EVENTS.has(event) && recent.length <= MAX_PER_IP && !isBot(request.headers.get("user-agent"))) {
    after(() => recordFunnel(event as "pricing_view"));
  }
  return new Response(null, { status: 204 });
}
