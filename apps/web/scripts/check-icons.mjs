#!/usr/bin/env node
// 圖示自檢：用無頭 Chrome 截下 /preview/icons 的每一頁，給人或 agent 對照 ICONS.md 檢查。
// 不需要任何 npm 套件，只要本機有 Chrome 系的瀏覽器，以及正在跑的網站（npm run web:dev）。
//
//   node apps/web/scripts/check-icons.mjs [--set line|pixel|all] [--only a,b] [--with c,d]
//                                         [--theme light|dark|both] [--no-accent] [--scale 3]
//                                         [--base http://localhost:3100] [--out dir]
//
// 輸出（預設在 apps/web/check-out/icons/）：
//   <set>-sizes-<theme>.png   每個圖示在三種尺寸下（線條 16/24/48，像素 16/32/48）
//   <set>-frames-<theme>.png  動態版：線條是 rest 與 active 的 0% 到 100%；像素是靜止格加每一格
// 圖示多時自動分頁（sizes 每頁 48 個、frames 每頁 24 個），檔名加 -1、-2…
// 並印出頁面載入時的腳本錯誤與不存在的圖示名稱；有任何一項就以非零結束。
//
// --only 只看這些圖示；--with 把現有圖示放在前面一起比較（標成 ref）；--no-accent 關掉朱紅，
// 檢查 accent 部位在單色下還分得出來；--scale 預設 2，查細縫時用 3 或 4。CHROME 可指定瀏覽器路徑。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(name);
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const setArg = opt("--set", "all");
const themeArg = opt("--theme", "both");
const only = opt("--only", "");
const refs = opt("--with", "");
const scale = Math.max(1, Number(opt("--scale", 2)) || 2);
const base = opt("--base", process.env.SUNUI_BASE || "http://localhost:3100").replace(/\/$/, "");
const out = path.resolve(opt("--out", path.join(root, "check-out", "icons")));

if (!["line", "pixel", "all"].includes(setArg)) fail("--set takes line, pixel or all.");
if (!["light", "dark", "both"].includes(themeArg)) fail("--theme takes light, dark or both.");
const sets = setArg === "all" ? ["line", "pixel"] : [setArg];
const themes = themeArg === "both" ? ["light", "dark"] : [themeArg];

// Playwright 下載的瀏覽器（macOS 與 Linux 的快取位置），版本新的優先
const playwright = [path.join(os.homedir(), "Library/Caches/ms-playwright"), path.join(os.homedir(), ".cache/ms-playwright")];
const fromPlaywright = (prefix, rel) =>
  playwright
    .filter((dir) => fs.existsSync(dir))
    .flatMap((dir) =>
      fs
        .readdirSync(dir)
        .filter((d) => new RegExp(`^${prefix}-\\d+$`).test(d))
        .sort((a, b) => Number(b.split("-").pop()) - Number(a.split("-").pop()))
        .flatMap((d) => rel.map((r) => path.join(dir, d, r))),
    );
// headless shell 最快也最穩；Brave 這類日常用的瀏覽器在無頭模式下可能卡住，排最後
const chrome = [
  process.env.CHROME,
  ...fromPlaywright("chromium_headless_shell", [
    "chrome-headless-shell-mac-arm64/chrome-headless-shell",
    "chrome-headless-shell-mac-x64/chrome-headless-shell",
    "chrome-headless-shell-linux64/chrome-headless-shell",
    "chrome-linux/headless_shell",
  ]),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ...fromPlaywright("chromium", [
    "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    "chrome-linux/chrome",
  ]),
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
].find((p) => p && fs.existsSync(p));
if (!chrome) fail("找不到 Chrome。用環境變數 CHROME 指定瀏覽器執行檔。");
const shell = /headless[_-]shell/.test(chrome);
// 單次瀏覽器呼叫的上限，避免卡住
const TIMEOUT = 90_000;

// 網站要先跑起來；第一次請求也順便讓 dev server 把頁面編譯好
const pageUrl = (set, sheet, theme, page = 1) => {
  const q = new URLSearchParams({ set, sheet, theme, page: String(page) });
  if (only) q.set("only", only);
  if (refs) q.set("with", refs);
  if (flag("--no-accent")) q.set("accent", "off");
  return `${base}/preview/icons?${q}`;
};
try {
  const res = await fetch(pageUrl(sets[0], "sizes", "light"));
  if (!res.ok) fail(`${base}/preview/icons 回應 ${res.status}。`);
} catch {
  fail(`連不到 ${base}。先在 repo 根目錄執行 npm run web:dev，或用 --base 指定網址。`);
}

fs.mkdirSync(out, { recursive: true });
const work = fs.mkdtempSync(path.join(out, ".work-"));
const common = [
  ...(shell ? [] : ["--headless=new"]),
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--force-prefers-reduced-motion",
  `--user-data-dir=${path.join(work, "profile")}`,
  "--virtual-time-budget=8000",
];

const attr = (html, name) => html.match(new RegExp(`<html[^>]*\\sdata-${name}="([^"]*)"`))?.[1];
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const run = (argv, options = {}) => {
  try {
    return execFileSync(chrome, argv, { timeout: TIMEOUT, killSignal: "SIGKILL", ...options });
  } catch (error) {
    if (error.signal === "SIGKILL") fail(`瀏覽器超過 ${TIMEOUT / 1000} 秒沒有結束：${chrome}\n用 CHROME 換一個瀏覽器（建議 Playwright 的 chrome-headless-shell）。`);
    throw error;
  }
};

console.log(`瀏覽器：${chrome}`);
const problems = [];
const written = [];
try {
  for (const set of sets) {
    for (const sheet of ["sizes", "frames"]) {
      let pages = 1;
      for (let page = 1; page <= pages; page += 1) {
        // 先讀 DOM：拿到錯誤、不存在的名稱、總頁數，以及這一頁的實際尺寸
        const dom = run([...common, "--window-size=1400,900", "--dump-dom", pageUrl(set, sheet, themes[0], page)], {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
          stdio: ["ignore", "pipe", "ignore"],
        });
        if (attr(dom, "ready") !== "1") {
          problems.push(`${set}/${sheet}: 頁面沒有渲染完成`);
          break;
        }
        const err = attr(dom, "err");
        if (err) problems.push(`${set}/${sheet}: ${unescape(err)}`);
        const unknown = attr(dom, "unknown");
        if (unknown) problems.push(`${set}: 沒有這些圖示 ${unknown}`);
        pages = Number(attr(dom, "pages")) || 1;
        const w = Math.min(4000, Number(attr(dom, "w")) || 1400);
        const h = Math.min(16000, Number(attr(dom, "h")) || 900);

        for (const theme of themes) {
          const suffix = pages > 1 ? `-${page}` : "";
          const file = path.join(out, `${set}-${sheet}-${theme}${suffix}.png`);
          run(
            [...common, `--window-size=${w},${h}`, `--force-device-scale-factor=${scale}`, `--screenshot=${file}`, pageUrl(set, sheet, theme, page)],
            { stdio: "ignore" },
          );
          written.push(path.relative(process.cwd(), file));
        }
      }
    }
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

console.log(written.map((f) => `  ${f}`).join("\n"));
const unique = [...new Set(problems)];
if (unique.length) {
  console.error(`\n${unique.length} 個問題：\n${unique.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("\n沒有腳本錯誤。");
