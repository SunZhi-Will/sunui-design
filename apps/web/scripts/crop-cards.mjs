#!/usr/bin/env node
// 首頁帶狀型錄的卡片圖：從淺色分享圖逐張取景，裁成 16:10，存到 public/cards/<name>.jpg（1200x750）。
// 取景寫在 content/home-cards.json 的 crop：[cx, cy, wf] 是中心與寬度，都是原圖的比例；超出邊界時往內推。
// 來源圖用 capture-og.mjs 截：node apps/web/scripts/capture-og.mjs --theme light --out public/og/blocks-light --only <名單>
//
//   node apps/web/scripts/crop-cards.mjs
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "content", "home-cards.json"), "utf8"));
const src = path.join(root, "public", "og", "blocks-light");
const out = path.join(root, "public", "cards");
fs.mkdirSync(out, { recursive: true });

let missing = 0;
for (const { name, crop } of [...config.pro, ...config.free]) {
  const file = path.join(src, `${name}.jpg`);
  if (!fs.existsSync(file)) {
    console.warn(`沒有 ${path.relative(root, file)}，先用 capture-og.mjs 截淺色版`);
    missing++;
    continue;
  }
  const [cx, cy, wf] = crop;
  const { width: W, height: H } = await sharp(file).metadata();
  const w = Math.floor(Math.min(W, wf * W));
  const h = Math.floor(Math.min(H, w / 1.6));
  const left = Math.round(Math.min(Math.max(cx * W - w / 2, 0), W - w));
  const top = Math.round(Math.min(Math.max(cy * H - h / 2, 0), H - h));
  await sharp(file)
    .extract({ left, top, width: w, height: h })
    .resize(1200, 750)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(out, `${name}.jpg`));
  console.log(`  ${name}`);
}
console.log(`輸出：${path.relative(process.cwd(), out)}${missing ? `（缺 ${missing} 張來源圖）` : ""}`);
process.exit(missing ? 1 : 0);
