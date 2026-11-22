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
// demo 會從頭到尾跑一次再重來，直到錄滿 seconds 秒（預設 6）。crf 是畫質（預設 28，越大越小檔；點很多的畫面用 34）。
//
//   node apps/web/scripts/record-cards.mjs [--only a,b] [--base http://localhost:3100] [--idle]
//
// --manifest 只重寫 content/home-cards-media.json（並刪掉比 H.264 大的 AV1 檔），不錄影。
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
const cards = [...config.pro, ...config.free].filter((c) => !only.length || only.includes(c.name));
const out = path.resolve(root, opt("--out", path.join("public", "cards")));
fs.mkdirSync(out, { recursive: true });

const VIEWPORT = { width: 1280, height: 900 };
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
  await page("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 1.5, mobile: false });
  await page("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("sunui-theme","light")}catch(e){}` });
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

/** 卡片在文件裡的範圍（CSS px）：分享圖的框再照 crop 取 16:10 */
function cardRect(clip, [cx, cy, wf]) {
  const w = Math.min(clip.w, wf * clip.w);
  const h = Math.min(clip.h, w / 1.6);
  const x = clip.x + Math.min(Math.max(cx * clip.w - w / 2, 0), clip.w - w);
  const y = clip.y + Math.min(Math.max(cy * clip.h - h / 2, 0), clip.h - h);
  return { x, y, w, h };
}

async function record(browser, card) {
  const seconds = card.seconds ?? 6;
  await browser.page("Page.navigate", { url: `${base}/preview/${card.name}` });
  const deadline = Date.now() + 60_000;
  while (!(await browser.evaluate(measure))) {
    if (Date.now() > deadline) throw new Error("demo 沒有渲染出來");
    await sleep(300);
  }
  await sleep(SETTLE);
  const box = await browser.evaluate(measure);
  const rect = cardRect(clipFor(box), card.crop);
  // 卡片要整塊在視窗裡：捲到它上面一點
  const scroll = Math.max(0, rect.y - 40);
  await browser.evaluate(`window.scrollTo(0, ${scroll}); 1`);
  await sleep(400);
  // 頁面不夠長時捲不動：用實際捲到的位置
  const vy = rect.y - (await browser.evaluate("scrollY"));
  if (vy + rect.h > VIEWPORT.height) throw new Error("卡片比視窗高，調 VIEWPORT");

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
  await browser.page("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1, maxWidth: VIEWPORT.width * 2, maxHeight: VIEWPORT.height * 2 });

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
  while (Date.now() - start < seconds * 1000) {
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
  const s = probe(firstFile) / VIEWPORT.width;
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
      "-vf", `scale=${Math.round(VIEWPORT.width * s)}:-2,${crop},scale=${v.w}:${v.w * 0.625}:flags=lanczos,format=yuv420p`,
      ...v.codec, "-movflags", "+faststart", "-an", file,
    ], { stdio: ["ignore", "ignore", "pipe"] });
    sizes[v.suffix] = Math.round(fs.statSync(file).size / 1024);
  }
  const file = path.join(out, `${card.name}.mp4`);
  // 畫面變化量：0 表示完全沒動
  return { kb: sizes[".mp4"], sizes, frames: moving, changed: new Set(frames.map((f) => f.data.length)).size };
}

/**
 * AV1 不一定比較小（畫面幾乎不動的卡，H.264 已經很省）：AV1 沒有比 H.264 小就刪掉 AV1 檔。
 * 哪些卡有 AV1 寫到 content/home-cards-media.json，頁面照它決定要不要給 AV1 來源，免得去要不存在的檔。
 */
function writeManifest() {
  const all = [...config.pro, ...config.free];
  const size = (f) => (fs.existsSync(f) ? fs.statSync(f).size : Infinity);
  const media = {};
  for (const { name } of all) {
    const h264 = size(path.join(out, `${name}.mp4`));
    const av1 = size(path.join(out, `${name}.av1.mp4`));
    const keep = av1 < h264;
    if (!keep) for (const f of [`${name}.av1.mp4`, `${name}-480.av1.mp4`]) fs.rmSync(path.join(out, f), { force: true });
    media[name] = { av1: keep };
  }
  if (out === path.join(root, "public", "cards")) {
    fs.writeFileSync(path.join(root, "content", "home-cards-media.json"), JSON.stringify(media, null, 2) + "\n");
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
