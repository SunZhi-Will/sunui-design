#!/usr/bin/env node
// 把 public/cards 與 public/og 同步到 Cloudflare R2（見 lib/media.ts）。
// 只上傳內容變過的檔：雜湊記在 content/media-manifest.json（要 commit，別台機器才知道哪些已上傳）。
// 先登入一次：npx wrangler@4 login
//
//   node apps/web/scripts/sync-media.mjs            上傳變動的檔
//   node apps/web/scripts/sync-media.mjs --dry-run  只列出會上傳哪些
//   node apps/web/scripts/sync-media.mjs --all      全部重傳
//
// bucket 名稱預設 sunui-media，可用 R2_BUCKET 覆寫。
// 重錄的影片沿用同一個檔名，瀏覽器與 Cloudflare 最多快取一天，所以換上新版最晚隔天生效。
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const manifestPath = path.join(root, "content/media-manifest.json");
const DIRS = ["cards", "og"];
const BUCKET = process.env.R2_BUCKET || "sunui-media";
const CACHE = "public, max-age=86400";
const TYPES = { ".mp4": "video/mp4", ".webm": "video/webm", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };
const CONCURRENCY = 6;

const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = DIRS.flatMap((d) => walk(path.join(publicDir, d)))
  .filter((f) => TYPES[path.extname(f).toLowerCase()])
  .map((full) => ({ full, key: path.relative(publicDir, full).split(path.sep).join("/") }));

const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const next = {};
const todo = [];
for (const f of files) {
  const hash = createHash("sha1").update(readFileSync(f.full)).digest("hex").slice(0, 16);
  next[f.key] = hash;
  if (all || manifest[f.key] !== hash) todo.push(f);
}
const bytes = todo.reduce((n, f) => n + statSync(f.full).size, 0);
console.log(`[sync-media] ${files.length} files, ${todo.length} to upload (${(bytes / 1e6).toFixed(1)} MB) -> r2://${BUCKET}`);

if (dryRun) {
  for (const f of todo.slice(0, 40)) console.log("  " + f.key);
  if (todo.length > 40) console.log(`  ...and ${todo.length - 40} more`);
  process.exit(0);
}

function put(f) {
  const args = ["-y", "wrangler@4", "r2", "object", "put", `${BUCKET}/${f.key}`, "--file", f.full, "--content-type", TYPES[path.extname(f.key).toLowerCase()], "--cache-control", CACHE, "--remote"];
  return new Promise((resolve) => {
    const child = spawn("npx", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve(code === 0 ? null : err.trim().split("\n").slice(-3).join("\n")));
  });
}

const done = { ...manifest };
let failed = 0;
let index = 0;
async function worker() {
  while (index < todo.length) {
    const f = todo[index++];
    const error = await put(f);
    if (error) {
      failed++;
      console.error(`  failed ${f.key}\n    ${error}`);
    } else {
      done[f.key] = next[f.key];
      console.log(`  ${f.key}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// 只記下成功的；public 裡已刪掉的檔從清單移除（R2 上的舊檔留著不影響）
const kept = Object.fromEntries(Object.entries(done).filter(([key]) => key in next).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestPath, JSON.stringify(kept, null, 2) + "\n");
console.log(`[sync-media] uploaded ${todo.length - failed}, failed ${failed}. Manifest: content/media-manifest.json`);
process.exit(failed ? 1 : 0);
