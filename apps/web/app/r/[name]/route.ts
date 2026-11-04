import { buildRegistryItem, freeManifest, getItem, getItems } from "@/lib/registry";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [
    { name: "registry.json" },
    ...getItems("free").map((item) => ({ name: `${item.name}.json` })),
  ];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  // 公開 registry 只含免費項目，符合 shadcn 官方索引「開源、扁平、files 不含 content」
  if (name === "registry.json") {
    return Response.json(freeManifest);
  }

  const item = getItem(name.replace(/\.json$/, ""), "free");
  if (!item || !name.endsWith(".json")) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(await buildRegistryItem(item));
}
