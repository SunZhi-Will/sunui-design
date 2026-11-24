// Acceptance script for the SunUI block "loading-button". Follows pilot-a/CONTRACT.md (v2).
//   node loading-button.mjs --url <url> --root "<css selector>" --out <file.json> --label <name>
import { chromium } from "/private/tmp/claude-501/-Applications-Projects-nextjs-sunui-design/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/cap/node_modules/playwright-core/index.mjs";
import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const URL0 = args.url, ROOT = args.root, OUT = args.out, LABEL = args.label || "run";
if (!URL0 || !ROOT || !OUT) { console.error("usage: --url --root --out --label"); process.exit(2); }
// contract v2: the locale travels in the URL on every target (l=<locale>); default en
const URL_ = (() => { const u = new URL(URL0); if (!u.searchParams.has("l")) u.searchParams.set("l", "en"); return u.toString(); })();
const LOCALE = new URL(URL_).searchParams.get("l");
// Locale: the component owns no visible string; every label is demo copy, and the original's demo follows l=<locale> while the port demos stay English. So outside l=en the state labels (idle from the first render, result labels discovered by pressing each button once) are read from the page, tab labels carry the button index instead of its name, and values that are copy (texts, names, live sequences) are recorded as info while every timing, geometry, attribute, focus and count check stays compared.
const f = findChrome();
const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const checks = [], errors = [], consoleErrors = [], keys = new Set();
const LOCTEXT = /(\.text$|Text$|\.name\b|\.sequence$|NonBusyLive|textUnchanged|textDuringHold|stillIdle|text\.after6s|buttonNames|placeholder)/;
let tabOrder = [];
function add(item, key, kind, value) {
  if (keys.has(key)) { errors.push({ item, message: "duplicate key " + key }); return; }
  if (value === undefined || value === null || (typeof value === "number" && !Number.isFinite(value))) { errors.push({ item, message: "no value for " + key }); return; }
  // outside l=en, values that are demo copy (labels, names, live text) are info only
  if (LOCALE !== "en" && kind === "exact" && typeof value !== "boolean" && LOCTEXT.test(key)) kind = "info";
  keys.add(key);
  checks.push({ item, key, kind, value: typeof value === "number" ? +value.toFixed(3) : value });
}
async function guard(items, fn) {
  try { await fn(); } catch (e) { for (const it of [].concat(items)) errors.push({ item: it, message: String((e && e.message) || e).slice(0, 300) }); }
}

// ---------------- in-page library (installed before any page script) ----------------
function installLib({ sel, probe }) {
  const L = (window.__L = { samples: [], events: [], on: false, idx: 0 });
  const root = () => document.querySelector(sel);
  const btns = () => [...root().querySelectorAll('button,[role="button"]')];
  L.btns = btns;
  const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
  // rendered text of a text node: innerText of its parent when the parent carries only this text, else collapsed text
  const textOfNode = (n) => {
    const p = n.parentElement;
    if (p && p.innerText !== undefined && [...p.childNodes].filter((c) => c.nodeType === 1 || (c.nodeType === 3 && c.textContent.trim())).length === 1) return norm(p.innerText);
    return norm(n.textContent);
  };
  // accessible name: aria-label, else the visible text outside the live region, else the live text (a shrunk button is named by it)
  const visName = (e) => {
    const al = e.getAttribute("aria-label");
    if (al) return norm(al);
    const out = [];
    const walkN = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3) { if (!c.textContent.trim()) continue; const t = textOfNode(c); if (t) out.push(t); } else if (c.nodeType === 1 && !c.hasAttribute("aria-live") && c.tagName.toLowerCase() !== "svg") walkN(c); } };
    walkN(e);
    if (out.length) return norm(out.join(" "));
    const live = e.querySelector && e.querySelector("[aria-live]");
    return live ? norm(live.innerText) : "";
  };
  L.visName = visName;
  const scaleOf = (cs) => {
    let s = 1;
    if (cs.scale && cs.scale !== "none") { const p = cs.scale.split(/\s+/).map(parseFloat); s *= p[1] ?? p[0]; }
    const m = /matrix\(([^)]+)\)/.exec(cs.transform || "");
    if (m) s *= parseFloat(m[1].split(",")[3]);
    else { const m3 = /matrix3d\(([^)]+)\)/.exec(cs.transform || ""); if (m3) s *= parseFloat(m3[1].split(",")[5]); }
    return s;
  };
  const snap = (b) => {
    const cs = getComputedStyle(b), r = b.getBoundingClientRect();
    const ps = scaleOf(cs) || 1;
    const live = b.querySelector("[aria-live]");
    const parts = [];
    const bc = r.top + r.height / 2;
    const mk = (k, text, node) => {
      const el = node.nodeType === 3 ? node.parentElement : node;
      let op = 1;
      for (let e = el; e && e !== b; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      let rr;
      if (node.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(node); rr = rg.getBoundingClientRect(); } else rr = node.getBoundingClientRect();
      let left = rr.left, right = rr.right, ww = rr.width;
      if (node.nodeType === 1) { const cw = parseFloat(getComputedStyle(node).width); if (cw > 0) { const cx = (rr.left + rr.right) / 2; left = cx - cw / 2; right = cx + cw / 2; ww = cw; } }
      const p = { k, text, op: +op.toFixed(3), dx: +((left + right) / 2 - (r.left + r.width / 2)).toFixed(2), dy: +(rr.top + rr.height / 2 - bc).toFixed(2), x1: +(left - r.left).toFixed(2), x2: +(right - r.left).toFixed(2), w: +ww.toFixed(2) };
      if (k !== "text") {
        const infinite = node.getAnimations ? node.getAnimations({ subtree: true }).some((a) => { try { return a.effect.getComputedTiming().iterations === Infinity; } catch (e) { return false; } }) : false;
        const smil = !!node.querySelector("animateTransform,animate");
        p.k = infinite || smil ? "spin" : "check";
        let frac = 1;
        const pa = node.querySelector("path,polyline");
        if (pa && p.k === "check") {
          const c2 = getComputedStyle(pa); const da = parseFloat(c2.strokeDasharray);
          if (Number.isFinite(da)) {
            const off = parseFloat(c2.strokeDashoffset) || 0; const pl = parseFloat(pa.getAttribute("pathLength"));
            const tot = Number.isFinite(pl) && pl > 0 ? pl : pa.getTotalLength ? pa.getTotalLength() : 1;
            frac = Math.max(0, Math.min(1, (da - off) / tot));
          }
        }
        p.frac = +frac.toFixed(3);
        // shape of the icon: stroked shapes, and how many are faint (an opacity or stroke-opacity near 0.25, never a colour) or solid
        const shapes = [...node.querySelectorAll("circle,path,ellipse,line,polyline,polygon,rect")].filter((e) => { const c = getComputedStyle(e); return c.stroke && c.stroke !== "none" && parseFloat(c.strokeWidth) > 0; });
        const effOp = (e) => { let o = +getComputedStyle(e).strokeOpacity; for (let x = e; x && x !== node; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o; };
        p.shapes = shapes.length;
        p.faint = shapes.filter((e) => Math.abs(effOp(e) - 0.25) <= 0.07).length;
        p.solid = shapes.filter((e) => effOp(e) >= 0.9).length;
        p.hidden = node.getAttribute("aria-hidden") === "true" || !!node.closest('[aria-hidden="true"]');
      }
      return p;
    };
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c === live) continue;
        if (c.nodeType === 3) { const t = norm(c.textContent); if (t) parts.push(mk("text", textOfNode(c), c)); }
        else if (c.nodeType === 1) { if (c.tagName.toLowerCase() === "svg") parts.push(mk("svg", "", c)); else walk(c); }
      }
    };
    walk(b);
    const tokens = cs.borderTopLeftRadius.split(" ");
    const rv = tokens[tokens.length - 1];
    let rad = rv.endsWith("%") ? (parseFloat(rv) / 100) * (r.height / ps) : parseFloat(rv);
    rad = Math.min(rad, r.height / ps / 2);
    const par = b.parentElement ? b.parentElement.getBoundingClientRect().width : 0;
    const rootEl = root();
    let opUp = 1;
    for (let e = b; e && e !== rootEl; e = e.parentElement) opUp *= +getComputedStyle(e).opacity;
    let liveHidden = null, liveW = null, liveH = null;
    if (live) {
      const lr = live.getBoundingClientRect(), lc = getComputedStyle(live);
      const clipped = /rect\(\s*0(px)?,?\s*0(px)?,?\s*0(px)?,?\s*0(px)?\s*\)/.test(lc.clip || "") || /inset\(\s*50%/.test(lc.clipPath || "");
      liveW = +lr.width.toFixed(2); liveH = +lr.height.toFixed(2);
      liveHidden = lc.display !== "none" && lc.visibility !== "hidden" && ((lr.width <= 1.01 && lr.height <= 1.01) || clipped);
    }
    return {
      bcx: r.width / 2, opUp: +opUp.toFixed(3), top: +(r.top - rootEl.getBoundingClientRect().top).toFixed(2), liveHidden, liveW, liveH,
      w: +(r.width / ps).toFixed(2), h: +(r.height / ps).toFixed(2), scale: +ps.toFixed(4), rad: +rad.toFixed(2), parentW: +par.toFixed(2),
      padL: parseFloat(cs.paddingLeft), padR: parseFloat(cs.paddingRight), fs: parseFloat(cs.fontSize), fw: cs.fontWeight, bw: parseFloat(cs.borderTopWidth),
      busy: b.getAttribute("aria-busy"), adis: b.getAttribute("aria-disabled"), dis: b.disabled === true, type: b.getAttribute("type") || b.type || "",
      live: live ? norm(live.innerText) : null, liveAttr: live ? live.getAttribute("aria-live") : null, name: visName(b),
      bg: cs.backgroundColor, fg: cs.color, parts, focused: document.activeElement === b,
      ol: { w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset), st: cs.outlineStyle },
      svgHidden: [...b.querySelectorAll("svg")].every((v) => v.getAttribute("aria-hidden") === "true" || !!v.closest('[aria-hidden="true"]')),
    };
  };
  L.snapAll = () => btns().map(snap);
  L.rect = (i) => { const r = btns()[i].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  L.start = (i) => { L.samples = []; L.events = []; L.idx = i; L.on = true; };
  L.stop = () => { L.on = false; return { samples: L.samples, events: L.events }; };
  L.spinRot = async (i, span = 300) => {
    const b = btns()[i];
    const sv = [...b.querySelectorAll("svg")].find((v) => v.getAnimations({ subtree: true }).some((a) => { try { return a.effect.getComputedTiming().iterations === Infinity; } catch (e) { return false; } }));
    if (!sv) return { has: false, rot: false, periodMs: 0 };
    const els = [sv, ...sv.querySelectorAll("*")];
    const ang = (e) => { const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(e).transform || ""); if (!m) return null; const v = m[1].split(",").map(parseFloat); return Math.atan2(v[1], v[0]); };
    const reads = [];
    const sample = () => reads.push({ t: document.timeline.currentTime, a: els.map(ang), tr: els.map((e) => getComputedStyle(e).transform).join("|") });
    sample();
    for (let k = 0; k < Math.round(span / 50); k++) { await new Promise((r) => setTimeout(r, 50)); sample(); }
    let best = 0;
    for (let j = 0; j < els.length; j++) {
      if (reads.some((r) => r.a[j] === null)) continue;
      let tot = 0;
      for (let k = 1; k < reads.length; k++) { let d = reads[k].a[j] - reads[k - 1].a[j]; while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI; tot += d; }
      if (Math.abs(tot) > Math.abs(best)) best = tot;
    }
    const dt = reads.at(-1).t - reads[0].t;
    return { has: true, rot: reads.some((r) => r.tr !== reads[0].tr), periodMs: Math.abs(best) < 0.05 ? 0 : (2 * Math.PI * dt) / Math.abs(best) };
  };
  for (const type of ["pointerdown", "pointerup", "click", "keydown", "keyup"]) {
    window.addEventListener(type, (e) => {
      const el = e.target instanceof Element ? e.target.closest('button,[role="button"]') : null;
      let i = -1; try { i = el ? btns().indexOf(el) : -1; } catch (er) {}
      L.events.push({ t: performance.now(), type, btn: i, key: e.key || "" });
    }, true);
  }
  const loop = () => {
    try { if (L.on) { const bs = btns(); if (bs[L.idx]) L.samples.push({ t: performance.now(), b: snap(bs[L.idx]) }); } } catch (e) {}
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  // first render: the idle labels as first drawn (before any demo autoplay), read from the first frame that has three buttons
  const fl = () => {
    try { if (root() && btns().length >= 3) { L.firstNames = btns().map((b) => snap(b).parts.filter((p) => p.k === "text").map((p) => p.text).join(" ")); return; } } catch (e) {}
    requestAnimationFrame(fl);
  };
  requestAnimationFrame(fl);
  if (probe) {
    window.__mount = [];
    // the 1000ms window starts at the first frame where the three buttons exist (a late mount must not shrink it)
    let t0 = null;
    const pl = () => {
      try {
        if (root() && btns().length >= 3) {
          if (t0 === null) t0 = performance.now();
          const all = btns().map(snap);
          if (!all.some((s) => s.busy)) window.__mount.push({ t: Math.round(performance.now() - t0), opUp: Math.min(...all.map((s) => s.opUp)), tops: all.map((s) => s.top), op: Math.min(...all.flatMap((s) => s.parts.map((p) => p.op))), dys: all.flatMap((s) => s.parts.map((p) => p.dy)), n: all.flatMap((s) => s.parts).length });
        }
      } catch (e) {}
      if (t0 === null || performance.now() - t0 < 1000) requestAnimationFrame(pl);
    };
    requestAnimationFrame(pl);
  }
  // tab stop label: tag plus accessible name (l=en), or tag plus button index (other locales, where names are demo copy)
  L.tabLabel = (e, nameFree) => {
    const tag = e.tagName.toLowerCase();
    if (!nameFree) return `${tag}:${visName(e).slice(0, 30)}`;
    const i = btns().indexOf(e);
    return `${tag}:${i >= 0 ? "#" + i : ""}`;
  };
}

const browser = await chromium.launch({ executablePath: exe, headless: true });
let IDLE = ["Subscribe", "Pay $68.00", "Apply code"];
let RES = ["Subscribed", "Paid", "Code expired"];
let IDLE_READ = LOCALE === "en";
const NAMEFREE = LOCALE !== "en";
const btnLabel = (i) => (NAMEFREE ? `button:#${i}` : `button:${IDLE[i]}`);
const emailBox = (root) => (LOCALE === "en" ? root.getByRole("textbox", { name: "Email for restock news", exact: true }) : root.getByRole("textbox"));
const textOf = (s) => s.parts.filter((p) => p.k === "text").map((p) => p.text).join(" ");

async function open({ reduced = false, probe = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1, locale: "en-US", colorScheme: "light", reducedMotion: reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript(() => { try { localStorage.setItem("sunui-theme", "light"); } catch (e) {} });
  await ctx.addInitScript(installLib, { sel: ROOT, probe });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) consoleErrors.push("console: " + m.text().slice(0, 200)); });
  await page.goto(URL_, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector(`${ROOT} button, ${ROOT} [role="button"]`, { timeout: 15000 });
  await sleep(600);
  if (!IDLE_READ) {
    const fn = await page.evaluate(() => window.__L.firstNames);
    if (!fn || fn.length < 3 || fn.some((t) => !t)) throw new Error("harness: idle labels not readable from the first render");
    IDLE = fn.slice(0, 3); IDLE_READ = true;
  }
  const root = page.locator(ROOT).first();
  const pressEmpty = async () => {
    let b = await root.getByText(/fails on purpose/).first().boundingBox({ timeout: 2000 }).catch(() => null);
    if (!b) { const rb = await root.boundingBox(); b = { x: rb.x, y: rb.y, width: 8, height: 8 }; }
    await page.mouse.click(b.x + 4, b.y + b.height / 2);
  };
  await pressEmpty();
  const read = () => page.evaluate(() => window.__L.snapAll().map((s) => s.busy + "/" + s.parts.map((p) => p.text).join(" ")).join(","));
  const want = IDLE.map((t) => "null/" + t).join(",");
  let rest = false;
  for (let k = 0; k < 14 && !rest; k++) {
    await sleep(500);
    const a = await read(); await sleep(2600); const b = await read();
    if (a === b && a === want) rest = true;
    else if (k % 3 === 2) { await page.reload({ waitUntil: "networkidle" }); await sleep(600); await pressEmpty(); }
  }
  if (!rest) throw new Error("harness: demo never came to rest");
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.mouse.move(5, 5);
  return { ctx, page, root };
}

const rectOf = (page, i) => page.evaluate((i) => window.__L.rect(i), i);
async function clickBtn(page, i, hold = 40) {
  const r = await rectOf(page, i);
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
  await page.mouse.down(); await sleep(hold); await page.mouse.up();
}
async function holdBtn(page, i, hold) { // press, hold, then release away from the button (no click)
  const r = await rectOf(page, i);
  const x = r.x + r.w / 2, y = r.y + r.h / 2;
  await page.mouse.move(x, y); await page.mouse.down(); await sleep(hold);
  await page.mouse.move(x, y + 250, { steps: 3 }); await page.mouse.up();
}
const startRec = async (page, i) => { await page.evaluate((i) => window.__L.start(i), i); await sleep(60); };
const stopRec = (page) => page.evaluate(() => window.__L.stop());

function series(rec, idx, type = "click", nth = 0) {
  const ev = rec.events.filter((e) => e.btn === idx && e.type === type);
  if (!ev[nth]) throw new Error(`no ${type} event #${nth} on button ${idx}`);
  const t0 = ev[nth].t;
  return { t0, S: rec.samples.map((x) => ({ t: x.t - t0, ...x.b })), ev: ev.map((e) => e.t - t0), all: rec.events.map((e) => ({ ...e, t: e.t - t0 })) };
}
const keyOf = (p) => (p.k === "text" ? p.text : p.k);
const partsOf = (s, key) => s.parts.filter((p) => keyOf(p) === key);
const firstFrame = (S, pred, from = -Infinity) => S.find((s) => s.t >= from && pred(s));
const lastBefore = (S, t) => { let r = S[0]; for (const s of S) { if (s.t <= t) r = s; else break; } return r; };
const R = (n) => Math.round(n);
// after pointerup the scale may only climb back to 1; a dip below the held value, or a first move downwards, is a wrong-way spring
function releaseOf(S, upT) {
  const after = S.filter((s) => s.t >= upT);
  if (after.length < 2) throw new Error("no frames after release");
  let ext = after[0].scale, dip = 0;
  for (const s of after) { ext = Math.max(ext, s.scale); dip = Math.max(dip, ext - s.scale); }
  const mv = after.find((s) => Math.abs(s.scale - after[0].scale) > 0.004);
  return { monotonic: dip <= 0.006, dip, firstDir: !mv ? "none" : mv.scale > after[0].scale ? "grow" : "shrink" };
}

function derive(S, idleLabel, resultLabel) {
  const load = S.find((s) => s.busy === "true");
  if (!load) throw new Error("never busy");
  const end = S.find((s) => s.t > load.t && s.busy !== "true");
  // the result is searched from the end of loading, so an outgoing result label that is still fading out after a repeat press is not mistaken for the new one
  const res = firstFrame(S, (s) => partsOf(s, resultLabel).length, end ? end.t : load.t);
  const idle = res && idleLabel ? firstFrame(S, (s) => partsOf(s, idleLabel).length, res.t + 50) : null;
  return { tLoad: load.t, tBusyEnd: end && end.t, tRes: res && res.t, tIdle: idle && idle.t, loadSteady: S.filter((s) => s.busy === "true").at(-1) };
}
function widthSeg(S, from, to, ref) {
  const seg = S.filter((s) => s.t >= from && s.t <= to);
  if (seg.length < 2) throw new Error("empty width window");
  const start = seg[0].w, end = seg.at(-1).w;
  const mv = seg.find((s) => Math.abs(s.w - start) > 0.3);
  const settle = seg.find((s, k) => seg.slice(k).every((q) => Math.abs(q.w - end) <= 0.5));
  // reversal: the furthest the width moves back against its net direction from its running extreme (a spring that starts the wrong way, or a jump that is then undone)
  const sgn = end - start >= 0 ? 1 : -1;
  let ext = seg[0].w, rev = 0;
  for (const s of seg) { ext = sgn > 0 ? Math.max(ext, s.w) : Math.min(ext, s.w); rev = Math.max(rev, sgn > 0 ? ext - s.w : s.w - ext); }
  return {
    reversal: rev, start, end, min: Math.min(...seg.map((s) => s.w)), max: Math.max(...seg.map((s) => s.w)),
    dir: !mv ? "none" : mv.w < start ? "shrink" : "grow",
    animates: seg.filter((s) => Math.abs(s.w - start) > 0.3 && Math.abs(s.w - end) > 0.3).length >= 2,
    settleMs: R(settle.t - ref),
    // spring easing: time from the trigger until the width has covered 50% and 90% of start to end (700 when it never does)
    t50: Math.abs(end - start) < 1 ? 0 : R(crossT(seg.map((s) => ({ t: s.t - ref, v: (s.w - start) / (end - start) })), (v) => v >= 0.5)),
    t90: Math.abs(end - start) < 1 ? 0 : R(crossT(seg.map((s) => ({ t: s.t - ref, v: (s.w - start) / (end - start) })), (v) => v >= 0.9)),
  };
}
// time until a curve first meets a threshold (700 when it never does): thresholds, not fixed-time samples, so a frame of phase does not matter
// the crossing time is interpolated between the frame before and the frame at the crossing, so frame rounding does not blur easing shape
function crossT(pts, pred) {
  const k = pts.findIndex((q) => pred(q.v));
  if (k < 0) return 700;
  if (k === 0) return pts[0].t;
  const a = pts[k - 1], b = pts[k];
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (pred(a.v + m * (b.v - a.v))) hi = m; else lo = m; }
  return a.t + hi * (b.t - a.t);
}
function fade(S, inKey, outKey, from, inGroup, outGroup) {
  const f0 = firstFrame(S, (s) => partsOf(s, inKey).length, from);
  if (!f0) throw new Error("incoming " + inKey + " never appeared");
  const win = S.filter((s) => s.t >= f0.t && s.t <= f0.t + 700);
  const op = (s) => Math.max(0, ...partsOf(s, inKey).map((p) => p.op));
  const dy = (s) => (partsOf(s, inKey)[0] || { dy: 0 }).dy;
  const full = win.find((s) => op(s) >= 0.98);
  const outF = S.filter((s) => s.t >= f0.t - 40 && s.t <= f0.t + 500 && partsOf(s, outKey).length);
  const outOp = (s) => Math.max(...partsOf(s, outKey).map((p) => p.op));
  const inPts = win.map((s) => ({ t: s.t - f0.t, v: op(s) }));
  const outPts = win.map((s) => ({ t: s.t - f0.t, v: partsOf(s, outKey).length ? outOp(s) : 0 }));
  const endDy = dy(full || win.at(-1));
  const slidePts = win.map((s) => ({ t: s.t - f0.t, v: Math.abs(dy(s) - endDy) }));
  // direction of the first slide larger than 0.3px: "up" when the incoming content moves up to its rest position (the original), "down" when it comes from above
  const mvF = win.find((s) => Math.abs(dy(s) - dy(win[0])) > 0.3);
  const slideDir = !mvF ? "none" : dy(mvF) < dy(win[0]) ? "up" : "down";
  const grp = inGroup || [inKey], ogrp = outGroup || [outKey];
  const dxs = [], stack = [];
  for (const s of S) {
    if (s.t < f0.t || s.t > f0.t + 300) continue;
    const ps = s.parts.filter((p) => grp.includes(keyOf(p))), os = s.parts.filter((p) => ogrp.includes(keyOf(p)));
    if (!ps.length) continue;
    const span = (q) => Math.max(...q.map((p) => p.x2)) - Math.min(...q.map((p) => p.x1));
    dxs.push(Math.abs((Math.min(...ps.map((p) => p.x1)) + Math.max(...ps.map((p) => p.x2))) / 2 - s.bcx));
    // stacking: when the outgoing content is popped out of layout both groups overlap, so their union is no wider than the wider one; side by side the union is about as wide as both together
    if (os.length) stack.push(span([...ps, ...os]) - Math.max(span(ps), span(os)));
  }
  const t50 = crossT(inPts, (v) => v >= 0.5), t90 = crossT(inPts, (v) => v >= 0.9);
  return {
    startOp: op(f0), startDy: dy(f0), endDy, dyRange: Math.max(...win.map(dy)) - Math.min(...win.map(dy)), slideDir,
    durMs: full ? R(full.t - f0.t) : 700,
    inAnimates: win.filter((s) => op(s) > 0.02 && op(s) < 0.98).length >= 2,
    outMinDy: outF.length ? Math.min(...outF.map((s) => Math.min(...partsOf(s, outKey).map((p) => p.dy)))) : 0,
    outAnimates: outF.filter((s) => outOp(s) > 0.02 && outOp(s) < 0.98).length >= 2,
    maxH: Math.max(...S.filter((s) => s.t >= f0.t - 40 && s.t <= f0.t + 500).map((s) => s.h)),
    inT50: t50, inT90: t90, inShape: shapeRatio(inPts),
    outT50: crossT(outPts, (v) => v <= 0.5), outT90: crossT(outPts, (v) => v <= 0.1),
    slideT50: crossT(slidePts, (v) => v <= 3), slideT90: crossT(slidePts, (v) => v <= 0.6),
    dxMax: dxs.length ? Math.max(...dxs) : 0, stackExtra: stack.length ? Math.max(...stack) : 0,
  };
}
// easing shape without frame phase: the animation starts somewhere between two frames, which moves both crossing times by the same amount; the start is estimated by extending the first rising segment back to zero, and the shape is the 50% crossing over the 90% crossing both counted from that start (ease-out about 0.45, linear about 0.56, ease-in-out about 0.63)
function shapeRatio(pts) {
  const t50 = crossT(pts, (v) => v >= 0.5), t90 = crossT(pts, (v) => v >= 0.9);
  const k = pts.findIndex((q) => q.v > 0.02);
  let t0 = pts[0].t;
  if (k >= 0 && k + 1 < pts.length && pts[k + 1].v > pts[k].v) {
    const a = pts[k], b = pts[k + 1];
    t0 = a.t - (a.v * (b.t - a.t)) / (b.v - a.v);
    t0 = Math.max(t0, (k > 0 ? pts[k - 1].t : a.t - 17), a.t - 17);
  }
  return t90 - t0 > 0 ? (t50 - t0) / (t90 - t0) : 1;
}
// Pay's idle to loading under the inline style: the spinner fades in and the label "Pay $68.00" stays as text, so the same text exists twice during the fade (the outgoing copy and the incoming copy)
function fadeInlineIn(S, label, from) {
  const F = fade(S, "spin", label, from, ["spin", label], ["spin", label]);
  const f0 = firstFrame(S, (s) => partsOf(s, "spin").length, from);
  const win = S.filter((s) => s.t >= f0.t - 40 && s.t <= f0.t + 500);
  const two = win.filter((s) => partsOf(s, label).length >= 2);
  // the outgoing copy is the one with the higher opacity at the first overlap frame; it is followed by its position among the matching parts
  let oi = 0, outDy = 0, outAnim = 0;
  if (two.length) {
    const ps0 = partsOf(two[0], label); oi = ps0.findIndex((p) => p.op === Math.max(...ps0.map((q) => q.op)));
    const outs = two.map((s) => partsOf(s, label)[Math.min(oi, partsOf(s, label).length - 1)]);
    outDy = Math.min(...outs.map((p) => p.dy));
    outAnim = outs.filter((p) => p.op > 0.02 && p.op < 0.98).length;
  }
  return { ...F, overlapFrames: two.length, outCopyMinDy: outDy, outCopyAnimates: outAnim >= 2 };
}
function emitFade(item, name, F) {
  add(item, `${name}.in.t50Ms`, "ms", F.inT50);
  add(item, `${name}.in.t90Ms`, "ms", F.inT90);
  // easing shape: ease-out puts the 50% crossing at about 0.42 to 0.5 of the 90% crossing, ease-in-out or linear near 0.6 or more
  add(item, `${name}.in.t50OverT90`, "ratio", F.inShape);
  add(item, `${name}.out.t50Ms`, "ms", F.outT50);
  add(item, `${name}.out.t90Ms`, "ms", F.outT90);
  add(item, `${name}.in.slideT50Ms`, "ms", F.slideT50);
  add(item, `${name}.in.slideT90Ms`, "ms", F.slideT90);
  // direction of the incoming slide: it starts about 6px below its rest position and moves up
  add(item, `${name}.in.firstDir`, "dir", F.slideDir);
  add(item, `${name}.in.startDyRel`, "px", F.startDy - F.endDy);
  // the offset of text inside its box is scale-corrected by Framer while the button grows (about 2.8px in the original, about 0 in a port that stays centred): info only; the stacking boolean below guards the popped-out outgoing content
  add(item, `${name}.in.dxFromCenterMax`, "info", F.dxMax);
  add(item, `${name}.in.stackExtra`, "info", F.stackExtra);
  add(item, `${name}.in.notStacked`, "exact", F.stackExtra < 8);
  add(item, `${name}.in.startOp`, "info", F.startOp);
  add(item, `${name}.in.startDy`, "info", F.startDy);
  add(item, `${name}.in.animates`, "exact", F.inAnimates);
  add(item, `${name}.in.durMs`, "ms", F.durMs);
  add(item, `${name}.out.minDy`, "px", F.outMinDy);
  add(item, `${name}.out.animates`, "exact", F.outAnimates);
  add(item, `${name}.maxHeight`, "px", F.maxH);
}
function emitWidth(item, name, W, opts = {}) {
  add(item, `${name}.firstDir`, "dir", W.dir);
  add(item, `${name}.animates`, "exact", W.animates);
  add(item, `${name}.monotonic`, "exact", W.reversal <= 1);
  add(item, `${name}.reversalPx`, "px", W.reversal);
  add(item, `${name}.end`, opts.endText ? "info" : "px", W.end);
  add(item, `${name}.min`, opts.endText ? "info" : "px", W.min);
  if (opts.overshoot) add(item, `${name}.overshoot`, "px", W.max - W.end);
  add(item, `${name}.settleMs`, "ms", W.settleMs);
  if (!name.startsWith("rm.")) { add(item, `${name}.t50Ms`, "ms", W.t50); add(item, `${name}.t90Ms`, "ms", W.t90); }
}
function emitCheckDraw(item, name, S, from) {
  const fr = S.filter((s) => s.t >= from && s.t <= from + 900 && s.parts.some((p) => p.k === "check"));
  if (!fr.length) throw new Error("no check icon seen");
  const fracs = fr.map((s) => s.parts.find((p) => p.k === "check").frac);
  const full = fr.find((s, k) => fracs[k] >= 0.98);
  add(item, `${name}.check.startFrac`, "info", fracs[0]);
  add(item, `${name}.check.endFrac`, "ratio", fracs.at(-1));
  add(item, `${name}.check.animates`, "exact", fracs.filter((v) => v > 0.02 && v < 0.98).length >= 2);
  add(item, `${name}.check.drawMs`, "ms", full ? R(full.t - fr[0].t) : 900);
  const fp = fr.map((s, k) => ({ t: s.t - fr[0].t, v: fracs[k] }));
  add(item, `${name}.check.t50Ms`, "ms", crossT(fp, (v) => v >= 0.5));
  add(item, `${name}.check.t90Ms`, "ms", crossT(fp, (v) => v >= 0.9));
  // easing shape of the draw (ease-out: about 0.42 to 0.5; ease-in-out or linear: 0.5 or more); not meaningful when everything appears at once under reduced motion
  if (!name.startsWith("rm.")) { const t90 = crossT(fp, (v) => v >= 0.9); add(item, `${name}.check.t50OverT90`, "ratio", t90 > 0 ? crossT(fp, (v) => v >= 0.5) / t90 : 1); }
}
// discrete signals only: the live region text and aria-busy, repeats collapsed
function collapse(S, from, to, f) {
  const out = [];
  for (const s of S) { if (s.t < from || s.t > to) continue; const v = f(s); if (out.at(-1) !== v) out.push(v); }
  return out;
}
const liveSeq = (S, from, to) => collapse(S, from, to, (s) => s.live === null ? "none" : s.live);
const busySeq = (S, from, to) => collapse(S, from, to, (s) => String(s.busy === "true"));
// radius over the expansion: only frames after loading ended
function expandRadius(S, d, endW) {
  const nb = S.filter((s) => s.t >= d.tBusyEnd && s.busy !== "true");
  if (!nb.length) throw new Error("no non-busy frames after loading");
  const growing = nb.filter((s) => s.t <= d.tBusyEnd + 800 && s.w < endW - 2);
  return { first: nb[0].rad, max: growing.length ? Math.max(...growing.map((s) => s.rad)) : nb[0].rad };
}
const rowSpanOf = async (page, root) => {
  const ib = await emailBox(root).first().boundingBox();
  const sb = await rectOf(page, 0);
  return sb.x + sb.w - ib.x;
};

// ---------------- scenario helpers shared by normal and reduced motion ----------------
function emitShrinkCycle(P, items, S, d, rm) {
  // shrink then expand for a shrink-style button (Subscribe or Apply code)
  const sh = widthSeg(S, -30, d.tBusyEnd - 40, 0);
  const ex = widthSeg(S, d.tBusyEnd - 30, d.tBusyEnd + 1000, d.tBusyEnd);
  return { sh, ex };
}

// press Tab from before the root until focus leaves it; labels are tag:accessible name (visible text outside the live region), so the walk also finds focus stops that are not button-like (an svg path)
async function tabWalk(page) {
  // fixed start: a temporary focusable sentinel just before the root takes focus, so the first Tab always lands on the first stop inside the root whatever was clicked before
  await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    const sn = document.createElement("span");
    sn.id = "__tabSentinel"; sn.tabIndex = 0;
    sn.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;outline:none;pointer-events:none";
    root.parentNode.insertBefore(sn, root);
    sn.focus();
  }, ROOT);
  const seq = [], outlines = {};
  let started = false;
  try {
  for (let k = 0; k < 16; k++) {
    await page.keyboard.press("Tab"); await sleep(80);
    const a = await page.evaluate(([sel, nf]) => {
      const e = document.activeElement; const root = document.querySelector(sel);
      if (!e || e === document.body || e.closest("nextjs-portal,[data-nextjs-dev-tools-button]")) return { inRoot: false, body: true };
      const tag = e.tagName.toLowerCase();
      const cs = getComputedStyle(e);
      return { inRoot: root.contains(e), label: window.__L.tabLabel(e, nf), ol: { w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset), st: cs.outlineStyle } };
    }, [ROOT, NAMEFREE]);
    if (a.inRoot) { started = true; seq.push(a.label); if (a.label.startsWith("button:")) outlines[a.label] = a.ol; }
    else if (started) break;
  }
  } finally { await page.evaluate(() => { const e = document.getElementById("__tabSentinel"); if (e) e.remove(); }); }
  return { seq, outlines };
}

// outside l=en the result labels are demo copy in the page's language: press each button once and read what it shows when done
if (LOCALE !== "en") {
  await guard(["first-render", "success-subscribe", "success-sticky", "error-state"], async () => {
    const { ctx, page } = await open();
    for (const i of [0, 1, 2]) { await clickBtn(page, i); await sleep(60); }
    await sleep(2300);
    const t = await page.evaluate(() => window.__L.snapAll().map((s) => s.parts.filter((p) => p.k === "text").map((p) => p.text).join(" ")));
    if (t.some((x, i) => !x || x === IDLE[i])) throw new Error("harness: result labels not found for l=" + LOCALE + ": " + JSON.stringify(t));
    RES = t;
    await ctx.close();
  });
}

// =====================================================================================
// S1: first render, tab order, Enter in the email field
// =====================================================================================
await guard(["first-render", "tab-order", "keyboard-activate"], async () => {
  const { ctx, page, root } = await open({ probe: true });
  const first = await page.evaluate(() => {
    const L = window.__L; const all = L.snapAll();
    const r = L.btns()[0].closest("form") || document;
    return { snaps: all, mount: window.__mount, rects: all.map((_, i) => L.rect(i)) };
  });
  await guard("first-render", async () => {
    const it = "first-render";
    const names = first.snaps.map((s) => s.name);
    add(it, "first.buttonNames", "exact", names);
    add(it, "first.buttonCount", "count", first.snaps.length);
    add(it, "first.buttonTypes", "exact", first.snaps.map((s) => s.type));
    const tb = emailBox(root);
    add(it, "first.input.count", "count", await tb.count());
    const inp = await tb.first().evaluate((e) => ({ ph: e.getAttribute("placeholder"), val: e.value, h: e.getBoundingClientRect().height, type: e.getAttribute("type") }));
    add(it, "first.input.placeholder", "exact", inp.ph);
    add(it, "first.input.value", "exact", inp.val);
    add(it, "first.input.type", "exact", inp.type);
    add(it, "first.input.height", "px", inp.h);
    add(it, "first.chip.count", "count", await root.getByText("SUMMER24", { exact: true }).count());
    // the hint is demo copy: found by its text in l=en only, elsewhere as the one leaf text outside buttons and the chip that is longer than 20 characters
    add(it, "first.hint.count", "count", LOCALE === "en" ? await root.getByText("This code fails on purpose so you can see the error state.", { exact: true }).count() : await page.evaluate((sel) => [...document.querySelector(sel).querySelectorAll("*")].filter((e) => e.children.length === 0 && !e.closest("button,[role=button]") && e.tagName !== "INPUT" && e.innerText.trim().length > 20 && !e.closest("[aria-live]")).length, ROOT));
    ["subscribe", "pay", "apply"].forEach((n, i) => {
      const s = first.snaps[i];
      add(it, `first.${n}.height`, "px", s.h);
      add(it, `first.${n}.padLeft`, "px", s.padL);
      add(it, `first.${n}.padRight`, "px", s.padR);
      add(it, `first.${n}.radius`, "px", s.rad);
      add(it, `first.${n}.fontSize`, "px", s.fs);
      add(it, `first.${n}.fontWeight`, "info", s.fw);
      add(it, `first.${n}.fontWeightMedium`, "exact", +s.fw >= 500 && +s.fw < 600);
      add(it, `first.${n}.iconCount`, "count", s.parts.filter((p) => p.k !== "text").length);
      add(it, `first.${n}.busyAttr`, "exact", s.busy ?? "absent");
      add(it, `first.${n}.liveText`, "exact", s.live ?? "none");
      add(it, `first.${n}.borderWidth`, "px", s.bw);
    });
    add(it, "first.apply.bgDiffersFromSubscribe", "exact", first.snaps[2].bg !== first.snaps[0].bg);
    // widths compared with the email row span (input left edge to Subscribe right edge), never with a parent element
    const ib = await tb.first().boundingBox();
    const rowSpan = first.rects[0].x + first.rects[0].w - ib.x;
    add(it, "first.pay.widthMinusRowSpan", "px", first.snaps[1].w - rowSpan);
    add(it, "first.subscribe.notFullWidth", "exact", first.snaps[0].w < 0.5 * rowSpan);
    const mount = first.mount || [];
    // contract v2: no absolute text offsets; how far each text/icon part moves across the mount frames
    let mountTravel = null;
    if (mount.length) {
      const nLast = mount.at(-1).n, mf = mount.filter((m) => m.n === nLast && m.dys.length === nLast);
      mountTravel = Math.max(0, ...Array.from({ length: nLast }, (_, j) => Math.max(...mf.map((m) => m.dys[j])) - Math.min(...mf.map((m) => m.dys[j]))));
    }
    add(it, "first.mountTravel", "px", mountTravel);
    add(it, "first.mountFrameN", "info", mount.length);
    // a capture that is too short to see an entry animation must fail, not pass (the window starts when the buttons first exist; about 60 frames in 1000ms)
    add(it, "first.mountFrameCount", "exact", mount.length >= 20);
    add(it, "first.noEntryAnimation", "exact", mount.length >= 20 && mount.every((m) => m.op >= 0.99) && mountTravel < 0.5);
    const topRange = mount.length ? Math.max(...first.snaps.map((_, k) => { const v = mount.map((m) => m.tops[k]); return Math.max(...v) - Math.min(...v); })) : null;
    add(it, "first.noButtonMountMotion", "exact", mount.length >= 20 && mount.every((m) => m.opUp >= 0.99) && topRange <= 0.5);
    add(it, "first.mountTopRange", "info", topRange);
    add(it, "first.mountFrames", "info", { n: mount.length, minOp: mount.length ? Math.min(...mount.map((m) => m.op)) : null });
    add(it, "first.widths", "info", first.snaps.map((s) => s.w));
  });
  await guard("tab-order", async () => {
    const it = "tab-order";
    const { seq, outlines } = await tabWalk(page);
    tabOrder = seq;
    add(it, "tab.count", "count", seq.length);
    add(it, "tab.focusableInRoot", "count", await page.evaluate((sel) => [...document.querySelector(sel).querySelectorAll("*")].filter((e) => e.tabIndex >= 0 && !e.disabled).length, ROOT));
    add(it, "tab.chipTabbable", "exact", await page.evaluate((sel) => { const c = [...document.querySelector(sel).querySelectorAll("*")].find((e) => e.children.length === 0 && e.innerText.trim() === "SUMMER24"); return c ? c.tabIndex >= 0 : "missing"; }, ROOT));
    add(it, "tab.hintTabbable", "exact", await page.evaluate(([sel, en]) => { const c = [...document.querySelector(sel).querySelectorAll("*")].find((e) => e.children.length === 0 && (en ? /fails on purpose/.test(e.innerText) : !e.closest("button,[role=button]") && e.tagName !== "INPUT" && e.innerText.trim().length > 20)); return c ? c.tabIndex >= 0 : "missing"; }, [ROOT, LOCALE === "en"]));
    const o = outlines[btnLabel(0)];
    if (!o) throw new Error("Subscribe button never focused by Tab");
    add(it, "tab.focus.outlineWidth", "px", o.w);
    add(it, "tab.focus.outlineOffset", "px", o.off);
    add(it, "tab.focus.outlineStyle", "exact", o.st);
  });
  await guard("keyboard-activate", async () => {
    const it = "keyboard-activate";
    const tb = emailBox(root);
    await page.evaluate(() => { window.__marker = 12345; });
    await tb.click(); await page.keyboard.type("a@b.co");
    await startRec(page, 0);
    await page.keyboard.press("Enter"); await sleep(700);
    const rec = await stopRec(page);
    add(it, "kbd.emailEnter.noReload", "exact", (await page.evaluate(() => window.__marker)) === 12345);
    add(it, "kbd.emailEnter.subscribeEverBusy", "exact", rec.samples.some((x) => x.b.busy === "true"));
    add(it, "kbd.emailEnter.inputValue", "exact", await tb.inputValue());
    add(it, "kbd.emailEnter.subscribeText", "exact", textOf(rec.samples.at(-1).b));
  });
  await ctx.close();
});

// =====================================================================================
// S2: Subscribe by mouse (shrink, success, reset)
// =====================================================================================
await guard(["shrink-loading", "success-subscribe", "label-crossfade", "aria-busy", "live-announcements"], async () => {
  const { ctx, page } = await open();
  await startRec(page, 0);
  const idleW = (await rectOf(page, 0)).w;
  await clickBtn(page, 0);
  await sleep(600);
  const spin = await page.evaluate(() => window.__L.spinRot(0, 300));
  const workingName = LOCALE === "en" ? "Working" : await page.evaluate(() => { const b = window.__L.btns()[0]; const l = b.querySelector("[aria-live]"); return l ? l.innerText.trim() : "" });
  const accessibleOk = await page.locator(ROOT).first().getByRole("button", { name: workingName, exact: true }).count();
  await sleep(4400 - 640 - 300);
  const rec = await stopRec(page);
  const { S } = series(rec, 0);
  const d = derive(S, IDLE[0], RES[0]);
  const { sh, ex } = emitShrinkCycle("subscribe", null, S, d, false);
  await guard("shrink-loading", async () => {
    const it = "shrink-loading";
    const L = d.loadSteady;
    emitWidth(it, "subscribe.shrink", sh, { endText: false });
    add(it, "subscribe.loading.width", "px", L.w);
    add(it, "subscribe.loading.height", "px", L.h);
    add(it, "subscribe.loading.padLeft", "px", L.padL);
    add(it, "subscribe.loading.padRight", "px", L.padR);
    add(it, "subscribe.loading.radius", "px", L.rad);
    add(it, "subscribe.loading.visibleText", "exact", textOf(L));
    add(it, "subscribe.loading.spinnerCount", "count", L.parts.filter((p) => p.k === "spin").length);
    add(it, "subscribe.loading.otherIconCount", "count", L.parts.filter((p) => p.k === "check").length);
    add(it, "subscribe.loading.spinnerSize", "px", (L.parts.find((p) => p.k === "spin") || {}).w);
    add(it, "subscribe.loading.spinnerShapes", "count", (L.parts.find((p) => p.k === "spin") || {}).shapes);
    add(it, "subscribe.loading.spinnerFaintRing", "exact", (L.parts.find((p) => p.k === "spin") || {}).faint === 1);
    add(it, "subscribe.loading.spinnerSolidArc", "exact", (L.parts.find((p) => p.k === "spin") || {}).solid === 1);
    add(it, "subscribe.loading.spinnerRotates", "exact", spin.has && spin.rot);
    add(it, "subscribe.loading.spinPeriodMs", "ms", spin.periodMs);
    add(it, "subscribe.loading.bgSameAsIdle", "exact", L.bg === S[0].bg);
    // expansion: radius must not stay a pill while the width grows; only frames after loading ended
    const xr = expandRadius(S, d, ex.end);
    add(it, "subscribe.expand.radiusAtFirst", "px", xr.first);
    add(it, "subscribe.expand.maxRadius", "px", xr.max);
    add(it, "subscribe.shrink.firstRadius", "px", (S.find((s) => s.t >= 0 && s.w < idleW - 1) || S.find((s) => s.t >= 0)).rad);
  });
  await guard("success-subscribe", async () => {
    const it = "subscribe.success";
    const it2 = "success-subscribe";
    emitWidth(it2, "subscribe.expand", ex, { endText: true, overshoot: true });
    add(it2, "subscribe.busyStartMs", "ms", R(d.tLoad));
    add(it2, "subscribe.busyEndMs", "ms", R(d.tBusyEnd));
    add(it2, "subscribe.resultTextMs", "ms", R(d.tRes));
    add(it2, "subscribe.idleAfterResultMs", "ms", R(d.tIdle - d.tRes));
    const rf = lastBefore(S, d.tRes + 700);
    add(it2, "subscribe.result.text", "exact", textOf(rf));
    const chk = rf.parts.find((p) => p.k === "check"), tx = rf.parts.find((p) => p.k === "text");
    if (!chk) throw new Error("no check icon in success state");
    add(it2, "subscribe.result.checkSize", "px", chk.w);
    add(it2, "subscribe.result.gap", "px", tx.x1 - chk.x2);
    add(it2, "subscribe.result.checkBeforeText", "exact", chk.x2 <= tx.x1);
    add(it2, "subscribe.result.height", "px", rf.h);
    emitCheckDraw(it2, "subscribe", S, d.tRes - 30);
    const endF = S.at(-1);
    const rs = widthSeg(S, d.tIdle - 30, endF.t, d.tIdle);
    emitWidth(it2, "subscribe.reset", rs, { endText: true });
    add(it2, "subscribe.reset.endMinusIdle", "px", rs.end - idleW);
    add(it2, "subscribe.idle.text", "exact", textOf(endF));
    add(it2, "subscribe.idle.widthRestored", "exact", Math.abs(endF.w - idleW) < 1.5);
    void it;
  });
  // a real mouse click must leave focus on the button through every state (keyboard use right after a click depends on it)
  await guard("keyboard-activate", async () => {
    const it = "keyboard-activate";
    add(it, "focus.subscribe.loading", "exact", d.loadSteady.focused);
    add(it, "focus.subscribe.result", "exact", lastBefore(S, d.tRes + 700).focused);
    add(it, "focus.subscribe.back", "exact", S.at(-1).focused);
  });
  await guard("label-crossfade", async () => {
    const it = "label-crossfade";
    emitFade(it, "xfade.subscribe.toLoading", fade(S, "spin", IDLE[0], -30));
    emitFade(it, "xfade.subscribe.toSuccess", fade(S, RES[0], "spin", d.tBusyEnd - 30, [RES[0], "check"]));
    emitFade(it, "xfade.subscribe.toIdle", fade(S, IDLE[0], RES[0], d.tRes + 50, null, [RES[0], "check"]));
  });
  await guard("aria-busy", async () => {
    const it = "aria-busy";
    const f = { idle: S[0], loading: d.loadSteady, result: lastBefore(S, d.tRes + 700), back: S.at(-1) };
    for (const [k, s] of Object.entries(f)) {
      add(it, `aria.subscribe.${k}.busy`, "exact", s.busy ?? "absent");
      add(it, `aria.subscribe.${k}.disabledAttr`, "exact", s.adis ?? "absent");
      add(it, `aria.subscribe.${k}.nativeDisabled`, "exact", s.dis);
    }
  });
  await guard("live-announcements", async () => {
    const it = "live-announcements";
    const f = { idle: S[0], loading: d.loadSteady, result: lastBefore(S, d.tRes + 700), back: S.at(-1) };
    for (const [k, s] of Object.entries(f)) { add(it, `live.subscribe.${k}.text`, "exact", s.live ?? "none"); add(it, `live.subscribe.${k}.visuallyHidden`, "exact", s.liveHidden ?? "none"); }
    add(it, "live.subscribe.liveAttr", "exact", d.loadSteady.liveAttr ?? "none");
    add(it, "live.subscribe.iconsHidden.loading", "exact", d.loadSteady.svgHidden);
    add(it, "live.subscribe.iconsHidden.result", "exact", lastBefore(S, d.tRes + 700).svgHidden);
    add(it, "live.subscribe.name.loading", "exact", d.loadSteady.name);
    add(it, "live.subscribe.name.role.working", "count", accessibleOk);
    add(it, "live.subscribe.name.idle", "exact", S[0].name);
  });
  await ctx.close();
});

// =====================================================================================
// S3: Pay (inline, sticky success, press again, press scale on a result)
// =====================================================================================
await guard(["inline-loading", "success-sticky", "repeat-press-result", "aria-busy", "live-announcements", "label-crossfade", "press-scale"], async () => {
  const { ctx, page } = await open();
  await startRec(page, 1);
  const idleW = (await rectOf(page, 1)).w;
  const rowSpan = await rowSpanOf(page, page.locator(ROOT).first());
  await clickBtn(page, 1);
  await sleep(300);
  const spin = await page.evaluate(() => window.__L.spinRot(1, 300));
  await sleep(2000);
  const rec = await stopRec(page);
  const { S } = series(rec, 1);
  const d = derive(S, null, RES[1]);
  await guard("inline-loading", async () => {
    const it = "inline-loading";
    const L = d.loadSteady;
    const sp = L.parts.find((p) => p.k === "spin"), tx = L.parts.find((p) => p.k === "text");
    if (!sp || !tx) throw new Error("inline loading lacks spinner or text");
    add(it, "pay.loading.widthMinusRowSpan", "px", L.w - rowSpan);
    add(it, "pay.loading.spinnerRotates", "exact", spin.has && spin.rot);
    add(it, "pay.loading.spinPeriodMs", "ms", spin.periodMs);
    add(it, "pay.loading.widthDelta", "px", L.w - idleW);
    add(it, "pay.loading.height", "px", L.h);
    add(it, "pay.loading.radius", "px", L.rad);
    add(it, "pay.loading.padLeft", "px", L.padL);
    add(it, "pay.loading.text", "exact", textOf(L));
    add(it, "pay.loading.spinnerCount", "count", L.parts.filter((p) => p.k === "spin").length);
    add(it, "pay.loading.spinnerSize", "px", sp.w);
    add(it, "pay.loading.spinnerShapes", "count", sp.shapes);
    add(it, "pay.loading.spinnerFaintRing", "exact", sp.faint === 1);
    add(it, "pay.loading.spinnerSolidArc", "exact", sp.solid === 1);
    add(it, "pay.loading.gap", "px", tx.x1 - sp.x2);
    add(it, "pay.loading.spinnerBeforeText", "exact", sp.x2 <= tx.x1);
    const w = S.filter((s) => s.t >= 0 && s.t <= d.tBusyEnd - 40);
    add(it, "pay.loading.widthRange", "px", Math.max(...w.map((s) => s.w)) - Math.min(...w.map((s) => s.w)));
  });
  await guard("success-sticky", async () => {
    const it = "success-sticky";
    add(it, "pay.busyEndMs", "ms", R(d.tBusyEnd));
    add(it, "pay.resultTextMs", "ms", R(d.tRes));
    const rf = lastBefore(S, d.tRes + 600);
    add(it, "pay.result.text", "exact", textOf(rf));
    add(it, "pay.result.hasCheck", "exact", rf.parts.some((p) => p.k === "check"));
    emitCheckDraw(it, "pay", S, d.tRes - 30);
    await page.mouse.move(5, 5);
    await sleep(4200);
    const after = await page.evaluate(() => window.__L.snapAll()[1]);
    add(it, "pay.sticky.text.after6s", "exact", textOf(after));
    add(it, "pay.sticky.busy.after6s", "exact", after.busy ?? "absent");
  });
  await guard("keyboard-activate", async () => {
    add("keyboard-activate", "focus.pay.loading", "exact", d.loadSteady.focused);
    add("keyboard-activate", "focus.pay.result", "exact", lastBefore(S, d.tRes + 600).focused);
  });
  await guard("aria-busy", async () => {
    const it = "aria-busy";
    const f = { idle: S[0], loading: d.loadSteady, result: lastBefore(S, d.tRes + 600) };
    for (const [k, s] of Object.entries(f)) {
      add(it, `aria.pay.${k}.busy`, "exact", s.busy ?? "absent");
      add(it, `aria.pay.${k}.disabledAttr`, "exact", s.adis ?? "absent");
    }
  });
  await guard("live-announcements", async () => {
    const it = "live-announcements";
    add(it, "live.pay.idle.text", "exact", S[0].live ?? "none");
    add(it, "live.pay.loading.text", "exact", d.loadSteady.live ?? "none");
    add(it, "live.pay.result.text", "exact", lastBefore(S, d.tRes + 600).live ?? "none");
    add(it, "live.pay.idle.visuallyHidden", "exact", S[0].liveHidden ?? "none");
    add(it, "live.pay.loading.visuallyHidden", "exact", d.loadSteady.liveHidden ?? "none");
    add(it, "live.pay.result.visuallyHidden", "exact", lastBefore(S, d.tRes + 600).liveHidden ?? "none");
    add(it, "live.pay.iconsHidden.loading", "exact", d.loadSteady.svgHidden);
    add(it, "live.pay.name.idle", "exact", S[0].name);
  });
  await guard("label-crossfade", async () => {
    emitFade("label-crossfade", "xfade.pay.toSuccess", fade(S, RES[1], IDLE[1], d.tBusyEnd - 30, [RES[1], "check"], [IDLE[1], "spin"]));
  });
  // idle to inline loading: the spinner fades in, the label stays as text but is replaced by a fresh copy, so two copies overlap while the old one slides up and out
  await guard("label-crossfade", async () => {
    const it = "label-crossfade", nm = "xfade.pay.toLoading";
    const F = fadeInlineIn(S, IDLE[1], -30);
    add(it, `${nm}.in.t50Ms`, "ms", F.inT50);
    add(it, `${nm}.in.t90Ms`, "ms", F.inT90);
    add(it, `${nm}.in.t50OverT90`, "ratio", F.inShape);
    add(it, `${nm}.in.firstDir`, "dir", F.slideDir);
    add(it, `${nm}.in.startDyRel`, "px", F.startDy - F.endDy);
    add(it, `${nm}.in.animates`, "exact", F.inAnimates);
    add(it, `${nm}.in.durMs`, "ms", F.durMs);
    add(it, `${nm}.textOverlapFrames`, "info", F.overlapFrames);
    add(it, `${nm}.textOverlaps`, "exact", F.overlapFrames >= 2);
    add(it, `${nm}.out.minDy`, "px", F.outCopyMinDy);
    add(it, `${nm}.out.animates`, "exact", F.outCopyAnimates);
    add(it, `${nm}.maxHeight`, "px", F.maxH);
  });
  // press scale on a button that shows success
  await guard("press-scale", async () => {
    await startRec(page, 1);
    await holdBtn(page, 1, 500);
    await sleep(500);
    const r2 = await stopRec(page);
    const { S: P, all: PA } = series(r2, 1, "pointerdown");
    const held = P.filter((s) => s.t >= 0 && s.t <= 500);
    add("press-scale", "press.success.scaleHeld", "ratio", Math.min(...held.map((s) => s.scale)));
    add("press-scale", "press.success.scaleAfter", "ratio", P.at(-1).scale);
    add("press-scale", "press.success.textUnchanged", "exact", textOf(P.at(-1)));
    const upE = PA.find((e) => e.type === "pointerup");
    if (!upE) throw new Error("no pointerup on success press");
    const rl = releaseOf(P, upE.t);
    add("press-scale", "press.success.releaseMonotonic", "exact", rl.monotonic);
    add("press-scale", "press.success.releaseFirstDir", "dir", rl.firstDir);
  });
  // press the result again: must start the cycle again
  await guard("repeat-press-result", async () => {
    const it = "repeat-press-result";
    await startRec(page, 1);
    await clickBtn(page, 1);
    await sleep(2600);
    const r3 = await stopRec(page);
    const { S: A } = series(r3, 1);
    const e = derive(A, null, RES[1]);
    add(it, "payAgain.busyStartMs", "ms", R(e.tLoad));
    add(it, "payAgain.busyEndMs", "ms", R(e.tBusyEnd));
    add(it, "payAgain.resultTextMs", "ms", R(e.tRes));
    add(it, "payAgain.loading.text", "exact", textOf(e.loadSteady));
    add(it, "payAgain.sequence", "exact", liveSeq(A, -20, 2500));
    add(it, "payAgain.busySequence", "exact", busySeq(A, -20, 2500));
    // Paid to loading: the check and "Paid" fade out and up, the spinner fades in
    emitFade("label-crossfade", "xfade.pay.again.toLoading", fade(A, "spin", RES[1], -30, ["spin", IDLE[1]], [RES[1], "check"]));
  });
  await ctx.close();
});

// =====================================================================================
// S4: Apply code (shrink, error, reset)
// =====================================================================================
await guard(["shrink-loading", "error-state", "label-crossfade", "aria-busy", "live-announcements"], async () => {
  const { ctx, page } = await open();
  await startRec(page, 2);
  const idleW = (await rectOf(page, 2)).w;
  await clickBtn(page, 2);
  await sleep(450);
  const spin = await page.evaluate(() => window.__L.spinRot(2, 250));
  await sleep(3900 - 490 - 250);
  const rec = await stopRec(page);
  const { S } = series(rec, 2);
  const d = derive(S, IDLE[2], RES[2]);
  const { sh, ex } = emitShrinkCycle("apply", null, S, d, false);
  await guard("shrink-loading", async () => {
    const it = "shrink-loading";
    const L = d.loadSteady;
    emitWidth(it, "apply.shrink", sh, {});
    add(it, "apply.loading.width", "px", L.w);
    add(it, "apply.loading.height", "px", L.h);
    add(it, "apply.loading.padLeft", "px", L.padL);
    add(it, "apply.loading.radius", "px", L.rad);
    add(it, "apply.loading.visibleText", "exact", textOf(L));
    add(it, "apply.loading.spinnerCount", "count", L.parts.filter((p) => p.k === "spin").length);
    add(it, "apply.loading.spinnerRotates", "exact", spin.has && spin.rot);
    add(it, "apply.loading.spinnerShapes", "count", (L.parts.find((p) => p.k === "spin") || {}).shapes);
    add(it, "apply.loading.spinnerFaintRing", "exact", (L.parts.find((p) => p.k === "spin") || {}).faint === 1);
    add(it, "apply.loading.spinnerSolidArc", "exact", (L.parts.find((p) => p.k === "spin") || {}).solid === 1);
    add(it, "apply.loading.borderWidth", "px", L.bw);
    add(it, "apply.loading.spinPeriodMs", "ms", spin.periodMs);
    add(it, "apply.loading.bgSameAsIdle", "exact", L.bg === S[0].bg);
    const xr = expandRadius(S, d, ex.end);
    add(it, "apply.expand.radiusAtFirst", "px", xr.first);
    add(it, "apply.expand.maxRadius", "px", xr.max);
  });
  await guard("error-state", async () => {
    const it = "error-state";
    emitWidth(it, "apply.expand", ex, { endText: true, overshoot: true });
    add(it, "apply.busyEndMs", "ms", R(d.tBusyEnd));
    add(it, "apply.errorTextMs", "ms", R(d.tRes));
    add(it, "apply.idleAfterErrorMs", "ms", R(d.tIdle - d.tRes));
    const ef = lastBefore(S, d.tRes + 700);
    add(it, "apply.error.text", "exact", textOf(ef));
    add(it, "apply.error.iconCount", "count", ef.parts.filter((p) => p.op > 0.5 && p.k !== "text").length);
    add(it, "apply.error.borderWidth", "px", ef.bw);
    add(it, "apply.error.radius", "px", ef.rad);
    add(it, "apply.error.height", "px", ef.h);
    add(it, "apply.error.bgChanged", "exact", ef.bg !== S[0].bg);
    add(it, "apply.error.fgChanged", "exact", ef.fg !== S[0].fg);
    const endF = S.at(-1);
    const rs = widthSeg(S, d.tIdle - 30, endF.t, d.tIdle);
    emitWidth(it, "apply.reset", rs, { endText: true });
    add(it, "apply.reset.endMinusIdle", "px", rs.end - idleW);
    add(it, "apply.idle.text", "exact", textOf(endF));
    add(it, "apply.idle.bgRestored", "exact", endF.bg === S[0].bg);
    add(it, "apply.idle.widthRestored", "exact", Math.abs(endF.w - idleW) < 1.5);
  });
  await guard("keyboard-activate", async () => {
    add("keyboard-activate", "focus.apply.loading", "exact", d.loadSteady.focused);
    add("keyboard-activate", "focus.apply.result", "exact", lastBefore(S, d.tRes + 700).focused);
  });
  await guard("label-crossfade", async () => {
    emitFade("label-crossfade", "xfade.apply.toLoading", fade(S, "spin", IDLE[2], -30));
    emitFade("label-crossfade", "xfade.apply.toError", fade(S, RES[2], "spin", d.tBusyEnd - 30, [RES[2]]));
    emitFade("label-crossfade", "xfade.apply.toIdle", fade(S, IDLE[2], RES[2], d.tRes + 50));
  });
  await guard("aria-busy", async () => {
    const it = "aria-busy";
    const f = { idle: S[0], loading: d.loadSteady, result: lastBefore(S, d.tRes + 700), back: S.at(-1) };
    for (const [k, s] of Object.entries(f)) {
      add(it, `aria.apply.${k}.busy`, "exact", s.busy ?? "absent");
      add(it, `aria.apply.${k}.disabledAttr`, "exact", s.adis ?? "absent");
    }
  });
  await guard("live-announcements", async () => {
    const it = "live-announcements";
    add(it, "live.apply.idle.text", "exact", S[0].live ?? "none");
    add(it, "live.apply.loading.text", "exact", d.loadSteady.live ?? "none");
    add(it, "live.apply.error.text", "exact", lastBefore(S, d.tRes + 700).live ?? "none");
    add(it, "live.apply.back.text", "exact", S.at(-1).live ?? "none");
    for (const [k, s] of Object.entries({ idle: S[0], loading: d.loadSteady, error: lastBefore(S, d.tRes + 700), back: S.at(-1) })) add(it, `live.apply.${k}.visuallyHidden`, "exact", s.liveHidden ?? "none");
    add(it, "live.apply.iconsHidden.loading", "exact", d.loadSteady.svgHidden);
    add(it, "live.apply.name.loading", "exact", d.loadSteady.name);
    add(it, "live.apply.name.idle", "exact", S[0].name);
  });
  await ctx.close();
});

// =====================================================================================
// S4b: Apply code pressed again while showing the error, plus press scale on an error
// =====================================================================================
await guard(["repeat-press-result", "press-scale"], async () => {
  const { ctx, page } = await open();
  await startRec(page, 2);
  await clickBtn(page, 2);
  await sleep(1400);
  await holdBtn(page, 2, 450); // press on the error button, release elsewhere (no click)
  await sleep(250);
  await clickBtn(page, 2); // second click, ~2100ms after the first: still inside the 2000ms error window
  await sleep(3600);
  const rec = await stopRec(page);
  const first = series(rec, 2, "click", 0), second = series(rec, 2, "click", 1);
  await guard("press-scale", async () => {
    const down = rec.events.find((e) => e.type === "pointerdown" && e.btn === 2 && e.t - first.t0 > 1300);
    if (!down) throw new Error("no pointerdown on error state");
    const win = first.S.filter((s) => s.t >= down.t - first.t0 && s.t <= down.t - first.t0 + 420);
    add("press-scale", "press.error.scaleHeld", "ratio", Math.min(...win.map((s) => s.scale)));
    add("press-scale", "press.error.textDuringHold", "exact", textOf(win.at(-1)));
  });
  await guard("repeat-press-result", async () => {
    const it = "repeat-press-result";
    const S = second.S;
    const e = derive(S.filter((s) => s.t >= -20), IDLE[2], RES[2]);
    add(it, "applyAgain.firstClickWasError", "exact", textOf(lastBefore(first.S, second.t0 - first.t0 - 5)) === RES[2]);
    add(it, "applyAgain.busyStartMs", "ms", R(e.tLoad));
    add(it, "applyAgain.busyEndMs", "ms", R(e.tBusyEnd));
    add(it, "applyAgain.sequence", "exact", liveSeq(S, -30, 3400));
    add(it, "applyAgain.busySequence", "exact", busySeq(S, -30, 3400));
    const nb = S.find((s) => s.t > e.tLoad && s.busy !== "true");
    add(it, "applyAgain.firstNonBusyLive", "exact", nb ? (nb.live ?? "none") : "no non-busy frame");
    add(it, "applyAgain.busyDurationOk", "exact", e.tBusyEnd >= 950 && e.tBusyEnd <= 1100);
    add(it, "applyAgain.idleAfterErrorMs", "ms", R(e.tIdle - e.tRes));
    emitFade("label-crossfade", "xfade.apply.again.toLoading", fade(S, "spin", RES[2], -30));
    add(it, "applyAgain.neverIdleWhileLoading", "exact", !S.some((s) => s.t > 0 && s.t < e.tBusyEnd && s.busy !== "true" && textOf(s) === IDLE[2]));
  });
  await ctx.close();
});

// =====================================================================================
// S5: press scale on idle, ignored presses while loading
// =====================================================================================
await guard(["press-scale", "repeat-press-loading", "aria-busy"], async () => {
  const { ctx, page } = await open();
  await guard("press-scale", async () => {
    const it = "press-scale";
    await startRec(page, 1);
    await holdBtn(page, 1, 500);
    await sleep(600);
    const rec = await stopRec(page);
    const { S, all, t0 } = series(rec, 1, "pointerdown");
    const up = all.find((e) => e.type === "pointerup");
    const held = S.filter((s) => s.t >= 0 && s.t <= 500);
    const min = Math.min(...held.map((s) => s.scale));
    const mv = held.find((s) => Math.abs(s.scale - 1) > 0.01);
    add(it, "press.idle.scaleHeld", "ratio", min);
    add(it, "press.idle.firstDir", "dir", !mv ? "none" : mv.scale < 1 ? "shrink" : "grow");
    add(it, "press.idle.animates", "exact", held.filter((s) => Math.abs(s.scale - 1) > 0.01 && Math.abs(s.scale - min) > 0.01).length >= 1);
    const downSettle = held.find((s, k) => held.slice(k).every((q) => Math.abs(q.scale - min) <= 0.01));
    add(it, "press.idle.downSettleMs", "ms", R(downSettle.t));
    add(it, "press.idle.downT50Ms", "ms", R(Math.abs(1 - min) < 0.01 ? 0 : crossT(held.map((s) => ({ t: s.t, v: (1 - s.scale) / (1 - min) })), (v) => v >= 0.5)));
    const after = S.filter((s) => s.t >= (up ? up.t : 500));
    const upSettle = after.find((s, k) => after.slice(k).every((q) => Math.abs(q.scale - 1) <= 0.01));
    add(it, "press.idle.releaseSettleMs", "ms", upSettle ? R(upSettle.t - (up ? up.t : 500)) : 600);
    add(it, "press.idle.scaleAfter", "ratio", S.at(-1).scale);
    if (!up) throw new Error("no pointerup on idle press");
    const rl = releaseOf(S, up.t);
    add(it, "press.idle.releaseMonotonic", "exact", rl.monotonic);
    add(it, "press.idle.releaseFirstDir", "dir", rl.firstDir);
    add(it, "press.idle.stillIdle", "exact", textOf(S.at(-1)));
    void t0;
  });
  await guard(["repeat-press-loading", "press-scale", "aria-busy"], async () => {
    await page.mouse.move(5, 5); await sleep(300);
    await startRec(page, 0);
    await clickBtn(page, 0); // click 1 starts the action
    const tStart = Date.now();
    const at = (ms) => sleep(Math.max(0, ms - (Date.now() - tStart)));
    await at(250);
    await clickBtn(page, 0, 40);
    await at(450);
    await holdBtn(page, 0, 300); // press while loading: must not scale; no click on release
    await at(900);
    await clickBtn(page, 0, 40);
    await at(1000);
    await page.keyboard.press("Enter");
    await at(1080);
    await page.keyboard.press("Space");
    await at(1160);
    const mid = await page.evaluate(() => { const b = window.__L.btns()[0]; return { dis: b.disabled === true, tab: b.tabIndex, focused: document.activeElement === b }; });
    await at(3800);
    const rec = await stopRec(page);
    const { S, ev, all } = series(rec, 0, "click", 0);
    const d = derive(S, IDLE[0], RES[0]);
    await guard("repeat-press-loading", async () => {
      const it = "repeat-press-loading";
      add(it, "repeat.loading.busyEndMs", "ms", R(d.tBusyEnd));
      add(it, "repeat.loading.resultTextMs", "ms", R(d.tRes));
      let n = 0, prev = false;
      for (const s of S) { const has = partsOf(s, RES[0]).length > 0; if (has && !prev) n++; prev = has; }
      add(it, "repeat.loading.resultCount", "count", n);
      add(it, "repeat.loading.idleAfterResultMs", "ms", R(d.tIdle - d.tRes));
      add(it, "repeat.loading.clickEvents", "info", ev.map(R));
      add(it, "repeat.loading.nativelyDisabled", "exact", mid.dis);
      add(it, "repeat.loading.focusable", "exact", mid.tab >= 0);
      add(it, "repeat.loading.sequence", "exact", liveSeq(S, -20, 3700));
      add(it, "repeat.loading.busySequence", "exact", busySeq(S, -20, 3700));
      add(it, "repeat.loading.clickCount", "count", ev.length);
      add(it, "repeat.loading.focusedDuringLoad", "exact", mid.focused);
    });
    await guard("press-scale", async () => {
      const dn = all.find((e) => e.type === "pointerdown" && e.btn === 0 && e.t > 400 && e.t < 700);
      if (!dn) throw new Error("no pointerdown on loading button");
      const win = S.filter((s) => s.t >= dn.t && s.t <= dn.t + 280 && s.busy === "true");
      if (!win.length) throw new Error("no loading frames during press");
      add("press-scale", "press.loading.scaleMin", "ratio", Math.min(...win.map((s) => s.scale)));
      add("press-scale", "press.loading.stillBusy", "exact", win.at(-1).busy === "true");
    });
    await guard("aria-busy", async () => {
      add("aria-busy", "aria.repeat.busyWhilePressed", "exact", S.filter((s) => s.t > 100 && s.t < 1300).every((s) => s.busy === "true" && s.adis === "true"));
    });
  });
  await ctx.close();
});

// =====================================================================================
// S6: keyboard activation
// =====================================================================================
await guard("keyboard-activate", async () => {
  const it = "keyboard-activate";
  const { ctx, page, root } = await open();
  const activeName = () => page.evaluate((nf) => { const e = document.activeElement; return e && e !== document.body ? window.__L.tabLabel(e, nf) : "body"; }, NAMEFREE);
  const tb = emailBox(root);
  await tb.focus();
  await page.keyboard.press("Tab");
  add(it, "kbd.tab.afterInput", "exact", await activeName());
  const one = async (name, idx, press, ms, resultLabel) => {
    await guard(it, async () => {
      await startRec(page, idx);
      await press();
      await sleep(ms);
      const rec = await stopRec(page);
      const { S, ev } = series(rec, idx, "click");
      const d = derive(S, null, resultLabel);
      add(it, `kbd.${name}.busy`, "exact", S.some((s) => s.t > 0 && s.t < 400 && s.busy === "true"));
      add(it, `kbd.${name}.ariaDisabled`, "exact", d.loadSteady.adis ?? "absent");
      add(it, `kbd.${name}.busyEndMs`, "ms", R(d.tBusyEnd));
      add(it, `kbd.${name}.resultText`, "exact", textOf(lastBefore(S, d.tBusyEnd + 600)));
      add(it, `kbd.${name}.clickCount`, "count", ev.length);
      add(it, `kbd.${name}.scaleAtEnd`, "info", S.at(-1).scale);
    });
  };
  await one("enter.subscribe", 0, () => page.keyboard.press("Enter"), 3700, RES[0]);
  await one("space.subscribe", 0, () => page.keyboard.press("Space"), 3700, RES[0]);
  await page.keyboard.press("Tab");
  add(it, "kbd.tab.afterSubscribe", "exact", await activeName());
  await one("enter.pay", 1, () => page.keyboard.press("Enter"), 2400, RES[1]);
  await page.keyboard.press("Tab");
  add(it, "kbd.tab.afterPay", "exact", await activeName());
  // Enter on whatever Tab reached must run Apply code (an extra focus stop sends it to Pay again)
  await guard(it, async () => {
    await startRec(page, 2);
    await page.keyboard.press("Enter"); await sleep(400);
    const rec = await stopRec(page);
    const c = rec.events.find((e) => e.type === "click");
    add(it, "kbd.tabEnter.clickedButton", "exact", c ? c.btn : -1);
    add(it, "kbd.tabEnter.applyBusy", "exact", rec.samples.some((x) => x.b.busy === "true"));
  });
  await sleep(3400); // let any cycle finish, then focus Apply code directly so its own flow is still measured
  await page.evaluate(() => window.__L.btns()[2].focus());
  await one("enter.apply", 2, () => page.keyboard.press("Enter"), 1800, RES[2]);
  await ctx.close();
});

// =====================================================================================
// S6b: keyboard after a mouse click (focus must still be on the button)
// =====================================================================================
await guard("keyboard-activate", async () => {
  const it = "keyboard-activate";
  const { ctx, page } = await open();
  await clickBtn(page, 0);
  await sleep(3900); // full cycle: loading 1400ms, success 2000ms, back to idle
  await startRec(page, 0);
  await page.keyboard.press("Space");
  await sleep(1700);
  const rec = await stopRec(page);
  add(it, "kbd.afterMouse.space.busy", "exact", rec.samples.some((x) => x.b.busy === "true"));
  add(it, "kbd.afterMouse.space.clickCount", "count", rec.events.filter((e) => e.type === "click").length);
  add(it, "kbd.afterMouse.space.resultText", "exact", textOf(rec.samples.at(-1).b));
  await ctx.close();
});

// =====================================================================================
// S8: real Tab walk while a success label is showing (no extra stop on the check icon)
// =====================================================================================
await guard("tab-order", async () => {
  const it = "tab-order";
  const { ctx, page } = await open();
  // Tab walks while a spinner is on screen (Pay loads for 1800ms, Subscribe for 1400ms): spinners and their motion elements must not take focus
  const tPay = Date.now();
  await clickBtn(page, 1);
  await sleep(300);
  add(it, "tab.loading.pay.order", "exact", (await tabWalk(page)).seq);
  add(it, "tab.loading.pay.walkedInWindow", "exact", Date.now() - tPay < 1700);
  await sleep(Math.max(0, 2300 - (Date.now() - tPay))); // Pay: sticky "Paid"
  add(it, "tab.success.pay.order", "exact", (await tabWalk(page)).seq);
  const tSub = Date.now();
  await clickBtn(page, 0);
  await sleep(300);
  add(it, "tab.loading.subscribe.order", "exact", (await tabWalk(page)).seq);
  add(it, "tab.loading.subscribe.walkedInWindow", "exact", Date.now() - tSub < 1300);
  await sleep(Math.max(0, 1700 - (Date.now() - tSub))); // Subscribe: success shows from 1400ms to 3400ms
  add(it, "tab.success.subscribe.order", "exact", (await tabWalk(page)).seq);
  await ctx.close();
});

// =====================================================================================
// S7: reduced motion
// =====================================================================================
await guard("reduced-motion", async () => {
  const it = "reduced-motion";
  const { ctx, page } = await open({ reduced: true });
  add(it, "rm.mediaMatches", "exact", await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches));
  // press on idle
  await guard(it, async () => {
    await startRec(page, 1);
    await holdBtn(page, 1, 450);
    await sleep(300);
    const rec = await stopRec(page);
    const { S } = series(rec, 1, "pointerdown");
    add(it, "rm.press.scaleMin", "ratio", Math.min(...S.map((s) => s.scale)));
  });
  // Subscribe
  await guard(it, async () => {
    await page.mouse.move(5, 5);
    await startRec(page, 0);
    await clickBtn(page, 0);
    await sleep(500);
    const spin = await page.evaluate(() => window.__L.spinRot(0, 300));
    await sleep(3900 - 800);
    const rec = await stopRec(page);
    const { S } = series(rec, 0);
    const d = derive(S, IDLE[0], RES[0]);
    const { sh, ex } = emitShrinkCycle("rm.subscribe", null, S, d, true);
    emitWidth(it, "rm.subscribe.shrink", sh, {});
    emitWidth(it, "rm.subscribe.expand", ex, { endText: true });
    add(it, "rm.subscribe.loading.width", "px", d.loadSteady.w);
    add(it, "rm.subscribe.spinnerRotates", "exact", spin.has && spin.rot);
    add(it, "rm.subscribe.spinPeriodMs", "ms", spin.periodMs);
    add(it, "rm.subscribe.busyEndMs", "ms", R(d.tBusyEnd));
    add(it, "rm.subscribe.resultTextMs", "ms", R(d.tRes));
    add(it, "rm.subscribe.idleAfterResultMs", "ms", R(d.tIdle - d.tRes));
    add(it, "rm.subscribe.result.text", "exact", textOf(lastBefore(S, d.tRes + 600)));
    emitCheckDraw(it, "rm.subscribe", S, d.tRes - 30);
    for (const [n, F] of [["toLoading", fade(S, "spin", IDLE[0], -30)], ["toSuccess", fade(S, RES[0], "spin", d.tBusyEnd - 30, [RES[0], "check"])]]) {
      add(it, `rm.xfade.${n}.dyRange`, "px", F.dyRange);
      add(it, `rm.xfade.${n}.outMinDy`, "px", F.outMinDy);
      add(it, `rm.xfade.${n}.durMs`, "ms", F.durMs);
      add(it, `rm.xfade.${n}.animates`, "exact", F.inAnimates || F.outAnimates);
    }
  });
  // Pay
  await guard(it, async () => {
    await startRec(page, 1);
    await clickBtn(page, 1);
    await sleep(300);
    const spin = await page.evaluate(() => window.__L.spinRot(1, 300));
    await sleep(1900);
    const rec = await stopRec(page);
    const { S } = series(rec, 1);
    const d = derive(S, null, RES[1]);
    add(it, "rm.pay.spinnerRotates", "exact", spin.has && spin.rot);
    add(it, "rm.pay.spinPeriodMs", "ms", spin.periodMs);
    add(it, "rm.pay.busyEndMs", "ms", R(d.tBusyEnd));
    add(it, "rm.pay.resultTextMs", "ms", R(d.tRes));
    add(it, "rm.pay.loading.text", "exact", textOf(d.loadSteady));
    emitCheckDraw(it, "rm.pay", S, d.tRes - 30);
  });
  // Apply
  await guard(it, async () => {
    await page.mouse.move(5, 5);
    await startRec(page, 2);
    await clickBtn(page, 2);
    await sleep(3600);
    const rec = await stopRec(page);
    const { S } = series(rec, 2);
    const d = derive(S, IDLE[2], RES[2]);
    add(it, "rm.apply.busyEndMs", "ms", R(d.tBusyEnd));
    add(it, "rm.apply.errorTextMs", "ms", R(d.tRes));
    add(it, "rm.apply.idleAfterErrorMs", "ms", R(d.tIdle - d.tRes));
    add(it, "rm.apply.loading.width", "px", d.loadSteady.w);
    const F = fade(S, RES[2], "spin", d.tBusyEnd - 30);
    add(it, "rm.xfade.toError.dyRange", "px", F.dyRange);
    add(it, "rm.xfade.toError.durMs", "ms", F.durMs);
  });
  await ctx.close();
});

await browser.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ block: "loading-button", label: LABEL, url: URL_, checks, tabOrder, consoleErrors: [...new Set(consoleErrors)].slice(0, 20), errors }, null, 1));
console.log(`done ${LABEL}: ${checks.length} checks, ${errors.length} errors, tabOrder ${tabOrder.length}`);

