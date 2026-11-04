// 掃描 registry/free 與 registry/pro（私有 repo，可能不存在）底下的 demo.tsx，
// 產生 registry/__generated__/previews.tsx。由 predev / prebuild 執行。
// demo 一律 ssr: false：伺服器端經過 next/dynamic 渲染會讓 block 內的 useId 對不上而 hydration 失敗。
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tiers = ["free", "pro"];
const entries = [];

for (const tier of tiers) {
  const dir = path.join(root, "registry", tier);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    if (existsSync(path.join(dir, name, "demo.tsx"))) {
      entries.push(`  "${name}": dynamic(() => import("../${tier}/${name}/demo"), { ssr: false }),`);
    }
  }
}

const out = `// 自動產生，請勿手動修改（scripts/generate-previews.mjs）
"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const previews: Record<string, ComponentType> = {
${entries.join("\n")}
};
`;

mkdirSync(path.join(root, "registry", "__generated__"), { recursive: true });
writeFileSync(path.join(root, "registry", "__generated__", "previews.tsx"), out);
console.log(`[previews] ${entries.length} demo(s)`);
