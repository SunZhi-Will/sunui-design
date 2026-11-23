import { after } from "next/server";

import { parsePortPlatform, portPlatformLabels, portPlatforms, portPrompt } from "@/lib/agent/port";
import { isBot, recordPort, recordProDenied } from "@/lib/events";
import { checkLicense, clientIp, readBearer } from "@/lib/license";
import { getItem } from "@/lib/registry";
import { licenseSummary, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// 移植指南（給 coding agent 讀的 Markdown）：/r/port/<platform>/<name>.md。
// 免費 block 直接給；Pro 的指南含 Pro 原始碼，和 /r/pro 一樣先驗授權。

const plain = (body: string, status: number, headers?: Record<string, string>) =>
  new Response(`${body}\n`, { status, headers: { "Content-Type": "text/plain; charset=utf-8", ...headers } });

export async function GET(request: Request, { params }: { params: Promise<{ platform: string; name: string }> }) {
  const { platform: rawPlatform, name } = await params;
  const platform = parsePortPlatform(rawPlatform);
  if (!platform) {
    return plain(`No port guide for "${rawPlatform}". Platforms: ${portPlatforms.join(", ")}.`, 404);
  }
  const item = getItem(name.replace(/\.md$/, ""));
  if (!item) return plain(`No SunUI block named "${name}".`, 404);

  if (item.meta.tier !== "pro") {
    if (!isBot(request.headers.get("user-agent"))) after(() => recordPort(item.name, platform, "free"));
    return new Response(await portPrompt(item, platform), {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600" },
    });
  }

  const key = readBearer(request);
  if (!key) {
    after(() => recordProDenied(item.name, 401));
    return plain(
      [
        `"${item.title}" is a SunUI Pro block. Its ${portPlatformLabels[platform]} port guide contains the Pro source, so it needs a license.`,
        licenseSummary(),
        `Get a license at ${siteUrl()}/pricing, then send it as: Authorization: Bearer <your key>.`,
      ].join("\n"),
      401,
    );
  }

  const license = await checkLicense(key, clientIp(request));
  if (!license.ok) {
    after(() => recordProDenied(item.name, license.status));
    return plain(license.message, license.status, license.status === 429 ? { "Retry-After": "900" } : undefined);
  }

  after(() => recordPort(item.name, platform, "pro", license.licenseId));
  return new Response(await portPrompt(item, platform, { displayKey: license.displayKey }), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}
