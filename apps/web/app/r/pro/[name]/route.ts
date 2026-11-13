import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { after } from "next/server";

import { recordProDenied, recordProInstall } from "@/lib/events";
import { checkLicense, clientIp, readBearer } from "@/lib/license";
import { getProIconItem, type ProIconItem } from "@/lib/pro-icons";
import { buildRegistryItem, getItem, withBanner } from "@/lib/registry";
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
  const slug = name.endsWith(".json") ? name.slice(0, -5) : undefined;
  const block = slug ? getItem(slug, "pro") : undefined;
  // 檔期圖示組不在 Pro 的 registry.json（那份是 block 型錄），索引在公開的 lib/pro-icons.ts；原始碼仍只在私有 repo
  const iconItem = !block && slug ? getProIconItem(slug) : undefined;
  const iconAvailable = iconItem ? existsSync(path.join(process.cwd(), iconItem.source)) : false;
  const item = block ?? (iconAvailable ? { name: iconItem!.name, title: iconItem!.title } : undefined);
  if (!item) {
    return Response.json({ error: "Not found", message: `No SunUI Pro block named "${name}".` }, { status: 404 });
  }

  const key = readBearer(request);
  // 統計（/admin）在回應送出後才寫，不拖慢安裝
  if (!key) {
    after(() => recordProDenied(item.name, 401));
    return deny(
      401,
      [
        `"${item.title}" is ${block ? "a SunUI Pro block" : "a SunUI Pro icon set"}.`,
        licenseSummary(),
        `Get a license at ${siteUrl()}/pricing, then add SUNUI_LICENSE_KEY=<your key> to .env.local.`,
        block ? `Setup guide: ${siteUrl()}/blocks/${item.name}` : `Icon sets: ${siteUrl()}/icons#pro-icons`,
      ].join("\n"),
    );
  }

  const license = await checkLicense(key, clientIp(request));
  if (!license.ok) {
    after(() => recordProDenied(item.name, license.status));
    return Response.json(
      { error: "License error", message: license.message },
      { status: license.status, headers: license.status === 429 ? { "Retry-After": "900" } : undefined },
    );
  }

  after(() => recordProInstall(item.name, license.licenseId));

  const banner = [
    "/**",
    ` * SunUI Pro: ${item.title}`,
    ` * Licensed copy (${license.displayKey}). Do not redistribute or publish this source.`,
    ` * License terms: ${siteUrl()}/license`,
    " */",
  ].join("\n");

  const body = block ? await buildRegistryItem(block, banner) : await buildIconItem(iconItem!, banner);
  return Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
}

async function buildIconItem(item: ProIconItem, banner: string) {
  const content = await readFile(path.join(process.cwd(), item.source), "utf8");
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: "registry:ui",
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies.map((dep) =>
      dep.startsWith("@sunui-pro/") ? dep : `${siteUrl()}/r/icons/${dep}.json`,
    ),
    files: [{ path: item.source, type: "registry:ui", target: item.target, content: withBanner(content, banner) }],
  };
}
