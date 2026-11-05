import { checkLicense, clientIp, readBearer } from "@/lib/license";
import { buildRegistryItem, getItem } from "@/lib/registry";
import { licenseSummary, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// shadcn CLI 會把 JSON body 裡的 message 顯示在使用者的終端機
function deny(status: number, message: string) {
  return Response.json({ error: status === 401 ? "Unauthorized" : "Forbidden", message }, { status });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const item = name.endsWith(".json") ? getItem(name.slice(0, -5), "pro") : undefined;
  if (!item) {
    return Response.json({ error: "Not found", message: `No SunUI Pro block named "${name}".` }, { status: 404 });
  }

  const key = readBearer(request);
  if (!key) {
    return deny(
      401,
      [
        `"${item.title}" is a SunUI Pro block.`,
        licenseSummary(),
        `Get a license at ${siteUrl()}/pricing, then add SUNUI_LICENSE_KEY=<your key> to .env.local.`,
        `Setup guide: ${siteUrl()}/blocks/${item.name}`,
      ].join("\n"),
    );
  }

  const license = await checkLicense(key, clientIp(request));
  if (!license.ok) {
    return Response.json(
      { error: "License error", message: license.message },
      { status: license.status, headers: license.status === 429 ? { "Retry-After": "900" } : undefined },
    );
  }

  const banner = [
    "/**",
    ` * SunUI Pro: ${item.title}`,
    ` * Licensed copy (${license.displayKey}). Do not redistribute or publish this source.`,
    ` * License terms: ${siteUrl()}/license`,
    " */",
  ].join("\n");

  return Response.json(await buildRegistryItem(item, banner), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
