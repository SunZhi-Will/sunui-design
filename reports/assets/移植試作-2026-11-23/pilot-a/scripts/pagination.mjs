// Acceptance script for the SunUI "pagination" block. One script, any target (see CONTRACT.md, v2).
//   node pagination.mjs --url <url> --root "<css selector>" --out <file.json> --label <name>
import { chromium } from "/private/tmp/claude-501/-Applications-Projects-nextjs-sunui-design/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/cap/node_modules/playwright-core/index.mjs";
import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : undefined; };
const URL_ = arg("url");
const ROOT = arg("root");
const OUT = arg("out");
const LABEL = arg("label") ?? "run";
const PILOT = "/private/tmp/claude-501/-Applications-Projects-nextjs-sunui-design/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/pa2";
if (!URL_ || !ROOT || !OUT) { console.error("usage: --url --root --out --label"); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const errors = [];
const consoleErrors = [];
let tabOrder = [];
const keys = new Set();
function chk(item, key, kind, value) {
  if (keys.has(key)) { errors.push({ item, message: "duplicate key " + key }); return; }
  keys.add(key);
  checks.push({ item, key, kind, value });
}
async function item(id, fn) {
  try { await fn(); } catch (e) { errors.push({ item: id, message: String(e?.message ?? e).split("\n")[0].slice(0, 300) }); }
}
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

const f = findChrome();
const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0];
const browser = await chromium.launch({ executablePath: exe, headless: true });

// ---------------------------------------------------------------- in-page helpers
const initHelpers = (rootSel) => {
  const w = window;
  const cs = (e) => getComputedStyle(e);
  const bb = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  w.__root = () => document.querySelector(rootSel);
  w.__navs = () => [...w.__root().querySelectorAll("nav, [role=navigation]")];
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const insideSvg = (e) => !!e.closest("svg");
  // the underline: an aria-hidden, non-svg, thin box anywhere in the nav whose horizontal centre lies within the
  // current control's column (nested in the control, or a sibling inside the same list item: both are fine)
  w.__ul = (nav) => {
    const cur = nav.querySelector('[aria-current="page"]');
    if (!cur) return [];
    const cr = cur.getBoundingClientRect();
    return [...nav.querySelectorAll('[aria-hidden="true"]')].filter((e) => {
      if (e.tagName.toLowerCase() === "svg" || insideSvg(e) || e === cur || e.contains(cur)) return false;
      const r = e.getBoundingClientRect();
      if (!(r.height <= 6 && r.width > 4)) return false;
      const cx = r.left + r.width / 2;
      return cx >= cr.left - 0.5 && cx <= cr.right + 0.5;
    });
  };
  // while sampling the bar is followed wherever it is drawn (framer draws it inside the NEW cell and offsets it with a
  // transform, so its centre can be outside the column): any aria-hidden, non-svg, thin box in the nav
  w.__ulAny = (nav) => [...nav.querySelectorAll('[aria-hidden="true"]')].filter((e) => {
    if (e.tagName.toLowerCase() === "svg" || insideSvg(e) || e.contains(nav.querySelector('[aria-current="page"]'))) return false;
    const r = e.getBoundingClientRect();
    return r.height <= 6 && r.width > 4;
  });
  w.__lis = (nav) => [...nav.querySelectorAll("li, [role=listitem]")];
  w.__isEllipsis = (li) => norm(li.innerText) === "…" || norm(li.innerText) === "..." || li.getAttribute("aria-hidden") === "true";
  w.__ctrl = (li) => li.querySelector("a, button, [role=button], [role=link], [aria-disabled]");
  w.__row = (nav) => w.__lis(nav).map((li) => {
    if (li.matches("[aria-live]") || li.querySelector("[aria-live]")) return norm(li.innerText);
    if (w.__isEllipsis(li)) return "…";
    const c = w.__ctrl(li) ?? li;
    const t = norm(c.innerText);
    return c.getAttribute("aria-current") === "page" ? "[" + t + "]" : t;
  });
  w.__name = (e) => norm(e.getAttribute("aria-label") ?? e.innerText);
  w.__role = (e) => { const t = e.tagName.toLowerCase(); return e.getAttribute("role") ?? (t === "a" ? "link" : t === "button" ? "button" : t); };
  w.__focusDesc = () => {
    const e = document.activeElement;
    const r = w.__root();
    if (!e || e === document.body || !r || !r.contains(e)) return "OUTSIDE";
    const ni = w.__navs().findIndex((n) => n.contains(e));
    return `${ni}|${w.__role(e)}:${w.__name(e).slice(0, 30)}`;
  };
  // mountTravel: how far the underline moves inside its own cell across frames after it first appears (does not animate on first render)
  w.__mt = { first: null, min: {}, max: {}, done: false };
  const mtick = () => {
    const r = w.__root && w.__root();
    if (r && !w.__mt.done) {
      const now = performance.now();
      for (const [i, nv] of w.__navs().entries()) {
        const cur = nv.querySelector('[aria-current="page"]');
        const u = cur && w.__ul(nv)[0];
        if (!u) continue;
        if (w.__mt.first == null) w.__mt.first = now;
        if (now - w.__mt.first > 700) continue;
        const v = u.getBoundingClientRect().left - cur.getBoundingClientRect().left;
        w.__mt.min[i] = Math.min(w.__mt.min[i] ?? v, v);
        w.__mt.max[i] = Math.max(w.__mt.max[i] ?? v, v);
      }
    }
    if (!w.__mt.done) requestAnimationFrame(mtick);
  };
  requestAnimationFrame(mtick);
  w.__evT = null;
  const mark = () => { w.__evT = performance.now(); };
  document.addEventListener("click", mark, true);
  document.addEventListener("keydown", mark, true);
  document.addEventListener("keyup", mark, true);
  w.__sampleStart = (ms) => {
    w.__evT = null;
    const frames = [];
    const t0 = performance.now();
    w.__sampleDone = new Promise((res) => {
      const tick = () => {
        const now = performance.now();
        frames.push({
          t: now,
          n: w.__navs().map((nav) => {
            const cur = nav.querySelector('[aria-current="page"]');
            const us = w.__ulAny(nav);
            const r = us[0]?.getBoundingClientRect();
            return {
              cur: cur ? norm(cur.innerText) : null,
              cellL: cur ? cur.getBoundingClientRect().left : null,
              u: r ? [r.left, r.width, r.top, r.height] : null,
              count: us.length,
            };
          }),
        });
        if (now - t0 < ms) requestAnimationFrame(tick);
        else res(frames.map((fr) => ({ ...fr, t: w.__evT == null ? null : fr.t - w.__evT })));
      };
      requestAnimationFrame(tick);
    });
  };
};

// ---------------------------------------------------------------- curve reduction
function curve(frames, i = 0, others = []) {
  const withT = frames.filter((fr) => fr.t != null);
  const pre = [...withT].reverse().find((fr) => fr.t < 0) ?? frames[0];
  const post = withT.filter((fr) => fr.t >= 0 && fr.n[i].u);
  const last = post[post.length - 1] ?? frames[frames.length - 1];
  const rest = last?.n[i]?.u?.[0];
  if (rest == null) return null;
  const preLeft = pre?.n[i]?.u?.[0] ?? rest;
  const off = (fr) => fr.n[i].u[0] - rest;
  const movers = post.filter((fr) => Math.abs(off(fr)) > 0.3);
  const firstChanged = post.find((fr) => Math.abs(fr.n[i].u[0] - preLeft) > 0.3);
  const firstDir = !firstChanged ? "none" : firstChanged.n[i].u[0] < preLeft ? "left" : "right";
  const start = firstChanged ? off(firstChanged) : 0;
  const peak = post.reduce((a, fr) => (Math.abs(off(fr)) > Math.abs(a) ? off(fr) : a), 0);
  let settleMs = 0;
  for (let k = post.length - 1; k >= 0; k--) {
    if (Math.abs(off(post[k])) > 0.5) { settleMs = post[k + 1]?.t ?? post[k].t; break; }
  }
  const lo = Math.min(preLeft, rest), hi = Math.max(preLeft, rest);
  const passesBetween = hi - lo > 2 && post.some((fr) => fr.n[i].u[0] > lo + 1 && fr.n[i].u[0] < hi - 1);
  const end = rest - (last.n[i].cellL ?? rest);
  const amp = Math.abs(start);
  const crossed = (frac) => { if (!firstChanged || amp < 0.3) return 0; const fr = post.find((f2) => f2.t >= (firstChanged.t ?? 0) && Math.abs(off(f2)) <= frac * amp); return fr ? fr.t : 0; };
  const t50Ms = crossed(0.5), t90Ms = crossed(0.1);
  const otherPositions = {};
  for (const o of others) otherPositions[o] = new Set(frames.map((fr) => JSON.stringify(fr.n[o]?.u))).size;
  return {
    animates: movers.length > 1, firstDir, start, peak, end, settleMs, t50Ms, t90Ms, movingFrames: movers.length,
    from: preLeft - rest, passesBetween, otherPositions,
    maxCount: Math.max(...frames.map((fr) => fr.n[i].count)),
  };
}
// startKind "px" compares the first-frame offset, its peak and direction; "info" records them only (on a jump the
// original's first frame sits 20px beyond the old bar, a framer artefact). timing: add threshold times t50/t90.
function curveChecks(id, name, c, { withBetween = false, startKind = "px", timing = true } = {}) {
  if (!c) throw new Error(`no underline curve for ${name}`);
  chk(id, `${name}.animates`, "exact", c.animates);
  chk(id, `${name}.firstDir`, startKind === "px" ? "dir" : "info", c.firstDir);
  chk(id, `${name}.start`, startKind, +c.start.toFixed(2));
  chk(id, `${name}.peak`, startKind, +c.peak.toFixed(2));
  chk(id, `${name}.end`, "px", +c.end.toFixed(2));
  chk(id, `${name}.settleMs`, "ms", +c.settleMs.toFixed(0));
  if (timing) {
    chk(id, `${name}.t50Ms`, "ms", +c.t50Ms.toFixed(0));
    chk(id, `${name}.t90Ms`, "ms", +c.t90Ms.toFixed(0));
  }
  chk(id, `${name}.movingFrames`, "info", c.movingFrames);
  if (withBetween) chk(id, `${name}.passesBetween`, "exact", c.passesBetween);
  chk(id, `${name}.restFrom`, "info", +c.from.toFixed(2));
}

// ---------------------------------------------------------------- scenario + page helpers
function watch(page) {
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) consoleErrors.push("console: " + m.text().slice(0, 200)); });
}
async function scenario(opts, fn, url = URL_) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1, locale: "en-US", colorScheme: "light", ...opts });
  await ctx.addInitScript(() => { try { localStorage.setItem("sunui-theme", "light"); } catch (e) {} });
  await ctx.addInitScript(initHelpers, ROOT);
  const page = await ctx.newPage();
  watch(page);
  try {
    try { await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }); } catch { /* dev servers keep sockets open */ }
    await page.locator(ROOT).getByRole("navigation").first().waitFor({ timeout: 15000 });
    await sleep(700);
    await settle(page);
    return await fn(page);
  } finally { await ctx.close(); }
}
const R = (page) => page.locator(ROOT);
const nav = (page, i) => R(page).getByRole("navigation").nth(i);
const ctl = (page, i, name) => {
  const n = nav(page, i);
  return n.getByRole("button", { name, exact: true })
    .or(n.getByRole("link", { name, exact: true }))
    .or(n.locator('[aria-disabled="true"]').filter({ hasText: name })).first();
};
async function center(loc) {
  const b = await loc.boundingBox();
  if (!b) throw new Error("control not found or not visible");
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
const click = async (page, i, name, wait = 700) => { const c = await center(ctl(page, i, name)); await page.mouse.click(c.x, c.y); await sleep(wait); };
const has = async (page, i, name) => (await ctl(page, i, name).count()) > 0;
async function sampledClick(page, i, name, ms = 1100) {
  const c = await center(ctl(page, i, name));
  await page.mouse.move(c.x, c.y);
  await sleep(120);
  await page.evaluate((ms) => window.__sampleStart(ms), ms);
  await sleep(60);
  await page.mouse.click(c.x, c.y);
  return page.evaluate(() => window.__sampleDone);
}
async function sampledKey(page, key, ms = 1000) {
  await page.evaluate((ms) => window.__sampleStart(ms), ms);
  await sleep(60);
  await page.keyboard.press(key);
  return page.evaluate(() => window.__sampleDone);
}
const row = (page, i) => page.evaluate((i) => window.__row(window.__navs()[i]), i);
const hash = (page) => page.evaluate(() => location.hash);
const header = async (page) => {
  const t = await R(page).getByText(/\d+ to \d+ of \d+ items|286/).first().innerText();
  return norm(t);
};
const current = (page, i) => page.evaluate((i) => { const c = window.__navs()[i].querySelector('[aria-current="page"]'); return c ? window.__name(c) : null; }, i);
const active = (page) => page.evaluate(() => window.__focusDesc());
const info = (page, i, name) => ctl(page, i, name).evaluate((el) => {
  const cs = getComputedStyle(el);
  return {
    tag: el.tagName.toLowerCase(), role: el.getAttribute("role"), href: el.getAttribute("href"), hasHref: el.hasAttribute("href"),
    disabled: el.disabled === true || el.hasAttribute("disabled"), ariaDisabled: el.getAttribute("aria-disabled"), tabindex: el.getAttribute("tabindex"),
    current: el.getAttribute("aria-current"), opacity: parseFloat(cs.opacity), weight: parseInt(cs.fontWeight, 10), pe: cs.pointerEvents, bg: cs.backgroundColor,
    isControl: el.tagName.toLowerCase() === "a" || el.tagName.toLowerCase() === "button",
  };
});
const isDisabled = (o) => o.disabled || o.ariaDisabled === "true";
async function settle(page) {
  // a real pointer press on an empty spot (the first card's title text) stops any autoplay
  const t = R(page).getByText("Home and living", { exact: true }).first();
  let c;
  try { c = await center(t); } catch { const b = await R(page).boundingBox(); c = { x: b.x + 6, y: b.y + 6 }; }
  await page.mouse.move(c.x, c.y);
  await page.mouse.down(); await page.mouse.up();
  await sleep(500);
  let prev = "";
  for (let k = 0; k < 12; k++) {
    const sig = JSON.stringify(await page.evaluate(() => window.__navs().map((n) => [window.__row(n), (window.__ulAny(n)[0]?.getBoundingClientRect().left ?? null)])));
    if (sig === prev) break;
    prev = sig;
    await sleep(350);
  }
}
async function goTo(page, n, i = 0) {
  for (let k = 0; k < 20; k++) {
    if (await has(page, i, `Page ${n}`)) { await click(page, i, `Page ${n}`, 650); return; }
    const cur = parseInt(norm(await page.evaluate((i) => window.__navs()[i].querySelector('[aria-current="page"]')?.innerText, i)), 10);
    await click(page, i, n > cur ? "Next" : "Previous", 450);
  }
  throw new Error(`cannot reach page ${n}`);
}
const pageNames = (page, i) => page.evaluate((i) => [...window.__navs()[i].querySelectorAll("a[aria-label], button[aria-label], a, button, [role=button], [role=link]")].map((e) => window.__name(e)), i);

// ---------------------------------------------------------------- items
await item("first-render-main", () => scenario({}, async (page) => {
  const id = "first-render-main";
  chk(id, "main.header", "exact", await header(page));
  const r = await row(page, 0);
  chk(id, "main.row", "exact", r);
  chk(id, "main.slots", "count", r.length - 2);
  const prev = await info(page, 0, "Previous"), next = await info(page, 0, "Next");
  chk(id, "main.prevEnabled", "exact", !isDisabled(prev));
  chk(id, "main.nextEnabled", "exact", !isDisabled(next));
  chk(id, "main.prevOpacity", "ratio", prev.opacity);
  const cur = await info(page, 0, "Page 6"), other = await info(page, 0, "Page 5");
  chk(id, "main.currentAria", "exact", cur.current);
  chk(id, "main.currentBolder", "exact", cur.weight > other.weight);
  chk(id, "main.currentWeight", "info", cur.weight);
  const ul = await page.evaluate(() => {
    const n = window.__navs()[0]; const cur = n.querySelector('[aria-current="page"]'); const us = window.__ul(n);
    const u = us[0]; if (!u) return { count: 0 };
    const r = u.getBoundingClientRect(), c = cur.getBoundingClientRect(), s = getComputedStyle(u);
    return { count: us.length, h: r.height, insetL: r.left - c.left, insetR: c.right - r.right, insetB: c.bottom - r.bottom, radius: parseFloat(s.borderTopLeftRadius) || 0, hidden: u.getAttribute("aria-hidden") };
  });
  chk(id, "main.underline.count", "count", ul.count);
  chk(id, "main.underline.height", "px", ul.h);
  chk(id, "main.underline.insetLeft", "px", ul.insetL);
  chk(id, "main.underline.insetRight", "px", ul.insetR);
  chk(id, "main.underline.insetBottom", "px", ul.insetB);
  chk(id, "main.underline.rounded", "exact", ul.radius >= 1);
  chk(id, "main.underline.ariaHidden", "exact", ul.hidden);
  const others = await page.evaluate(() => window.__navs().map((n) => window.__ul(n).length));
  chk(id, "main.underline.perInstance", "exact", others);
  const mt = await page.evaluate(() => { window.__mt.done = true; return Object.keys(window.__mt.max).map((i) => window.__mt.max[i] - window.__mt.min[i]); });
  chk(id, "main.underline.mountTravel", "px", Math.max(0, ...mt));
  chk(id, "main.underline.mountTravelInstances", "count", mt.length);
  await page.screenshot({ path: `${PILOT}/shots/pagination-${LABEL}-00-initial.png` }).catch(() => {});
}));

await item("first-render-secondary", () => scenario({}, async (page) => {
  const id = "secondary";
  const id1 = "first-render-secondary";
  const r1 = await row(page, 1), r2 = await row(page, 2);
  chk(id1, "orders.row", "exact", r1);
  chk(id1, "orders.ellipsisCount", "count", r1.filter((t) => t === "…").length);
  const p = await info(page, 1, "Previous");
  chk(id1, "orders.prevDisabled", "exact", isDisabled(p));
  chk(id1, "orders.prevOpacity", "ratio", p.opacity);
  chk(id1, "orders.currentLabel", "exact", await current(page, 1));
  chk(id1, "reviews.row", "exact", r2);
  chk(id1, "reviews.text", "exact", norm(await nav(page, 2).innerText()));
  chk(id1, "reviews.pageButtons", "count", await nav(page, 2).locator('[aria-label^="Page"]').count());
  const a = await info(page, 2, "Previous"), b = await info(page, 2, "Next");
  chk(id1, "reviews.bothEnabled", "exact", !isDisabled(a) && !isDisabled(b));
  void id;
}));

await item("range-fixed-length", () => scenario({}, async (page) => {
  const id = "range-fixed-length";
  for (const n of [1, 4, 5, 9, 12]) {
    await goTo(page, n);
    const r = await row(page, 0);
    chk(id, `range.page${n}.row`, "exact", r);
    chk(id, `range.page${n}.slots`, "count", r.length - 2);
  }
  const o = await row(page, 1);
  chk(id, "range.orders.slots", "count", o.length - 2);
  chk(id, "range.orders.noEllipsis", "exact", !o.includes("…"));
}));

await item("select-page", () => scenario({}, async (page) => {
  const id = "select-page";
  await click(page, 0, "Page 7");
  chk(id, "select7.current", "exact", await current(page, 0));
  chk(id, "select7.row", "exact", await row(page, 0));
  chk(id, "select7.header", "exact", await header(page));
  chk(id, "select7.bolder", "exact", (await info(page, 0, "Page 7")).weight > (await info(page, 0, "Page 8")).weight);
}));

await item("prev-next", () => scenario({}, async (page) => {
  const id = "prev-next";
  const seq = [];
  await click(page, 0, "Next"); seq.push(await current(page, 0));
  await click(page, 0, "Previous"); seq.push(await current(page, 0));
  await click(page, 0, "Previous"); seq.push(await current(page, 0));
  chk(id, "prevnext.sequence", "exact", seq);
  chk(id, "prevnext.header", "exact", await header(page));
  chk(id, "prevnext.row", "exact", await row(page, 0));
}));

await item("range-text-ends", () => scenario({}, async (page) => {
  const id = "range-text-ends";
  await goTo(page, 1); chk(id, "ends.page1.header", "exact", await header(page));
  await goTo(page, 12); chk(id, "ends.page12.header", "exact", await header(page));
}));

await item("limits-disabled", async () => {
  const id = "limits-disabled";
  await scenario({}, async (page) => {
    for (const [n, name, tag] of [[1, "Previous", "first"], [12, "Next", "last"]]) {
      await goTo(page, n);
      await page.mouse.move(0, 0);
      const before = await info(page, 0, name);
      const c = await center(ctl(page, 0, name));
      await page.mouse.move(c.x, c.y); await sleep(250);
      const hov = await info(page, 0, name);
      for (let k = 0; k < 4; k++) { await page.mouse.click(c.x, c.y); await sleep(120); }
      await sleep(300);
      chk(id, `limits.${tag}.disabled`, "exact", isDisabled(before));
      chk(id, `limits.${tag}.opacity`, "ratio", before.opacity);
      chk(id, `limits.${tag}.noHoverBg`, "exact", before.bg === hov.bg);
      chk(id, `limits.${tag}.pageAfterPresses`, "exact", await current(page, 0));
      const tabbable = await ctl(page, 0, name).evaluate((el) => el.tagName.toLowerCase() === "button" ? !el.disabled : el.tabIndex >= 0 && el.hasAttribute("href"));
      chk(id, `limits.${tag}.focusable`, "exact", tabbable);
    }
  });
  await scenario({}, async (page) => {
    for (let k = 0; k < 4; k++) await click(page, 2, "Previous", 120);
    await sleep(250);
    chk(id, "limits.compact.first.text", "exact", norm(await nav(page, 2).locator("[aria-live]").first().innerText()));
    chk(id, "limits.compact.first.prevDisabled", "exact", isDisabled(await info(page, 2, "Previous")));
    chk(id, "limits.compact.first.nextEnabled", "exact", !isDisabled(await info(page, 2, "Next")));
    for (let k = 0; k < 40; k++) await click(page, 2, "Next", 50);
    await sleep(300);
    chk(id, "limits.compact.last.text", "exact", norm(await nav(page, 2).locator("[aria-live]").first().innerText()));
    chk(id, "limits.compact.last.nextDisabled", "exact", isDisabled(await info(page, 2, "Next")));
    chk(id, "limits.compact.last.prevEnabled", "exact", !isDisabled(await info(page, 2, "Previous")));
  });
});

await item("current-page-noop", () => scenario({}, async (page) => {
  const id = "current-page-noop";
  const before = JSON.stringify([await row(page, 0), await header(page), await current(page, 0)]);
  const c = await center(ctl(page, 0, "Page 6"));
  await page.mouse.move(c.x, c.y); await sleep(120);
  await page.evaluate(() => window.__sampleStart(1300));
  await sleep(60);
  for (let k = 0; k < 4; k++) { await page.mouse.click(c.x, c.y); await sleep(150); }
  const frames = await page.evaluate(() => window.__sampleDone);
  const after = JSON.stringify([await row(page, 0), await header(page), await current(page, 0)]);
  chk(id, "noop.unchanged", "exact", before === after);
  chk(id, "noop.current", "exact", await current(page, 0));
  chk(id, "noop.row", "exact", await row(page, 0));
  chk(id, "noop.header", "exact", await header(page));
  chk(id, "noop.underlinePositions", "count", new Set(frames.map((fr) => JSON.stringify(fr.n[0].u))).size);
  chk(id, "noop.otherUnderlinePositions", "exact", [1, 2].map((o) => new Set(frames.map((fr) => JSON.stringify(fr.n[o].u))).size));
}));

await item("underline-spring", () => scenario({}, async (page) => {
  const id = "underline-spring";
  let fr = await sampledClick(page, 0, "Page 7");
  const a = curve(fr, 0, [1, 2]);
  curveChecks(id, "spring.a.forward6to7", a, { withBetween: true });
  chk(id, "spring.a.otherUnderlinesStill", "exact", [1, 2].map((o) => a.otherPositions[o]));
  chk(id, "spring.a.underlineCount", "count", a.maxCount);
  fr = await sampledClick(page, 0, "Previous");
  const b = curve(fr, 0, [1, 2]);
  curveChecks(id, "spring.b.backward7to6", b, { withBetween: true });
  chk(id, "spring.ab.backwardLarger", "exact", Math.abs(b.start) > 1.5 * Math.abs(a.start));
  await sampledClick(page, 0, "Page 7");
  fr = await sampledClick(page, 0, "Page 12", 1400);
  const c = curve(fr, 0, [1, 2]);
  curveChecks(id, "spring.c.jump7to12", c, { withBetween: true, startKind: "info" });
  chk(id, "spring.c.otherUnderlinesStill", "exact", [1, 2].map((o) => c.otherPositions[o]));
  chk(id, "spring.c.settleUnder1s", "exact", c.settleMs < 1000);
}));

// more springs: backward moves inside the sliding window, and moves where the row switches between the centred and the edge layout
await item("underline-spring", () => scenario({}, async (page) => {
  const id = "underline-spring";
  const go = async (name) => curve(await sampledClick(page, 0, name), 0);
  curveChecks(id, "spring.d.prev6to5", await go("Previous"));
  curveChecks(id, "spring.e.prev5to4", await go("Previous"));
  curveChecks(id, "spring.e.next4to5", await go("Next"));
  await click(page, 0, "Previous", 700);
  curveChecks(id, "spring.e.page5from4", await go("Page 5"));
  await click(page, 0, "Page 6", 700);
  await click(page, 0, "Page 7", 700);
  curveChecks(id, "spring.d.page6from7", await go("Page 6"));
  curveChecks(id, "spring.d.page5from6", await go("Page 5"));
}));

await item("reduced-motion", () => scenario({ reducedMotion: "reduce" }, async (page) => {
  const id = "reduced-motion";
  chk(id, "reduced.mediaMatches", "exact", await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches));
  let fr = await sampledClick(page, 0, "Page 7", 800);
  const r67 = curve(fr, 0);
  // Under reduced motion the source jumps straight to the new cell. A single offset frame on a zero-travel move is a
  // framer duration-0 artefact, so first-frame direction/start/peak and the offset frame are recorded as info only;
  // the requirement is no intermediate positions and no animation.
  curveChecks(id, "reduced.card1.6to7", r67, { withBetween: true, startKind: "info", timing: false });
  chk(id, "reduced.card1.6to7.offsetFrame", "info", r67.movingFrames >= 1);
  chk(id, "reduced.card1.afterRow", "exact", await row(page, 0));
  fr = await sampledClick(page, 0, "Page 12", 800);
  curveChecks(id, "reduced.card1.7to12", curve(fr, 0), { withBetween: true, startKind: "info", timing: false });
  chk(id, "reduced.card1.header", "exact", await header(page));
  fr = await sampledClick(page, 1, "Page 3", 800);
  curveChecks(id, "reduced.orders.1to3", curve(fr, 1), { withBetween: true, startKind: "info", timing: false });
  chk(id, "reduced.orders.current", "exact", await current(page, 1));
}));

await item("tab-order-buttons", () => scenario({}, async (page) => {
  const id = "tab-order-buttons";
  const seq = [];
  let ring = null;
  for (let k = 0; k < 30; k++) {
    await page.keyboard.press("Tab");
    const d = await active(page);
    if (d === "OUTSIDE") break;
    seq.push(d);
    if (k === 1 && !ring) {
      ring = await page.evaluate(() => {
        const e = document.activeElement; const s = getComputedStyle(e);
        const sp = [...s.boxShadow.matchAll(/(?:rgba?|oklab|oklch|lab|lch|color)\([^)]*\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/g)].map((m) => parseFloat(m[4])).filter((v) => v > 0).sort((a, b) => a - b);
        const ow = s.outlineStyle !== "none" ? parseFloat(s.outlineWidth) : 0;
        if (sp.length >= 2) return { width: sp[sp.length - 1] - sp[0], offset: sp[0] };
        if (ow > 0) return { width: ow, offset: parseFloat(s.outlineOffset) || 0 };
        if (sp.length === 1) return { width: sp[0], offset: 0 };
        return { width: 0, offset: 0 };
      });
    }
  }
  tabOrder = seq.map((d) => d.slice(d.indexOf("|") + 1));
  const byNav = (n) => seq.filter((d) => d.startsWith(n + "|")).map((d) => d.slice(d.indexOf("|") + 1));
  chk(id, "tabs.card1", "exact", byNav(0));
  chk(id, "tabs.orders", "exact", byNav(1));
  chk(id, "tabs.reviews", "exact", byNav(2));
  chk(id, "tabs.total", "count", seq.length);
  if (ring) { chk(id, "tabs.focusRing.width", "px", ring.width); chk(id, "tabs.focusRing.offset", "px", ring.offset); }
}));

await item("keyboard-activate", () => scenario({}, async (page) => {
  const id = "keyboard-activate";
  const tabTo = async (want) => { for (let k = 0; k < 25; k++) { await page.keyboard.press("Tab"); if ((await active(page)) === want) return true; } return false; };
  chk(id, "kb.reached7", "exact", await tabTo("0|button:Page 7"));
  await page.keyboard.press("Enter"); await sleep(600);
  chk(id, "kb.enter.current", "exact", await current(page, 0));
  chk(id, "kb.enter.focus", "exact", await active(page));
  chk(id, "kb.reachedNext", "exact", await tabTo("0|button:Next"));
  await page.keyboard.press("Space"); await sleep(600);
  chk(id, "kb.space.current", "exact", await current(page, 0));
  chk(id, "kb.space.focus", "exact", await active(page));
  chk(id, "kb.space.header", "exact", await header(page));
}));

await item("link-mode", () => scenario({}, async (page) => {
  const id = "link-mode";
  const pages = [1, 2, 3, 4];
  const hrefs = [];
  for (const n of pages) hrefs.push((await info(page, 1, `Page ${n}`)).href);
  chk(id, "link.hrefs", "exact", hrefs);
  chk(id, "link.pagesAreLinks", "exact", await nav(page, 1).getByRole("link", { name: /^Page [1-4]$/ }).count() === 4);
  const p = await info(page, 1, "Previous");
  chk(id, "link.prev.isLink", "exact", (await nav(page, 1).getByRole("link", { name: "Previous", exact: true }).count()) > 0);
  chk(id, "link.prev.ariaDisabled", "exact", p.ariaDisabled);
  chk(id, "link.prev.hasHref", "exact", p.hasHref);
  const nx = await info(page, 1, "Next");
  chk(id, "link.next.href", "exact", nx.href);
  await click(page, 1, "Page 3", 500);
  chk(id, "link.p3.hash", "exact", await hash(page));
  chk(id, "link.p3.current", "exact", await current(page, 1));
  chk(id, "link.p3.prevHref", "exact", (await info(page, 1, "Previous")).href);
  await click(page, 1, "Page 4", 500);
  chk(id, "link.p4.hash", "exact", await hash(page));
  const n4 = await info(page, 1, "Next");
  chk(id, "link.p4.nextAriaDisabled", "exact", n4.ariaDisabled);
  chk(id, "link.p4.nextIsLink", "exact", (await nav(page, 1).getByRole("link", { name: "Next", exact: true }).count()) > 0);
  chk(id, "link.p4.nextHasHref", "exact", n4.hasHref);
}));

await item("link-href-lag", () => scenario({}, async (page) => {
  const id = "link-href-lag";
  await click(page, 1, "Page 4", 500);
  await click(page, 1, "Previous", 600);
  chk(id, "lag.prev.current", "exact", await current(page, 1));
  chk(id, "lag.prev.hash", "exact", await hash(page));
  await click(page, 1, "Page 2", 500);
  chk(id, "lag.p2.hash", "exact", await hash(page));
  await click(page, 1, "Next", 600);
  chk(id, "lag.next.current", "exact", await current(page, 1));
  chk(id, "lag.next.hash", "exact", await hash(page));
  await click(page, 1, "Page 3", 500);
  chk(id, "lag.numbered.current", "exact", await current(page, 1));
  chk(id, "lag.numbered.hash", "exact", await hash(page));
}));

await item("link-keyboard-and-current", () => scenario({}, async (page) => {
  const id = "link-keyboard-and-current";
  let ok = false;
  for (let k = 0; k < 25; k++) { await page.keyboard.press("Tab"); if ((await active(page)) === "1|link:Page 2") { ok = true; break; } }
  chk(id, "lkb.reached", "exact", ok);
  await page.keyboard.press("Space"); await sleep(500);
  chk(id, "lkb.space.current", "exact", await current(page, 1));
  chk(id, "lkb.space.hash", "exact", await hash(page));
  await page.keyboard.press("Enter"); await sleep(600);
  chk(id, "lkb.enter.current", "exact", await current(page, 1));
  chk(id, "lkb.enter.hash", "exact", await hash(page));
  await page.keyboard.press("Shift+Tab"); await sleep(100);
  chk(id, "lkb.shiftTab.focus", "exact", await active(page));
  await page.keyboard.press("Enter"); await sleep(600);
  chk(id, "lkb.page1.current", "exact", await current(page, 1));
  chk(id, "lkb.page1.hash", "exact", await hash(page));
  const s1 = JSON.stringify([await row(page, 0), await row(page, 1), await row(page, 2), await header(page)]);
  await page.keyboard.press("Enter"); await sleep(600);
  chk(id, "lkb.page1again.hash", "exact", await hash(page));
  chk(id, "lkb.page1again.current", "exact", await current(page, 1));
  const s2 = JSON.stringify([await row(page, 0), await row(page, 1), await row(page, 2), await header(page)]);
  chk(id, "lkb.page1again.unchanged", "exact", s1 === s2);
  chk(id, "lkb.page1.hrefKept", "exact", (await info(page, 1, "Page 1")).href);
}));

await item("accessible-names", () => scenario({}, async (page) => {
  const id = "accessible-names";
  const count = await R(page).getByRole("navigation").count();
  chk(id, "a11y.navCount", "count", count);
  const names = [];
  for (let i = 0; i < count; i++) names.push(await nav(page, i).getAttribute("aria-label"));
  chk(id, "a11y.navNames", "exact", names);
  const lists = [];
  for (let i = 0; i < count; i++) lists.push(await nav(page, i).getByRole("list").count());
  chk(id, "a11y.listCount", "exact", lists);
  chk(id, "a11y.card1.names", "exact", await pageNames(page, 0));
  chk(id, "a11y.orders.names", "exact", await pageNames(page, 1));
  chk(id, "a11y.reviews.names", "exact", await pageNames(page, 2));
  chk(id, "a11y.currentCount", "exact", await page.evaluate(() => window.__navs().map((n) => n.querySelectorAll('[aria-current="page"]').length)));
  chk(id, "a11y.currentValue", "exact", await page.evaluate(() => window.__navs().map((n) => n.querySelector('[aria-current="page"]')?.getAttribute("aria-current") ?? null)));
  const hid = await page.evaluate(() => {
    const out = { svgExposed: 0, ellipsisTotal: 0, ellipsisHidden: 0, ulHidden: true };
    for (const n of window.__navs()) {
      for (const s of n.querySelectorAll("svg")) if (!s.closest('[aria-hidden="true"]')) out.svgExposed++;
      for (const li of window.__lis(n)) {
        if (li.innerText.trim() === "…") { out.ellipsisTotal++; if (li.closest('[aria-hidden="true"]')) out.ellipsisHidden++; }
      }
      for (const u of window.__ul(n)) if (u.getAttribute("aria-hidden") !== "true") out.ulHidden = false;
    }
    return out;
  });
  chk(id, "a11y.svgExposed", "count", hid.svgExposed);
  chk(id, "a11y.ellipsisAllHidden", "exact", hid.ellipsisTotal > 0 && hid.ellipsisTotal === hid.ellipsisHidden);
  chk(id, "a11y.underlineHidden", "exact", hid.ulHidden);
  chk(id, "a11y.underlineTabindex", "exact", await page.evaluate(() => window.__navs().map((n) => window.__ul(n).map((u) => u.getAttribute("tabindex")))));
  const uc = await page.evaluate(() => { const r = window.__ul(window.__navs()[0])[0].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.click(uc.x, uc.y); await sleep(200);
  chk(id, "a11y.underlineClickFocus", "exact", await active(page));
  chk(id, "a11y.underlineClickCurrent", "exact", await current(page, 0));
}));

await item("compact-live", () => scenario({}, async (page) => {
  const id = "compact-live";
  const live = nav(page, 2).locator("[aria-live]").first();
  chk(id, "live.before", "exact", norm(await live.innerText()));
  chk(id, "live.ariaLive", "exact", await live.getAttribute("aria-live"));
  chk(id, "live.role", "exact", await live.evaluate((e) => e.getAttribute("role") ?? (e.tagName.toLowerCase() === "li" ? "listitem" : e.tagName.toLowerCase())));
  await click(page, 2, "Next", 400);
  chk(id, "live.after", "exact", norm(await live.innerText()));
}));

await item("locale", async () => {
  const id = "locale";
  const expect = {
    "zh-TW": ["居家生活", "訂單紀錄", "顧客評價"],
    "zh-CN": ["家居生活", "订单记录", "用户评价"],
    ja: ["ホーム & リビング", "注文履歴", "カスタマーレビュー"],
  };
  for (const l of ["zh-TW", "zh-CN", "ja"]) {
    await item(id, async () => {
      const u = /([?&])l=[^&]*/.test(URL_) ? URL_.replace(/([?&])l=[^&]*/, `$1l=${l}`) : URL_ + (URL_.includes("?") ? "&" : "?") + `l=${l}`;
      const ctxOpts = { locale: "en-US" };
      const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, colorScheme: "light", ...ctxOpts });
      await ctx.addInitScript(() => { try { localStorage.setItem("sunui-theme", "light"); } catch (e) {} });
      await ctx.addInitScript(initHelpers, ROOT);
      const page = await ctx.newPage();
      watch(page);
      try {
        try { await page.goto(u, { waitUntil: "networkidle", timeout: 30000 }); } catch {}
        await page.locator(ROOT).getByRole("navigation").first().waitFor({ timeout: 15000 });
        await sleep(900);
        await settle(page);
        const k = `locale.${l}`;
        const nm = [];
        for (let i = 0; i < 3; i++) nm.push(await nav(page, i).getAttribute("aria-label"));
        // compared: only strings the component itself produces (nav name, Previous/Next, page names, compact text)
        chk(id, `${k}.navNames`, "exact", nm);
        chk(id, `${k}.card1Names`, "exact", await pageNames(page, 0));
        chk(id, `${k}.ordersNames`, "exact", await pageNames(page, 1));
        chk(id, `${k}.reviewsNames`, "exact", await pageNames(page, 2));
        chk(id, `${k}.currentName`, "exact", await current(page, 0));
        chk(id, `${k}.compactText`, "exact", norm(await nav(page, 2).locator("[aria-live]").first().innerText()));
        // demo copy (titles, range header) is not component-owned: info only
        const titles = [];
        for (const t of expect[l]) titles.push((await R(page).getByText(t, { exact: true }).count()) > 0);
        chk(id, `${k}.demoTitlesPresent`, "info", titles);
        chk(id, `${k}.demoHeader`, "info", await header(page));
      } finally { await ctx.close(); }
    });
  }
});

await item("layout-narrow", async () => {
  const id = "layout-narrow";
  const measure = (page) => page.evaluate(() => {
    const n = window.__navs()[0];
    let card = n.parentElement;
    while (card && card !== document.body && (parseFloat(getComputedStyle(card).borderTopWidth) || 0) === 0) card = card.parentElement;
    const cr = card.getBoundingClientRect();
    const lis = window.__lis(n);
    const rects = lis.map((li) => li.getBoundingClientRect());
    const pageCells = lis.filter((li) => !window.__isEllipsis(li) && /^\d+$/.test(li.innerText.trim())).map((li) => window.__ctrl(li).getBoundingClientRect());
    const ell = lis.filter((li) => li.innerText.trim() === "…").map((li) => li.getBoundingClientRect());
    const prev = window.__ctrl(lis[0]);
    const word = [...prev.querySelectorAll("*")].concat([prev]).flatMap((e) => [...e.childNodes].filter((c) => c.nodeType === 3 && c.textContent.trim())).map((tn) => { const pe = tn.parentElement; const b = pe.getBoundingClientRect(); const st = getComputedStyle(pe); const clipped = /^rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)$/.test(st.clip.trim()) || /inset\(50%\)/.test(st.clipPath) || st.visibility === "hidden" || st.display === "none"; return { w: b.width, h: b.height, clipped }; });
    const pr = prev.getBoundingClientRect();
    const nr = window.__ctrl(lis[lis.length - 1]).getBoundingClientRect();
    const left = Math.min(...rects.map((r) => r.left)), right = Math.max(...rects.map((r) => r.right));
    return {
      cardW: cr.width, cardL: cr.left, rowW: right - left, rowL: left, rowR: right,
      cellH: pageCells.map((r) => r.height), cellW: pageCells.map((r) => r.width), ellH: ell.map((r) => r.height), ellW: ell.map((r) => r.width),
      gap: rects[1].left - rects[0].right, centerOff: (left + right) / 2 - (cr.left + cr.width / 2),
      prevW: pr.width, nextW: nr.width, prevWordVisible: word.some((x) => x.w > 4 && x.h > 4 && !x.clipped), prevName: window.__name(prev),
      chevronOutside: pr.left < cr.left || pr.right > cr.right || rects[rects.length - 1].right > cr.right,
    };
  });
  await scenario({}, async (page) => {
    const m = await measure(page);
    chk(id, "layout.wide.cellHeight", "px", m.cellH[0]);
    chk(id, "layout.wide.cellHeightsAll36", "exact", m.cellH.every((h) => Math.abs(h - 36) < 0.6));
    chk(id, "layout.wide.cellMinWidth36", "exact", m.cellW.every((w) => w >= 35.5));
    chk(id, "layout.wide.ellipsisHeight", "px", m.ellH[0]);
    chk(id, "layout.wide.ellipsisMinWidth28", "exact", m.ellW.every((w) => w >= 27.5));
    chk(id, "layout.wide.gap", "px", m.gap);
    chk(id, "layout.wide.centered", "exact", Math.abs(m.centerOff) < 1.5);
    chk(id, "layout.wide.prevWordVisible", "exact", m.prevWordVisible);
    chk(id, "layout.wide.rowFitsCard", "exact", m.rowW <= m.cardW);
    chk(id, "layout.wide.cellWidths", "info", m.cellW);
    chk(id, "layout.wide.prevWidth", "info", m.prevW);
    chk(id, "layout.wide.nextWidth", "info", m.nextW);
  });
  for (const w of [600, 340]) {
    await scenario({ viewport: { width: w, height: 800 } }, async (page) => {
      const m = await measure(page);
      chk(id, `layout.w${w}.prevWordVisible`, "exact", m.prevWordVisible);
      chk(id, `layout.w${w}.prevName`, "exact", m.prevName);
      chk(id, `layout.w${w}.namesKept`, "exact", (await ctl(page, 0, "Previous").count()) > 0 && (await ctl(page, 0, "Next").count()) > 0);
      chk(id, `layout.w${w}.cellHeight`, "px", m.cellH[0]);
      chk(id, `layout.w${w}.gap`, "px", m.gap);
      chk(id, `layout.w${w}.rowWiderThanCard`, "exact", m.rowW > m.cardW);
      chk(id, `layout.w${w}.chevronsOutsideCard`, "exact", m.chevronOutside);
      chk(id, `layout.w${w}.rowWidth`, "info", m.rowW);
      chk(id, `layout.w${w}.cardWidth`, "info", m.cardW);
      chk(id, `layout.w${w}.prevWidth`, "px", m.prevW);
      chk(id, `layout.w${w}.nextWidth`, "px", m.nextW);
      await page.screenshot({ path: `${PILOT}/shots/pagination-${LABEL}-narrow-${w}.png` }).catch(() => {});
    });
  }
});

await browser.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ block: "pagination", label: LABEL, url: URL_, checks, tabOrder, consoleErrors: [...new Set(consoleErrors)].slice(0, 20), errors }, null, 1));
console.log(`${LABEL}: ${checks.length} checks, ${errors.length} errors, ${consoleErrors.length} console errors`);
for (const e of errors) console.log("  ERR", e.item, e.message);

