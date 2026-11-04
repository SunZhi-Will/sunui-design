// 把 registry/_incoming/*.json（新 block 的 item 清單）併入兩份 registry.json：
// 免費進 ./registry.json，Pro 進 ./registry/pro/registry.json。同名 item 以新的覆蓋。
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const incomingDir = path.join(root, "registry", "_incoming");
const targets = {
  free: path.join(root, "registry.json"),
  pro: path.join(root, "registry", "pro", "registry.json"),
};

if (!existsSync(incomingDir)) {
  console.log("[merge] nothing to merge");
  process.exit(0);
}

const incoming = readdirSync(incomingDir)
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(readFileSync(path.join(incomingDir, file), "utf8")));

for (const [tier, file] of Object.entries(targets)) {
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const additions = incoming.filter((item) => item.meta?.tier === tier);
  for (const item of additions) {
    const missing = item.files.filter((f) => !existsSync(path.join(root, f.path)));
    if (missing.length) throw new Error(`[merge] ${item.name}: missing ${missing.map((f) => f.path).join(", ")}`);
    const index = manifest.items.findIndex((existing) => existing.name === item.name);
    if (index >= 0) manifest.items[index] = item;
    else manifest.items.push(item);
  }
  manifest.items.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[merge] ${tier}: +${additions.length}, total ${manifest.items.length}`);
}

rmSync(incomingDir, { recursive: true });
