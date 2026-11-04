import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

// 圖示庫獨立於 block 目錄（registry.json）之外，避免出現在 block 清單、站內地圖與 llms.txt
const source = "registry/icons/sunui-icons.tsx";

export function generateStaticParams() {
  return [{ name: "sunui-icons.json" }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (name !== "sunui-icons.json") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const content = await readFile(path.join(process.cwd(), source), "utf8");
  return Response.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "sunui-icons",
    type: "registry:ui",
    title: "SunUI Icons",
    description:
      "SunUI's stroke icon set on a 24px grid with a 1.5 stroke, including paper-commerce signatures (notched coupon, zigzag receipt, tilted stamp, punch card) and an optional vermilion accent via --sunui-icon-accent.",
    files: [{ path: source, type: "registry:ui", target: "components/ui/sunui-icons.tsx", content }],
  });
}
