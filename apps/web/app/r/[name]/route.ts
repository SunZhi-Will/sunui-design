import { buildRegistryItem, getItem, getItems } from "@/lib/registry";
import registry from "@/registry.json";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [
    { name: "registry.json" },
    ...getItems().map((item) => ({ name: `${item.name}.json` })),
  ];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  if (name === "registry.json") {
    return Response.json(registry);
  }

  const item = getItem(name.replace(/\.json$/, ""));
  if (!item || !name.endsWith(".json")) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // TODO(pro): meta.tier === "pro" 時驗證 Authorization: Bearer <license key>
  return Response.json(await buildRegistryItem(item));
}
