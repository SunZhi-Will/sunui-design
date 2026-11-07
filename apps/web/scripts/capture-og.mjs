#!/usr/bin/env node
// 每個 block 的分享圖素材：用無頭 Chrome 打開 /preview/<name>，裁到 block 本身，存成 public/og/blocks/<name>.jpg。
// app/(site)/blocks/[slug]/opengraph-image.tsx 讀這張圖，讓每個 block 的 OG 都是它自己的畫面；
// 沒有截圖的 block 退回純文字版，所以新 block 沒截也能建置。
// 不需要任何 npm 套件（用 Node 內建的 WebSocket 走 DevTools protocol），只要本機有 Chrome 系的瀏覽器，
// 以及正在跑的網站（npm run web:dev，或用 --base 指向 next start）。
//
//   node apps/web/scripts/capture-og.mjs [--only a,b] [--missing] [--jobs 4] [--base http://localhost:3100]
//
// --only 只截這些 block；--missing 只截還沒有圖的；--jobs 同時開幾個瀏覽器。
// Pro block 也截（registry/pro 存在時）：分享圖只有畫面，沒有原始碼。
// 裁切：取 block 內容的外框，四周留白，再補成 OG 右側畫框的比例（640 : 550）；太高的 block 取上半部。
// macOS 另用 sips 縮到 1000 寬，其他系統保留原尺寸。
import { execFile, execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { findChrome } from "./find-chrome.mjs";

const exec = promisify(execFile);
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

const base = opt("--base", process.env.SUNUI_BASE || "http://localhost:3100").replace(/\/$/, "");
const only = opt("--only", "").split(",").map((s) => s.trim()).filter(Boolean);
const missingOnly = args.includes("--missing");
const jobs = Math.max(1, Number(opt("--jobs", 4)) || 4);
const out = path.join(root, "public", "og", "blocks");

const VIEWPORT = { width: 1280, height: 900 };
const ASPECT = 640 / 550; // OG 右側畫框
const PAD = 48; // 內容四周留白（CSS px）
const MIN_WIDTH = 520; // 小按鈕不要被放到糊掉
const SETTLE = 3500; // demo 掛上後等進場動畫跑完
const TIMEOUT = 60_000;

const found = findChrome();
if (!found) fail("找不到 Chrome。用環境變數 CHROME 指定瀏覽器執行檔。");
const { chrome, shell } = found;
const hasSips = (() => {
  try {
    execFileSync("sips", ["--help"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

const readNames = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")).items.map((i) => i.name) : []);
const all = [...readNames(path.join(root, "registry.json")), ...readNames(path.join(root, "registry", "pro", "registry.json"))];
const existing = (name) => [".jpg", ".png"].some((ext) => fs.existsSync(path.join(out, name + ext)));
const unknown = only.filter((n) => !all.includes(n));
if (unknown.length) fail(`沒有這些 block：${unknown.join(", ")}`);
const names = (only.length ? only : all).filter((n) => !missingOnly || !existing(n));
if (!names.length) {
  console.log("沒有要截的 block。");
  process.exit(0);
}

// 網站要先跑起來；第一次請求也順便讓 dev server 把預覽頁編譯好
try {
  const res = await fetch(`${base}/preview/${names[0]}`);
  if (!res.ok) fail(`${base}/preview/${names[0]} 回應 ${res.status}。`);
} catch {
  fail(`連不到 ${base}。先在 repo 根目錄執行 npm run web:dev，或用 --base 指定網址。`);
}

fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(root, "check-out"), { recursive: true });
const work = fs.mkdtempSync(path.join(root, "check-out", ".og-"));
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
  await page("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, deviceScaleFactor: 2, mobile: false });
  return {
    page,
    waitEvent,
    evaluate,
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

// 在頁面裡量 block 內容的外框（文件座標）。和舞台一樣寬的外層容器不算，否則每張都是整個視窗；
// 跑出視窗左右的部分（跑馬燈的軌道）截掉。順便移掉 dev server 的 Next 標誌。
const measure = `(() => {
  document.querySelectorAll("nextjs-portal").forEach((n) => n.remove());
  const wrap = document.querySelector("[data-preview-stage]")?.firstElementChild;
  if (!wrap) return null;
  const vw = innerWidth;
  const full = wrap.getBoundingClientRect().width * 0.98;
  let box = null;
  // 看得到的範圍：往上被 overflow 裁掉的部分不算，整串祖先有一個透明就整個不算
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
    // 太高的 block：寬度用滿，取上半部
    w = box.vw;
    h = w / ASPECT;
  }
  if (h > box.dh) {
    // 文件比畫框矮：整個縮小，不要截到文件底下的空白
    h = box.dh;
    w = h * ASPECT;
  }
  const x = Math.min(Math.max(0, cx - w / 2), box.vw - w);
  const tall = box.b - box.t + PAD * 2 > h;
  // 不超出文件底部，否則多出一截白
  const y = Math.max(0, Math.min(tall ? box.t - PAD : (box.t + box.b) / 2 - h / 2, box.dh - h));
  return { x, y, width: w, height: h, scale: 1 };
}

async function capture(browser, name) {
  const loaded = browser.waitEvent("Page.loadEventFired", TIMEOUT);
  await browser.page("Page.navigate", { url: `${base}/preview/${name}` });
  await loaded;
  // demo 是 ssr: false 的動態載入，dev server 第一次還要編譯，等它真的掛上
  const deadline = Date.now() + TIMEOUT;
  while (!(await browser.evaluate(measure))) {
    if (Date.now() > deadline) throw new Error("demo 沒有渲染出來");
    await sleep(300);
  }
  await sleep(SETTLE);
  const box = await browser.evaluate(measure);
  const { data } = await browser.page("Page.captureScreenshot", {
    format: "jpeg",
    quality: 86,
    clip: clipFor(box),
    captureBeyondViewport: true,
  });
  const file = path.join(out, `${name}.jpg`);
  fs.rmSync(path.join(out, `${name}.png`), { force: true });
  fs.writeFileSync(file, Buffer.from(data, "base64"));
  if (hasSips) await exec("sips", ["--resampleWidth", "1000", "-s", "formatOptions", "82", file]);
}

console.log(`瀏覽器：${chrome}\n截 ${names.length} 個 block，同時 ${jobs} 個…`);
const failed = [];
let next = 0;
let done = 0;
try {
  await Promise.all(
    Array.from({ length: Math.min(jobs, names.length) }, async (_, slot) => {
      let browser = await openBrowser(slot);
      while (next < names.length) {
        const name = names[next++];
        try {
          await capture(browser, name);
        } catch (error) {
          failed.push(`${name}: ${error.message.split("\n")[0]}`);
          // 卡住的分頁可能拖累下一張，換一個乾淨的瀏覽器
          await browser.close();
          browser = await openBrowser(slot);
        }
        done += 1;
        process.stdout.write(`\r  ${done}/${names.length}`);
      }
      await browser.close();
    }),
  );
} finally {
  fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

console.log(`\n輸出：${path.relative(process.cwd(), out)}`);
if (failed.length) {
  console.error(`\n${failed.length} 個失敗：\n${failed.map((f) => `  - ${f}`).join("\n")}`);
  process.exit(1);
}
