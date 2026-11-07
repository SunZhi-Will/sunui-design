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
const variantFeatured = {};

// variants.tsx：效果庫把每種樣式拆成首頁的一張卡。
// 樣式清單寫成 `export const variants = <陣列>`，可以是字串陣列、block 檔或 demo.tsx 裡的陣列名稱，或 [...a, ...b]。
// 這裡在建置時解析成純資料，伺服器端（首頁、靜態路由）才拿得到，不必載入 client 模組。
function readVariantIds(dir, name) {
  const variantSrc = readFileSync(path.join(dir, name, "variants.tsx"), "utf8");
  const match = variantSrc.match(/export const variants\s*(?::[^=]+)?=\s*([\s\S]*?);/);
  if (!match) throw new Error(`[previews] ${name}/variants.tsx: missing \`export const variants = ...\``);
  const arrays = {};
  for (const file of ["", "demo.tsx", "variants.tsx"].map((f) => path.join(dir, name, f || `${name}.tsx`))) {
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

// Pro 的 preview.tsx：網站預覽只載入這個展示版，完整元件只由 /r/pro/* 授權後交付。
// 預覽會編譯成公開的 chunk，所以展示版必須自給自足：不能 import 同資料夾的任何檔案（元件本體、demo、card），
// 也不能 import 其他 Pro block 的原始碼；組合場景要用其他 block 時，只能 import 對方的展示版（@/registry/pro/<name>/preview）。
// default export 是 block 頁的完整預覽，`export function Card` 是型錄卡片（可省略）。
const proPreviewStats = { preview: 0, full: [] };

function readProPreview(dir, name) {
  const src = readFileSync(path.join(dir, name, "preview.tsx"), "utf8");
  for (const [, spec] of src.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
    const otherPreview = /^@\/registry\/pro\/[\w-]+\/preview$/.test(spec);
    if (otherPreview && !existsSync(path.join(dir, spec.split("/")[3], "preview.tsx"))) {
      throw new Error(`[previews] pro/${name}/preview.tsx imports "${spec}", which does not exist yet. Write that block's preview first.`);
    }
    if (!otherPreview && (spec.startsWith(".") || spec.includes("registry/pro"))) {
      throw new Error(`[previews] pro/${name}/preview.tsx imports "${spec}". A Pro preview must not pull in Pro source; inline what the showcase needs.`);
    }
  }
  return { hasCard: /export function Card\b/.test(src) };
}

for (const tier of tiers) {
  const dir = path.join(root, "registry", tier);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    if (tier === "pro" && existsSync(path.join(dir, name, "preview.tsx"))) {
      const { hasCard } = readProPreview(dir, name);
      entries.push(`  "${name}": dynamic(() => import("../pro/${name}/preview"), { ssr: false }),`);
      if (hasCard) cardEntries.push(`  "${name}": dynamic(() => import("../pro/${name}/preview").then((m) => m.Card), { ssr: false }),`);
      proPreviewStats.preview++;
      continue;
    }
    if (tier === "pro" && existsSync(path.join(dir, name, "demo.tsx"))) proPreviewStats.full.push(name);
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
      // featured：首頁預設只放這一種當效果庫的代表，沒寫就用第一種
      const featured = readFileSync(path.join(dir, name, "variants.tsx"), "utf8").match(/export const featured\s*=\s*"([^"]+)"/)?.[1];
      if (featured && !variantIds[name].includes(featured)) throw new Error(`[previews] ${name}/variants.tsx: featured "${featured}" is not a variant`);
      variantFeatured[name] = featured ?? variantIds[name][0];
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

// 首頁預設顯示的代表樣式（variants.tsx 的 featured）
export const variantFeatured: Record<string, string> = ${JSON.stringify(variantFeatured, null, 2)};
`;

mkdirSync(path.join(root, "registry", "__generated__"), { recursive: true });
writeFileSync(path.join(root, "registry", "__generated__", "previews.tsx"), out);
writeFileSync(path.join(root, "registry", "__generated__", "variants.ts"), idsOut);
const variantCount = Object.values(variantIds).reduce((n, ids) => n + ids.length, 0);
console.log(`[previews] ${entries.length} demo(s), ${cardEntries.length} card(s), ${variantCount} variant(s)`);
if (proPreviewStats.preview || proPreviewStats.full.length) {
  console.log(
    `[previews] Pro: ${proPreviewStats.preview} showcase preview(s); ${proPreviewStats.full.length} still ship full source to the browser (add preview.tsx)`,
  );
}
