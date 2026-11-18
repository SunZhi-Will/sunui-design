#!/usr/bin/env node
// 質感改版的手感與圓角（DESIGN.md 第 3、5 節）：
// 1. 按壓：每個 <button>、<motion.button> 與看起來像按鈕的 <a>，沒有按下狀態的補上
//    motion-safe:active:scale-[0.97]（大面積的選項卡用 0.99），並讓 scale 跟著過渡。
//    已經有 whileTap 或 active: 的不動。Tailwind v4 的 scale-* 寫的是獨立的 scale 屬性，
//    不會和 framer-motion 的 inline transform 打架。
// 2. 圓角：有表面底色（bg-card 或 surface 常數）的容器，rounded-md（6px）改成 rounded-xl（12px）；
//    對話框與固定定位的面板改成 rounded-2xl（16px）。控制項維持 6px。
//
// 用法：node scripts/craft-press-radius.mjs [--write] <block 目錄...>
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const write = process.argv.includes("--write");
const targets = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const CONTAINERS = new Set(["div", "section", "article", "li", "ul", "ol", "aside", "figure", "form", "dl", "label", "header", "footer", "span"]);
const TAG_RE = /<(motion\.)?([a-z]+)\b/g;

/** 從 < 開始找到這個開始標籤的結尾（深度 0 的 >），處理大括號與字串 */
function tagEnd(src, start) {
  let depth = 0;
  let quote = null;
  for (let i = start + 1; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      // 深度 0 的引號是屬性值；大括號裡的是 JS 字串
      quote = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return i;
  }
  return -1;
}

/** 找出 className 的值在 tag 內的範圍 */
function classNameValue(tag) {
  const m = tag.match(/\bclassName=/);
  if (!m) return null;
  const s = m.index + m[0].length;
  if (tag[s] === '"' || tag[s] === "'") {
    const e = tag.indexOf(tag[s], s + 1);
    return { start: s, end: e + 1 };
  }
  if (tag[s] === "{") {
    let depth = 0;
    let quote = null;
    for (let i = s; i < tag.length; i++) {
      const ch = tag[i];
      if (quote) {
        if (ch === "\\") i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) return { start: s, end: i + 1 };
    }
  }
  return null;
}

const LIT_RE = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;

function literals(value) {
  return [...value.matchAll(LIT_RE)].filter((m) => !m[2].includes("${")).map((m) => ({ index: m.index, q: m[1], body: m[2] }));
}

/** 在值裡改第一個符合 test 的字串字面值 */
function editLiteral(value, test, fn) {
  for (const lit of literals(value)) {
    if (!test(lit.body)) continue;
    const next = fn(lit.body);
    return value.slice(0, lit.index) + lit.q + next + lit.q + value.slice(lit.index + lit.body.length + 2);
  }
  return null;
}

function processTag(tag, name, motion, stats) {
  const v = classNameValue(tag);
  if (!v) return tag;
  let value = tag.slice(v.start, v.end);
  const lits = literals(value);
  if (!lits.length) return tag;
  const all = " " + lits.map((l) => l.body).join(" ") + " ";
  const has = (re) => re.test(all);

  const buttonLike =
    name === "button" ||
    (name === "a" && has(/\srounded(-[a-z0-9[\]]+)?\s/) && has(/\s(bg-|border\s|border-)/) && has(/\s(px-|h-\d)/));
  if (buttonLike && !/whileTap|whileHover=\{\{\s*scale/.test(tag) && !has(/active:/)) {
    const large = has(/\s(p-[3-9]|min-h-\[|flex-col)/) && !has(/\sh-(7|8|9|10|11|12)\s/);
    const press = `motion-safe:active:scale-[${large ? "0.99" : "0.97"}]`;
    let done = false;
    for (const [from, to] of [
      ["transition-colors", "transition-[color,background-color,border-color,opacity,scale]"],
      ["transition-opacity", "transition-[opacity,scale]"],
    ]) {
      const re = new RegExp(`(^|\\s)${from}(?=\\s|$)`);
      const next = editLiteral(value, (b) => re.test(b), (b) => b.replace(re, `$1${to}`));
      if (next) {
        value = next;
        done = true;
        break;
      }
    }
    const hasTransition = done || has(/\stransition(-all|-transform|-\[[^\]]*scale[^\]]*\])?\s/);
    const hasOtherTransition = !hasTransition && has(/\stransition-\[/);
    if (!hasOtherTransition) {
      const add = hasTransition ? press : `${press} transition-[color,background-color,border-color,opacity,scale]`;
      value = editLiteral(value, () => true, (b) => (b.trim() ? `${b.replace(/\s+$/, "")} ${add}` : add)) ?? value;
      stats.press++;
    } else stats.skippedPress++;
  }

  if (CONTAINERS.has(name) || (name === "div" && motion)) {
    const surface = has(/\sbg-card\s/) || /\bsurface\b/.test(value);
    const panel = /role="dialog"|aria-modal/.test(tag) || has(/\sfixed\s/);
    // 控制項群組（步進器、分段控制、輸入組）維持 6px
    const control = /role="(group|radiogroup|tablist|toolbar|listbox|combobox)"/.test(tag) || has(/\s(inline-flex|h-(7|8|9|10|11|12))\s/);
    if (panel && has(/\srounded-(md|lg|xl)\s/)) {
      value = editLiteral(value, (b) => /(^|\s)rounded-(md|lg|xl)(?=\s|$)/.test(b), (b) => b.replace(/(^|\s)rounded-(md|lg|xl)(?=\s|$)/, "$1rounded-2xl")) ?? value;
      stats.panel++;
    } else if (surface && has(/\srounded-md\s/) && !control) {
      value = editLiteral(value, (b) => /(^|\s)rounded-md(?=\s|$)/.test(b), (b) => b.replace(/(^|\s)rounded-md(?=\s|$)/, "$1rounded-xl")) ?? value;
      stats.card++;
    }
  }
  return tag.slice(0, v.start) + value + tag.slice(v.end);
}

function transform(src, stats) {
  let out = "";
  let last = 0;
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(src))) {
    const start = m.index;
    // 型別參數（Array<string>）與比較運算不是 JSX：前一個字元要是空白、( 、{ 、> 或行首
    const prev = src[start - 1];
    if (prev && !/[\s({>?:&|]/.test(prev)) continue;
    const end = tagEnd(src, start);
    if (end < 0) continue;
    const tag = src.slice(start, end + 1);
    const next = processTag(tag, m[2], Boolean(m[1]), stats);
    out += src.slice(last, start) + next;
    last = end + 1;
    TAG_RE.lastIndex = end + 1;
  }
  out += src.slice(last);
  // 共用的表面常數：const surface / card / panel = "... rounded-md ..."
  out = out.replace(/(const (?:surface|card|panel|sheet)\w* = (["'`]))([^"'`\n]*)\2/g, (whole, head, q, body) => {
    if (!/(^|\s)rounded-md(?=\s|$)/.test(body) || !/bg-card/.test(body)) return whole;
    stats.card++;
    return head + body.replace(/(^|\s)rounded-md(?=\s|$)/, "$1rounded-xl") + q;
  });
  return out;
}

const collect = (t) => (statSync(t).isFile() ? (t.endsWith(".tsx") ? [t] : []) : readdirSync(t).flatMap((f) => collect(path.join(t, f))));
const files = targets.flatMap(collect);
const total = { press: 0, skippedPress: 0, card: 0, panel: 0 };
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const stats = { press: 0, skippedPress: 0, card: 0, panel: 0 };
  const next = transform(src, stats);
  for (const k in total) total[k] += stats[k];
  if (next !== src) {
    if (write) writeFileSync(file, next);
    console.log(`${path.relative(process.cwd(), file)}: 按壓 ${stats.press}${stats.skippedPress ? `（跳過 ${stats.skippedPress}）` : ""}，卡片 ${stats.card}，面板 ${stats.panel}`);
  }
}
console.log(`${write ? "已改寫" : "預覽"}：${files.length} 個檔案；按壓 ${total.press}、跳過 ${total.skippedPress}、卡片圓角 ${total.card}、面板圓角 ${total.panel}`);
