import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// lib/agent/port.ts 用到 @/ 路徑別名，node --test 解析不了，所以這裡檢查轉接規則檔本身與公開呼叫點的寫法。

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("every platform has an adapter file", () => {
  const platforms = read("lib/agent/port.ts").match(/portPlatforms = \[([^\]]+)\]/)![1].match(/"([^"]+)"/g)!.map((p) => p.slice(1, -1));
  assert.ok(platforms.length >= 2);
  for (const name of ["core", ...platforms]) assert.ok(read(`lib/agent/port/${name}.md`).length > 500, name);
});

test("adapters keep the three springs and use no em dashes", () => {
  const core = read("lib/agent/port/core.md");
  for (const row of ["| snappy | 520 | 34 | 1 |", "| gentle | 240 | 30 | 1 |", "| pop | 620 | 20 | 0.8 |"]) assert.ok(core.includes(row), row);
  const platforms = read("lib/agent/port.ts").match(/portPlatforms = \[([^\]]+)\]/)![1].match(/"([^"]+)"/g)!.map((p) => p.slice(1, -1));
  for (const name of ["core", ...platforms]) assert.ok(!/[—]/.test(read(`lib/agent/port/${name}.md`)), name);
});

test("public callers never build a Pro port guide", () => {
  // 頁面只用等級與取得指令；MCP 對 Pro 走 proPortInstructions；只有 /r/port 在驗過授權後傳 licensed
  assert.ok(!read("app/(site)/blocks/[slug]/page.tsx").includes("portPrompt("));
  const mcp = read("app/mcp/route.ts");
  assert.match(mcp, /tier === "pro" \? proPortInstructions\(item, platform\) : await portPrompt\(item, platform\)/);
  const route = read("app/r/port/[platform]/[name]/route.ts");
  assert.ok(route.indexOf("checkLicense(") < route.indexOf("displayKey: license.displayKey"));
  assert.match(read("lib/agent/port.ts"), /if \(isPro && !licensed\) throw/);
});
