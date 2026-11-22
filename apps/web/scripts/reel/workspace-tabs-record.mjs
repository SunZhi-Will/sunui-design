// Records the workspace-tabs showcase (/preview/workspace-tabs) for the explainer video: headless Chrome at 2x,
// a drawn cursor with click ripples, scripted clicks. Run twice, then cut with workspace-tabs-edit.py:
//
//   node apps/web/scripts/reel/workspace-tabs-record.mjs [--base http://localhost:3100]
//   SLOW=1 node apps/web/scripts/reel/workspace-tabs-record.mjs [--base ...]
//   python3 -I apps/web/scripts/reel/workspace-tabs-edit.py reports/assets/<name>.mp4
//
// The normal pass writes frames/, frames.json and marks.json to apps/web/check-out/reel-workspace-tabs/ (gitignored).
// SLOW=1 records one collapse and one expand with the whole page at quarter speed (page clock and CSS animations
// both slowed), so the slow-motion scenes are real frames, not interpolated ones. Needs the site running.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { findChrome } from "../find-chrome.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const OUT = path.join(root, "check-out", "reel-workspace-tabs");
const SLOW = process.env.SLOW === "1";
const FRAMES = path.join(OUT, SLOW ? "frames_slow" : "frames");
fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });
const argi = process.argv.indexOf("--base");
const BASE = (argi > 0 ? process.argv[argi + 1] : process.env.SUNUI_BASE || "http://localhost:3100").replace(/\/$/, "");
const URL_ = `${BASE}/preview/workspace-tabs?l=zh-TW`;
const VIEW = { width: 1000, height: 640 };
const DPR = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { chrome, shell } = findChrome();
const proc = spawn(chrome, [...(shell ? [] : ["--headless=new"]), "--hide-scrollbars", "--force-device-scale-factor=2", "--window-size=1000,640", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${path.join(OUT, `profile-${Date.now()}`)}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
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
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
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
const evaluate = async (expr) => (await page("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

await page("Page.enable");
await page("Animation.enable");
await page("Runtime.enable");
await page("Emulation.setDeviceMetricsOverride", { width: VIEW.width, height: VIEW.height, deviceScaleFactor: DPR, mobile: false });
await page("Page.addScriptToEvaluateOnNewDocument", {
  source: `try{localStorage.setItem("sunui-theme","dark")}catch(e){}
  (()=>{const realNow=performance.now.bind(performance);let scale=1,aR=realNow(),aV=aR;
    window.__setScale=s=>{const r=realNow();aV=aV+(r-aR)*scale;aR=r;scale=s;};
    performance.now=()=>aV+(realNow()-aR)*scale;
    const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(()=>cb(performance.now()));})();
  addEventListener("DOMContentLoaded",()=>{
    const st=document.createElement("style");
    st.textContent="nextjs-portal{display:none!important}[data-preview-stage] p{display:none!important}#__cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:26px;height:26px;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px rgb(0 0 0/.5))}.__ring{position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:2px solid #7aa2ff;animation:__r .5s ease-out forwards}@keyframes __r{from{opacity:.9;transform:scale(.4)}to{opacity:0;transform:scale(1.3)}}";
    document.head.appendChild(st);
    const c=document.createElement("div");c.id="__cur";
    c.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 3l14 8-6.5 1.5L9.5 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    addEventListener("mousemove",e=>{c.style.transform="translate("+(e.clientX-4)+"px,"+(e.clientY-2)+"px)"},true);
    addEventListener("mousedown",e=>{const r=document.createElement("div");r.className="__ring";r.style.left=e.clientX+"px";r.style.top=e.clientY+"px";document.body.appendChild(r);setTimeout(()=>r.remove(),600)},true);
  });`,
});
await page("Page.navigate", { url: URL_ });
await sleep(7000);

const box = (sel, nth = 0) =>
  evaluate(`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${nth}]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
const frame = await box(".h-\\[520px\\]");
if (!frame) throw new Error("showcase frame not found");

// Frames
const frames = [];
let t0 = null;
listeners.add(async (msg) => {
  if (msg.method !== "Page.screencastFrame" || msg.sessionId !== sessionId) return;
  const { data, metadata, sessionId: sid } = msg.params;
  page("Page.screencastFrameAck", { sessionId: sid });
  const ts = metadata.timestamp;
  if (t0 === null) t0 = ts;
  const n = frames.length;
  fs.writeFileSync(path.join(FRAMES, `${String(n).padStart(5, "0")}.jpg`), Buffer.from(data, "base64"));
  frames.push(ts - t0);
});

let pos = { x: frame.x + frame.w * 0.6, y: frame.y + frame.h * 0.6 };
const mouse = (type, extra = {}) => page("Input.dispatchMouseEvent", { type, x: pos.x, y: pos.y, button: "left", ...extra });
async function glide(to, ms) {
  const from = { ...pos };
  const steps = Math.max(1, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const e = 1 - Math.pow(1 - k, 3);
    pos = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
    await mouse("mouseMoved");
    await sleep(16);
  }
}
const marks = [];
const start = Date.now();
const mark = (name) => marks.push({ name, t: (Date.now() - start) / 1000 });
async function click(sel, nth = 0, ms = 500, name = sel) {
  const b = await box(sel, nth);
  if (!b) throw new Error(`missing ${sel} ${nth}`);
  await glide({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, ms);
  await sleep(120);
  mark(name);
  await mouse("mousePressed", { clickCount: 1 });
  await sleep(70);
  await mouse("mouseReleased", { clickCount: 1 });
}

await page("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1, maxWidth: VIEW.width * DPR, maxHeight: VIEW.height * DPR });
await mouse("mouseMoved");
// Keep the page repainting every frame so the screencast stays at full rate even when nothing moves
await evaluate(`(() => { const d = document.createElement("div"); d.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:.01;z-index:2147483647"; document.body.appendChild(d); let k = 0; (function f(){ d.style.transform = "translateX(" + (k++ % 2) + "px)"; requestAnimationFrame(f); })(); })()`);
await sleep(700);
const toggle = 'button[aria-expanded][title]';
if (SLOW) {
  // Cursor in place at normal speed, then everything on the page runs at a quarter speed for one collapse and one expand
  const tb = await box(toggle);
  await glide({ x: tb.x + tb.w / 2, y: tb.y + tb.h / 2 }, 500);
  await sleep(400);
  await evaluate("window.__setScale(0.25)");
  await page("Animation.setPlaybackRate", { playbackRate: 0.25 });
  await sleep(300);
  mark("collapse_slow");
  await mouse("mousePressed", { clickCount: 1 });
  await sleep(70);
  await mouse("mouseReleased", { clickCount: 1 });
  await sleep(2600);
  mark("expand_slow");
  await mouse("mousePressed", { clickCount: 1 });
  await sleep(70);
  await mouse("mouseReleased", { clickCount: 1 });
  await sleep(2600);
} else {
await click(toggle, 0, 650, "collapse1");
await sleep(1300);
await click(toggle, 0, 200, "expand1");
await sleep(1300);
await click(toggle, 0, 200, "collapse2");
await sleep(1300);
await click(toggle, 0, 200, "expand2");
await sleep(1100);
await click("[role=tab]", 1, 600, "tab2");
await sleep(900);
await click("[role=tab]", 2, 500, "tab3");
await sleep(900);
await click("[role=tab]", 0, 600, "tab1");
await sleep(900);
await click("button[title]:not([aria-expanded])", 0, 600, "add");
await sleep(1100);
await click("[data-on=true] button", 0, 450, "close");
await sleep(1200);
}
await page("Page.stopScreencast");
await sleep(300);

const boxes = {
  frame,
  toggle: await box(toggle),
  brand: await box("[data-shell-brand]"),
};
fs.writeFileSync(path.join(OUT, SLOW ? "frames_slow.json" : "frames.json"), JSON.stringify(frames));
fs.writeFileSync(path.join(OUT, SLOW ? "marks_slow.json" : "marks.json"), JSON.stringify({ marks, boxes, dpr: DPR, view: VIEW }, null, 2));
console.log(`frames ${frames.length}, duration ${frames.at(-1)?.toFixed(2)}s, fps ~${(frames.length / frames.at(-1)).toFixed(1)}`);
console.log(JSON.stringify(marks));
ws.close();
proc.kill();
process.exit(0);
