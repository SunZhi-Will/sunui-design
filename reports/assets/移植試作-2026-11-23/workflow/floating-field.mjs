import { chromium } from "playwright-core";
import { findChrome } from "/Applications/Projects/nextjs/sunui-design/apps/web/scripts/find-chrome.mjs";
import fs from "node:fs";

const OUT = "/private/tmp/claude-501/-Users-sun--claude-spares-spare-pTIojw/5465df63-0c9d-404d-8b8d-8414c00fa179/scratchpad/exp/verify";
const SHOTS = `${OUT}/shots`;
fs.mkdirSync(SHOTS, { recursive: true });
const f = findChrome();
const exe = typeof f === "string" ? f : f.path ?? Object.values(f)[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = [
  ["original", "http://localhost:3100/preview/floating-field?l=en", "[data-preview-stage]"],
  ["haiku", "http://localhost:3141/?only=floating-field", "[data-demo]"],
  ["sonnet", "http://localhost:3142/?only=floating-field", "[data-demo]"],
  ["opus", "http://localhost:3143/?only=floating-field", "[data-demo]"],
];
const only = process.argv[2];

// Runs in the page: installs helpers
function install() {
  const parts = (name) => {
    const el = document.querySelector(`[name=${name}]`);
    if (!el) return null;
    const box = el.parentElement;
    const root = box.parentElement;
    return { el, box, root, label: box.querySelector("label"), msg: root.querySelector(`[id="${el.id}-msg"]`), meter: root.querySelector(`[id="${el.id}-meter"]`) };
  };
  const T = (e) => (e ? getComputedStyle(e).transform : null);
  const mx = (e) => {
    const t = T(e);
    if (!t || t === "none") return { x: 0, y: 0, s: 1 };
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return { raw: t };
    const v = m[1].split(",").map(Number);
    return { x: +v[4].toFixed(2), y: +v[5].toFixed(2), s: +Math.hypot(v[0], v[1]).toFixed(3) };
  };
  const overlay = (box) => [...box.children].find((c) => c.tagName === "DIV" && c.getAttribute("aria-hidden") === "true" && /inset-x-3/.test(c.className));
  const check = (box) => box.querySelector('svg[viewBox="0 0 24 24"]');
  const ring = (box) => box.querySelector('svg[viewBox="0 0 18 18"]');
  window.__ff = { parts, mx, overlay, check, ring };

  window.__snap = () => {
    const out = {};
    for (const name of ["name", "zip", "email", "password", "note"]) {
      const p = parts(name);
      if (!p) { out[name] = "MISSING"; continue; }
      const { el, box, root, label, msg, meter } = p;
      const cs = getComputedStyle(el);
      const o = {};
      o.tag = el.tagName; o.type = el.getAttribute("type"); o.value = el.value;
      o.hasId = !!el.id; o.labelFor = label ? label.getAttribute("for") === el.id : "NOLABEL";
      o.ariaInvalid = el.getAttribute("aria-invalid");
      o.describedby = (el.getAttribute("aria-describedby") || "").split(" ").filter(Boolean).map((id) => (id === el.id + "-msg" ? "msg" : id === el.id + "-meter" ? "meter" : "other:" + id) + (document.getElementById(id) ? "" : "(dangling)")).join(" ") || null;
      o.required = el.required; o.maxlength = el.getAttribute("maxlength"); o.rows = el.getAttribute("rows");
      o.autocomplete = el.getAttribute("autocomplete"); o.inputmode = el.getAttribute("inputmode");
      o.pr10 = /\bpr-10\b/.test(el.className); o.textTransparent = /text-transparent/.test(el.className);
      o.padRight = cs.paddingRight; o.inputH = Math.round(el.getBoundingClientRect().height);
      o.labelText = label ? label.textContent : null;
      o.labelT = label ? mx(label) : null;
      o.labelColor = label ? getComputedStyle(label).color : null;
      o.labelOrigin = label ? getComputedStyle(label).transformOrigin : null;
      o.boxBorderColor = getComputedStyle(box).borderTopColor;
      const rb = root.getBoundingClientRect(), bb = box.getBoundingClientRect();
      o.rootBox = [rb.x, rb.y, rb.width, rb.height].map(Math.round);
      o.boxBox = [bb.x, bb.y, bb.width, bb.height].map(Math.round);
      const msgs = root.querySelectorAll(`[id="${el.id}-msg"]`);
      o.msgCount = msgs.length;
      o.msg = msg ? { tag: msg.tagName, text: msg.textContent.replace(/\s+/g, " ").trim(), role: msg.getAttribute("role"), color: getComputedStyle(msg).color, opacity: getComputedStyle(msg).opacity, button: msg.querySelector("button") ? { text: msg.querySelector("button").textContent.trim(), type: msg.querySelector("button").getAttribute("type") } : null } : null;
      const ck = check(box);
      o.check = ck ? { opacity: getComputedStyle(ck).opacity, t: mx(ck), ariaHidden: ck.getAttribute("aria-hidden"), color: getComputedStyle(ck).color } : null;
      const ov = overlay(box);
      o.overlay = ov ? { text: ov.textContent, spans: [...ov.children].map((c) => [c.textContent, getComputedStyle(c).color]) } : null;
      const tb = [...box.querySelectorAll("button")].map((b) => ({ text: b.textContent.trim(), type: b.getAttribute("type") }));
      o.trailing = tb.length ? tb : null;
      // counters
      const rg = ring(box);
      if (rg) {
        const wrap = rg.parentElement; const cs2 = rg.querySelectorAll("circle");
        const left = [...wrap.children].find((c) => c.tagName === "SPAN");
        o.ring = { t: mx(rg), ariaHidden: wrap.getAttribute("aria-hidden"), dasharray: getComputedStyle(cs2[1]).strokeDasharray, dashoffset: getComputedStyle(cs2[1]).strokeDashoffset, stroke: getComputedStyle(cs2[1]).stroke, left: left ? { text: left.textContent, color: getComputedStyle(left).color, opacity: getComputedStyle(left).opacity } : null, size: Math.round(rg.getBoundingClientRect().width) };
      } else o.ring = null;
      const num = [...box.children].find((c) => c.tagName === "SPAN" && /\d+\/\d+/.test(c.textContent));
      o.numCounter = num ? num.textContent : null;
      if (meter) {
        const segs = [...meter.querySelectorAll("span.relative > span, span.relative > *")];
        const word = meter.querySelector("span.min-w-10");
        const live = meter.querySelector("[aria-live]");
        o.meter = {
          segs: segs.map((s) => mx(s).raw ?? +(getComputedStyle(s).transform === "none" ? 1 : new DOMMatrix(getComputedStyle(s).transform).a).toFixed(2)),
          segBg: segs.map((s) => getComputedStyle(s).backgroundColor),
          word: word ? word.textContent : "NOWORD", wordColor: word ? getComputedStyle(word).color : null, wordAriaHidden: word ? word.getAttribute("aria-hidden") : null,
          live: live ? { text: live.textContent, live: live.getAttribute("aria-live"), atomic: live.getAttribute("aria-atomic"), srOnly: /sr-only/.test(live.className) } : "NOLIVE",
          rules: [...meter.querySelectorAll("li")].map((li) => ({ text: li.textContent.replace(/\s+/g, " ").trim(), color: getComputedStyle(li).color, bulletBg: getComputedStyle(li.firstElementChild).backgroundColor, bulletAriaHidden: li.firstElementChild.getAttribute("aria-hidden"), path: (() => { const p = li.querySelector("path"); const c = getComputedStyle(p); return { opacity: c.opacity, dash: c.strokeDasharray, pl: p.getAttribute("pathLength") }; })() })),
          gridCols: getComputedStyle(meter.querySelector("ul")).gridTemplateColumns.split(" ").length,
        };
      } else o.meter = null;
      out[name] = o;
    }
    const a = document.activeElement;
    out.active = a ? (a.getAttribute("name") || a.tagName + ":" + (a.textContent || "").trim().slice(0, 20)) : null;
    return out;
  };

  // per-frame recorder for one field
  window.__rec = (name, ms) => {
    const frames = [];
    const t0 = performance.now();
    window.__recDone = false;
    const tick = () => {
      const p = parts(name);
      const t = Math.round(performance.now() - t0);
      if (p) {
        const { el, box, root, label, msg, meter } = p;
        const ck = check(box), ov = overlay(box), rg = ring(box);
        const fr = { t, label: mx(label), boxX: mx(box).x, msgN: root.querySelectorAll(`[id="${el.id}-msg"]`).length, msg: msg ? msg.textContent.trim().slice(0, 30) : null, msgO: msg ? +(+getComputedStyle(msg).opacity).toFixed(2) : null, msgY: msg ? mx(msg).y : null };
        if (ck) fr.ck = { o: +(+getComputedStyle(ck).opacity).toFixed(2), s: mx(ck).s };
        if (ov) { fr.ov = ov.textContent; const sp = ov.querySelectorAll("span span"); if (sp.length) fr.ovSp = [...sp].map((s) => [+(+getComputedStyle(s).opacity).toFixed(2), mx(s).y]); }
        fr.transp = /text-transparent/.test(el.className);
        if (rg) { fr.ringS = mx(rg).s; const left = [...rg.parentElement.children].find((c) => c.tagName === "SPAN"); fr.left = left ? [left.textContent, +(+getComputedStyle(left).opacity).toFixed(2), mx(left).x] : null; fr.dash = parseFloat(getComputedStyle(rg.querySelectorAll("circle")[1]).strokeDashoffset).toFixed(1); }
        if (meter) { fr.segs = [...meter.querySelectorAll("span.relative > *")].map((s) => { const tr = getComputedStyle(s).transform; return tr === "none" ? 1 : +new DOMMatrix(tr).a.toFixed(2); }); fr.bul = [...meter.querySelectorAll("li")].map((li) => mx(li.firstElementChild).s); }
        frames.push(fr);
      }
      if (performance.now() - t0 < ms) requestAnimationFrame(tick); else { window.__recFrames = frames; window.__recDone = true; }
    };
    requestAnimationFrame(tick);
  };
}

const browser = await chromium.launch({ executablePath: exe, headless: true });
const results = {};
for (const [key, url, rootSel] of targets) {
  if (only && !only.split(",").includes(key)) continue;
  const ctx = await browser.newContext({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 1, locale: "en-US", colorScheme: "light" });
  await ctx.addInitScript(() => { try { localStorage.setItem("sunui-theme", "light"); } catch (e) {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 300)));
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/favicon|Failed to load resource|Download the React DevTools/.test(m.text()) && errors.push(m.type() + ": " + m.text().slice(0, 300)));
  const R = (results[key] = { steps: {}, recs: {}, errors });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(rootSel + " [name=email]", { timeout: 20000 });
    const root = page.locator(rootSel).first();
    // abort the original's autoplay with a real click on the heading, as early as possible
    const heading = root.locator("p", { hasText: "Shipping details" }).first();
    const clickHeading = async () => { await heading.click({ position: { x: 4, y: 4 } }); };
    for (let i = 0; i < 6; i++) { await clickHeading(); await sleep(100); }
    await sleep(1200);
    await page.evaluate(install);
    R.rootTextInitial = (await root.innerText()).replace(/\s+/g, " ").trim();
    const fb = await root.locator("form").first().boundingBox();
    R.formBox = fb && [fb.x, fb.y, fb.width, fb.height].map(Math.round);

    let n = 0;
    const step = async (name, fn, rec) => {
      const id = String(n++).padStart(2, "0") + "-" + name;
      try {
        if (rec) await page.evaluate(([f2, ms]) => window.__rec(f2, ms), rec);
        await fn();
        if (rec) { await page.waitForFunction(() => window.__recDone, null, { timeout: rec[1] + 5000 }); R.recs[id] = await page.evaluate(() => window.__recFrames); }
        else await sleep(700);
        R.steps[id] = await page.evaluate(() => window.__snap());
      } catch (e) { R.steps[id] = { FAIL: String(e).split("\n")[0].slice(0, 200) }; }
      await page.screenshot({ path: `${SHOTS}/floating-field-${key}-${id}.png` });
    };
    const F = (name) => root.locator(`[name=${name}]`).first();
    const type = (s, d = 25) => page.keyboard.type(s, { delay: d });

    await step("initial", async () => {});
    // email: focus floats the label
    await step("email-focus", async () => { await F("email").click(); }, ["email", 700]);
    // typing an invalid value before first blur: no error yet
    await step("email-type-invalid", async () => { await type("lin@gmial"); });
    // blur: error + shake
    await step("email-blur-invalid", async () => { await clickHeading(); }, ["email", 800]);
    // refocus and fix: validateOn change -> live validation -> valid
    await step("email-refocus", async () => { await F("email").click(); await page.keyboard.press("End"); });
    await step("email-complete-valid", async () => { await type(".com"); }, ["email", 900]);
    // blur: suggestion offered
    await step("email-blur-suggest", async () => { await clickHeading(); }, ["email", 900]);
    // accept suggestion: morph
    await step("email-accept", async () => { await root.locator("button", { hasText: "lin@gmail.com" }).first().click(); }, ["email", 1200]);
    await step("email-after-accept-blur", async () => { await clickHeading(); });
    // zip mask
    await step("zip-focus", async () => { await F("zip").click(); }, ["zip", 600]);
    await step("zip-type-partial", async () => { await type("94a1"); });
    await step("zip-blur-partial", async () => { await clickHeading(); }, ["zip", 800]);
    await step("zip-refocus", async () => { await F("zip").click(); await page.keyboard.press("End"); });
    await step("zip-complete-overflow", async () => { await type("079"); });
    await step("zip-blur-valid", async () => { await clickHeading(); }, ["zip", 800]);
    // password strength
    await step("pw-focus", async () => { await F("password").click(); });
    await step("pw-a", async () => { await type("a"); }, ["password", 900]);
    await step("pw-aB1", async () => { await type("B1"); }, ["password", 900]);
    await step("pw-aB1-", async () => { await type("-"); }, ["password", 900]);
    await step("pw-strong", async () => { await type("xyzw"); }, ["password", 1100]);
    await step("pw-show", async () => { await root.locator("button", { hasText: /^Show$/ }).first().click(); });
    await step("pw-hide", async () => { await root.locator("button", { hasText: /^Hide$/ }).first().click(); });
    await step("pw-clear", async () => { await F("password").click(); await page.keyboard.press("ControlOrMeta+a"); await page.keyboard.press("Backspace"); }, ["password", 1100]);
    // note: ring counter
    await step("note-focus", async () => { await F("note").click(); }, ["note", 600]);
    await step("note-20", async () => { await type("abcdefghijklmnopqrst", 10); });
    await step("note-36", async () => { await type("abcdefghijklmnop", 10); }, ["note", 800]);
    await step("note-40-overflow", async () => { await type("abcdefg", 10); }, ["note", 800]);
    await step("note-back-to-30", async () => { for (let i = 0; i < 10; i++) await page.keyboard.press("Backspace"); }, ["note", 800]);
    await step("note-blur", async () => { await clickHeading(); });
    // name: required star, clearing drops the label on blur
    await step("name-clear", async () => { await F("name").click(); await page.keyboard.press("ControlOrMeta+a"); await page.keyboard.press("Backspace"); });
    await step("name-blur-empty", async () => { await clickHeading(); }, ["name", 700]);
    // keyboard: tab order from name
    await step("tab-order", async () => {
      await F("name").focus(); const order = [];
      for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); order.push(await page.evaluate(() => { const a = document.activeElement; return a.getAttribute("name") || a.tagName + ":" + a.textContent.trim(); })); }
      R.tabOrder = order;
    });
    // label click focuses? (pointer-events-none, so click lands on input)
    R.rootTextFinal = (await root.innerText()).replace(/\s+/g, " ").trim();
  } catch (e) { R.fatal = String(e).split("\n")[0].slice(0, 300); }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/floating-field-results${only ? "-" + only : ""}.json`, JSON.stringify(results, null, 1));
console.log(Object.entries(results).map(([k, r]) => `${k}: steps ${Object.keys(r.steps).length} fails ${Object.entries(r.steps).filter(([, v]) => v.FAIL).map(([s, v]) => s + " " + v.FAIL).join("; ") || 0} errors ${r.errors.length} ${r.fatal || ""}`).join("\n"));
