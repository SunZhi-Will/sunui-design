import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { clientIp } from "@/lib/license";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 10;
const hits = new Map<string, number[]>();

export async function POST(request: Request) {
  const ip = clientIp(request);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > MAX_PER_IP) {
    return Response.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; company?: unknown; source?: unknown };
  // 蜜罐欄位有值代表是機器人，假裝成功
  if (body.company) return Response.json({ message: "You are on the list." });

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  }
  const source = typeof body.source === "string" ? body.source.slice(0, 40) : "site";

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const segmentId = process.env.RESEND_WAITLIST_SEGMENT_ID;
    const response = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
      }),
    });
    // 已存在的聯絡人也當作成功，不透露名單內容
    if (!response.ok && response.status !== 409) {
      return Response.json({ message: "Could not join right now. Please try again later." }, { status: 502 });
    }
  } else if (process.env.NODE_ENV !== "production") {
    // 本機開發沒有設定 Resend 時寫到 .data/waitlist.jsonl
    const dir = path.join(process.cwd(), ".data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "waitlist.jsonl"), JSON.stringify({ email, source, at: new Date().toISOString() }) + "\n");
  } else {
    return Response.json({ message: "The waitlist is not open yet." }, { status: 503 });
  }

  return Response.json({ message: "You are on the list. We will email you when Founding seats open." });
}
