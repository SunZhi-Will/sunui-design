// Pro 檔期圖示組：公開索引（lib/pro-icons.ts）要跟私有 repo 的原始碼對得上。
// 公開 clone 沒有 registry/pro/icons 時只檢查索引本身。Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { proIconSets } from "../lib/pro-icons.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const free = (file: string) => readFileSync(`${root}registry/icons/${file}`, "utf8");

/** 取出 `export const <name> = { ... }` 第一層的鍵 */
function keysOf(src: string, name: string) {
  const start = src.indexOf(`export const ${name} = {`);
  assert.ok(start >= 0, `missing export const ${name}`);
  const body = src.slice(start, src.indexOf("\n} satisfies", start));
  return [...body.matchAll(/^ {2}"?([a-z0-9-]+)"?: [[{]/gm)].map((m) => m[1]);
}

test("pro icon index: unique names, keywords, items for every style", () => {
  for (const set of proIconSets) {
    const names = set.icons.map((i) => i.name);
    assert.equal(new Set(names).size, names.length, `${set.id}: duplicate names`);
    for (const icon of set.icons) assert.ok(icon.keywords.trim().length > 0, `${set.id}/${icon.name}: no keywords`);
    for (const style of ["line", "pixel"] as const) {
      for (const animated of [false, true]) {
        assert.ok(set.items.some((i) => i.style === style && i.animated === animated), `${set.id}: no ${style}${animated ? " animated" : ""} item`);
      }
    }
  }
});

test("pro icons do not shadow free icons", () => {
  const line = keysOf(free("sunui-icons.tsx"), "icons");
  const pixel = keysOf(free("sunui-pixel-icons.tsx"), "pixelIcons");
  for (const set of proIconSets) {
    for (const { name } of set.icons) {
      assert.ok(!line.includes(name), `${name} is already a free line icon`);
      assert.ok(!pixel.includes(name), `${name} is already a free pixel icon`);
    }
  }
});

const sources = existsSync(`${root}registry/pro/icons`);

test("pro icon index matches the Pro source", { skip: !sources && "registry/pro/icons not present" }, () => {
  const set = proIconSets.find((s) => s.id === "lunar-new-year");
  assert.ok(set);
  const read = (file: string) => readFileSync(`${root}registry/pro/icons/${file}`, "utf8");
  const names = set.icons.map((i) => i.name).sort();
  assert.deepEqual(keysOf(read("sunui-lunar-icons.tsx"), "lunarIcons").sort(), names, "line icons");
  assert.deepEqual(keysOf(read("sunui-lunar-pixel-icons.tsx"), "lunarPixelIcons").sort(), names, "pixel icons");
  const motion = set.icons.filter((i) => i.motion).map((i) => i.name).sort();
  const pixelMotion = set.icons.filter((i) => i.pixelMotion).map((i) => i.name).sort();
  assert.deepEqual(keysOf(read("sunui-animated-lunar-icons.tsx"), "lunarRecipes").sort(), motion, "animated line icons");
  assert.deepEqual(keysOf(read("sunui-animated-lunar-pixel-icons.tsx"), "lunarPixelRecipes").sort(), pixelMotion, "animated pixel icons");
  for (const item of set.items) assert.ok(existsSync(`${root}${item.source}`), `${item.source} missing`);
});

test("pro icon sprites are 16 × 16 with a 1px margin", { skip: !sources && "registry/pro/icons not present" }, () => {
  const src = readFileSync(`${root}registry/pro/icons/sunui-lunar-pixel-icons.tsx`, "utf8");
  const body = src.slice(src.indexOf("export const lunarPixelIcons = {"), src.indexOf("\n} satisfies"));
  for (const block of body.split(/\n {2}(?=\/\/|"?[a-z])/).filter((b) => b.includes("["))) {
    const name = block.match(/"?([a-z0-9-]+)"?: \[/)?.[1];
    const rows = [...block.matchAll(/^ {4}"([^"]*)",$/gm)].map((m) => m[1]);
    assert.equal(rows.length, 16, `${name}: ${rows.length} rows`);
    rows.forEach((row, y) => {
      assert.equal(row.length, 16, `${name} row ${y}`);
      assert.ok(row[0] === "." && row[15] === ".", `${name} row ${y} touches the edge`);
    });
    assert.equal(rows[15].replace(/\./g, ""), "", `${name}: last row must stay empty`);
  }
});
