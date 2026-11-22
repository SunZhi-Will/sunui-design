#!/usr/bin/env node
// 首頁帶狀型錄的卡片影片：用無頭 Chrome 打開 /preview/<name>（淺色），照 content/home-cards.json 的
// crop 取同一塊畫面，錄一段循環影片。每張卡輸出四個檔到 public/cards/：<name>.mp4 與 <name>-480.mp4（H.264），
// <name>.av1.mp4 與 <name>-480.av1.mp4（AV1），960x600 與 480x300，無聲。
// 取景和 crop-cards.mjs 一樣：先照 capture-og.mjs 的規則框出 block（四周留白、640:550），再依 crop 的
// [cx, cy, wf] 取 16:10。所以影片和卡片靜態圖是同一個畫面，靜態圖當 poster。
// 有些 block 要有人操作才會動：在 home-cards.json 寫 demo，座標是卡片畫面的比例（0 到 1）：
//   { "move": [x, y], "ms": 600 }        滑鼠移過去（ms 是移動時間）
//   { "click": [x, y] }                  點一下
//   { "drag": [x1, y1, x2, y2], "ms": 900 } 按住拖過去
//   { "wait": 800 }                      停一下
//   { "sel": "[role=tab]", "nth": 1 }    點第 n 個符合選擇器的元素（比座標穩，按鈕順序不隨語言改變）
//   { "hover": "img", "nth": 2 }         滑鼠移到第 n 個符合選擇器的元素上，不點
// demo 會從頭到尾跑一次再重來，直到錄滿 seconds 秒（預設 6）。crf 是畫質（預設 28，越大越小檔；點很多的畫面用 34）。
//
//   node apps/web/scripts/record-cards.mjs [--only a,b] [--base http://localhost:3100] [--idle]
//
// --catalog 錄 /blocks 型錄的卡片（2026-11-22）：每個 block 一支。和首頁一樣用 1280 寬的完整頁面（/preview/<name>）渲染，
//   block 以原尺寸排版，再框一個剛好裝下整個 block 的 16:10（不裁、不縮小排版）；效果庫錄代表樣式 /preview/<name>/v/<featured>，
//   整個 800x500 的舞台就是畫面。首頁已經錄過（home-cards.json 有）的跳過，
//   兩邊共用同一支。要操作才會動的 block 把 demo 寫在 content/catalog-cards.json 的 demos（格式同上）。沒有靜態圖的順便輸出 <name>.jpg。
// --manifest 只重寫 content/cards-media.json（並刪掉比 H.264 大的 AV1 檔），不錄影。
// --idle 不跑 demo，只錄 block 自己會不會動（拿來判斷哪些需要寫 demo），並印出畫面變化量。
// 需要 ffmpeg（brew install ffmpeg）與正在跑的網站。
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { findChrome } from "./find-chrome.mjs";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const base = opt("--base", process.env.SUNUI_BASE || "http://localhost:3100").replace(/\/$/, "");
const only = opt("--only", "").split(",").map((s) => s.trim()).filter(Boolean);
const idle = args.includes("--idle");
// --config 換一份名單（試候選時用），--out 換輸出資料夾
const config = JSON.parse(fs.readFileSync(path.resolve(root, opt("--config", path.join("content", "home-cards.json"))), "utf8"));
const catalog = args.includes("--catalog");
const homeNames = new Set([...config.pro, ...config.free].map((c) => c.name));

/** 型錄模式的名單：免費與 Pro 的 registry，效果庫用 variants.tsx 的代表樣式 */
function catalogCards() {
  const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).items : []);
  const items = [...read(path.join(root, "registry.json")), ...read(path.join(root, "registry", "pro", "registry.json"))];
  const generated = fs.readFileSync(path.join(root, "registry", "__generated__", "variants.ts"), "utf8");
  const featured = Object.fromEntries(
    [...(generated.split("variantFeatured")[1] ?? "").matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );
  const extra = fs.existsSync(path.join(root, "content", "catalog-cards.json"))
    ? JSON.parse(fs.readFileSync(path.join(root, "content", "catalog-cards.json"), "utf8")).demos ?? {}
    : {};
  return items
    .filter((item) => !homeNames.has(item.name))
    .map((item) => ({
      name: item.name,
      interaction: item.meta?.interaction,
      catalog: true,
      // 效果庫的單一樣式頁沒有 data-preview-stage，用整個舞台
      stage: featured[item.name] ? `/preview/${item.name}/v/${encodeURIComponent(featured[item.name])}` : undefined,
      ...extra[item.name],
    }));
}

const cards = (catalog ? catalogCards() : [...config.pro, ...config.free]).filter((c) => !only.length || only.includes(c.name));
const out = path.resolve(root, opt("--out", path.join("public", "cards")));
fs.mkdirSync(out, { recursive: true });

const VIEWPORT = { width: 1280, height: 900 };
// 型錄模式框得比首頁緊（小元件框到 520 寬），用兩倍像素才不糊
const DPR = catalog ? 2 : 1.5;
// 效果庫單一樣式的舞台：整個視窗就是畫面
const STAGE = { width: 800, height: 500, dpr: 1.2 };
const ASPECT = 640 / 550;
const PAD = 48;
const MIN_WIDTH = 520;
const SETTLE = 3500;
const FPS = 30;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const found = findChrome();
if (!found) throw new Error("找不到 Chrome");
const work = fs.mkdtempSync(path.join(root, "check-out", ".rec-"));

async function openBrowser() {
  const proc = spawn(
    found.chrome,
    [
      ...(found.shell ? [] : ["--headless=new"]),
      "--hide-scrollbars",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${path.join(work, `p-${Date.now()}`)}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = "";
    proc.stderr.on("data", (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) resolve(m[1]);
    });
    proc.on("exit", () => reject(new Error("瀏覽器結束了")));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
    } else for (const l of listeners) l(msg);
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const page = (m, p) => send(m, p, sessionId);
  await page("Page.enable");
  await page("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: DPR, mobile: false });
  await page("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("sunui-theme","light")}catch(e){}` });
  // 自動 demo 會點到連結和送出鈕：擋掉換頁，元件自己的 onClick 照跑
  await page("Page.addScriptToEvaluateOnNewDocument", {
    source: `addEventListener("click",(e)=>{if(e.target.closest&&e.target.closest("a[href]"))e.preventDefault()},true);addEventListener("submit",(e)=>e.preventDefault(),true);`,
  });
  await page("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  return {
    page,
    on: (fn) => listeners.add(fn),
    off: (fn) => listeners.delete(fn),
    sessionId,
    evaluate: async (expression) => (await page("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value,
    close: () => {
      ws.close();
      proc.kill("SIGKILL");
    },
  };
}

// 和 capture-og.mjs 同一套量法
const measure = `(() => {
  document.querySelectorAll("nextjs-portal").forEach((n) => n.remove());
  const wrap = document.querySelector("[data-preview-stage]")?.firstElementChild;
  if (!wrap) return null;
  const vw = innerWidth;
  const full = wrap.getBoundingClientRect().width * 0.98;
  let box = null;
  const visibleRect = (el) => {
    let { left, top, right, bottom } = el.getBoundingClientRect();
    for (let a = el; a && a !== wrap; a = a.parentElement) {
      const st = getComputedStyle(a);
      if (st.opacity === "0" || st.visibility === "hidden") return null;
      if (a !== el && st.overflow !== "visible") {
        const c = a.getBoundingClientRect();
        left = Math.max(left, c.left); top = Math.max(top, c.top);
        right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom);
      }
    }
    return right - left >= 2 && bottom - top >= 2 ? { left, top, right, bottom } : null;
  };
  for (const el of wrap.querySelectorAll("*")) {
    if (el.getBoundingClientRect().width >= full) continue;
    const r = visibleRect(el);
    if (!r) continue;
    const l = Math.max(0, r.left), rt = Math.min(vw, r.right);
    if (rt <= l) continue;
    const t = r.top + scrollY, b = r.bottom + scrollY;
    box = box ? { l: Math.min(box.l, l), t: Math.min(box.t, t), r: Math.max(box.r, rt), b: Math.max(box.b, b) } : { l, t, r: rt, b };
  }
  if (!box) {
    const r = wrap.getBoundingClientRect();
    if (r.height < 2) return null;
    box = { l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY };
  }
  return { ...box, vw, dh: document.documentElement.scrollHeight };
})()`;

function clipFor(box) {
  const cx = (box.l + box.r) / 2;
  let w = Math.max(MIN_WIDTH, box.r - box.l + PAD * 2);
  let h = box.b - box.t + PAD * 2;
  if (w / h < ASPECT) w = h * ASPECT;
  else h = w / ASPECT;
  if (w > box.vw) {
    w = box.vw;
    h = w / ASPECT;
  }
  if (h > box.dh) {
    h = box.dh;
    w = h * ASPECT;
  }
  const x = Math.min(Math.max(0, cx - w / 2), box.vw - w);
  const tall = box.b - box.t + PAD * 2 > h;
  const y = Math.max(0, Math.min(tall ? box.t - PAD : (box.t + box.b) / 2 - h / 2, box.dh - h));
  return { x, y, w, h };
}

/** 型錄卡片：剛好裝下整個 block 的 16:10（四周留白，最窄 520）；比視窗還大的 block 取整個寬、從上面開始 */
function frameFor(box) {
  const bw = box.r - box.l + PAD * 2;
  const bh = box.b - box.t + PAD * 2;
  let w = Math.max(MIN_WIDTH, bw);
  let h = bh;
  if (w / h < 1.6) w = h * 1.6;
  else h = w / 1.6;
  if (w > box.vw) {
    w = box.vw;
    h = w / 1.6;
  }
  const cx = (box.l + box.r) / 2;
  const x = Math.min(Math.max(0, cx - w / 2), box.vw - w);
  const y = Math.max(0, Math.min(bh > h ? box.t - PAD : (box.t + box.b) / 2 - h / 2, box.dh - h));
  return { x, y, w, h };
}

/** 卡片在文件裡的範圍（CSS px）：分享圖的框再照 crop 取 16:10 */
function cardRect(clip, [cx, cy, wf]) {
  const w = Math.min(clip.w, wf * clip.w);
  const h = Math.min(clip.h, w / 1.6);
  const x = clip.x + Math.min(Math.max(cx * clip.w - w / 2, 0), clip.w - w);
  const y = clip.y + Math.min(Math.max(cy * clip.h - h / 2, 0), clip.h - h);
  return { x, y, w, h };
}

/**
 * 自動 demo 的目標：卡片裡看得到、點得到的控制項，最多五個，彼此隔開一點，由上而下、由左而右。
 * 文字欄位會打字，滑桿和 range 會拖，其他點一下。
 */
const findTargets = (b) => `((b) => {
  const root = document.querySelector("[data-fit-stage] > div") || document.querySelector("[data-preview-stage]");
  if (!root) return [];
  const sel = 'button, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=slider], [role=option], input, textarea, select, summary, a[href], [draggable=true], label';
  const out = [];
  for (const el of root.querySelectorAll(sel)) {
    if (el.disabled || el.getAttribute("aria-disabled") === "true" || el.closest("[aria-hidden=true]")) continue;
    if (el.type === "hidden" || el.type === "file") continue;
    // 關閉、移除、刪除、登出這類按下去畫面就沒了：跳過，不然影片大半是空的
    const label = [el.getAttribute("aria-label"), el.getAttribute("title"), el.textContent].join(" ").trim().toLowerCase();
    if (/close|dismiss|remove|delete|clear|cancel|sign out|log out|reset|關閉|移除|刪除|清除|取消|閉じる|削除|关闭|删除/.test(label) || /^[×✕x]$/.test(label)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) continue;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (x < b.x + 4 || y < b.y + 4 || x > b.x + b.w - 4 || y > b.y + b.h - 4) continue;
    const hit = document.elementFromPoint(x, y);
    if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < 28)) continue;
    const tag = el.tagName.toLowerCase();
    const slider = el.getAttribute("role") === "slider" || el.type === "range";
    const typing = (tag === "input" && !["checkbox", "radio", "range", "button", "submit", "color"].includes(el.type)) || tag === "textarea";
    // 欄位要猜一下該打什麼：看 type、name、placeholder 與標籤；已經有字的欄位只點不打（不然會接在後面）
    const hint = [el.type, el.name, el.placeholder, el.getAttribute("aria-label"), el.labels?.[0]?.textContent, el.closest("label")?.textContent].join(" ").toLowerCase();
    const text = el.type === "email" || /mail/.test(hint) ? "mia@studio.com"
      : el.type === "number" || el.inputMode === "numeric" || /qty|quantity|amount|數量/.test(hint) ? "2"
      : /code|coupon|promo|折扣|優惠/.test(hint) ? "SPRING20"
      : /name|姓名|名字/.test(hint) ? "Mia Chen"
      : /search|find|搜尋/.test(hint) || el.type === "search" ? "linen"
      : /phone|tel|電話/.test(hint) || el.type === "tel" ? "0912 345 678"
      : "Linen shirt";
    out.push(slider ? { x, y, kind: "drag", dx: Math.min(80, Math.max(30, r.width * 0.3)) } : typing && !el.value ? { x, y, kind: "type", text } : { x, y, kind: "click", label });
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  // 數量加減：先按加再按減，不然第一下就減到零被移除
  const minus = /^(−|-|–|decrease|minus|減少|减少)/;
  out.sort((a, b) => (a.y === b.y ? (minus.test(a.label) ? 1 : 0) - (minus.test(b.label) ? 1 : 0) : 0));
  return out.slice(0, 5);
})(${JSON.stringify(b)})`;

/** 型錄卡片頁：FitStage 量好尺寸、裡面有東西才算畫好 */
const stageReady = `(() => { const r = document.querySelector("[data-fit-stage] > div")?.getBoundingClientRect(); return !!r && r.width > 2 && r.height > 2; })()`;

async function record(browser, card) {
  const seconds = card.seconds ?? 6;
  const vp = card.stage ? STAGE : VIEWPORT;
  const dpr = card.stage ? STAGE.dpr : DPR;
  await browser.page("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: dpr, mobile: false });
  await browser.page("Page.navigate", { url: `${base}${card.stage ?? `/preview/${card.name}`}` });
  const deadline = Date.now() + 60_000;
  while (!(await browser.evaluate(card.stage ? stageReady : measure))) {
    if (Date.now() > deadline) throw new Error("demo 沒有渲染出來");
    await sleep(300);
  }
  await sleep(SETTLE);
  let rect;
  let vy;
  if (card.stage) {
    // 整個視窗就是卡片
    rect = { x: 0, y: 0, w: vp.width, h: vp.height };
    vy = 0;
  } else {
    const box = await browser.evaluate(measure);
    rect = card.catalog && !card.crop ? frameFor(box) : cardRect(clipFor(box), card.crop);
    // 卡片要整塊在視窗裡：捲到它上面一點
    const scroll = Math.max(0, rect.y - 40);
    await browser.evaluate(`window.scrollTo(0, ${scroll}); 1`);
    await sleep(400);
    // 頁面不夠長時捲不動：用實際捲到的位置
    vy = rect.y - (await browser.evaluate("scrollY"));
    if (vy + rect.h > vp.height + 1) throw new Error("卡片比視窗高，調 VIEWPORT");
  }

  const dir = fs.mkdtempSync(path.join(work, `${card.name}-`));
  const frames = [];
  const onFrame = (msg) => {
    if (msg.method !== "Page.screencastFrame" || msg.sessionId !== browser.sessionId) return;
    frames.push({ t: msg.params.metadata.timestamp, data: msg.params.data });
    browser.page("Page.screencastFrameAck", { sessionId: msg.params.sessionId }).catch(() => {});
  };
  browser.on(onFrame);
  // 畫面沒變時 screencast 不送幀：先截一張當第一幀
  const first = await browser.page("Page.captureScreenshot", { format: "jpeg", quality: 90 });
  const startedAt = Date.now() / 1000;
  await browser.page("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1, maxWidth: Math.round(vp.width * dpr), maxHeight: Math.round(vp.height * dpr) });

  const at = ([fx, fy]) => ({ x: rect.x + fx * rect.w, y: vy + fy * rect.h });
  if (process.env.REC_DEBUG) {
    for (const st of card.demo ?? []) {
      const pt = st.click ?? st.move ?? (st.drag && st.drag.slice(0, 2));
      if (!pt) continue;
      const { x, y } = at(pt);
      console.log("   ", JSON.stringify(st).slice(0, 40), await browser.evaluate(`(() => { const e = document.elementFromPoint(${x}, ${y}); return e ? e.tagName + "." + String(e.className).slice(0, 50) + " [" + (e.textContent || "").trim().slice(0, 20) + "] aria=" + (e.getAttribute("aria-label")||"") : "none"; })()`));
    }
    console.log("    rect", JSON.stringify(rect), "vy", vy);
  }
  const mouse = (type, { x, y }, extra = {}) => browser.page("Input.dispatchMouseEvent", { type, x, y, button: "left", ...extra });
  let pos = at([0.5, 0.5]);
  const glide = async (to, ms, pressed) => {
    const steps = Math.max(1, Math.round(ms / 16));
    const from = pos;
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      pos = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      await mouse("mouseMoved", pos, pressed ? { buttons: 1 } : { button: "none" });
      await sleep(16);
    }
  };
  const start = Date.now();
  const demo = idle ? [] : card.demo ?? [];
  // 型錄模式沒寫 demo 的卡：自動找卡片裡能操作的東西，滑過去、點、打字、拖（--catalog 時預設開，--no-auto 關）
  const auto = card.catalog && !idle && !card.demo && !args.includes("--no-auto") ? await browser.evaluate(findTargets({ x: rect.x, y: vy, w: rect.w, h: rect.h })) : [];
  if (process.env.REC_DEBUG) console.log("    auto", JSON.stringify(auto));
  while (Date.now() - start < seconds * 1000) {
    if (auto.length) {
      // 先從左到右掃過一次（hover 類的效果），再逐一操作
      await glide(at([0.2, 0.5]), 350);
      await glide(at([0.8, 0.45]), 900);
      for (const t of auto) {
        if (Date.now() - start >= seconds * 1000) break;
        await glide(t, 450);
        await sleep(250);
        if (t.kind === "drag") {
          await mouse("mousePressed", pos, { clickCount: 1 });
          await glide({ x: t.x + t.dx, y: t.y }, 800, true);
          await mouse("mouseReleased", pos, { clickCount: 1 });
          await sleep(500);
          continue;
        }
        await mouse("mousePressed", pos, { clickCount: 1 });
        await sleep(60);
        await mouse("mouseReleased", pos, { clickCount: 1 });
        if (t.kind === "type") {
          await sleep(200);
          for (const ch of t.text) {
            await browser.page("Input.insertText", { text: ch });
            await sleep(70);
          }
          await sleep(700);
        } else await sleep(1100);
      }
      continue;
    }
    // 找不到控制項：照 registry 的 interaction 動一下（hover 繞圈、drag 從左拖到右、scroll 捲動滾輪）
    if (card.catalog && !idle && !card.demo && !args.includes("--no-auto") && ["hover", "drag", "scroll"].includes(card.interaction)) {
      // 座標換成卡片畫面裡的比例
      const W = 1;
      const H = 1;
      if (card.interaction === "hover") {
        for (let i = 0; i <= 24 && Date.now() - start < seconds * 1000; i++) {
          const a = (i / 24) * Math.PI * 2;
          await glide(at([W / 2 + Math.sin(a) * W * 0.3, H / 2 + Math.sin(a * 2) * H * 0.22]), 160);
        }
      } else if (card.interaction === "drag") {
        await glide(at([W * 0.3, H * 0.5]), 400);
        await mouse("mousePressed", pos, { clickCount: 1 });
        await glide(at([W * 0.72, H * 0.45]), 1200, true);
        await mouse("mouseReleased", pos, { clickCount: 1 });
        await sleep(900);
      } else {
        await glide(at([W / 2, H / 2]), 300);
        for (let i = 0; i < 12; i++) {
          await mouse("mouseWheel", pos, { deltaX: 0, deltaY: i < 6 ? 60 : -60 });
          await sleep(180);
        }
        await sleep(500);
      }
      continue;
    }
    if (!demo.length) {
      await sleep(100);
      continue;
    }
    for (const step of demo) {
      if (Date.now() - start >= seconds * 1000) break;
      if (step.wait) await sleep(step.wait);
      if (step.move) await glide(at(step.move), step.ms ?? 600);
      if (step.click) {
        await glide(at(step.click), step.ms ?? 400);
        await mouse("mousePressed", pos, { clickCount: 1 });
        await sleep(60);
        await mouse("mouseReleased", pos, { clickCount: 1 });
      }
      if (step.hover) {
        const target = await browser.evaluate(`(() => { const e = document.querySelectorAll(${JSON.stringify(step.hover)})[${step.nth ?? 0}]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
        if (!target) throw new Error(`找不到 ${step.hover} 第 ${step.nth ?? 0} 個`);
        await glide(target, step.ms ?? 450);
      }
      if (step.sel) {
        const target = await browser.evaluate(`(() => { const e = document.querySelectorAll(${JSON.stringify(step.sel)})[${step.nth ?? 0}]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
        if (!target) throw new Error(`找不到 ${step.sel} 第 ${step.nth ?? 0} 個`);
        await glide(target, step.ms ?? 450);
        await mouse("mousePressed", pos, { clickCount: 1 });
        await sleep(60);
        await mouse("mouseReleased", pos, { clickCount: 1 });
      }
      if (step.drag) {
        const [x1, y1, x2, y2] = step.drag;
        await glide(at([x1, y1]), 300);
        await mouse("mousePressed", pos, { clickCount: 1 });
        await glide(at([x2, y2]), step.ms ?? 900, true);
        await mouse("mouseReleased", pos, { clickCount: 1 });
      }
    }
  }
  await browser.page("Page.stopScreencast");
  browser.off(onFrame);
  const moving = frames.length;
  // screencast 只在畫面有變時送幀：照時間戳記補成固定 30fps
  const t0 = frames.length ? Math.min(frames[0].t, startedAt) : startedAt;
  frames.unshift({ t: t0 - 0.001, data: first.data });
  const total = Math.round(seconds * FPS);
  let j = 0;
  for (let i = 0; i < total; i++) {
    const t = t0 + i / FPS;
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, "0")}.jpg`), Buffer.from(frames[j].data, "base64"));
  }
  // 幀的實際寬度不一定等於裝置像素：用第一幀量比例（screencast 幀和截圖可能不同大小，所以全部統一縮成同寬）
  const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width", "-of", "csv=p=0", f]).toString().trim());
  const firstFile = path.join(dir, "f0000.jpg");
  const s = probe(firstFile) / vp.width;
  const crop = `crop=${Math.round(rect.w * s)}:${Math.round(rect.h * s)}:${Math.round(rect.x * s)}:${Math.round(vy * s)}`;
  // 四個檔：H.264（所有瀏覽器）與 AV1（同樣畫質約小三到四成，支援的瀏覽器優先用；AV1 的 crf 是 H.264 的 +20，2026-11-22 並排比過），各有 960 與 480 寬（手機一欄寬的卡片用 480）
  const crf = card.crf ?? 28;
  const variants = [
    { suffix: ".mp4", w: 960, codec: ["-c:v", "libx264", "-preset", "slow", "-crf", String(crf)] },
    { suffix: "-480.mp4", w: 480, codec: ["-c:v", "libx264", "-preset", "slow", "-crf", String(crf)] },
    { suffix: ".av1.mp4", w: 960, codec: ["-c:v", "libsvtav1", "-preset", "5", "-crf", String(Math.min(crf + 20, 56)), "-g", "90"] },
    { suffix: "-480.av1.mp4", w: 480, codec: ["-c:v", "libsvtav1", "-preset", "5", "-crf", String(Math.min(crf + 20, 56)), "-g", "90"] },
  ];
  const sizes = {};
  for (const v of variants) {
    const file = path.join(out, `${card.name}${v.suffix}`);
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(dir, "f%04d.jpg"),
      "-vf", `scale=${Math.round(vp.width * s)}:-2,${crop},scale=${v.w}:${v.w * 0.625}:flags=lanczos,format=yuv420p`,
      ...v.codec, "-movflags", "+faststart", "-an", file,
    ], { stdio: ["ignore", "ignore", "pipe"] });
    sizes[v.suffix] = Math.round(fs.statSync(file).size / 1024);
  }
  // 型錄模式：第一幀當卡片的靜態圖（首頁那批是從分享圖裁的，不在型錄名單裡，不會被蓋掉）
  const poster = path.join(out, `${card.name}.jpg`);
  if (card.catalog) {
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-i", firstFile,
      "-vf", `scale=${Math.round(vp.width * s)}:-2,${crop},scale=960:600:flags=lanczos`, "-q:v", "3", poster,
    ], { stdio: ["ignore", "ignore", "pipe"] });
  }
  // 畫面變化量：0 表示完全沒動
  return { kb: sizes[".mp4"], sizes, frames: moving, changed: new Set(frames.map((f) => f.data.length)).size };
}

/**
 * AV1 不一定比較小（畫面幾乎不動的卡，H.264 已經很省）：AV1 沒有比 H.264 小就刪掉 AV1 檔。
 * 哪些卡有影片、有沒有 AV1 寫到 content/cards-media.json（首頁與 /blocks 型錄共用），
 * 頁面照它決定要不要放影片與 AV1 來源，免得去要不存在的檔。
 */
function writeManifest() {
  const names = new Set([...config.pro, ...config.free, ...catalogCards()].map((c) => c.name));
  const size = (f) => (fs.existsSync(f) ? fs.statSync(f).size : Infinity);
  const media = {};
  for (const name of names) {
    if (!fs.existsSync(path.join(out, `${name}.mp4`))) continue;
    const h264 = size(path.join(out, `${name}.mp4`));
    const av1 = size(path.join(out, `${name}.av1.mp4`));
    const keep = av1 < h264;
    if (!keep) for (const f of [`${name}.av1.mp4`, `${name}-480.av1.mp4`]) fs.rmSync(path.join(out, f), { force: true });
    media[name] = { av1: keep };
  }
  if (out === path.join(root, "public", "cards")) {
    fs.writeFileSync(path.join(root, "content", "cards-media.json"), JSON.stringify(media, null, 2) + "\n");
  }
  return media;
}

if (args.includes("--manifest")) {
  console.log(writeManifest());
  process.exit(0);
}

const browser = await openBrowser();
const failed = [];
try {
  for (const card of cards) {
    try {
      const r = await record(browser, card);
      console.log(`  ${card.name.padEnd(24)} H.264 ${r.sizes[".mp4"]}/${r.sizes["-480.mp4"]} KB，AV1 ${r.sizes[".av1.mp4"]}/${r.sizes["-480.av1.mp4"]} KB（960/480）  收到 ${r.frames} 幀`);
    } catch (e) {
      failed.push(`${card.name}: ${e.message}`);
    }
  }
} finally {
  browser.close();
  await sleep(300);
  fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
writeManifest();
if (failed.length) {
  console.error(failed.join("\n"));
  process.exit(1);
}
