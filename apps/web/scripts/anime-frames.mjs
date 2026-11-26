#!/usr/bin/env node
// anime 系列的影格表：停住 anime-fx 的時鐘，觸發一次反應，推到指定時間點各截一張，並排存成一張圖。
// 「跑起來沒錯」不代表反應好看：交付前要一格一格看打擊格、餘韻、離場（DESIGN-anime.md 驗收）。
// 不需要 npm 套件：Node 內建 WebSocket 走 DevTools protocol，跟 capture-og.mjs 一樣。
//
//   node apps/web/scripts/anime-frames.mjs --url /preview/anime-fx-study --select "#controls button" \
//     --act "document.querySelector('#controls button').click()" --times 0,0.05,0.12,0.25,0.45,0.8 --out frames.png
//
// --base 網站位址（預設 http://localhost:3100）；--select 要裁的元素（取第一個，四周留 --pad，預設 140）；
// --act 觸發反應的 JS（在時鐘停住後執行，可以用 await）；--times 秒數；--theme light|dark；--width 視窗寬（預設 1280）。
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { findChrome } from "./find-chrome.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const base = opt("--base", process.env.SUNUI_BASE || "http://localhost:3100").replace(/\/$/, "");
const url = opt("--url", "/preview/anime-fx-study");
const select = opt("--select", "");
const act = opt("--act", "");
const times = opt("--times", "0,0.05,0.12,0.25,0.45,0.8").split(",").map(Number);
const theme = opt("--theme", "light");
const pad = Number(opt("--pad", 140));
const width = Number(opt("--width", 1280));
const out = path.resolve(opt("--out", "anime-frames.png"));
if (!select || !act) fail("需要 --select 與 --act");

const found = findChrome();
if (!found) fail("找不到 Chrome。用環境變數 CHROME 指定瀏覽器執行檔。");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anime-frames-"));
const proc = spawn(
  found.chrome,
  [...(found.shell ? [] : ["--headless=new"]), "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"],
  { stdio: ["ignore", "ignore", "pipe"] },
);
const wsUrl = await new Promise((resolve, reject) => {
  let buf = "";
  const timer = setTimeout(() => reject(new Error("瀏覽器 30 秒內沒有啟動")), 30_000);
  proc.stderr.on("data", (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) {
      clearTimeout(timer);
      resolve(m[1]);
    }
  });
});

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = () => reject(new Error("連不上 DevTools"));
});
let seq = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  const p = msg.id && pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  if (msg.error) p.reject(new Error(msg.error.message));
  else p.resolve(msg.result);
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const page = (method, params) => send(method, params, sessionId);
const evaluate = async (expression) => {
  const r = await page("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await page("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 2, mobile: false });
  await page("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] });
  await page("Page.navigate", { url: base + url });
  await sleep(1500);
  await evaluate(`localStorage.setItem("sunui-theme", ${JSON.stringify(theme)})`);
  await page("Page.reload");
  for (let i = 0; i < 60 && !(await evaluate("!!window.__animeFx && document.readyState === 'complete'")); i++) await sleep(250);
  await sleep(800);
  for (let i = 0; i < 40 && !(await evaluate(`!!document.querySelector(${JSON.stringify(select)})`)); i++) await sleep(250);
  await evaluate(`document.querySelector(${JSON.stringify(select)}).scrollIntoView({ block: "center" })`);
  await sleep(300);
  const box = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(select)}).getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2, scale: 1 };
  // act 可以是 async（例如等一個假的網路請求）；時鐘停著，特效等 step 才前進
  await evaluate(`window.__animeFx.pause(true); (async () => { ${act} })()`);
  const shots = [];
  let now = 0;
  for (const t of times) {
    await evaluate(`window.__animeFx.step(${Math.max(0, t - now)})`);
    now = Math.max(now, t);
    const { data } = await page("Page.captureScreenshot", { format: "png", clip });
    shots.push({ t, data });
  }
  // 並排：在一張空白頁排好再截一次
  const cell = Math.round(clip.width);
  const html = `<body style="margin:0;background:#fff;font:12px ui-monospace,monospace;display:flex;gap:8px;padding:8px">${shots
    .map((s) => `<figure style="margin:0"><img style="display:block;width:${cell}px;border:1px solid #ddd" src="data:image/png;base64,${s.data}"><figcaption style="padding:4px 0">${s.t.toFixed(2)}s</figcaption></figure>`)
    .join("")}</body>`;
  await page("Emulation.setDeviceMetricsOverride", { width: (cell + 8) * shots.length + 8, height: Math.round(clip.height) + 40, deviceScaleFactor: 1, mobile: false });
  await page("Page.navigate", { url: "data:text/html;base64," + Buffer.from(html).toString("base64") });
  await sleep(800);
  const { data } = await page("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`影格表：${out}（${shots.length} 格）`);
} finally {
  ws.close();
  // 等瀏覽器真的結束再刪設定檔資料夾，不然它還在寫檔
  await new Promise((resolve) => {
    proc.once("exit", resolve);
    proc.kill();
    setTimeout(resolve, 3000);
  });
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
