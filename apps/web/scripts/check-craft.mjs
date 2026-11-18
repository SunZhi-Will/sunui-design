#!/usr/bin/env node
// 質感改版後的全庫檢查（reports/拋棄紙感全面改質感深度分析-2026-11-18.md 的 P3）。
// 每個 craft 系列 block 用三種狀態打開 /preview/<name>：淺色 1280、深色 1280、淺色 375（手機），量：
// - 執行期錯誤（Runtime.exceptionThrown）
// - 375 寬時的橫向溢出（文件比視窗寬）
// - 殘留的紙感顏色（計算後的底色或邊線色等於舊紙、紙邊）
// 不需要 npm 套件，用本機 Chrome 走 DevTools protocol（和 capture-og.mjs 相同做法）。
//
//   node scripts/check-craft.mjs [--only a,b] [--jobs 4] [--base http://localhost:3100] [--json out.json]
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
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
const base = opt("--base", "http://localhost:3100").replace(/\/$/, "");
const only = opt("--only", "").split(",").map((s) => s.trim()).filter(Boolean);
const jobs = Math.max(1, Number(opt("--jobs", 4)) || 4);
const jsonOut = opt("--json", "");
const SETTLE = 2500;
const TIMEOUT = 60_000;

const found = findChrome();
if (!found) fail("找不到 Chrome。用環境變數 CHROME 指定瀏覽器執行檔。");
const { chrome, shell } = found;

// craft 系列：meta.series 省略、craft 或舊名 paper
const readCraft = (file) =>
  fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8")).items.filter((i) => [undefined, "craft", "paper"].includes(i.meta?.series) && i.type !== "registry:lib").map((i) => i.name)
    : [];
const all = [...readCraft(path.join(root, "registry.json")), ...readCraft(path.join(root, "registry", "pro", "registry.json"))];
const names = only.length ? only : all;

fs.mkdirSync(path.join(root, "check-out"), { recursive: true });
const work = fs.mkdtempSync(path.join(root, "check-out", ".craft-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 開一個無頭瀏覽器與一個分頁，回傳最小的 DevTools protocol 介面。 */
async function openBrowser(slot) {
  const proc = spawn(
    chrome,
    [
      ...(shell ? [] : ["--headless=new"]),
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      `--user-data-dir=${path.join(work, `profile-${slot}-${Date.now()}`)}`,
      "about:blank",
    ],
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
    proc.on("exit", () => reject(new Error("瀏覽器啟動後就結束了")));
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("連不上 DevTools"));
  });
  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
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
  const page = (method, params) => send(method, params, sessionId);
  const waitEvent = (method, timeout) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        listeners.delete(listener);
        reject(new Error(`${method} 逾時`));
      }, timeout);
      const listener = (msg) => {
        if (msg.method === method && msg.sessionId === sessionId) {
          clearTimeout(timer);
          listeners.delete(listener);
          resolve(msg.params);
        }
      };
      listeners.add(listener);
    });
  const evaluate = async (expression) =>
    (await page("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;

  await page("Page.enable");
  
  return {
    page,
    waitEvent,
    evaluate,
    listen: (fn) => listeners.add(fn),
    // 等行程真的結束再回傳，之後刪暫存 profile 才不會和瀏覽器搶檔案
    async close() {
      ws.close();
      if (proc.exitCode !== null || proc.signalCode !== null) return;
      const exited = new Promise((resolve) => proc.once("exit", resolve));
      proc.kill("SIGKILL");
      await exited;
    },
  };
}


// 頁面內量測：橫向溢出與殘留紙感色（淺色 #f7f7f7 / #e2e2e2，深色 #333333；深色 #1c1c1c 剛好等於主題的 --muted，不能拿來判斷）
const probe = (dark) => `(() => {
  document.querySelectorAll("nextjs-portal").forEach((n) => n.remove());
  const legacy = ${JSON.stringify(dark ? ["rgb(51, 51, 51)"] : ["rgb(247, 247, 247)", "rgb(226, 226, 226)"])};
  const stage = document.querySelector("[data-preview-stage]") || document.body;
  const hits = new Set();
  for (const el of stage.querySelectorAll("*")) {
    const st = getComputedStyle(el);
    for (const v of [st.backgroundColor, st.borderTopColor, st.borderLeftColor]) {
      if (legacy.includes(v) && (v !== st.borderTopColor || parseFloat(st.borderTopWidth) > 0)) {
        hits.add((el.className && typeof el.className === "string" ? el.className : el.tagName).slice(0, 80));
      }
    }
  }
  const sw = document.scrollingElement.scrollWidth;
  return { overflow: sw > innerWidth + 1 ? sw - innerWidth : 0, legacy: [...hits].slice(0, 5) };
})()`;

const MODES = [
  { id: "light", width: 1280, height: 900, dark: false, mobile: false },
  { id: "dark", width: 1280, height: 900, dark: true, mobile: false },
  { id: "mobile", width: 375, height: 812, dark: false, mobile: true },
];

async function checkOne(b, name) {
  const result = { name, errors: [], overflow: 0, legacy: {} };
  for (const mode of MODES) {
    await b.page("Emulation.setDeviceMetricsOverride", { width: mode.width, height: mode.height, deviceScaleFactor: 1, mobile: mode.mobile });
    await b.page("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: mode.dark ? "dark" : "light" }] });
    // 網站可能預設深色而不跟系統，所以主題直接寫進 localStorage（layout 的主題腳本讀它）
    if (b.themeScript) await b.page("Page.removeScriptToEvaluateOnNewDocument", { identifier: b.themeScript });
    b.themeScript = (await b.page("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("sunui-theme","${mode.dark ? "dark" : "light"}")}catch(e){}` })).identifier;
    b.errors.length = 0;
    const loaded = b.waitEvent("Page.loadEventFired", TIMEOUT);
    await b.page("Page.navigate", { url: `${base}/preview/${name}` });
    await loaded;
    await sleep(SETTLE);
    const isDark = await b.evaluate(`document.documentElement.classList.contains("dark")`);
    if (isDark !== mode.dark) throw new Error(`主題沒有切到 ${mode.id}`);
    const r = await b.evaluate(probe(mode.dark));
    for (const e of b.errors) if (!result.errors.includes(e)) result.errors.push(e);
    if (mode.id === "mobile") result.overflow = r?.overflow ?? 0;
    if (r?.legacy?.length) result.legacy[mode.id] = r.legacy;
  }
  return result;
}

const queue = [...names];
const results = [];
async function worker(slot) {
  let b = await openBrowser(slot);
  b.errors = [];
  await b.page("Runtime.enable");
  b.listen((msg) => {
    if (msg.method === "Runtime.exceptionThrown") b.errors.push((msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text || "").split("\n")[0].slice(0, 160));
  });
  while (queue.length) {
    const name = queue.shift();
    try {
      results.push(await checkOne(b, name));
    } catch (e) {
      results.push({ name, errors: [`檢查失敗：${e.message}`], overflow: 0, legacy: {} });
    }
    process.stdout.write(".");
  }
  await b.close();
}
await Promise.all(Array.from({ length: Math.min(jobs, names.length) }, (_, i) => worker(i)));
process.stdout.write("\n");
fs.rmSync(work, { recursive: true, force: true });

const bad = results.filter((r) => r.errors.length || r.overflow || Object.keys(r.legacy).length).sort((a, b) => a.name.localeCompare(b.name));
for (const r of bad) {
  const parts = [];
  if (r.errors.length) parts.push(`錯誤 ${r.errors.join(" | ")}`);
  if (r.overflow) parts.push(`375 寬溢出 ${r.overflow}px`);
  for (const [m, list] of Object.entries(r.legacy)) parts.push(`${m} 殘留紙色 ${list.join(" ; ")}`);
  console.log(`${r.name}: ${parts.join("；")}`);
}
console.log(`檢查 ${results.length} 個 block，${bad.length} 個有問題`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(results, null, 2));
