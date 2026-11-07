// 找本機的 Chrome 系瀏覽器執行檔，給 check-icons.mjs 與 capture-og.mjs 共用。
// 順序：環境變數 CHROME，Playwright 的 headless shell（最快也最穩），再來是一般安裝的瀏覽器。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

/** 回傳瀏覽器路徑與它是不是 headless shell（shell 不吃 --headless=new）；找不到回傳 null。 */
export function findChrome() {
  // Brave 這類日常用的瀏覽器在無頭模式下可能卡住，排最後
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
  if (!chrome) return null;
  return { chrome, shell: /headless[_-]shell/.test(chrome) };
}
