#!/usr/bin/env node
/* global process, console */
// Checks a PlushPortrait face set and, with --out, converts it for the web.
//
//   node check-faces.mjs <folder>                      check only
//   node check-faces.mjs <folder> --out public/plush/mei [--size 768]
//
// The folder holds one image per face, named after the face (rest.png,
// grab.webp, look-left.png ...). Needs sharp, which Next.js projects
// usually have; otherwise: npm i -D sharp
//
// Exit code 1 when a face would visibly jump during a cross-fade.

import fs from "node:fs";
import path from "node:path";

const FACES = [
  ["rest", "rest"],
  ["hover", "hover"],
  ["grab", "grab"],
  ["pull", "pull"],
  ["dazed", "dazed"],
  ["blink", "blink"],
  ["idle", "idle"],
  ["lookLeft", "look-left"],
  ["lookRight", "look-right"],
];
const EXT = [".png", ".webp", ".jpg", ".jpeg"];
const GRID = 256; // silhouettes are compared at this size
const WARN = 4; // % of the silhouette that may differ before we warn
const FAIL = 8; // ... and before we fail

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const out = flag("--out");
const size = Number(flag("--size") ?? 768);

if (!dir) {
  console.error("Usage: node check-faces.mjs <folder> [--out <folder>] [--size 768]");
  process.exit(2);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("sharp is not installed. Run: npm i -D sharp");
  process.exit(2);
}

const find = (base) => {
  for (const ext of EXT) {
    const file = path.join(dir, base + ext);
    if (fs.existsSync(file)) return file;
  }
  return null;
};

async function silhouette(file) {
  const { data } = await sharp(file)
    .ensureAlpha()
    .resize(GRID, GRID, { fit: "fill" })
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

function compare(a, b) {
  let union = 0, diff = 0, ax = 0, ay = 0, an = 0, bx = 0, by = 0, bn = 0;
  for (let i = 0; i < a.length; i++) {
    const A = a[i] > 128, B = b[i] > 128;
    if (A || B) union++;
    if (A !== B) diff++;
    const x = i % GRID, y = (i / GRID) | 0;
    if (A) { ax += x; ay += y; an++; }
    if (B) { bx += x; by += y; bn++; }
  }
  const shift = an && bn ? Math.hypot(ax / an - bx / bn, ay / an - by / bn) / GRID : 1;
  return { mismatch: union ? (diff / union) * 100 : 100, shift: shift * 100 };
}

function topRow(alpha) {
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (alpha[y * GRID + x] > 128) return y / GRID;
  return 0;
}

const restFile = find("rest");
if (!restFile) {
  console.error(`No rest image in ${dir}. rest.png (or .webp/.jpg) is the one face that is required.`);
  process.exit(1);
}

const restMeta = await sharp(restFile).metadata();
const restAlpha = await silhouette(restFile);
const problems = [];
const found = [];

console.log(`\nFace set in ${dir}\n`);
console.log("face        file                 size        silhouette  shift   verdict");

for (const [key, base] of FACES) {
  const file = find(base);
  if (!file) {
    console.log(`${key.padEnd(11)} (missing, skipped by the component)`);
    continue;
  }
  const meta = await sharp(file).metadata();
  const notes = [];
  if (meta.width !== meta.height) notes.push("not square");
  if (meta.width !== restMeta.width || meta.height !== restMeta.height) notes.push(`size differs from rest (${restMeta.width}x${restMeta.height})`);
  if (!meta.hasAlpha) notes.push("no transparency: cut the background out");
  if (meta.width < 768) notes.push("smaller than 768px, will look soft");

  // The top corners should be empty (the shoulders may fill the bottom ones):
  // a background that is white rather than transparent fails here.
  const alpha = await silhouette(file);
  if (meta.hasAlpha && (alpha[0] > 128 || alpha[GRID - 1] > 128)) notes.push("top corners are not transparent");

  const { mismatch, shift } = key === "rest" ? { mismatch: 0, shift: 0 } : compare(restAlpha, alpha);
  let verdict = "ok";
  if (mismatch > FAIL || shift > 1.5) verdict = "FAIL";
  else if (mismatch > WARN || shift > 0.8) verdict = "warn";
  if (notes.some((n) => n.startsWith("size") || n.startsWith("no transparency"))) verdict = "FAIL";
  if (verdict !== "ok") problems.push({ key, verdict, mismatch, shift, notes });

  console.log(
    `${key.padEnd(11)} ${path.basename(file).padEnd(20)} ${`${meta.width}x${meta.height}`.padEnd(11)} ${`${mismatch.toFixed(1)}%`.padEnd(11)} ${`${shift.toFixed(2)}%`.padEnd(7)} ${verdict}${notes.length ? `  (${notes.join("; ")})` : ""}`,
  );
  found.push({ key, base, file });
}

// Where the circle should sit: the default frameBox assumes the top of the
// head is 8% below the top edge.
const top = topRow(restAlpha);
const y = Math.min(0.64, Math.max(0.5, top + 0.5));
console.log(`\nTop of head at ${(top * 100).toFixed(0)}% of the height. Suggested frameBox: { y: ${y.toFixed(2)}, r: 0.42 }`);
if (top < 0.03) console.log("The head touches the top edge: there is no room for it to pop out of the frame. Leave about 8% above it.");

if (problems.length) {
  console.log("\nFix before shipping:");
  for (const p of problems) {
    const why = [];
    if (p.mismatch > WARN) why.push(`${p.mismatch.toFixed(1)}% of the silhouette differs from rest`);
    if (p.shift > 0.8) why.push(`the person moved by ${p.shift.toFixed(2)}% of the width`);
    console.log(`- ${p.key} (${p.verdict}): ${[...why, ...p.notes].join("; ")}. Regenerate it as an edit of rest, not from scratch.`);
  }
} else {
  console.log("\nAll faces line up with rest.");
}

if (out) {
  fs.mkdirSync(out, { recursive: true });
  for (const f of found) {
    await sharp(f.file).ensureAlpha().resize(size, size, { fit: "fill" }).webp({ quality: 86, effort: 6 }).toFile(path.join(out, `${f.base}.webp`));
  }
  const publicPath = "/" + path.relative(path.join(process.cwd(), "public"), out).split(path.sep).join("/");
  const web = out.includes(`public${path.sep}`) || out.startsWith("public") ? publicPath : out;
  console.log(`\nWrote ${found.length} WebP files (${size}px) to ${out}\n`);
  console.log("const faces: PlushFaces = {");
  for (const f of found) console.log(`  ${f.key}: "${web}/${f.base}.webp",`);
  console.log("};");
}

process.exit(problems.some((p) => p.verdict === "FAIL") ? 1 : 0);
