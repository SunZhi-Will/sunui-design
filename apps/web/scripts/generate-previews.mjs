// 掃描 registry/free 與 registry/pro（私有 repo，可能不存在）底下的 demo.tsx，
// 產生 registry/__generated__/previews.tsx。由 predev / prebuild 執行。
// demo 一律 ssr: false：伺服器端經過 next/dynamic 渲染會讓 block 內的 useId 對不上而 hydration 失敗。
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tiers = ["free", "pro"];
const entries = [];
const cardEntries = [];
const variantEntries = [];
const variantIds = {};

// variants.tsx：效果庫把每種樣式拆成首頁的一張卡。
// 樣式清單寫成 `export const variants = <陣列>`，可以是字串陣列、block 檔裡的陣列名稱，或 [...a, ...b]。
// 這裡在建置時解析成純資料，伺服器端（首頁、靜態路由）才拿得到，不必載入 client 模組。
function readVariantIds(dir, name) {
  const variantSrc = readFileSync(path.join(dir, name, "variants.tsx"), "utf8");
  const match = variantSrc.match(/export const variants\s*(?::[^=]+)?=\s*([\s\S]*?);/);
  if (!match) throw new Error(`[previews] ${name}/variants.tsx: missing \`export const variants = ...\``);
  const arrays = {};
  for (const file of [path.join(dir, name, `${name}.tsx`), path.join(dir, name, "variants.tsx")]) {
    if (!existsSync(file)) continue;
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/(?:export )?const (\w+)\s*=\s*\[([\s\S]*?)\]\s*as const/g)) {
      arrays[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    }
  }
  const expr = match[1].trim().replace(/\s+as const$/, "");
  const resolve = (token) => {
    if (!arrays[token]) throw new Error(`[previews] ${name}/variants.tsx: cannot resolve array "${token}"`);
    return arrays[token];
  };
  let ids;
  if (/^\w+$/.test(expr)) ids = resolve(expr);
  else if (expr.startsWith("[")) {
    ids = [];
    for (const part of expr.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean)) {
      if (part.startsWith("...")) ids.push(...resolve(part.slice(3)));
      else if (/^"[^"]+"$/.test(part)) ids.push(part.slice(1, -1));
      else throw new Error(`[previews] ${name}/variants.tsx: unsupported entry ${part}`);
    }
  } else throw new Error(`[previews] ${name}/variants.tsx: unsupported variants expression`);
  if (new Set(ids).size !== ids.length) throw new Error(`[previews] ${name}/variants.tsx: duplicate variant ids`);
  return ids;
}

for (const tier of tiers) {
  const dir = path.join(root, "registry", tier);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    if (existsSync(path.join(dir, name, "demo.tsx"))) {
      entries.push(`  "${name}": dynamic(() => import("../${tier}/${name}/demo"), { ssr: false }),`);
    }
    // card.tsx：型錄卡片專用的精簡 demo，只放核心互動；沒有就沿用 demo.tsx
    if (existsSync(path.join(dir, name, "card.tsx"))) {
      cardEntries.push(`  "${name}": dynamic(() => import("../${tier}/${name}/card"), { ssr: false }),`);
    }
    if (existsSync(path.join(dir, name, "variants.tsx"))) {
      variantEntries.push(`  "${name}": dynamic(() => import("../${tier}/${name}/variants"), { ssr: false }),`);
      variantIds[name] = readVariantIds(dir, name);
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

export const cardPreviews: Record<string, ComponentType> = {
${cardEntries.join("\n")}
};

export const variantPreviews: Record<string, ComponentType<{ variant: string }>> = {
${variantEntries.join("\n")}
};
`;

const idsOut = `// 自動產生，請勿手動修改（scripts/generate-previews.mjs）
// 每個效果庫的樣式清單，首頁把每種樣式拆成一張卡。

export const variantIds: Record<string, readonly string[]> = ${JSON.stringify(variantIds, null, 2)};
`;

mkdirSync(path.join(root, "registry", "__generated__"), { recursive: true });
writeFileSync(path.join(root, "registry", "__generated__", "previews.tsx"), out);
writeFileSync(path.join(root, "registry", "__generated__", "variants.ts"), idsOut);
const variantCount = Object.values(variantIds).reduce((n, ids) => n + ids.length, 0);
console.log(`[previews] ${entries.length} demo(s), ${cardEntries.length} card(s), ${variantCount} variant(s)`);
