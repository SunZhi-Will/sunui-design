// 首頁型錄卡片檢查：在實際卡片尺寸下載入每一張卡，量 FitStage 的縮放比例與橫向溢出。
// 一張卡只該放一個主角，縮得太小或被卡片邊緣切掉，代表卡片內容選錯了（該寫 card.tsx 或 variants.tsx）。
//
// 用法（先跑 npm run web:dev）：
//   node scripts/check-cards.mjs                 報告模式：列出不合格的卡，不會失敗
//   node scripts/check-cards.mjs --strict        有不合格的卡就以 exit code 1 結束
//   node scripts/check-cards.mjs --only a,b      只檢查這幾個 block
//   node scripts/check-cards.mjs --json out.json 另存完整量測值
//   --base http://localhost:3100                 換 dev server 位址
//
// 不需要額外套件：用本機的 Chrome / Chromium（或 Playwright 快取裡的 headless shell），
// 透過 DevTools Protocol 控制。找不到時用 CHROME=/path/to/chrome 指定。
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const base = (option("--base") ?? "http://localhost:3100").replace(/\/$/, "");
const only = option("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
const jsonOut = option("--json");
const strict = flag("--strict");

// 卡片尺寸：lg 三欄（max-w-6xl）是首頁主要看到的大小；sm 兩欄（640px 寬）是最窄的卡
const SIZES = [
  { key: "lg", width: 357, height: 286, minScale: 0.6 },
  { key: "sm", width: 288, height: 230, minScale: 0.5 },
];
// 超出卡片邊緣幾個像素以上才算被切掉（抗鋸齒與次像素誤差）
const OVERFLOW_TOLERANCE = 4;
// iframe 載入後等多久再量：FitStage 在 400 / 1200 / 2500ms 會補量一次
const SETTLE_MS = 3000;
const CONCURRENCY = 8;

// ---------- 要檢查哪些卡 ----------

function readJson(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

function readGenerated() {
  const file = path.join(root, "registry", "__generated__", "variants.ts");
  if (!existsSync(file)) throw new Error("registry/__generated__/variants.ts 不存在，先跑 node scripts/generate-previews.mjs");
  const src = readFileSync(file, "utf8");
  const pick = (name) => JSON.parse(src.match(new RegExp(`${name}[^=]*=\\s*(\\{[\\s\\S]*?\\});`))[1]);
  return { variantIds: pick("variantIds"), variantFeatured: pick("variantFeatured") };
}

const names = [
  ...(readJson(path.join(root, "registry.json"))?.items ?? []),
  ...(readJson(path.join(root, "registry", "pro", "registry.json"))?.items ?? []),
].map((item) => item.name);
const { variantIds, variantFeatured } = readGenerated();

const targets = names
  .filter((name) => !only || only.includes(name))
  .flatMap((name) =>
    variantIds[name]
      ? variantIds[name].map((variant) => ({
          label: `${name}~${variant}${variantFeatured[name] === variant ? " *" : ""}`,
          url: `/preview/${name}/v/${encodeURIComponent(variant)}`,
        }))
      : [{ label: name, url: `/preview/${name}/card` }],
  );

if (!targets.length) {
  console.error("沒有要檢查的卡片");
  process.exit(1);
}

// ---------- 瀏覽器 ----------

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  // Playwright 下載過的 headless shell
  const cache = [path.join(os.homedir(), "Library", "Caches", "ms-playwright"), path.join(os.homedir(), ".cache", "ms-playwright")];
  for (const dir of cache) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir).filter((d) => d.startsWith("chromium")).sort().reverse()) {
      for (const sub of readdirSync(path.join(dir, entry))) {
        for (const bin of ["chrome-headless-shell", "headless_shell", "chrome"]) candidates.push(path.join(dir, entry, sub, bin));
      }
    }
  }
  return candidates.find((file) => existsSync(file));
}

async function launch() {
  const bin = findChrome();
  if (!bin) throw new Error("找不到 Chrome / Chromium，用 CHROME=/path/to/chrome 指定");
  const profile = mkdtempSync(path.join(os.tmpdir(), "sunui-check-cards-"));
  const proc = spawn(
    bin,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--window-size=1600,1200",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const wsUrl = await new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("Chrome 沒有在 15 秒內啟動")), 15000);
    proc.stderr.on("data", (chunk) => {
      buffer += chunk;
      const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    proc.on("exit", (code) => reject(new Error(`Chrome 結束了（${code}）：${buffer.slice(-500)}`)));
  });
  const close = () => {
    proc.kill();
    // Chrome 收到 kill 後還會寫一下設定檔，刪不掉就留給系統清暫存
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {}
  };
  return { wsUrl, close };
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve({ send, close: () => ws.close() }));
    ws.addEventListener("error", () => reject(new Error("連不上 DevTools")));
  });
}

// ---------- 在頁面裡跑的量測 ----------

// 這個函式會被序列化後在同源頁面裡執行：開 iframe 載入卡片、等 FitStage 量完、讀縮放與溢出
const measureInPage = async (batch, width, height, settle, tolerance) => {
  const one = (target) =>
    new Promise((resolve) => {
      const frame = document.createElement("iframe");
      frame.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;border:0`;
      let done = false;
      const finish = (result) => {
        if (done) return;
        done = true;
        frame.remove();
        resolve({ label: target.label, ...result });
      };
      const timeout = setTimeout(() => finish({ error: "timeout" }), 45000);
      frame.onload = () =>
        setTimeout(() => {
          clearTimeout(timeout);
          try {
            const doc = frame.contentDocument;
            const win = frame.contentWindow;
            const stage = doc.querySelector("[data-fit-stage]");
            if (!stage) return finish({ error: "no FitStage (404?)" });
            const content = stage.querySelector(":scope > div[style]");
            const match = content?.style.transform.match(/scale\(([\d.]+)\)/);
            const scale = match ? Number(match[1]) : 0;
            const block = content?.firstElementChild?.firstElementChild;
            if (!block || !block.getBoundingClientRect().height) return finish({ scale, error: "empty" });

            // 橫向溢出：真的畫出東西的元素（文字、圖、底色、邊框、陰影），可見範圍（扣掉會裁切的祖先）超出 iframe 多少。
            // 只負責排版的透明外框（例如置中用的 flex 容器）比卡片寬是正常的，不算
            const REPLACED = new Set(["IMG", "svg", "CANVAS", "VIDEO", "INPUT", "TEXTAREA", "SELECT", "BUTTON", "IFRAME"]);
            const transparent = (color) => color === "transparent" || /,\s*0\)$|\/\s*0\)$/.test(color);
            const paints = (el) => {
              if (REPLACED.has(el.tagName)) return true;
              const s = win.getComputedStyle(el);
              return (
                !transparent(s.backgroundColor) ||
                s.backgroundImage !== "none" ||
                s.boxShadow !== "none" ||
                ["Top", "Right", "Bottom", "Left"].some((side) => parseFloat(s[`border${side}Width`]) > 0 && !transparent(s[`border${side}Color`]))
              );
            };
            const visibleSpan = (rect, from) => {
              let left = rect.left;
              let right = rect.right;
              for (let a = from; a && a !== stage; a = a.parentElement) {
                if (win.getComputedStyle(a).overflowX === "visible") continue;
                const box = a.getBoundingClientRect();
                left = Math.max(left, box.left);
                right = Math.min(right, box.right);
              }
              return right - left > 1 ? Math.max(right - win.innerWidth, -left) : 0;
            };
            let overflow = 0;
            const all = content.querySelectorAll("*");
            for (let i = 0; i < all.length && i < 4000; i++) {
              const el = all[i];
              if (el.closest("svg") && el.tagName !== "svg") continue;
              const rect = el.getBoundingClientRect();
              if (!rect.width || !rect.height) continue;
              if (win.getComputedStyle(el).visibility === "hidden") continue;
              if (paints(el)) overflow = Math.max(overflow, visibleSpan(rect, el.parentElement));
            }
            // 文字用文字本身的範圍量，不用它所在的區塊
            const walker = doc.createTreeWalker(content, NodeFilter.SHOW_TEXT);
            const range = doc.createRange();
            for (let node = walker.nextNode(), n = 0; node && n < 4000; node = walker.nextNode(), n++) {
              if (!node.textContent.trim() || node.parentElement.closest("svg, style, script")) continue;
              if (win.getComputedStyle(node.parentElement).visibility === "hidden") continue;
              range.selectNodeContents(node);
              const rect = range.getBoundingClientRect();
              if (rect.width && rect.height) overflow = Math.max(overflow, visibleSpan(rect, node.parentElement));
            }
            finish({ scale, overflow: Math.round(overflow), height: Math.round(content.offsetHeight) });
          } catch (error) {
            finish({ error: String(error) });
          }
        }, settle);
      frame.src = target.url;
      document.body.appendChild(frame);
    });
  return Promise.all(batch.map(one));
};

// ---------- 主流程 ----------

async function main() {
  try {
    const res = await fetch(`${base}/robots.txt`);
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    console.error(`連不上 ${base}，先跑 npm run web:dev`);
    process.exit(1);
  }

  const { wsUrl, close } = await launch();
  const results = new Map(targets.map((t) => [t.label, { label: t.label }]));
  try {
    const cdp = await connect(wsUrl);
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    // 任何同源的輕量頁面都可以當宿主；robots.txt 不會載入任何元件
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.navigate", { url: `${base}/robots.txt` }, sessionId);
    await new Promise((r) => setTimeout(r, 800));

    const total = targets.length * SIZES.length;
    let finished = 0;
    for (const size of SIZES) {
      for (let i = 0; i < targets.length; i += CONCURRENCY) {
        const batch = targets.slice(i, i + CONCURRENCY).map((t) => ({ label: t.label, url: base + t.url }));
        const expression = `(${measureInPage.toString()})(${JSON.stringify(batch)}, ${size.width}, ${size.height}, ${SETTLE_MS}, ${OVERFLOW_TOLERANCE})`;
        const { result, exceptionDetails } = await cdp.send(
          "Runtime.evaluate",
          { expression, awaitPromise: true, returnByValue: true },
          sessionId,
        );
        if (exceptionDetails) throw new Error(exceptionDetails.text);
        for (const r of result.value) results.get(r.label)[size.key] = r;
        finished += batch.length;
        process.stderr.write(`\r量測中 ${finished}/${total}`);
      }
    }
    process.stderr.write("\n");
    cdp.close();
  } finally {
    close();
  }

  // ---------- 判定與輸出 ----------

  const rows = [...results.values()].map((row) => {
    const problems = [];
    for (const size of SIZES) {
      const r = row[size.key];
      if (!r) continue;
      if (r.error) problems.push(`${size.key}: ${r.error}`);
      else {
        if (r.scale < size.minScale) problems.push(`${size.key} 縮到 ${r.scale.toFixed(2)}`);
        if (r.overflow > OVERFLOW_TOLERANCE) problems.push(`${size.key} 橫向超出 ${r.overflow}px`);
      }
    }
    return { ...row, problems };
  });
  const failing = rows.filter((r) => r.problems.length).sort((a, b) => (a.lg?.scale ?? 0) - (b.lg?.scale ?? 0));

  if (jsonOut) writeFileSync(path.resolve(jsonOut), JSON.stringify(rows, null, 2));

  console.log(`\n檢查 ${rows.length} 張卡（* 是首頁收合時的代表樣式）`);
  console.log(`規則：lg ${SIZES[0].width}×${SIZES[0].height} 縮放 ≥ ${SIZES[0].minScale}，sm ${SIZES[1].width}×${SIZES[1].height} 縮放 ≥ ${SIZES[1].minScale}，不能被卡片邊緣切掉\n`);
  if (!failing.length) {
    console.log("全部合格");
    return;
  }
  const width = Math.max(...failing.map((r) => r.label.length));
  for (const row of failing) {
    const lg = row.lg?.scale != null ? row.lg.scale.toFixed(2) : "  - ";
    console.log(`  ${row.label.padEnd(width)}  lg ${lg}  ${row.problems.join("、")}`);
  }
  console.log(`\n${failing.length} 張不合格。修法：寫 card.tsx 只放一個主角，或效果庫用 variants.tsx 拆成一種一張。`);
  if (strict) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
