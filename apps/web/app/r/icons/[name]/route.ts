import { readFile } from "node:fs/promises";
import path from "node:path";

import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

// 圖示庫獨立於 block 目錄（registry.json）之外，避免出現在 block 清單、站內地圖與 llms.txt
const items = {
  "sunui-icons": {
    title: "SunUI Icons",
    description:
      "SunUI's stroke icon set on a 24px grid with a 1.5 stroke, including paper-commerce signatures (notched coupon, zigzag receipt, tilted stamp, punch card) and an optional vermilion accent via --sunui-icon-accent.",
    source: "registry/icons/sunui-icons.tsx",
    target: "components/ui/sunui-icons.tsx",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
  },
  "sunui-animated-icons": {
    title: "SunUI Animated Icons",
    description:
      "Animated versions of SunUI icons on the same geometry: hover icons play when their button is hovered or focused, toggle icons switch with an active prop, and loading icons loop only while active. Respects reduced motion.",
    source: "registry/icons/sunui-animated-icons.tsx",
    target: "components/ui/sunui-animated-icons.tsx",
    dependencies: ["framer-motion"],
    registryDependencies: ["sunui-icons"],
  },
  "sunui-pixel-icons": {
    title: "SunUI Pixel Icons",
    description:
      "SunUI's pixel sprite icons on a 16px grid: outline, tinted fill, shade and a white shine, covering interface controls, paper-commerce signatures and retro game items. Crisp-edged SVG with an optional vermilion accent via --sunui-icon-accent.",
    source: "registry/icons/sunui-pixel-icons.tsx",
    target: "components/ui/sunui-pixel-icons.tsx",
    dependencies: [] as string[],
    registryDependencies: [] as string[],
  },
  "sunui-animated-pixel-icons": {
    title: "SunUI Animated Pixel Icons",
    description:
      "Frame-by-frame animated versions of SunUI pixel icons: hover icons play once when their button is hovered or focused, toggle icons step between states with an active prop, and loop icons cycle only while active. No animation library; respects reduced motion.",
    source: "registry/icons/sunui-animated-pixel-icons.tsx",
    target: "components/ui/sunui-animated-pixel-icons.tsx",
    dependencies: [] as string[],
    registryDependencies: ["sunui-pixel-icons"],
  },
};

type ItemName = keyof typeof items;

export function generateStaticParams() {
  return Object.keys(items).map((name) => ({ name: `${name}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const key = name.replace(/\.json$/, "") as ItemName;
  const item = name.endsWith(".json") ? items[key] : undefined;
  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const content = await readFile(path.join(process.cwd(), item.source), "utf8");
  return Response.json({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: key,
    type: "registry:ui",
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies.map((dep) => `${siteUrl()}/r/icons/${dep}.json`),
    files: [{ path: item.source, type: "registry:ui", target: item.target, content }],
  });
}
