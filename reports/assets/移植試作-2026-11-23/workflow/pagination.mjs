import { chromium } from "playwright-core";
import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs";
import fs from "node:fs";
const V = "/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/exp/verify";
const f = findChrome(); const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const targets = [
  ["orig", "http://localhost:3100/preview/pagination?l=en", "[data-preview-stage]"],
  ["haiku", "http://localhost:3141/?only=pagination", "[data-demo]"],
  ["sonnet", "http://localhost:3142/?only=pagination", "[data-demo]"],
  ["opus", "http://localhost:3143/?only=pagination", "[data-demo]"],
];
const browser = await chromium.launch({ executablePath: exe, headless: true });
const out = {};

// state of all three navs
const dump = (page, rootSel) => page.evaluate((rootSel) => {
  const root = document.querySelector(rootSel);
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10]; };
  const navs = [...root.querySelectorAll("nav")].map((nav) => {
    const nb = nav.getBoundingClientRect();
    return {
      label: nav.getAttribute("aria-label"), w: Math.round(nb.width),
      items: [...nav.querySelectorAll("ul > li")].map((li) => {
        const c = li.firstElementChild; const el = c && /^(BUTTON|A|SPAN)$/.test(c.tagName) && c.className.includes("inline-flex") ? c : null;
        const b = (el ?? li).getBoundingClientRect();
        const cs = getComputedStyle(el ?? li);
        const o = { tag: el ? el.tagName.toLowerCase() : "li", text: (el ?? li).textContent.replace(/\s+/g, " ").trim(), x: Math.round((b.x - nb.x) * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 };
        if (el) { for (const a of ["aria-label", "aria-current", "aria-disabled", "href", "type"]) if (el.hasAttribute(a)) o[a] = el.getAttribute(a); if (el.tagName === "BUTTON") o.disabled = el.disabled; o.opacity = cs.opacity; o.pe = cs.pointerEvents; o.fw = cs.fontWeight; }
        else { for (const a of ["aria-hidden", "aria-live"]) if (li.hasAttribute(a)) o[a] = li.getAttribute(a); o.fw = cs.fontWeight; }
        const ind = li.querySelector("span.absolute"); if (ind) { const ib = ind.getBoundingClientRect(); o.ind = { x: Math.round((ib.x - b.x) * 10) / 10, yFromBottom: Math.round((b.bottom - ib.bottom) * 10) / 10, w: Math.round(ib.width * 10) / 10, h: Math.round(ib.height * 10) / 10, ariaHidden: ind.getAttribute("aria-hidden") }; }
        return o;
      }),
      indicators: nav.querySelectorAll("span.absolute").length,
    };
  });
  const ps = [...root.querySelectorAll("p")].map((p) => p.textContent.replace(/\s+/g, " ").trim());
  const a = document.activeElement;
  return { ps, navs, hash: location.hash, active: a && a !== document.body ? `${a.tagName.toLowerCase()}:${a.getAttribute("aria-label") ?? a.textContent.trim()}` : null };
}, rootSel);

// sample the indicator of nav i during a click
async function sampled(page, rootSel, navIdx, clickFn, ms = 900) {
  await page.evaluate(([rootSel, navIdx, ms]) => {
    const nav = document.querySelector(rootSel).querySelectorAll("nav")[navIdx];
    const S = (window.__s = { samples: [], click: null });
    window.addEventListener("click", () => { S.click = performance.now(); }, { capture: true, once: true });
    const t0 = performance.now();
    const tick = () => {
      const now = performance.now();
      const inds = [...nav.querySelectorAll("span.absolute")];
      const nb = nav.getBoundingClientRect();
      S.samples.push([now, inds.map((i) => { const b = i.getBoundingClientRect(); return [Math.round((b.x - nb.x) * 10) / 10, Math.round(b.width * 10) / 10, Math.round((b.y - nb.y) * 10) / 10, +getComputedStyle(i).opacity]; })]);
      if (now - t0 < ms + 400) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [rootSel, navIdx, ms]);
  await sleep(80);
  await clickFn();
  await sleep(ms);
  const S = await page.evaluate(() => window.__s);
  const rel = S.samples.filter((s) => s[0] >= S.click - 20).map((s) => [Math.round(s[0] - S.click), s[1]]);
  const xs = rel.map((s) => [s[0], s[1][0]?.[0] ?? null, s[1].length]);
  const before = S.samples.filter((s) => s[0] < S.click).at(-1)?.[1][0]?.[0];
  const end = xs.at(-1)[1];
  const dist = end - before;
  const frac = (x) => (x - before) / dist;
  const tAt = (p) => xs.find((s) => s[1] != null && frac(s[1]) >= p)?.[0] ?? null;
  const settle = (() => { let last = null; for (const s of xs) if (s[1] == null || Math.abs(s[1] - end) > 0.5) last = s[0]; return last; })();
  const maxFrac = Math.max(...xs.filter((s) => s[1] != null).map((s) => frac(s[1])));
  const intermediate = xs.filter((s) => s[1] != null && frac(s[1]) > 0.03 && frac(s[1]) < 0.97).length;
  const maxInd = Math.max(...rel.map((s) => s[1].length));
  return { before, end, dist, t10: tAt(0.1), t50: tAt(0.5), t90: tAt(0.9), settle, overshoot: Math.round((maxFrac - 1) * 1000) / 1000, intermediateFrames: intermediate, maxIndicators: maxInd, trace: xs.filter((_, i) => i % 2 === 0).slice(0, 30).map((s) => `${s[0]}:${s[1]}`).join(" ") };
}

async function run(key, url, rootSel, opts = {}) {
  const tag = opts.tag ?? "";
  const ctx = await browser.newContext({ viewport: opts.viewport ?? { width: 900, height: 620 }, deviceScaleFactor: 1, locale: "en-US", colorScheme: "light", reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript(() => { try { localStorage.setItem("sunui-theme", "light"); } catch (e) {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 300)));
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/favicon|Failed to load resource|Download the React DevTools|\[HMR\]|\[Fast Refresh\]/.test(m.text()) && errors.push(m.type() + ": " + m.text().slice(0, 300)));
  const R = { steps: {}, errors };
  let n = 0;
  const step = async (name, fn) => {
    let extra;
    try { extra = await fn(); } catch (e) { extra = { FAIL: String(e).split("\n")[0].slice(0, 200) }; }
    await sleep(120);
    const st = await dump(page, rootSel);
    R.steps[name] = { ...st, extra };
    await page.screenshot({ path: `${V}/shots/pagination-${key}${tag}-${String(n++).padStart(2, "0")}-${name}.png` });
  };
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector(rootSel + " nav", { timeout: 15000 });
    await sleep(900);
    const root = page.locator(rootSel).first();
    const nav = (i) => root.locator("nav").nth(i);
    const ctl = (i, label) => nav(i).locator(`[aria-label="${label}"]`);
    const prev = (i) => nav(i).locator("ul > li").first().locator("button, a, span.inline-flex").first();
    const next = (i) => nav(i).locator("ul > li").last().locator("button, a, span.inline-flex").first();
    const mclick = async (loc) => { const b = await loc.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.up(); };

    if (opts.mode === "narrow") {
      await step("narrow-initial", async () => page.evaluate((rootSel) => { const root = document.querySelector(rootSel); return [...root.querySelectorAll("nav")].map((nav) => { const s = nav.querySelector("li span.max-sm\\:sr-only") ?? nav.querySelector("li button span, li a span, li span span"); const b = s?.getBoundingClientRect(); return { cls: s?.className, w: b?.width, h: b?.height, pos: s && getComputedStyle(s).position, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }; }); }, rootSel));
      await step("narrow-next", async () => { await mclick(next(0)); await sleep(500); });
    } else if (opts.mode === "reduced") {
      await step("rm-initial", async () => {});
      await step("rm-main-1", async () => { await mclick(ctl(0, "Page 1")); await sleep(600); });
      await step("rm-main-4", async () => sampled(page, rootSel, 0, () => mclick(ctl(0, "Page 4"))));
      await step("rm-orders-4", async () => sampled(page, rootSel, 1, () => mclick(ctl(1, "Page 4"))));
    } else {
      await step("initial", async () => {});
      await step("hover-5", async () => { const l = ctl(0, "Page 5"); await l.hover(); await sleep(400); return l.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, cursor: getComputedStyle(el).cursor, td: getComputedStyle(el).transitionDuration, tp: getComputedStyle(el).transitionProperty.slice(0, 60) })); });
      await step("main-click-7", async () => sampled(page, rootSel, 0, () => mclick(ctl(0, "Page 7"))));
      await step("main-next-8", async () => { await mclick(next(0)); await sleep(600); });
      await step("main-prev-7", async () => { await mclick(prev(0)); await sleep(600); });
      await step("main-click-12", async () => sampled(page, rootSel, 0, () => mclick(ctl(0, "Page 12"))));
      await step("main-next-at-end", async () => { const b = await next(0).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(400); });
      await step("main-click-1", async () => sampled(page, rootSel, 0, () => mclick(ctl(0, "Page 1"))));
      await step("main-prev-at-start", async () => { const b = await prev(0).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(400); });
      await step("main-click-4", async () => sampled(page, rootSel, 0, () => mclick(ctl(0, "Page 4"))));
      await step("main-click-same-4", async () => { await mclick(ctl(0, "Page 4")); await sleep(400); });
      await step("main-click-2", async () => sampled(page, rootSel, 0, () => mclick(ctl(0, "Page 2"))));
      // keyboard: focus Page 2 was clicked; Tab to Page 3, Enter; Space on next
      await step("kbd-tab-enter", async () => { await ctl(0, "Page 2").focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); await sleep(600); });
      await step("kbd-focus-ring", async () => ctl(0, "Page 3").evaluate((el) => ({ focused: document.activeElement === el, boxShadow: getComputedStyle(el).boxShadow.slice(0, 120), outline: getComputedStyle(el).outlineStyle })));
      await step("kbd-next-space-x3", async () => { await next(0).focus(); for (let i = 0; i < 3; i++) { await page.keyboard.press("Space"); await sleep(350); } await sleep(300); });
      await step("kbd-shift-tab-prev-enter", async () => { await prev(0).focus(); await page.keyboard.press("Enter"); await sleep(600); });
      // orders (links)
      await step("orders-click-3", async () => sampled(page, rootSel, 1, () => mclick(ctl(1, "Page 3"))));
      await step("orders-next-4", async () => { await mclick(next(1)); await sleep(600); });
      await step("orders-next-at-end", async () => { const b = await next(1).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(400); });
      await step("orders-click-1", async () => sampled(page, rootSel, 1, () => mclick(ctl(1, "Page 1"))));
      await step("orders-kbd-enter-2", async () => { await ctl(1, "Page 2").focus(); await page.keyboard.press("Enter"); await sleep(600); });
      // compact
      await step("compact-next", async () => { await mclick(next(2)); await sleep(400); });
      await step("compact-prev-x3", async () => { for (let i = 0; i < 3; i++) { await mclick(prev(2)); await sleep(250); } });
      await step("compact-prev-at-start", async () => { const b = await prev(2).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(300); });
      await step("compact-next-rapid-x5", async () => { for (let i = 0; i < 5; i++) { await mclick(next(2)); await sleep(40); } await sleep(400); });
      await step("final", async () => {});
    }
  } catch (e) { R.fatal = String(e).split("\n")[0].slice(0, 300); }
  await ctx.close();
  return R;
}

for (const [key, url, rootSel] of targets) {
  out[key] = {
    main: await run(key, url, rootSel),
    reduced: await run(key, url, rootSel, { mode: "reduced", reduced: true, tag: "-rm" }),
    narrow: await run(key, url, rootSel, { mode: "narrow", viewport: { width: 420, height: 700 }, tag: "-narrow" }),
  };
}
await browser.close();
fs.writeFileSync(`${V}/pagination-results.json`, JSON.stringify(out, null, 1));

// compare against original
const strip = (st) => JSON.stringify({ ps: st.ps, hash: st.hash, active: st.active, navs: st.navs.map((n) => ({ label: n.label, indicators: n.indicators, items: n.items.map((i) => { const { x, w, h, ind, opacity, ...rest } = i; return { ...rest, opacity, h, ind: ind ? { h: ind.h, yb: ind.yFromBottom, x: ind.x, ah: ind.ariaHidden } : undefined }; }) })) });
for (const run of ["main", "reduced", "narrow"]) {
  for (const name of Object.keys(out.orig[run].steps)) {
    const o = out.orig[run].steps[name];
    const line = [];
    for (const k of ["haiku", "sonnet", "opus"]) {
      const p = out[k][run].steps[name];
      if (!p) { line.push(`${k}:MISSING`); continue; }
      line.push(`${k}:${strip(p) === strip(o) ? "=" : "DIFF"}`);
    }
    console.log(run.padEnd(8), name.padEnd(26), line.join("  "));
    if (o.extra) for (const k of ["orig", "haiku", "sonnet", "opus"]) { const e = out[k][run].steps[name]?.extra; if (e) { const { trace, ...rest } = e; console.log("   ", k.padEnd(7), JSON.stringify(rest)); } }
  }
}
for (const k of Object.keys(out)) for (const run of ["main", "reduced", "narrow"]) console.log(k, run, "fatal:", out[k][run].fatal ?? "-", "errors:", out[k][run].errors.length, out[k][run].errors.slice(0, 3));
