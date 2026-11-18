#!/usr/bin/env node
// 紙感 → 質感的機械替換（reports/拋棄紙感全面改質感深度分析-2026-11-18.md 的 P1、P2）。
// 把寫死的紙、紙邊、墨、淡墨色碼換成主題 token，淺色與深色成對的類別合成一個；
// 有表面、邊線與圓角的外框補上 e1 的極淡陰影與深色頂邊高光。
// 虛線、行內樣式的色碼、無法對應的類別只列出來，交給人工判斷。
//
// 用法：node scripts/craft-codemod.mjs [--write] <block 目錄或檔案...>
// 不加 --write 只印報告。

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const write = process.argv.includes("--write");
const targets = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (targets.length === 0) {
  console.error("usage: node scripts/craft-codemod.mjs [--write] <dir|file...>");
  process.exit(1);
}

// 色碼在淺色（無 dark:）與深色（dark:）各代表什麼角色；text 另外處理（紙色字 = 反白字）
const LIGHT = {
  f7f7f7: { any: "card", text: "background" },
  fafafa: { any: "card", text: "background" },
  e2e2e2: { any: "foreground/10" },
  e5e5e5: { any: "foreground/10" },
  d4d4d4: { any: "foreground/15" },
  "171717": { any: "foreground" },
  // #111111 是整頁模板刻意固定的深色段落（深淺模式都深），不對應主題
  "0a0a0a": { any: "foreground" },
  "525252": { any: "muted-foreground" },
  "737373": { any: "muted-foreground" },
  a3a3a3: { any: "muted-foreground/70" },
  ededed: { any: "muted", text: "background" },
  f1f1f1: { any: "muted" },
  efefef: { any: "muted" },
  f5f5f5: { any: "muted" },
};
const DARK = {
  "1c1c1c": { any: "card", text: "background" },
  "111111": { any: "card", text: "background" },
  "333333": { any: "foreground/10" },
  "3a3a3a": { any: "foreground/15" },
  "262626": { any: "foreground/10" },
  ededed: { any: "foreground" },
  fafafa: { any: "foreground" },
  a3a3a3: { any: "muted-foreground" },
  "737373": { any: "muted-foreground/70" },
  "171717": { any: "card", text: "background" },
  "0a0a0a": { any: "card", text: "background" },
  "232323": { any: "muted" },
  "222222": { any: "muted" },
};

// 淡墨字（墨加 55 到 65% 透明度）就是次要文字
const MUTED_TEXT = new Set(["50", "55", "60", "65", "70"]);

const CLASS_RE = /^((?:[a-z-]+:)*)(-?[a-z]+(?:-[a-z]+)*)-\[#([0-9a-fA-F]{6})\](?:\/(\d+))?$/;
const E1 = "shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";

function mapClass(cls, report) {
  const m = cls.match(CLASS_RE);
  if (!m) return cls;
  const [, variants, utility, hexRaw, alpha] = m;
  const hex = hexRaw.toLowerCase();
  const dark = variants.split(":").includes("dark");
  const table = dark ? DARK : LIGHT;
  const role = table[hex];
  if (!role) {
    report.unmapped.add(cls);
    return cls;
  }
  let token = (utility === "text" && role.text) || role.any;
  if (alpha) {
    if (utility === "text" && token === "foreground" && MUTED_TEXT.has(alpha)) token = "muted-foreground";
    else if (token.includes("/")) {
      report.unmapped.add(cls);
      return cls;
    } else token = `${token}/${alpha}`;
  }
  report.count++;
  return `${variants}${utility}-${token}`;
}

function transformClassString(str, report) {
  if (!/#[0-9a-fA-F]{6}/.test(str) && !/(border|divide)-dashed/.test(str)) return str;
  const parts = str.split(/(\s+)/);
  const mapped = parts.map((p) => (/\s/.test(p) || p === "" ? p : mapClass(p, report)));
  // 淺深合成一個：dark:X 和不帶 dark 的 X 相同就拿掉 dark 版
  const tokens = mapped.filter((p) => p && !/\s/.test(p));
  const plain = new Set(tokens.filter((t) => !t.startsWith("dark:")));
  const seen = new Set();
  let out = [];
  for (const p of mapped) {
    if (/\s/.test(p) || p === "") {
      out.push(p);
      continue;
    }
    if (p.startsWith("dark:") && plain.has(p.slice(5))) {
      out.push("");
      continue;
    }
    if (seen.has(p)) {
      out.push("");
      continue;
    }
    seen.add(p);
    out.push(p);
  }
  // 拿掉類別後留下的多餘空白：中間收成一格，頭尾維持原字串的樣子
  let result = out.join("").replace(/\s{2,}/g, " ").trim();
  if (/^\s/.test(str) && result) result = " " + result;
  if (/\s$/.test(str) && result) result = result + " ";
  const list = result.trim().split(/\s+/);
  const hasSurface = list.includes("bg-card");
  const hasBorder = list.some((c) => c === "border" || c === "border-foreground/10");
  const hasRadius = list.some((c) => /^rounded(-|$)/.test(c));
  const hasShadow = list.some((c) => /(^|:)shadow/.test(c));
  if (hasSurface && hasBorder && hasRadius && !hasShadow) {
    result = result.trimEnd() + " " + E1 + (str.endsWith(" ") ? " " : "");
    report.elevated++;
  }
  if (/(border|divide)-dashed/.test(result)) report.dashed++;
  return result;
}

function transformFile(file) {
  const src = readFileSync(file, "utf8");
  const report = { count: 0, elevated: 0, dashed: 0, unmapped: new Set(), inline: [] };
  // 只處理字串字面值（"..."、'...'、`...`），class 都在這裡面
  const next = src.replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g, (whole, q, body) => {
    const out = transformClassString(body, report);
    return out === body ? whole : q + out + q;
  });
  next.split("\n").forEach((line, i) => {
    if (/#(f7f7f7|1c1c1c|e2e2e2|333333|171717|ededed|a3a3a3|737373)\b/i.test(line) && !/\[#/.test(line)) report.inline.push(i + 1);
  });
  if (write && next !== src) writeFileSync(file, next);
  return report;
}

function collect(target) {
  const st = statSync(target);
  if (st.isFile()) return target.endsWith(".tsx") ? [target] : [];
  return readdirSync(target).flatMap((f) => collect(path.join(target, f)));
}

const files = targets.flatMap(collect).filter((f) => !/[/\\](preview|demo)\.tsx$/.test(f) || process.argv.includes("--demos"));
let total = 0;
for (const file of files) {
  const r = transformFile(file);
  total += r.count;
  const notes = [];
  if (r.elevated) notes.push(`e1 +${r.elevated}`);
  if (r.dashed) notes.push(`虛線 ${r.dashed}（人工判斷）`);
  if (r.unmapped.size) notes.push(`未對應 ${[...r.unmapped].join(" ")}`);
  if (r.inline.length) notes.push(`行內色碼 L${r.inline.join(",")}`);
  if (r.count || notes.length) console.log(`${path.relative(process.cwd(), file)}: ${r.count} 個類別${notes.length ? "；" + notes.join("；") : ""}`);
}
console.log(`${write ? "已改寫" : "預覽"}：${files.length} 個檔案，${total} 個類別`);
