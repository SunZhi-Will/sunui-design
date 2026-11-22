#!/usr/bin/env node
// 首頁捲動效能：無頭 Chrome 模擬手機（390x844、DPR 3、觸控）或桌機（1440x900），CPU 降速，
// 從頭到尾等速捲一次，數 requestAnimationFrame 的間隔，並統計捲完時下載了多少影片與圖片。
//
//   node apps/web/scripts/measure-home.mjs [--base http://localhost:3100] [--cpu 4] [--desktop] [--path /]
//
// 數字只拿來前後比較：dev server 比正式版慢很多，絕對值不準。
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { findChrome } from "./find-chrome.mjs";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const base = opt("--base", "http://localhost:3100").replace(/\/$/, "");
const cpu = Number(opt("--cpu", 4));
const desktop = args.includes("--desktop");
const pagePath = opt("--path", "/");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const found = findChrome();
fs.mkdirSync(path.join(root, "check-out"), { recursive: true });
const work = fs.mkdtempSync(path.join(root, "check-out", ".measure-"));
const proc = spawn(found.chrome, [...(found.shell ? [] : ["--headless=new"]), "--hide-scrollbars", "--no-first-run", "--autoplay-policy=no-user-gesture-required", "--remote-debugging-port=0", `--user-data-dir=${work}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((resolve) => {
  let buf = "";
  proc.stderr.on("data", (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
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
const evaluate = async (expression) => (await page("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;

// 下載量：照 MIME 分類累加 encodedDataLength
const types = new Map();
const bytes = {};
listeners.add((msg) => {
  if (msg.sessionId !== sessionId) return;
  if (msg.method === "Network.responseReceived") types.set(msg.params.requestId, msg.params.response.mimeType);
  if (msg.method === "Network.loadingFinished") {
    const mime = types.get(msg.params.requestId) || "other";
    const kind = mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : mime.includes("javascript") ? "js" : "other";
    bytes[kind] = (bytes[kind] || 0) + msg.params.encodedDataLength;
  }
});
await page("Network.enable");
await page("Page.enable");
await page("Network.setCacheDisabled", { cacheDisabled: true });
await page("Emulation.setDeviceMetricsOverride", desktop ? { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false } : { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
if (!desktop) await page("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await page("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("sunui-theme","dark")}catch(e){}` });

await page("Page.navigate", { url: base + pagePath });
await sleep(8000);
await page("Emulation.setCPUThrottlingRate", { rate: cpu });

// 等速捲：每幀往下 18px（約每秒 1000px），一路捲到底，同時記錄每一幀的間隔
const result = await evaluate(`new Promise((resolve) => {
  const gaps = [];
  let last = performance.now();
  const end = document.documentElement.scrollHeight - innerHeight;
  const step = () => {
    const now = performance.now();
    gaps.push(now - last);
    last = now;
    if (scrollY >= end - 2) return resolve(gaps);
    window.scrollBy(0, 18);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})`);
await sleep(2500);
await page("Emulation.setCPUThrottlingRate", { rate: 1 });
const videos = await evaluate(`[...document.querySelectorAll("video")].map((v) => (v.currentSrc || "").split("/").pop()).filter(Boolean)`);

const gaps = result.slice(1);
const total = gaps.reduce((a, b) => a + b, 0);
const slow = gaps.filter((g) => g > 33.4).length;
const sorted = [...gaps].sort((a, b) => a - b);
const kb = (n) => `${Math.round((n || 0) / 1024)} KB`;
console.log(`${desktop ? "桌機 1440" : "手機 390"}，CPU 降速 ${cpu} 倍，${base}${pagePath}`);
console.log(`  捲動 ${(total / 1000).toFixed(1)} 秒，平均 ${(1000 / (total / gaps.length)).toFixed(0)} fps，慢於 33ms 的幀 ${((slow / gaps.length) * 100).toFixed(1)}%，最長一幀 ${Math.round(sorted.at(-1))}ms，第 95 百分位 ${Math.round(sorted[Math.floor(sorted.length * 0.95)])}ms`);
console.log(`  下載：影片 ${kb(bytes.video)}、圖片 ${kb(bytes.image)}、JS ${kb(bytes.js)}`);
console.log(`  播過的影片檔：${[...new Set(videos)].join(" ") || "（無）"}`);

ws.close();
proc.kill("SIGKILL");
await sleep(300);
fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
