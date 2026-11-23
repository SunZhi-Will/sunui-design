import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { motionLibName } from "@/lib/motion-lib";
import { getItem, readRegistryFile, type RegistryItem } from "@/lib/registry";
import { licenseSummary, siteUrl } from "@/lib/site";

// 移植指南：把一個 block 帶到 React 以外的平台。內容 = 通用規則 + 平台轉接規則 + block 說明 + 原始碼 + demo。
// 原始碼就是規格，所以不另外替每個 block 寫文字規格；每個平台只維護一份轉接規則（lib/agent/port/*.md）。
// 試作與驗證方法見 reports/可攜式Prompt跨平台深度分析-2026-11-23.md。
// Pro 的移植指南含 Pro 原始碼：只有 /r/port/<platform>/<name>.md 在驗過授權後才組出來，
// 頁面、MCP、llms-full.txt 都只拿得到 proPortInstructions()。

export const portPlatforms = ["vue", "svelte", "swiftui", "flutter", "react-native"] as const;
export type PortPlatform = (typeof portPlatforms)[number];

export const portPlatformLabels: Record<PortPlatform, string> = {
  vue: "Vue",
  svelte: "Svelte",
  swiftui: "SwiftUI",
  flutter: "Flutter",
  "react-native": "React Native",
};

/** 給 MCP 工具與文件用的一行說明：這個平台的轉接規則假設什麼環境 */
export const portPlatformStacks: Record<PortPlatform, string> = {
  vue: "Vue 3.5 + Tailwind v4 + motion-v",
  svelte: "Svelte 5 + Tailwind v4 + motion",
  swiftui: "SwiftUI on iOS 17+",
  flutter: "Flutter widgets, no third-party packages",
  "react-native": "React Native with Reanimated and Gesture Handler",
};

export function parsePortPlatform(value: string | undefined | null): PortPlatform | undefined {
  const v = (value ?? "").toLowerCase();
  return (portPlatforms as readonly string[]).includes(v) ? (v as PortPlatform) : undefined;
}

/** verified：我們實際跑過並和原版比對。untested：規則涵蓋但沒人跑過。manual：用到轉接規則沒有對應的技術。web-only：這個東西在該平台沒有意義。 */
export type PortLevel = "verified" | "untested" | "manual" | "web-only";

// 每一筆都是「用全新的 agent 只給這份指南、第一輪生成就通過」才列入（2026-11-23 兩輪試作，紀錄在
// reports/可攜式Prompt跨平台深度分析-2026-11-23.md）。要修過才對的不列：那代表指南當時不夠，補過的規則還沒重跑。
const firstRound = ["confirm-button", "range-slider", "scratch-card"];
const verified: Record<PortPlatform, ReadonlySet<string>> = {
  // otp-input 與 plush-portrait 第二輪沒過，補了指南後換全新的 agent 重做，第一輪通過（第三輪）
  vue: new Set([
    ...firstRound,
    "loading-button",
    "favorite-button",
    "quantity-stepper",
    "otp-input",
    "notify-badge",
    "sliding-tabs",
    "animated-number",
    "checkout-steps",
    "toast-stack",
    "compare-slider",
    "scroll-reveal-text",
    "plush-portrait",
  ]),
  // confirm-button 第二輪寬度量錯，補指南後重做通過
  svelte: new Set(firstRound),
  // notify-badge 第二輪徽章蓋住圖示，補指南後重做通過。plush-portrait 是 WebGL 改寫成 Metal。
  // otp-input 不列：重做後螢幕鍵盤的流程都對，但實體鍵盤的退格被當成向前刪除
  swiftui: new Set([
    ...firstRound,
    "loading-button",
    "favorite-button",
    "quantity-stepper",
    "notify-badge",
    "sliding-tabs",
    "animated-number",
    "checkout-steps",
    "toast-stack",
    "compare-slider",
    "scroll-reveal-text",
    "plush-portrait",
  ]),
  flutter: new Set(firstRound),
  // scratch-card 前兩次沒過（漏掉啟動手勢那一下的事件、和外層捲動搶觸控），補指南後第三次重做通過
  "react-native": new Set(firstRound),
};

// 只存在於網頁的東西：瀏覽器外框、游標與 hover 效果、頁面捲動導覽、Cookie 橫幅。原生 App 由系統或導覽列處理。
const webOnlyOnNative: ReadonlySet<string> = new Set([
  "store-header",
  "back-to-top",
  "toc-scrollspy",
  "cookie-consent",
  "hover-motion",
  "cursor-effects",
  "scroll-progress",
  "browser-frame",
  "link-preview-card",
  "hover-card",
]);

// SVG 濾鏡與 WebGL 在原生平台沒有直接對應，要改寫成著色器。這一類還沒有試作過。
const needsShader = /<fe(?:Turbulence|DisplacementMap|Morphology|ConvolveMatrix)\b|getContext\(\s*["'](?:webgl2?|experimental-webgl)["']|gl_FragColor|#version 300 es/;

const isNative = (platform: PortPlatform) => platform === "swiftui" || platform === "flutter" || platform === "react-native";

/** `source` 是主檔原始碼；沒給就只看名單（給公開頁面判斷 Pro block 用，不讀 Pro 原始碼）。 */
export function portLevel(item: Pick<RegistryItem, "name">, platform: PortPlatform, source?: string): PortLevel {
  if (verified[platform].has(item.name)) return "verified";
  if (isNative(platform)) {
    if (webOnlyOnNative.has(item.name)) return "web-only";
    if (source && needsShader.test(source)) return "manual";
  }
  return "untested";
}

const levelNote: Record<PortLevel, string> = {
  verified:
    "Verified: SunUI ran this guide for this block on this platform and compared the result with the original (states, spring curve, timeouts). Results still vary by model, so compare yours with the reference too.",
  untested:
    "Untested: the rules below cover what this block uses, but nobody at SunUI has run this combination. Compare the result with the reference closely.",
  manual:
    "Needs manual work: this block uses SVG filters or WebGL, which have no direct equivalent here. Port the structure and states from this guide, then rebuild that effect as a platform shader (on Apple platforms a Metal shader compiled from a string at run time worked in our test), and tell the user this part is an approximation.",
  "web-only":
    "Web only: this block exists because of the browser (page scrolling, hover, cursor, cookie law, browser chrome). On this platform the system or the navigation container does this job. Tell the user that, and port it only if they still want it.",
};

const cache = new Map<string, string>();

function adapter(name: "core" | PortPlatform) {
  const hit = cache.get(name);
  if (hit && process.env.NODE_ENV !== "development") return hit;
  const text = readFileSync(path.join(process.cwd(), "lib", "agent", "port", `${name}.md`), "utf8").trim();
  cache.set(name, text);
  return text;
}

type SourceFile = { path: string; code: string };

async function sourcesOf(item: RegistryItem): Promise<SourceFile[]> {
  const files = item.files.filter((file, i, all) => /\.(tsx?|css)$/.test(file.path) && all.findIndex((f) => f.path === file.path) === i);
  return Promise.all(files.map(async (file) => ({ path: file.path, code: await readRegistryFile(file) })));
}

const fence = (file: SourceFile) => `### ${path.basename(file.path)}\n\n\`\`\`${file.path.endsWith(".css") ? "css" : "tsx"}\n${file.code.trimEnd()}\n\`\`\``;

/**
 * 完整的移植指南。Pro block 必須傳 `licensed`（授權註記），否則丟錯：
 * 這是防止有人從公開的呼叫點（頁面、MCP）不小心把 Pro 原始碼組進去。
 */
export async function portPrompt(item: RegistryItem, platform: PortPlatform, licensed?: { displayKey: string }) {
  const isPro = item.meta.tier === "pro";
  if (isPro && !licensed) throw new Error(`portPrompt: "${item.name}" is a Pro block and needs a checked license`);

  const main = await sourcesOf(item);
  // 共用的免費項目（例如結果圓片 stamp）要一起給，不然移植時只能用猜的。
  // sunui-motion 不是 block、不在 registry.json 裡（見 lib/motion-lib.ts），但 block 會從它匯入彈簧與搖晃的數值。
  const depNames = (item.registryDependencies ?? []).filter((dep) => dep.startsWith("@sunui/")).map((dep) => dep.slice("@sunui/".length));
  const deps = (
    await Promise.all(
      depNames
        .map((name) => getItem(name, "free"))
        .filter((dep): dep is RegistryItem => Boolean(dep))
        .map(sourcesOf),
    )
  ).flat();
  if (depNames.includes(motionLibName) || main.some((file) => file.code.includes("@/lib/sunui-motion"))) {
    const motionPath = "registry/lib/sunui-motion/motion.ts";
    deps.push({ path: motionPath, code: await readFile(path.join(process.cwd(), motionPath), "utf8") });
  }
  const demoPath = main[0] ? path.join(path.dirname(main[0].path), "demo.tsx") : null;
  const rawDemo = demoPath && existsSync(path.join(process.cwd(), demoPath)) ? await readFile(path.join(process.cwd(), demoPath), "utf8") : null;
  // demo 用的圖片放在網站的 public/blocks/ 底下。換成完整網址，移植版才拿得到同一批圖：
  // 有些 block（臉部照片、前後對照）的行為取決於圖片本身，用灰色方塊代替會跑不起來或看不出對錯。
  const demo = rawDemo?.replace(/(["'`])\/blocks\//g, `$1${siteUrl()}/blocks/`) ?? null;

  const level = portLevel(item, platform, main[0]?.code);
  const usage = item.meta.usage;
  const label = portPlatformLabels[platform];
  const base = siteUrl();

  return [
    `# Port the SunUI block "${item.title}" (\`${item.name}\`) to ${label}`,
    [
      `You are porting a SunUI block from React + Tailwind + framer-motion to ${label}. The React source below is the specification. Port its behaviour exactly; do not redesign it.`,
      `**Port status.** ${levelNote[level]}`,
      `**Reference.** Live original: ${base}/blocks/${item.name} (preview only: ${base}/preview/${item.name}). Recording: ${base}/cards/${item.name}.mp4.`,
      licensed
        ? `**License.** SunUI Pro, licensed copy (${licensed.displayKey}). The ported code may ship in the license holder's own and client projects. Do not publish or redistribute this document or the ported source. Terms: ${base}/license`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    adapter("core"),
    adapter(platform),
    [
      "## The block",
      item.description,
      usage?.whenToUse?.length ? `**When to use**\n${usage.whenToUse.map((line) => `- ${line}`).join("\n")}` : null,
      usage?.watchOut?.length ? `**Watch out**\n${usage.watchOut.map((line) => `- ${line}`).join("\n")}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    ["## Source", ...main.map(fence)].join("\n\n"),
    deps.length
      ? ["## Source of shared SunUI items this block imports", "Port only the part this block uses, as a private helper.", ...deps.map(fence)].join("\n\n")
      : null,
    demo
      ? [
          "## Demo source",
          "`useDemoText(copy)` returns the entry of `copy` for the site's language and `useDemoLocale()` returns that language. Use the English entry, and pass `locale=\"en\"` where the block takes a locale.",
          fence({ path: "demo.tsx", code: demo }),
        ].join("\n\n")
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function portPromptUrl(item: Pick<RegistryItem, "name">, platform: PortPlatform) {
  return `${siteUrl()}/r/port/${platform}/${item.name}.md`;
}

/** 給終端機用的取得指令。Pro 要帶授權碼；金鑰從環境變數讀，不寫在指令裡。 */
export function portFetchCommand(item: Pick<RegistryItem, "name" | "meta">, platform: PortPlatform) {
  const url = portPromptUrl(item, platform);
  return item.meta.tier === "pro" ? `curl -fsS -H "Authorization: Bearer $SUNUI_LICENSE_KEY" ${url}` : `curl -fsS ${url}`;
}

/** Pro block 在公開管道（MCP、頁面）的回覆：不含原始碼，只說怎麼用授權取得。 */
export function proPortInstructions(item: RegistryItem, platform: PortPlatform) {
  const label = portPlatformLabels[platform];
  return [
    `"${item.title}" is a SunUI Pro block. Its ${label} port guide contains the Pro source, so it is served only with a license.`,
    `Port status: ${levelNote[portLevel(item, platform)]}`,
    "With `SUNUI_LICENSE_KEY` set in the environment (never ask for the key in chat, print it or commit it), fetch the guide and follow it:",
    `\`\`\`bash\n${portFetchCommand(item, platform)}\n\`\`\``,
    `No license: ${licenseSummary()} ${siteUrl()}/pricing. Do not rebuild a Pro block from its preview or description; offer a free block instead.`,
  ].join("\n\n");
}

/** llms-full.txt、skill、MCP 說明共用的一段。 */
export function portOverview() {
  const base = siteUrl();
  return [
    "## Other platforms (port guides)",
    `SunUI blocks are React code. For a project that is not React, each block has a port guide: the platform's adapter rules plus the block's source and demo, written for a coding agent to follow. Platforms: ${portPlatforms.map((p) => `${portPlatformLabels[p]} (\`${p}\`)`).join(", ")}.`,
    `- Get one: the \`get_port_prompt\` MCP tool, or \`${base}/r/port/<platform>/<name>.md\`. Pro guides need \`Authorization: Bearer $SUNUI_LICENSE_KEY\`.`,
    "- Each guide states its status: verified (SunUI ran it and compared with the original), untested, needs manual work (SVG filters, WebGL) or web only.",
    "- In a React project, install the block instead. A port is a rewrite by your model, so it can differ from the original; the installed React block cannot.",
  ].join("\n");
}
