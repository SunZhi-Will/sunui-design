// 代理搜尋評估：用業界標準動效名稱查 searchBlocks()，第一名必須是對應的 SunUI block。
// 名稱來源見 reports/動效參考站整合規劃-2026-11-05.md 第 4 節。改 aliases 後執行：
//   node scripts/eval-agent-search.mjs
// 私有 Pro repo 不存在時，Pro 案例自動略過。
import { build } from "esbuild";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const hasPro = existsSync(path.join(root, "registry", "pro", "registry.json"));

/** [查詢, 預期第一名（陣列表示任一皆可）, 是否 Pro] */
const cases = [
  ["add to cart fly", "add-to-cart-button"],
  ["odometer", "animated-number"],
  ["number ticker", "animated-number"],
  ["split-flap", "countdown-banner"],
  ["heart burst", "favorite-button"],
  ["copy to clipboard feedback", "copy-code-button"],
  ["skeleton shimmer", "skeleton-set"],
  ["toast slide-in", "toast-stack"],
  ["before-after slider", "compare-slider"],
  ["tab indicator slide", "capsule-nav"],
  ["back to top progress", "scroll-progress"],
  ["scroll-linked text", "scroll-reveal-text"],
  ["stacking cards", ["scroll-story", "scroll-effects"]],
  ["drawer slide", "side-panel"],
  ["button loading state", ["confirm-button", "checkout-button"]],
  ["shake on error", "otp-input"],
  ["marquee", "testimonial-marquee"],
  ["step progress", "checkout-steps"],
  ["scratch reveal", "scratch-card", true],
  ["pricing toggle", "pricing-cards", true],
  ["lucky draw", "prize-wheel", true],
  ["lightbox zoom", ["product-gallery", "image-effects"], true],
  ["filterable grid", "product-filter-grid", true],
  ["accordion expand collapse", "faq-accordion", true],
  ["file drop upload", "file-dropzone", true],
  ["departure board", "launch-countdown-wall", true],
  ["multiplayer cursors", "self-building-page", true],
  ["self building website", "self-building-page", true],
  ["build on scroll", "self-building-page", true],
];

const dir = mkdtempSync(path.join(tmpdir(), "sunui-eval-"));
const outfile = path.join(dir, "catalog.mjs");
try {
  await build({
    stdin: { contents: 'export { searchBlocks } from "@/lib/agent/catalog";', resolveDir: root, loader: "ts" },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    tsconfig: path.join(root, "tsconfig.json"),
    logLevel: "error",
  });
  const { searchBlocks } = await import(pathToFileURL(outfile).href);

  let failed = 0;
  let skipped = 0;
  for (const [query, expected, pro] of cases) {
    if (pro && !hasPro) {
      skipped++;
      continue;
    }
    const hits = searchBlocks({ query, limit: 3 }).map((h) => h.item.name);
    const ok = [expected].flat().includes(hits[0]);
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${query.padEnd(28)} -> ${hits.join(", ") || "(none)"}${ok ? "" : `  (expected ${expected})`}`);
  }
  const run = cases.length - skipped;
  console.log(`\n${run - failed}/${run} passed${skipped ? `, ${skipped} Pro case(s) skipped` : ""}`);
  process.exitCode = failed ? 1 : 0;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
