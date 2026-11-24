// Acceptance script for the SunUI block "avatar-stack". One script, any target (React original or a port).
//   node avatar-stack.mjs --url <url> --root "<css selector>" --out <file.json> --label <name>
// Elements are found by role, accessible name, aria attributes or visible text only.
import { chromium } from "/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/pilot/cap/node_modules/playwright-core/index.mjs";
import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const { url: URL0, root: ROOT, out: OUT, label: LABEL } = args;
if (!URL0 || !ROOT || !OUT || !LABEL) { console.error("usage: --url --root --out --label"); process.exit(2); }

const BLOCK = "avatar-stack";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const keys = new Set();
const errors = [];
const consoleErrors = [];
let tabOrder = [];

function add(item, key, kind, value) {
  if (keys.has(key)) { errors.push({ item, message: "duplicate key " + key }); return; }
  keys.add(key);
  if (typeof value === "number") value = +value.toFixed(3);
  checks.push({ item, key, kind, value });
}
async function guard(item, fn) {
  try { await fn(); } catch (e) { errors.push({ item, message: String(e && e.message ? e.message : e).split("\n")[0].slice(0, 300) }); }
}

const LISTS = ["Recent buyers (1284)", "Buyers of Stoneware Mug (412)", "Buyers of Market Tote (96)"];
const LEO = "Leo C., Osaka, 5 hours ago";

const f = findChrome();
const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0];
const browser = await chromium.launch({ executablePath: exe, headless: true });

// ---------------------------------------------------------------- in-page helpers
function pageFns() {
  try { localStorage.setItem("sunui-theme", "light"); } catch (e) {}
  const TEXTS = new Set([
    "Mina P.", "Leo C.", "Ava L.", "Noah W.", "Sara K.", "Taipei, 2 hours ago", "Osaka, 5 hours ago", "Seoul, yesterday", "Taichung, yesterday", "Singapore, 2 days ago", "94 more",
    "林美娜", "陳立歐", "陈立欧", "李艾娃", "王諾亞", "王诺亚", "柯莎拉", "台北，2 小時前", "台北，2 小时前", "大阪，5 小時前", "大阪，5 小时前", "首爾，昨天", "首尔，昨天", "台中，昨天", "新加坡，2 天前", "還有 94 人", "还有 94 人",
    "佐藤美奈", "中村玲央", "鈴木彩", "渡辺直人", "加藤沙羅", "台北、2 時間前", "大阪、5 時間前", "ソウル、昨日", "台中、昨日", "シンガポール、2 日前", "ほか 94 人",
  ]);
  const nameOf = (e) => (e ? e.getAttribute("aria-label") || (e.textContent || "").trim() : null);
  window.__nameOf = nameOf;
  window.__rgba = (css) => {
    const c = document.createElement("canvas"); c.width = c.height = 1;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.clearRect(0, 0, 1, 1); x.fillStyle = "#000"; x.fillStyle = css; x.fillRect(0, 0, 1, 1);
    return [...x.getImageData(0, 0, 1, 1).data];
  };
  const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const isVisible = (e) => { if (e.checkVisibility) return e.checkVisibility({ checkVisibilityCSS: true }); for (let n = e; n && n.nodeType === 1; n = n.parentElement) if (getComputedStyle(n).display === "none") return false; return getComputedStyle(e).visibility !== "hidden"; };
  const effOpacity = (from, upTo) => { let op = 1, n = from; while (n && n.nodeType === 1) { op *= parseFloat(getComputedStyle(n).opacity); if (n === upTo) break; n = n.parentElement; } return op; };
  window.__tipEls = (rootSel) => {
    const root = document.querySelector(rootSel) || document.body;
    const leaves = [...root.querySelectorAll("*")].filter((e) => e.children.length === 0 && TEXTS.has((e.textContent || "").trim()) && !e.closest('[role="img"]') && isVisible(e));
    const m = new Map();
    for (const l of leaves) { const c = l.closest('[aria-hidden="true"]') || l.parentElement; if (!m.has(c)) m.set(c, []); m.get(c).push(l); }
    return [...m];
  };
  // the whole tooltip container, found without the text whitelist: the visible aria-hidden element with text that is outside every role=img
  window.__tipBox = (rootSel) => {
    const root = document.querySelector(rootSel) || document.body;
    const hid = [...root.querySelectorAll('[aria-hidden="true"]')].filter((e) => !e.closest('[role="img"]') && !(e.parentElement && e.parentElement.closest('[aria-hidden="true"]')) && (e.textContent || "").trim() && isVisible(e));
    if (hid.length) return hid[0];
    const disc = root.querySelector('[role="img"]:hover') || (document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("role") === "img" ? document.activeElement : null);
    if (!disc) return null;
    const d = disc.getBoundingClientRect(); const cx = d.left + d.width / 2;
    const c = [...root.querySelectorAll("*")].filter((e) => {
      if (e.closest('[role="img"]') || e.querySelector('[role="img"]') || !(e.textContent || "").trim() || !isVisible(e)) return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.bottom <= d.top + 2 && r.bottom >= d.top - 40 && Math.abs(r.left + r.width / 2 - cx) < 80;
    });
    c.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.width * rb.height - ra.width * ra.height; });
    return c[0] || null;
  };
  window.__tipText = (rootSel) => { const b = window.__tipBox(rootSel); if (!b) return ""; return ((b.innerText || b.textContent || "")).replace(/\s+/g, " ").trim(); };
  window.__tipVis = (rootSel) => { const els = window.__tipEls(rootSel); if (!els.length) return { n: 0, op: 0, w: 0 }; const c = els[0][0]; return { n: els.length, op: effOpacity(c), w: c.getBoundingClientRect().width }; };
  window.__tipCount = (rootSel) => window.__tipEls(rootSel).length;
  window.__tipInfo = (rootSel) => window.__tipEls(rootSel).map(([c, leaves]) => {
    leaves.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const cs = getComputedStyle(c); const r = c.getBoundingClientRect();
    const l1 = leaves[0], l2 = leaves[1];
    const bg = window.__rgba(cs.backgroundColor), fg = window.__rgba(getComputedStyle(l1).color);
    return {
      lines: leaves.map((l) => l.textContent.trim()),
      rect: [r.x, r.y, r.width, r.height],
      pe: cs.pointerEvents, ah: c.getAttribute("aria-hidden"),
      fs: parseFloat(getComputedStyle(l1).fontSize), radius: parseFloat(cs.borderTopLeftRadius),
      heavier: l2 ? parseInt(getComputedStyle(l1).fontWeight) > parseInt(getComputedStyle(l2).fontWeight) : null,
      op2: l2 ? effOpacity(l2, c) : null,
      dark: luma(bg) < luma(fg),
    };
  });
  window.__live = (rootSel) => (document.querySelector(rootSel) || document.body).querySelectorAll('[aria-live],[role="status"],[role="alert"],[role="tooltip"]').length;
  // trigger time = first real pointer move or key press after arm()
  window.__trig = null;
  window.__arm = () => { window.__trig = null; };
  const mark = () => { if (window.__trig == null) window.__trig = performance.now(); };
  addEventListener("pointermove", mark, true);
  addEventListener("keydown", mark, true);
  window.__sample = (els, bases, ms, rootSel) => new Promise((res) => {
    const t0 = performance.now(); const frames = [];
    const tick = () => {
      const now = performance.now();
      const tv = window.__tipVis(rootSel);
      frames.push({ t: now, y: els.map((e, i) => e.getBoundingClientRect().top - bases[i]), tips: tv.n, op: tv.op, w: tv.w });
      if (now - t0 < ms) requestAnimationFrame(tick); else res({ trig: window.__trig, frames });
    };
    requestAnimationFrame(tick);
  });
  window.__ring = (e) => {
    const cs = getComputedStyle(e);
    let ext = 0;
    const layers = cs.boxShadow === "none" ? [] : cs.boxShadow.replace(/\([^)]*\)/g, "C").split(",");
    for (const l of layers) { if (/inset/.test(l)) continue; const n = (l.match(/-?[\d.]+px/g) || []).map(parseFloat); if (n.length >= 4 && n[2] === 0 && n[3] > 0) ext = Math.max(ext, n[3] + Math.max(Math.abs(n[0]), Math.abs(n[1]))); }
    if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 && window.__rgba(cs.outlineColor)[3] > 0) ext = Math.max(ext, parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset || "0"));
    return ext;
  };
  window.__ringInfo = (e) => {
    const cs = getComputedStyle(e);
    const spreads = [];
    const layers = cs.boxShadow === "none" ? [] : cs.boxShadow.replace(/\([^)]*\)/g, "C").split(",");
    for (const l of layers) { if (/inset/.test(l)) continue; const n = (l.match(/-?[\d.]+px/g) || []).map(parseFloat); if (n.length >= 4 && n[0] === 0 && n[1] === 0 && n[2] === 0 && n[3] > 0) spreads.push(n[3]); }
    spreads.sort((a, b) => a - b);
    const outlineDrawn = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 && window.__rgba(cs.outlineColor)[3] > 0;
    const inner = outlineDrawn && cs.outlineStyle !== "auto" ? parseFloat(cs.outlineOffset || "0") : (spreads.length >= 2 ? spreads[0] : 0);
    return { inner, auto: cs.outlineStyle === "auto" };
  };
  // entrance recorder over the first moments after discs exist
  window.__ent = { frames: [], first: 0 };
  const t0 = performance.now();
  const tick = () => {
    const imgs = [...document.querySelectorAll('[role="img"][aria-label]')];
    if (imgs.length) {
      const now = performance.now(); if (!window.__ent.first) window.__ent.first = now;
      if (now - window.__ent.first < 1200) {
        window.__ent.frames.push(imgs.map((e) => {
          let op = 1, n = e; while (n && n.nodeType === 1) { op *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
          const r = e.getBoundingClientRect(); const lr = (e.closest('[aria-label]:not([role="img"])') || document.body).getBoundingClientRect();
          return { op, w: r.width, h: r.height, x: r.left - lr.left, y: r.top - lr.top, plus: (e.textContent || "").trim().startsWith("+") };
        }));
      }
    }
    if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------- page helpers
async function openPage(url, reduced, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, locale: "en-US", colorScheme: "light", reducedMotion: reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript(pageFns);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => consoleErrors.push(`[${tag}] pageerror: ${String(e).slice(0, 200)}`));
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(`[${tag}] console: ${m.text().slice(0, 200)}`));
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.locator(ROOT).getByRole("img").first().waitFor({ timeout: 15000 });
  await sleep(1200);
  await settle(page);
  return { ctx, page };
}

// real press on an empty spot (the heading text), then wait until the demo is at rest
async function settle(page) {
  const h = page.locator(ROOT).getByRole("heading").first();
  const b = await h.boundingBox();
  if (b) { await page.mouse.move(b.x + 3, b.y + 3); await page.mouse.down(); await page.mouse.up(); }
  await sleep(500);
  await page.mouse.move(2, 2);
  const t0 = Date.now();
  let calm = 0;
  while (Date.now() - t0 < 20000) {
    const a = await page.evaluate((r) => JSON.stringify([...document.querySelector(r).querySelectorAll('[role="img"]')].map((e) => e.getBoundingClientRect().top)) + "|" + window.__tipCount(r), ROOT);
    await sleep(400);
    const b2 = await page.evaluate((r) => JSON.stringify([...document.querySelector(r).querySelectorAll('[role="img"]')].map((e) => e.getBoundingClientRect().top)) + "|" + window.__tipCount(r), ROOT);
    if (a === b2 && b2.endsWith("|0")) { calm += 1; if (calm >= 3) return; } else calm = 0;
  }
}

const root = (page) => page.locator(ROOT);
const listLoc = (page, name) => root(page).getByRole("list", { name, exact: true });

function parseSnapshot(text) {
  // returns [{name, imgs:[...]}] for every named list
  const lines = text.split("\n"); const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)- list "((?:[^"\\]|\\.)*)"/);
    if (!m) continue;
    const indent = m[1].length; const imgs = []; const inItem = []; const stack = [{ indent, role: "list" }];
    for (let j = i + 1; j < lines.length; j++) {
      const k = lines[j].match(/^(\s*)- (\w+)(?: "((?:[^"\\]|\\.)*)")?/);
      if (!k) continue;
      if (k[1].length <= indent) break;
      while (stack.length && stack[stack.length - 1].indent >= k[1].length) stack.pop();
      if (k[2] === "img") { imgs.push(k[3] ?? ""); inItem.push(stack.length > 0 && stack[stack.length - 1].role === "listitem"); }
      stack.push({ indent: k[1].length, role: k[2] });
    }
    out.push({ name: m[2], imgs, inItem });
  }
  return out;
}
async function snapshotLists(page) { return parseSnapshot(await root(page).ariaSnapshot()); }

const discInfo = (el) => {
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  let bgAnc = null, n = el.parentElement;
  while (n) { const c = window.__rgba(getComputedStyle(n).backgroundColor); if (c[3] === 255) { bgAnc = c; break; } n = n.parentElement; }
  const bc = window.__rgba(cs.borderTopColor);
  return { x: r.left, y: r.top, w: r.width, h: r.height, text: (el.textContent || "").trim(), bg: cs.backgroundColor, bgAlpha: window.__rgba(cs.backgroundColor)[3] / 255, bgImg: cs.backgroundImage, border: parseFloat(cs.borderTopWidth), borderIsCard: !!bgAnc && bgAnc.join() === bc.join(), color: cs.color, name: el.getAttribute("aria-label") };
};
async function discs(page, listName) {
  return listLoc(page, listName).getByRole("img").evaluateAll((els, fnSrc) => { const fn = eval("(" + fnSrc + ")"); return els.map(fn); }, discInfo.toString());
}
const eqPattern = (arr) => { const seen = []; return arr.map((v) => { let i = seen.indexOf(v); if (i < 0) { seen.push(v); i = seen.length - 1; } return i; }); };
const stripCommaTail = (s) => String(s).split(",")[0];

// ---------------------------------------------------------------- curves
async function measure(page, handles, bases, ms, action) {
  await page.evaluate(() => window.__arm());
  const p = page.evaluate(([els, b, m, r]) => window.__sample(els, b, m, r), [handles, bases, ms, ROOT]);
  await sleep(60);
  await action();
  return await p;
}
function reduce(r, i) {
  const trig = r.trig ?? r.frames[Math.min(1, r.frames.length - 1)].t;
  const fs2 = r.frames.map((fr) => ({ t: fr.t - trig, y: fr.y[i], tips: fr.tips, op: fr.op, w: fr.w }));
  const pre = fs2.filter((x) => x.t < 0), post = fs2.filter((x) => x.t >= 0);
  const start = pre.length ? pre[pre.length - 1].y : fs2[0].y;
  const end = fs2[fs2.length - 1].y;
  const ys = post.map((x) => x.y);
  const min = Math.min(start, ...ys), max = Math.max(start, ...ys);
  const animates = Math.abs(end - start) >= 1 && post.some((x) => Math.abs(x.y - start) > 0.3 && Math.abs(x.y - end) > 0.3);
  const mv = post.find((x) => Math.abs(x.y - start) > 0.3);
  const firstDir = mv ? (mv.y < start ? "up" : "down") : "none";
  let settleMs = 0;
  if (mv) for (let k = post.length - 1; k >= 0; k--) if (Math.abs(post[k].y - end) > 0.5) { settleMs = (post[k + 1] ?? post[k]).t; break; }
  const tipsBefore = pre.length ? pre[pre.length - 1].tips : 0;
  const firstTip = post.find((x) => x.tips > 0);
  const tipOpacityAtAppear = tipsBefore > 0 ? pre[pre.length - 1].op : (firstTip ? firstTip.op : 0);
  const tipFullMs = tipsBefore > 0 && pre[pre.length - 1].op >= 0.99 ? 0 : (post.find((x) => x.tips > 0 && x.op >= 0.99)?.t ?? -1);
  const tipVisibleAfterLeaveMs = post.find((x) => x.tips === 0 || x.op < 0.01)?.t ?? -1;
  const wMax = Math.max(0, ...post.filter((x) => x.tips > 0).map((x) => x.w));
  const tipScaleAtAppear = tipsBefore > 0 || !firstTip || !wMax ? 1 : firstTip.w / wMax;
  // curve shape without start latency: fraction of the travel done 50ms after the curve crosses 10% of it (interpolated)
  let travelAt50 = 0;
  if (Math.abs(end - start) >= 1) {
    const frac = (x) => (x.y - start) / (end - start);
    const at = (t) => { const a = post.filter((x) => x.t <= t).pop(), b = post.find((x) => x.t > t); if (!a) return 0; if (!b) return frac(a); return frac(a) + (frac(b) - frac(a)) * ((t - a.t) / (b.t - a.t)); };
    const k = post.findIndex((x) => frac(x) >= 0.1);
    if (k >= 0) { const p0 = k > 0 ? post[k - 1] : null; const t10 = p0 ? p0.t + (post[k].t - p0.t) * ((0.1 - frac(p0)) / (frac(post[k]) - frac(p0))) : post[k].t; travelAt50 = at(t10 + 50); }
  }
  const on = tipsBefore > 0 ? 0 : (post.find((x) => x.tips > 0)?.t ?? -1);
  const off = post.find((x) => x.tips === 0)?.t ?? -1;
  return { start, end, min, max, animates, firstDir, settleMs: Math.max(0, settleMs), tipAppearMs: on, tipGoneMs: off, tipsEnd: fs2[fs2.length - 1].tips, tipOpacityAtAppear, tipFullMs, tipVisibleAfterLeaveMs, tipScaleAtAppear, travelAt50, maxAbs: Math.max(...fs2.map((x) => Math.abs(x.y))) };
}
function emitCurve(item, prefix, c, tip) {
  add(item, `${prefix}.animates`, "exact", c.animates);
  add(item, `${prefix}.firstDir`, "dir", c.firstDir);
  add(item, `${prefix}.start`, "px", c.start);
  add(item, `${prefix}.end`, "px", c.end);
  add(item, `${prefix}.min`, "px", c.min);
  add(item, `${prefix}.max`, "px", c.max);
  add(item, `${prefix}.settleMs`, "ms", c.settleMs);
  // exact lift and spring shape: px checks alone allow 1.5px either way and cannot see a 0.09px overshoot
  add(item, `${prefix}.endRounded`, "exact", String(Math.round(c.end) + 0));
  if (prefix.endsWith(".in")) { add(item, `${prefix}.overshoots`, "exact", c.min < c.end - 0.04); add(item, `${prefix}.travelAt50ms`, "ratio", c.travelAt50); }
  else add(item, `${prefix}.overshoots`, "exact", c.max > c.end + 0.04);
  if (tip === "appear") { add(item, `${prefix}.tipOpacityAtAppear`, "ratio", c.tipOpacityAtAppear); add(item, `${prefix}.tipFullMs`, "ms", c.tipFullMs); add(item, `${prefix}.tipScaleAtAppear`, "ratio", c.tipScaleAtAppear); }
  if (tip === "gone" && prefix.endsWith(".out")) add(item, `${prefix}.tipVisibleAfterLeaveMs`, "ms", c.tipVisibleAfterLeaveMs);
  if (tip === "appear") add(item, `${prefix}.tipAppearMs`, "ms", c.tipAppearMs);
  if (tip === "gone") add(item, `${prefix}.tipGoneMs`, "ms", c.tipGoneMs);
}
const topOf = (e) => e.getBoundingClientRect().top;

// hover one disc, record lift, tooltip, stacking, optional geometry and pointer-through test, then leave
async function hoverFlow(page, item, prefix, disc, o = {}) {
  const handle = await disc.elementHandle();
  const box = await disc.boundingBox();
  const px = box.x + box.width * 0.65, py = box.y + box.height / 2;
  await page.mouse.move(2, 2); await sleep(400);
  const base = await handle.evaluate(topOf);
  const r = await measure(page, [handle], [base], 800, () => page.mouse.move(px, py));
  const c = reduce(r, 0);
  emitCurve(item, `${prefix}.in`, c, "appear");
  await sleep(150);
  const tips = await page.evaluate((r2) => window.__tipInfo(r2), ROOT);
  add(item, `${prefix}.tipCount`, "count", tips.length);
  add(item, `${prefix}.tipLines`, "exact", tips[0]?.lines ?? []);
  add(item, `${prefix}.tipText`, "exact", await page.evaluate((r2) => window.__tipText(r2), ROOT));
  const cov = await page.evaluate(([x, y]) => window.__nameOf(document.elementFromPoint(x, y)?.closest('[role="img"]')), [box.x + 3, py]);
  add(item, `${prefix}.leftEdgeCoveredBy`, "exact", cov);
  if (o.geom && tips[0]) {
    const t = tips[0]; const hb = await disc.boundingBox();
    add(item, `${prefix}.tip.gap`, "px", hb.y - (t.rect[1] + t.rect[3]));
    add(item, `${prefix}.tip.centreOffset`, "px", (t.rect[0] + t.rect[2] / 2) - (hb.x + hb.width / 2));
    add(item, `${prefix}.tip.fontSize`, "px", t.fs);
    add(item, `${prefix}.tip.radius`, "px", t.radius);
    add(item, `${prefix}.tip.line1Heavier`, "exact", t.heavier);
    add(item, `${prefix}.tip.line2Opacity`, "ratio", t.op2 ?? 1);
    add(item, `${prefix}.tip.darkOnLight`, "exact", t.dark);
    add(item, `${prefix}.tip.pointerEvents`, "exact", t.pe);
    add(item, `${prefix}.tip.ariaHidden`, "exact", t.ah);
    add(item, `${prefix}.tip.liveRegions`, "count", await page.evaluate((r2) => window.__live(r2), ROOT));
    add(item, `${prefix}.tip.height`, "px", t.rect[3]);
  }
  if (o.at && tips[0]) {
    const t = tips[0];
    const base2 = base;
    const r2 = await measure(page, [handle], [base2], 800, () => page.mouse.move(t.rect[0] + t.rect[2] / 2, t.rect[1] + t.rect[3] / 2));
    const c2 = reduce(r2, 0);
    emitCurve(item, `${prefix}.ontoTip`, c2, "gone");
    add(item, `${prefix}.ontoTip.tipsLeft`, "count", c2.tipsEnd);
    await page.mouse.move(2, 2); await sleep(500);
    await page.mouse.move(px, py); await sleep(500);
  }
  const rl = await measure(page, [handle], [base], 800, () => page.mouse.move(2, 2));
  const cl = reduce(rl, 0);
  emitCurve(item, `${prefix}.out`, cl, "gone");
  add(item, `${prefix}.out.tipsLeft`, "count", cl.tipsEnd);
  return c;
}

// ---------------------------------------------------------------- tab walk
const focusInfo = () => {
  const e = document.activeElement; if (!e || e === document.body) return null;
  const tag = e.tagName.toLowerCase();
  return { tag, role: e.getAttribute("role"), name: window.__nameOf(e) || "" };
};
const fmtStop = (s) => `${s.role || s.tag}:${s.name.replace(/\s+/g, " ").slice(0, 30)}`;
async function startBeforeRoot(page) {
  await page.evaluate((sel) => {
    document.activeElement?.blur?.();
    const r = document.querySelector(sel); const s = getSelection(); s.removeAllRanges();
    const rg = document.createRange(); rg.setStart(r, 0); rg.collapse(true); s.addRange(rg);
  }, ROOT);
}
const inRoot = (page) => page.evaluate((sel) => { const r = document.querySelector(sel); return !!r && r.contains(document.activeElement) && document.activeElement !== r; }, ROOT);

// ================================================================= scenarios
const T0 = Date.now();

// ---- static: initial render, structure, names, overlap, entrance, fallback
await guard("first-render-main-stack", async () => {
  const { ctx, page } = await openPage(URL0, false, "static");
  try {
    const item = "first-render-main-stack";
    // entrance recorder (item no-entrance-on-first-render)
    await guard("no-entrance-on-first-render", async () => {
      const ent = await page.evaluate(() => window.__ent);
      const frames = ent.frames;
      if (!frames.length) throw new Error("no entrance frames recorded");
      const n = Math.min(...frames.map((fr) => fr.length));
      let minOp = 1, wd = 0, hd = 0, xd = 0, yd = 0;
      for (let i = 0; i < n; i++) {
        const col = frames.map((fr) => fr[i]);
        for (const d of col) minOp = Math.min(minOp, d.op);
        const rg = (k) => Math.max(...col.map((d) => d[k])) - Math.min(...col.map((d) => d[k]));
        wd = Math.max(wd, rg("w")); hd = Math.max(hd, rg("h")); xd = Math.max(xd, rg("x")); yd = Math.max(yd, rg("y"));
      }
      const i0 = "no-entrance-on-first-render";
      add(i0, "entrance.minOpacity", "ratio", minOp);
      add(i0, "entrance.widthDrift", "px", wd);
      add(i0, "entrance.heightDrift", "px", hd);
      add(i0, "entrance.xDrift", "px", xd);
      add(i0, "entrance.yDrift", "px", yd);
      add(i0, "entrance.frames", "info", frames.length);
    });

    const snap = await snapshotLists(page);
    const main = await discs(page, LISTS[0]);
    const mug = await discs(page, LISTS[1]);
    const tote = await discs(page, LISTS[2]);

    // first-render-main-stack
    add(item, "main.discCount", "count", main.length);
    add(item, "main.discTexts", "exact", main.map((d) => d.text));
    const init4 = main.slice(0, 4);
    add(item, "main.initialDisc.width.min", "px", Math.min(...init4.map((d) => d.w)));
    add(item, "main.initialDisc.width.max", "px", Math.max(...init4.map((d) => d.w)));
    add(item, "main.initialDisc.height.min", "px", Math.min(...init4.map((d) => d.h)));
    add(item, "main.initialDisc.height.max", "px", Math.max(...init4.map((d) => d.h)));
    const ov = main[main.length - 1];
    add(item, "main.overflow.height", "px", ov.h);
    add(item, "main.overflow.atLeast36", "exact", ov.w >= 35.5 && ov.h >= 35.5);
    add(item, "main.overflow.width", "info", ov.w);
    const text = (await root(page).innerText()).replace(/\s+/g, " ");
    add(item, "main.caption", "exact", text.includes("1,284 bought in the last 30 days"));
    add(item, "main.rootText", "info", text);
    add(item, "main.tintColours", "info", init4.map((d) => [d.bg, d.color]));
    add(item, "main.overflow.bgInfo", "info", [ov.bg, ov.color]);

    // first-render-related-rows
    const rel = "first-render-related-rows";
    for (const [k, ds] of [["mug", mug], ["tote", tote]]) {
      const g = ds.slice(0, 2);
      add(rel, `${k}.discCount`, "count", ds.length);
      add(rel, `${k}.discTexts`, "exact", ds.map((d) => d.text));
      add(rel, `${k}.gradientDisc.width.min`, "px", Math.min(...g.map((d) => d.w)));
      add(rel, `${k}.gradientDisc.width.max`, "px", Math.max(...g.map((d) => d.w)));
      add(rel, `${k}.gradientDisc.height.min`, "px", Math.min(...g.map((d) => d.h)));
      add(rel, `${k}.gradientDisc.height.max`, "px", Math.max(...g.map((d) => d.h)));
      add(rel, `${k}.gradientDisc.border`, "px", Math.min(...g.map((d) => d.border)));
      add(rel, `${k}.gradientDisc.borderIsCardColour`, "exact", g.every((d) => d.borderIsCard));
      add(rel, `${k}.overflow.height`, "px", ds[ds.length - 1].h);
      add(rel, `${k}.overflow.width`, "info", ds[ds.length - 1].w);
    }

    // overlap-and-stacking
    await guard("overlap-and-stacking", async () => {
      const i1 = "overlap-and-stacking";
      for (const [k, ds, ln] of [["main", main, LISTS[0]], ["mug", mug, LISTS[1]], ["tote", tote, LISTS[2]]]) {
        const ov2 = ds.slice(1).map((d, i) => ds[i].x + ds[i].w - d.x);
        add(i1, `overlap.${k}.min`, "px", Math.min(...ov2));
        add(i1, `overlap.${k}.max`, "px", Math.max(...ov2));
        const covered = await page.evaluate(([sel, nm]) => {
          const list = [...document.querySelector(sel).querySelectorAll('[aria-label]')].find((e) => e.getAttribute("aria-label") === nm && e.getAttribute("role") !== "img");
          const imgs = [...list.querySelectorAll('[role="img"]')];
          return imgs.slice(1).map((e) => { const b = e.getBoundingClientRect(); return window.__nameOf(document.elementFromPoint(b.left + 3, b.top + b.height / 2)?.closest('[role="img"]')); });
        }, [ROOT, ln]);
        add(i1, `overlap.${k}.leftEdgeCoveredBy`, "exact", covered);
      }
    });

    // group names, avatar names, overflow names
    await guard("group-accessible-name", async () => {
      const i2 = "group-accessible-name";
      add(i2, "group.names", "exact", snap.map((s) => s.name));
      add(i2, "group.count", "count", snap.length);
      // read from the aria snapshot: every img's parent node is a listitem (roles only)
      add(i2, "group.discsInListItems", "exact", snap.length > 0 && snap.every((s) => s.imgs.length > 0 && s.inItem.every(Boolean)));
    });
    await guard("avatar-accessible-names", async () => {
      const i3 = "avatar-accessible-names";
      const byName = Object.fromEntries(snap.map((s) => [s.name, s.imgs]));
      add(i3, "avatar.names.main", "exact", (byName[LISTS[0]] ?? []).slice(0, 4));
      add(i3, "avatar.names.mug", "exact", (byName[LISTS[1]] ?? []).slice(0, 2));
      add(i3, "avatar.names.tote", "exact", (byName[LISTS[2]] ?? []).slice(0, 2));
      const hidden = await listLoc(page, LISTS[0]).getByRole("img").evaluateAll((els) => els.slice(0, 4).map((e) => {
        const leaves = [...e.querySelectorAll("*")].filter((x) => x.children.length === 0 && (x.textContent || "").trim());
        return leaves.length > 0 && leaves.every((x) => x.closest('[aria-hidden="true"]'));
      }));
      add(i3, "avatar.initialsAriaHidden", "exact", hidden);
    });
    await guard("overflow-accessible-name", async () => {
      const i4 = "overflow-accessible-name";
      const byName = Object.fromEntries(snap.map((s) => [s.name, s.imgs]));
      add(i4, "overflow.names", "exact", LISTS.map((l) => (byName[l] ?? []).slice(-1)[0] ?? null));
      add(i4, "overflow.buttonCount", "count", await root(page).getByRole("button", { name: /more/i }).count());
      const tabs = [];
      for (const l of LISTS) tabs.push(await listLoc(page, l).getByRole("img").evaluateAll((els) => els.map((e) => e.getAttribute("tabindex"))));
      add(i4, "overflow.allDiscsFocusable", "exact", tabs.flat().every((t) => t !== null && Number(t) >= 0));
    });

    // photo-less-fallback
    await guard("photo-less-fallback", async () => {
      const i5 = "photo-less-fallback";
      add(i5, "fallback.main.tintPattern", "exact", eqPattern(init4.map((d) => d.bg)));
      init4.forEach((d, i) => add(i5, `fallback.main.tintAlpha.${i}`, "ratio", d.bgAlpha));
      add(i5, "fallback.main.tintAlpha.note", "info", "Alpha of the computed background (opacity, not hue), expected about 0.12, 0.20, 0.28 by the id hash. Index modulo 3 gives the same [0,1,2,0] pattern as the id hash for these four people, so the main stack cannot tell an index-based port apart; only fallback.related.gradientPattern (ids 2,3,4,5) can.");
      add(i5, "fallback.main.hasGradient", "exact", init4.some((d) => d.bgImg !== "none"));
      const grads = [...mug.slice(0, 2), ...tote.slice(0, 2)];
      add(i5, "fallback.related.allGradient", "exact", grads.every((d) => /linear-gradient/.test(d.bgImg)));
      add(i5, "fallback.related.angle135", "exact", grads.every((d) => /135deg/.test(d.bgImg)));
      add(i5, "fallback.related.noLetters", "exact", grads.every((d) => d.text === ""));
      add(i5, "fallback.related.gradientPattern", "exact", eqPattern(grads.map((d) => d.bgImg)));
      const before = JSON.stringify([init4.map((d) => d.bg), grads.map((d) => d.bgImg)]);
      await page.reload({ waitUntil: "load" });
      await root(page).getByRole("img").first().waitFor({ timeout: 15000 });
      await sleep(1200); await settle(page);
      const m2 = (await discs(page, LISTS[0])).slice(0, 4), a2 = await discs(page, LISTS[1]), b2 = await discs(page, LISTS[2]);
      const after = JSON.stringify([m2.map((d) => d.bg), [...a2.slice(0, 2), ...b2.slice(0, 2)].map((d) => d.bgImg)]);
      add(i5, "fallback.stableAfterReload", "exact", before === after);
    });
  } finally { await ctx.close(); }
});

// ---- tab order, focus ring, tooltips while focused
await guard("tab-order", async () => {
  const { ctx, page } = await openPage(URL0, false, "tab");
  try {
    const seq = [], rings = [], tips = [], ringInfos = [];
    await startBeforeRoot(page);
    let left = false;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab"); await sleep(200);
      if (!(await inRoot(page))) { left = true; break; }
      const fi = await page.evaluate(focusInfo);
      seq.push(fmtStop(fi));
      rings.push(await page.evaluate(() => window.__ring(document.activeElement)));
      ringInfos.push(await page.evaluate(() => window.__ringInfo(document.activeElement)));
      const t = await page.evaluate((r) => window.__tipInfo(r), ROOT);
      tips.push(`${t.length}|${(t[0]?.lines ?? []).join(" / ")}`);
    }
    tabOrder = seq;
    await guard("tab-order", async () => {
      add("tab-order", "tab.order", "exact", seq);
      add("tab-order", "tab.stopCount", "count", seq.length);
      add("tab-order", "tab.leftRoot", "exact", left);
      // reverse
      let back = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press("Shift+Tab"); await sleep(150);
        if (await inRoot(page)) { back.push(fmtStop(await page.evaluate(focusInfo))); }
        else if (back.length) break;
      }
      add("tab-order", "tab.reverseIsMirror", "exact", JSON.stringify(back) === JSON.stringify([...seq].reverse()));
    });
    await guard("focus-ring", async () => {
      const discRings = rings.filter((_, i) => seq[i].startsWith("img:"));
      add("focus-ring", "ring.discCount", "count", discRings.length);
      add("focus-ring", "ring.extent.min", "px", Math.min(...discRings));
      add("focus-ring", "ring.extent.max", "px", Math.max(...discRings));
      const unf = await page.evaluate((r) => window.__ring([...document.querySelector(r).querySelectorAll('[role="img"]')].find((e) => e !== document.activeElement)), ROOT);
      add("focus-ring", "ring.extent.unfocused", "px", unf);
      const discInfos = ringInfos.filter((_, i) => seq[i].startsWith("img:"));
      // the default browser outline (outline-style auto) must not sit next to the block's own ring
      add("focus-ring", "ring.outlineAuto", "exact", discInfos.some((x) => x.auto));
      // the 2px gap between disc and ring: spread of the inner zero-offset shadow layer, or outline-offset
      add("focus-ring", "ring.innerOffset", "px", Math.min(...discInfos.map((x) => x.inner)));
      add("focus-ring", "ring.innerOffset.max", "px", Math.max(...discInfos.map((x) => x.inner)));
    });
    await guard("tab-order", async () => { add("tab-order", "tab.focusTooltips", "exact", tips); });
  } finally { await ctx.close(); }
});

// ---- hover on the second main avatar, tooltip geometry, pointer-through, leave
await guard("hover-lift-and-tooltip", async () => {
  const { ctx, page } = await openPage(URL0, false, "hover");
  try {
    const leo = listLoc(page, LISTS[0]).getByRole("img", { name: LEO, exact: true }).first();
    const mina = await listLoc(page, LISTS[0]).getByRole("img").first().elementHandle();
    const ava = await listLoc(page, LISTS[0]).getByRole("img").nth(2).elementHandle();
    const hLeo = await leo.elementHandle();
    await page.mouse.move(2, 2); await sleep(400);
    const bases = [await mina.evaluate(topOf), await hLeo.evaluate(topOf), await ava.evaluate(topOf)];
    const box = await leo.boundingBox();
    const r = await measure(page, [hLeo, mina, ava], bases, 800, () => page.mouse.move(box.x + box.width * 0.65, box.y + box.height / 2));
    await guard("hover-lift-and-tooltip", async () => {
            add("hover-lift-and-tooltip", "hover.leo.neighbourMoveMax", "px", Math.max(reduce(r, 1).maxAbs, reduce(r, 2).maxAbs));
    });
    await sleep(100);
    await guard("tooltip-hidden-from-at", async () => {
      // geometry and pointer-through, then leave, all in hoverFlow below; here check the tooltip count while hovered
      const t = await page.evaluate((r2) => window.__tipInfo(r2), ROOT);
      add("tooltip-hidden-from-at", "tipAT.countWhileHovered", "count", t.length);
    });
    await page.mouse.move(2, 2); await sleep(500);
    await guard("hover-lift-and-tooltip", async () => {
      await hoverFlow(page, "hover-lift-and-tooltip", "hoverFlow.leo", leo, { geom: true, at: true });
    });
    // the same keys used by the tooltip-hidden item: derive from hoverFlow keys
    await guard("tooltip-hidden-from-at", async () => {
      const find = (k) => checks.find((c) => c.key === k);
      for (const [k, kind] of [["tip.pointerEvents", "exact"], ["tip.ariaHidden", "exact"], ["tip.liveRegions", "count"], ["ontoTip.tipsLeft", "count"], ["ontoTip.end", "px"], ["ontoTip.animates", "exact"], ["ontoTip.firstDir", "dir"]]) {
        const src = find(`hoverFlow.leo.${k}`); if (src) add("tooltip-hidden-from-at", `tipAT.${k}`, kind, src.value);
      }
    });
  } finally { await ctx.close(); }
});

// ---- keyboard focus lift
await guard("focus-lift-and-tooltip", async () => {
  const { ctx, page } = await openPage(URL0, false, "focus");
  try {
    const item = "focus-lift-and-tooltip";
    const imgs = listLoc(page, LISTS[0]).getByRole("img");
    const hs = [await imgs.nth(0).elementHandle(), await imgs.nth(1).elementHandle(), await imgs.nth(2).elementHandle()];
    await page.mouse.move(2, 2); await sleep(300);
    const bases = [];
    for (const h of hs) bases.push(await h.evaluate(topOf));
    await startBeforeRoot(page);
    for (let i = 0; i < 20; i++) { await page.keyboard.press("Tab"); await sleep(120); const fi = await page.evaluate(focusInfo); if (fi && fi.name.startsWith("Mina P.")) break; }
    await sleep(600);
    let r = await measure(page, hs, bases, 900, () => page.keyboard.press("Tab"));
    emitCurve(item, "focus.leo.in", reduce(r, 1));
    emitCurve(item, "focus.mina.out", reduce(r, 0));
    await sleep(100);
    let t = await page.evaluate((r2) => window.__tipInfo(r2), ROOT);
    add(item, "focus.afterFirstTab.tips", "exact", t.map((x) => x.lines));
    add(item, "focus.afterFirstTab.tipText", "exact", await page.evaluate((r2) => window.__tipText(r2), ROOT));
    r = await measure(page, hs, bases, 900, () => page.keyboard.press("Tab"));
    emitCurve(item, "focus.leo.out", reduce(r, 1));
    emitCurve(item, "focus.ava.in", reduce(r, 2));
    await sleep(100);
    t = await page.evaluate((r2) => window.__tipInfo(r2), ROOT);
    add(item, "focus.afterSecondTab.tips", "exact", t.map((x) => x.lines));
    add(item, "focus.afterSecondTab.tipText", "exact", await page.evaluate((r2) => window.__tipText(r2), ROOT));
  } finally { await ctx.close(); }
});

// ---- overflow discs
await guard("overflow-lift-and-tooltip", async () => {
  const { ctx, page } = await openPage(URL0, false, "overflow");
  try {
    for (const [k, ln] of [["main", LISTS[0]], ["mug", LISTS[1]], ["tote", LISTS[2]]]) {
      await guard("overflow-lift-and-tooltip", async () => {
        await hoverFlow(page, "overflow-lift-and-tooltip", `overflow.${k}`, listLoc(page, ln).getByRole("img").last());
      });
    }
  } finally { await ctx.close(); }
});

// ---- reduced motion
await guard("reduced-motion", async () => {
  const { ctx, page } = await openPage(URL0, true, "reduced");
  try {
    const item = "reduced-motion";
    await guard(item, async () => {
      const ent = await page.evaluate(() => window.__ent);
      const frames = ent.frames;
      const n = Math.min(...frames.map((fr) => fr.length));
      let minOp = 1, drift = 0;
      for (let i = 0; i < n; i++) {
        const col = frames.map((fr) => fr[i]);
        for (const d of col) minOp = Math.min(minOp, d.op);
        for (const k of ["w", "x", "y"]) drift = Math.max(drift, Math.max(...col.map((d) => d[k])) - Math.min(...col.map((d) => d[k])));
      }
      add(item, "rm.entrance.minOpacity", "ratio", minOp);
      add(item, "rm.entrance.drift", "px", drift);
    });
    await guard(item, async () => { await hoverFlow(page, item, "rm.hover.leo", listLoc(page, LISTS[0]).getByRole("img", { name: LEO, exact: true }).first()); });
    await guard(item, async () => { await hoverFlow(page, item, "rm.hover.mainOverflow", listLoc(page, LISTS[0]).getByRole("img").last()); });
    await guard(item, async () => {
      const imgs = listLoc(page, LISTS[0]).getByRole("img");
      const hs = [await imgs.nth(0).elementHandle(), await imgs.nth(1).elementHandle()];
      await page.mouse.move(2, 2); await sleep(300);
      const bases = [await hs[0].evaluate(topOf), await hs[1].evaluate(topOf)];
      await startBeforeRoot(page);
      for (let i = 0; i < 20; i++) { await page.keyboard.press("Tab"); await sleep(120); const fi = await page.evaluate(focusInfo); if (fi && fi.name.startsWith("Mina P.")) break; }
      await sleep(400);
      const r = await measure(page, hs, bases, 800, () => page.keyboard.press("Tab"));
      emitCurve(item, "rm.focus.leo.in", reduce(r, 1));
      await sleep(100);
      const t = await page.evaluate((r2) => window.__tipInfo(r2), ROOT);
      add(item, "rm.focus.tips", "exact", t.map((x) => x.lines));
      add(item, "rm.focus.tipText", "exact", await page.evaluate((r2) => window.__tipText(r2), ROOT));
    });
  } finally { await ctx.close(); }
});

// ---- locales (the demo locale comes from the l= parameter of the page; a target that ignores it will show English)
function withLocale(url, l) {
  if (/([?&])l=/.test(url)) return url.replace(/([?&])l=[^&]*/, `$1l=${encodeURIComponent(l)}`);
  return url + (url.includes("?") ? "&" : "?") + "l=" + encodeURIComponent(l);
}
const EXPECT = {
  "zh-TW": { caption: "1,284 人在過去 30 天購買", button: "加入購物車", heading: "經常一起購買" },
  "zh-CN": { caption: "1,284 人在过去 30 天购买", button: "加入购物车", heading: "经常一起购买" },
  ja: { caption: "1,284 人が過去 30 日間に購入", button: "カートに入れる", heading: "よく一緒に購入されている商品" },
};
for (const l of ["zh-TW", "zh-CN", "ja"]) {
  const item = l === "zh-TW" ? "locale-zh-tw" : "locale-zh-cn-ja";
  await guard(item, async () => {
    const { ctx, page } = await openPage(withLocale(URL0, l), false, "locale-" + l);
    try {
      const snap = await snapshotLists(page);
      add(item, `locale.${l}.listNames`, "exact", snap.map((s) => s.name));
      add(item, `locale.${l}.discNames.main`, "exact", snap[0]?.imgs ?? []);
      add(item, `locale.${l}.discNames.mug`, "exact", snap[1]?.imgs ?? []);
      add(item, `locale.${l}.discNames.tote`, "exact", snap[2]?.imgs ?? []);
      const texts = [];
      for (const s of snap) texts.push((await listLoc(page, s.name).getByRole("img").evaluateAll((els) => els.map((e) => (e.textContent || "").trim()))));
      add(item, `locale.${l}.discTexts`, "exact", texts);
      const text = (await root(page).innerText()).replace(/\s+/g, " ");
      add(item, `locale.${l}.caption`, "exact", text.includes(EXPECT[l].caption));
      add(item, `locale.${l}.buttonName`, "exact", (await root(page).getByRole("button", { name: EXPECT[l].button, exact: true }).count()) === 1);
      add(item, `locale.${l}.headingName`, "exact", (await root(page).getByRole("heading", { name: EXPECT[l].heading, exact: true }).count()) === 1);
      add(item, `locale.${l}.rootText`, "info", text);
      // hover the first disc: tooltip lines
      const first = listLoc(page, snap[0].name).getByRole("img").first();
      const box = await first.boundingBox();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2); await sleep(400);
      const t = await page.evaluate((r2) => window.__tipInfo(r2), ROOT);
      add(item, `locale.${l}.hoverFirst.tipLines`, "exact", t.map((x) => x.lines));
      add(item, `locale.${l}.hoverFirst.tipText`, "exact", await page.evaluate((r2) => window.__tipText(r2), ROOT));
    } finally { await ctx.close(); }
  });
}

// ---------------------------------------------------------------- write
await browser.close();
const result = { block: BLOCK, label: LABEL, url: URL0, checks, tabOrder, consoleErrors: [...new Set(consoleErrors)].slice(0, 20), errors };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ label: LABEL, checks: checks.length, errors, consoleErrors: result.consoleErrors, seconds: Math.round((Date.now() - T0) / 1000) }, null, 1));

