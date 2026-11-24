// Acceptance script for the SunUI block "loading-button". Follows pa/CONTRACT.md.
//   node loading-button.mjs --url <url> --root "<css selector>" --out <file.json> --label <name>
import { chromium } from "/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/pilot/cap/node_modules/playwright-core/index.mjs";
import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const URL_ = args.url, ROOT = args.root, OUT = args.out, LABEL = args.label || "run";
if (!URL_ || !ROOT || !OUT) { console.error("usage: --url --root --out --label"); process.exit(2); }
const f = findChrome();
const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const checks = [], errors = [], consoleErrors = [], keys = new Set();
let tabOrder = [];
function add(item, key, kind, value) {
  if (keys.has(key)) { errors.push({ item, message: "duplicate key " + key }); return; }
  if (value === undefined || value === null || (typeof value === "number" && !Number.isFinite(value))) { errors.push({ item, message: "no value for " + key }); return; }
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
        p.hidden = node.getAttribute("aria-hidden") === "true" || !!node.closest('[aria-hidden="true"]');
      }
      return p;
    };
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c === live) continue;
        if (c.nodeType === 3) { const t = c.textContent.trim(); if (t) parts.push(mk("text", t, c)); }
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
      live: live ? live.textContent.trim() : null, liveAttr: live ? live.getAttribute("aria-live") : null, name: b.getAttribute("aria-label") || b.textContent.trim(),
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
  if (probe) {
    window.__mount = [];
    const t0 = performance.now();
    const pl = () => {
      try {
        if (root() && btns().length >= 3) {
          const all = btns().map(snap);
          if (!all.some((s) => s.busy)) window.__mount.push({ t: Math.round(performance.now() - t0), opUp: Math.min(...all.map((s) => s.opUp)), tops: all.map((s) => s.top), op: Math.min(...all.flatMap((s) => s.parts.map((p) => p.op))), dy: Math.max(...all.flatMap((s) => s.parts.map((p) => Math.abs(p.dy)))), n: all.flatMap((s) => s.parts).length });
        }
      } catch (e) {}
      if (performance.now() - t0 < 1000) requestAnimationFrame(pl);
    };
    requestAnimationFrame(pl);
  }
}

const browser = await chromium.launch({ executablePath: exe, headless: true });
const IDLE = ["Subscribe", "Pay $68.00", "Apply code"];
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
  return {
    start, end, min: Math.min(...seg.map((s) => s.w)), max: Math.max(...seg.map((s) => s.w)),
    dir: !mv ? "none" : mv.w < start ? "shrink" : "grow",
    animates: seg.filter((s) => Math.abs(s.w - start) > 0.3 && Math.abs(s.w - end) > 0.3).length >= 2,
    settleMs: R(settle.t - ref),
  };
}
function interp(pts, T) {
  if (!pts.length) return 0;
  if (T <= pts[0].t) return pts[0].v;
  for (let i = 1; i < pts.length; i++) if (pts[i].t >= T) { const a = pts[i - 1], b = pts[i]; return a.v + (b.v - a.v) * ((T - a.t) / (b.t - a.t || 1)); }
  return pts.at(-1).v;
}
function fade(S, inKey, outKey, from, inGroup) {
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
  const grp = inGroup || [inKey];
  const dxs = S.filter((s) => s.t >= f0.t && s.t <= f0.t + 300).map((s) => {
    const ps = s.parts.filter((p) => grp.includes(keyOf(p)));
    if (!ps.length) return null;
    return Math.abs((Math.min(...ps.map((p) => p.x1)) + Math.max(...ps.map((p) => p.x2))) / 2 - s.bcx);
  }).filter((v) => v !== null);
  return {
    startOp: op(f0), startDy: dy(f0), endDy: dy(full || win.at(-1)),
    durMs: full ? R(full.t - f0.t) : 700,
    inAnimates: win.filter((s) => op(s) > 0.02 && op(s) < 0.98).length >= 2,
    outMinDy: outF.length ? Math.min(...outF.map((s) => Math.min(...partsOf(s, outKey).map((p) => p.dy)))) : 0,
    outAnimates: outF.filter((s) => outOp(s) > 0.02 && outOp(s) < 0.98).length >= 2,
    maxH: Math.max(...S.filter((s) => s.t >= f0.t - 40 && s.t <= f0.t + 500).map((s) => s.h)),
    inOp33: interp(inPts, 33), inOp67: interp(inPts, 67), outOp67: interp(outPts, 67),
    dxMax: dxs.length ? Math.max(...dxs) : 0,
  };
}
function emitFade(item, name, F) {
  add(item, `${name}.in.startOp`, "ratio", F.startOp);
  add(item, `${name}.in.opAt33`, "ratio", F.inOp33);
  add(item, `${name}.in.opAt67`, "ratio", F.inOp67);
  add(item, `${name}.out.opAt67`, "ratio", F.outOp67);
  add(item, `${name}.in.dxFromCenterMax`, "px", F.dxMax);
  add(item, `${name}.in.startDy`, "px", F.startDy);
  add(item, `${name}.in.endDy`, "px", F.endDy);
  add(item, `${name}.in.animates`, "exact", F.inAnimates);
  add(item, `${name}.in.durMs`, "ms", F.durMs);
  add(item, `${name}.out.minDy`, "px", F.outMinDy);
  add(item, `${name}.out.animates`, "exact", F.outAnimates);
  add(item, `${name}.maxHeight`, "px", F.maxH);
}
function emitWidth(item, name, W, opts = {}) {
  add(item, `${name}.firstDir`, "dir", W.dir);
  add(item, `${name}.animates`, "exact", W.animates);
  add(item, `${name}.end`, opts.endText ? "info" : "px", W.end);
  add(item, `${name}.min`, opts.endText ? "info" : "px", W.min);
  if (opts.overshoot) add(item, `${name}.overshoot`, "px", W.max - W.end);
  add(item, `${name}.settleMs`, "ms", W.settleMs);
}
function emitCheckDraw(item, name, S, from) {
  const fr = S.filter((s) => s.t >= from && s.t <= from + 900 && s.parts.some((p) => p.k === "check"));
  if (!fr.length) throw new Error("no check icon seen");
  const fracs = fr.map((s) => s.parts.find((p) => p.k === "check").frac);
  const full = fr.find((s, k) => fracs[k] >= 0.98);
  add(item, `${name}.check.startFrac`, "ratio", fracs[0]);
  add(item, `${name}.check.endFrac`, "ratio", fracs.at(-1));
  add(item, `${name}.check.animates`, "exact", fracs.filter((v) => v > 0.02 && v < 0.98).length >= 2);
  add(item, `${name}.check.drawMs`, "ms", full ? R(full.t - fr[0].t) : 900);
  add(item, `${name}.check.fracAt70`, "ratio", interp(fr.map((s, k) => ({ t: s.t - fr[0].t, v: fracs[k] })), 70));
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
  const ib = await root.getByRole("textbox", { name: "Email for restock news", exact: true }).first().boundingBox();
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
    const tb = root.getByRole("textbox", { name: "Email for restock news", exact: true });
    add(it, "first.input.count", "count", await tb.count());
    const inp = await tb.first().evaluate((e) => ({ ph: e.getAttribute("placeholder"), val: e.value, h: e.getBoundingClientRect().height, type: e.getAttribute("type") }));
    add(it, "first.input.placeholder", "exact", inp.ph);
    add(it, "first.input.value", "exact", inp.val);
    add(it, "first.input.type", "exact", inp.type);
    add(it, "first.input.height", "px", inp.h);
    add(it, "first.chip.count", "count", await root.getByText("SUMMER24", { exact: true }).count());
    add(it, "first.hint.count", "count", await root.getByText("This code fails on purpose so you can see the error state.", { exact: true }).count());
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
    add(it, "first.noEntryAnimation", "exact", mount.length > 0 && mount.every((m) => m.op >= 0.99 && m.dy < 0.5));
    const topRange = mount.length ? Math.max(...first.snaps.map((_, k) => { const v = mount.map((m) => m.tops[k]); return Math.max(...v) - Math.min(...v); })) : null;
    add(it, "first.noButtonMountMotion", "exact", mount.length > 0 && mount.every((m) => m.opUp >= 0.99) && topRange <= 0.5);
    add(it, "first.mountTopRange", "info", topRange);
    add(it, "first.mountFrames", "info", { n: mount.length, minOp: mount.length ? Math.min(...mount.map((m) => m.op)) : null });
    add(it, "first.widths", "info", first.snaps.map((s) => s.w));
  });
  await guard("tab-order", async () => {
    const it = "tab-order";
    await page.evaluate((sel) => {
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      const r = document.createRange(); r.setStartBefore(document.querySelector(sel)); r.collapse(true);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }, ROOT);
    const seq = [], outlines = {};
    let started = false;
    for (let k = 0; k < 16; k++) {
      await page.keyboard.press("Tab"); await sleep(80);
      const a = await page.evaluate((sel) => {
        const e = document.activeElement; const root = document.querySelector(sel);
        if (!e || e === document.body || e.closest("nextjs-portal,[data-nextjs-dev-tools-button]")) return { inRoot: false, body: true };
        const tag = e.tagName.toLowerCase();
        const live = e.querySelector && e.querySelector("[aria-live]");
        let name = e.getAttribute("aria-label");
        if (!name) { name = (e.textContent || "").trim(); if (live && !live.textContent.trim()) name = name; }
        const cs = getComputedStyle(e);
        return { inRoot: root.contains(e), label: `${tag}:${name.slice(0, 30)}`, ol: { w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset), st: cs.outlineStyle } };
      }, ROOT);
      if (a.inRoot) { started = true; seq.push(a.label); if (a.label.startsWith("button:")) outlines[a.label] = a.ol; }
      else if (started) break;
    }
    tabOrder = seq;
    add(it, "tab.count", "count", seq.length);
    add(it, "tab.focusableInRoot", "count", await page.evaluate((sel) => [...document.querySelector(sel).querySelectorAll("*")].filter((e) => e.tabIndex >= 0 && !e.disabled).length, ROOT));
    add(it, "tab.chipTabbable", "exact", await page.evaluate((sel) => { const c = [...document.querySelector(sel).querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent.trim() === "SUMMER24"); return c ? c.tabIndex >= 0 : "missing"; }, ROOT));
    add(it, "tab.hintTabbable", "exact", await page.evaluate((sel) => { const c = [...document.querySelector(sel).querySelectorAll("*")].find((e) => e.children.length === 0 && /fails on purpose/.test(e.textContent)); return c ? c.tabIndex >= 0 : "missing"; }, ROOT));
    const o = outlines["button:Subscribe"];
    if (!o) throw new Error("Subscribe never focused by Tab");
    add(it, "tab.focus.outlineWidth", "px", o.w);
    add(it, "tab.focus.outlineOffset", "px", o.off);
    add(it, "tab.focus.outlineStyle", "exact", o.st);
  });
  await guard("keyboard-activate", async () => {
    const it = "keyboard-activate";
    const tb = root.getByRole("textbox", { name: "Email for restock news", exact: true });
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
  const accessibleOk = await page.locator(ROOT).first().getByRole("button", { name: "Working", exact: true }).count();
  await sleep(4400 - 640 - 300);
  const rec = await stopRec(page);
  const { S } = series(rec, 0);
  const d = derive(S, "Subscribe", "Subscribed");
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
    add(it2, "subscribe.idle.text", "exact", textOf(endF));
    add(it2, "subscribe.idle.widthRestored", "exact", Math.abs(endF.w - idleW) < 1.5);
    void it;
  });
  await guard("label-crossfade", async () => {
    const it = "label-crossfade";
    emitFade(it, "xfade.subscribe.toLoading", fade(S, "spin", "Subscribe", -30));
    emitFade(it, "xfade.subscribe.toSuccess", fade(S, "Subscribed", "spin", d.tBusyEnd - 30, ["Subscribed", "check"]));
    emitFade(it, "xfade.subscribe.toIdle", fade(S, "Subscribe", "Subscribed", d.tRes + 50));
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
  const d = derive(S, null, "Paid");
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
    emitFade("label-crossfade", "xfade.pay.toSuccess", fade(S, "Paid", "Pay $68.00", d.tBusyEnd - 30, ["Paid", "check"]));
  });
  // press scale on a button that shows success
  await guard("press-scale", async () => {
    await startRec(page, 1);
    await holdBtn(page, 1, 500);
    await sleep(500);
    const r2 = await stopRec(page);
    const { S: P } = series(r2, 1, "pointerdown");
    const held = P.filter((s) => s.t >= 0 && s.t <= 500);
    add("press-scale", "press.success.scaleHeld", "ratio", Math.min(...held.map((s) => s.scale)));
    add("press-scale", "press.success.scaleAfter", "ratio", P.at(-1).scale);
    add("press-scale", "press.success.textUnchanged", "exact", textOf(P.at(-1)));
  });
  // press the result again: must start the cycle again
  await guard("repeat-press-result", async () => {
    const it = "repeat-press-result";
    await startRec(page, 1);
    await clickBtn(page, 1);
    await sleep(2600);
    const r3 = await stopRec(page);
    const { S: A } = series(r3, 1);
    const e = derive(A, null, "Paid");
    add(it, "payAgain.busyStartMs", "ms", R(e.tLoad));
    add(it, "payAgain.busyEndMs", "ms", R(e.tBusyEnd));
    add(it, "payAgain.resultTextMs", "ms", R(e.tRes));
    add(it, "payAgain.loading.text", "exact", textOf(e.loadSteady));
    add(it, "payAgain.sequence", "exact", liveSeq(A, -20, 2500));
    add(it, "payAgain.busySequence", "exact", busySeq(A, -20, 2500));
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
  const d = derive(S, "Apply code", "Code expired");
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
    add(it, "apply.idle.text", "exact", textOf(endF));
    add(it, "apply.idle.bgRestored", "exact", endF.bg === S[0].bg);
    add(it, "apply.idle.widthRestored", "exact", Math.abs(endF.w - idleW) < 1.5);
  });
  await guard("label-crossfade", async () => {
    emitFade("label-crossfade", "xfade.apply.toLoading", fade(S, "spin", "Apply code", -30));
    emitFade("label-crossfade", "xfade.apply.toError", fade(S, "Code expired", "spin", d.tBusyEnd - 30, ["Code expired"]));
    emitFade("label-crossfade", "xfade.apply.toIdle", fade(S, "Apply code", "Code expired", d.tRes + 50));
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
    const e = derive(S.filter((s) => s.t >= -20), "Apply code", "Code expired");
    add(it, "applyAgain.firstClickWasError", "exact", textOf(lastBefore(first.S, second.t0 - first.t0 - 5)) === "Code expired");
    add(it, "applyAgain.busyStartMs", "ms", R(e.tLoad));
    add(it, "applyAgain.busyEndMs", "ms", R(e.tBusyEnd));
    add(it, "applyAgain.sequence", "exact", liveSeq(S, -30, 3400));
    add(it, "applyAgain.busySequence", "exact", busySeq(S, -30, 3400));
    const nb = S.find((s) => s.t > e.tLoad && s.busy !== "true");
    add(it, "applyAgain.firstNonBusyLive", "exact", nb ? (nb.live ?? "none") : "no non-busy frame");
    add(it, "applyAgain.busyDurationOk", "exact", e.tBusyEnd >= 950 && e.tBusyEnd <= 1100);
    add(it, "applyAgain.idleAfterErrorMs", "ms", R(e.tIdle - e.tRes));
    add(it, "applyAgain.neverIdleWhileLoading", "exact", !S.some((s) => s.t > 0 && s.t < e.tBusyEnd && s.busy !== "true" && textOf(s) === "Apply code"));
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
    const after = S.filter((s) => s.t >= (up ? up.t : 500));
    const upSettle = after.find((s, k) => after.slice(k).every((q) => Math.abs(q.scale - 1) <= 0.01));
    add(it, "press.idle.releaseSettleMs", "ms", upSettle ? R(upSettle.t - (up ? up.t : 500)) : 600);
    add(it, "press.idle.scaleAfter", "ratio", S.at(-1).scale);
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
    const d = derive(S, "Subscribe", "Subscribed");
    await guard("repeat-press-loading", async () => {
      const it = "repeat-press-loading";
      add(it, "repeat.loading.busyEndMs", "ms", R(d.tBusyEnd));
      add(it, "repeat.loading.resultTextMs", "ms", R(d.tRes));
      let n = 0, prev = false;
      for (const s of S) { const has = partsOf(s, "Subscribed").length > 0; if (has && !prev) n++; prev = has; }
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
  const activeName = () => page.evaluate(() => { const e = document.activeElement; return e && e !== document.body ? e.tagName.toLowerCase() + ":" + (e.getAttribute("aria-label") || e.textContent.trim().slice(0, 20)) : "body"; });
  const tb = root.getByRole("textbox", { name: "Email for restock news", exact: true });
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
  await one("enter.subscribe", 0, () => page.keyboard.press("Enter"), 3700, "Subscribed");
  await one("space.subscribe", 0, () => page.keyboard.press("Space"), 3700, "Subscribed");
  await page.keyboard.press("Tab");
  add(it, "kbd.tab.afterSubscribe", "exact", await activeName());
  await one("enter.pay", 1, () => page.keyboard.press("Enter"), 2400, "Paid");
  await page.keyboard.press("Tab");
  add(it, "kbd.tab.afterPay", "exact", await activeName());
  await one("enter.apply", 2, () => page.keyboard.press("Enter"), 1800, "Code expired");
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
    const d = derive(S, "Subscribe", "Subscribed");
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
    for (const [n, F] of [["toLoading", fade(S, "spin", "Subscribe", -30)], ["toSuccess", fade(S, "Subscribed", "spin", d.tBusyEnd - 30, ["Subscribed", "check"])]]) {
      add(it, `rm.xfade.${n}.startDy`, "px", F.startDy);
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
    const d = derive(S, null, "Paid");
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
    const d = derive(S, "Apply code", "Code expired");
    add(it, "rm.apply.busyEndMs", "ms", R(d.tBusyEnd));
    add(it, "rm.apply.errorTextMs", "ms", R(d.tRes));
    add(it, "rm.apply.idleAfterErrorMs", "ms", R(d.tIdle - d.tRes));
    add(it, "rm.apply.loading.width", "px", d.loadSteady.w);
    const F = fade(S, "Code expired", "spin", d.tBusyEnd - 30);
    add(it, "rm.xfade.toError.startDy", "px", F.startDy);
    add(it, "rm.xfade.toError.durMs", "ms", F.durMs);
  });
  await ctx.close();
});

await browser.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ block: "loading-button", label: LABEL, url: URL_, checks, tabOrder, consoleErrors: [...new Set(consoleErrors)].slice(0, 20), errors }, null, 1));
console.log(`done ${LABEL}: ${checks.length} checks, ${errors.length} errors, tabOrder ${tabOrder.length}`);

