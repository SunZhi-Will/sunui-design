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
    for (const style of ["line", "twotone", "pixel"] as const) {
      for (const animated of [false, true]) {
        assert.ok(set.items.some((i) => i.style === style && i.animated === animated), `${set.id}: no ${style}${animated ? " animated" : ""} item`);
      }
    }
  }
});

test("pro icons do not shadow free icons", () => {
  const line = keysOf(free("sunui-icons.tsx"), "icons");
  const pixel = keysOf(free("sunui-pixel-icons.tsx"), "pixelIcons");
  const twoTone = keysOf(free("sunui-twotone-icons.tsx"), "twoToneIcons");
  for (const set of proIconSets) {
    for (const { name } of set.icons) {
      assert.ok(!line.includes(name), `${name} is already a free line icon`);
      assert.ok(!twoTone.includes(name), `${name} is already a free two-tone icon`);
      assert.ok(!pixel.includes(name), `${name} is already a free pixel icon`);
    }
  }
});

const sources = existsSync(`${root}registry/pro/icons`);

const lower = (component: string) => component[0].toLowerCase() + component.slice(1);
const slug = (component: string) => component.toLowerCase();

test("pro icon sets do not share names with each other", () => {
  const seen = new Map<string, string>();
  for (const set of proIconSets) {
    for (const { name } of set.icons) {
      assert.ok(!seen.has(name), `${name} is in both ${seen.get(name)} and ${set.id}`);
      seen.set(name, set.id);
    }
  }
});

for (const set of proIconSets) {
  const c = set.component;
  const file = (kind: string) => `registry/pro/icons/sunui-${kind.replace("*", slug(c))}.tsx`;

  test(`pro icon index matches the Pro source: ${set.id}`, { skip: !sources && "registry/pro/icons not present" }, () => {
    const read = (kind: string) => readFileSync(`${root}${file(kind)}`, "utf8");
    const names = set.icons.map((i) => i.name).sort();
    assert.deepEqual(keysOf(read("*-icons"), `${lower(c)}Icons`).sort(), names, "line icons");
    assert.deepEqual(keysOf(read("*-pixel-icons"), `${lower(c)}PixelIcons`).sort(), names, "pixel icons");
    assert.deepEqual(keysOf(read("*-twotone-icons"), `${lower(c)}TwoToneIcons`).sort(), names, "two-tone icons");
    const motion = set.icons.filter((i) => i.motion).map((i) => i.name).sort();
    const pixelMotion = set.icons.filter((i) => i.pixelMotion).map((i) => i.name).sort();
    const twotoneMotion = set.icons.filter((i) => i.twotoneMotion).map((i) => i.name).sort();
    assert.deepEqual(keysOf(read("animated-*-icons"), `${lower(c)}Recipes`).sort(), motion, "animated line icons");
    assert.deepEqual(keysOf(read("animated-*-pixel-icons"), `${lower(c)}PixelRecipes`).sort(), pixelMotion, "animated pixel icons");
    assert.deepEqual(keysOf(read("animated-*-twotone-icons"), `${lower(c)}TwoToneRecipes`).sort(), twotoneMotion, "animated two-tone icons");
    // 和免費庫一樣：每個圖示在每種風格都會動
    assert.deepEqual(motion, names, "every line icon animated");
    assert.deepEqual(pixelMotion, names, "every pixel icon animated");
    assert.deepEqual(twotoneMotion, names, "every two-tone icon animated");
    for (const item of set.items) assert.ok(existsSync(`${root}${item.source}`), `${item.source} missing`);
  });

  test(`pro icon sprites are 16 × 16 with a 1px margin: ${set.id}`, { skip: !sources && "registry/pro/icons not present" }, () => {
    const src = readFileSync(`${root}${file("*-pixel-icons")}`, "utf8");
    const body = src.slice(src.indexOf(`export const ${lower(c)}PixelIcons = {`), src.indexOf("\n} satisfies"));
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
}

test("quest sprite kit: 32 × 32 with a 1px margin", { skip: !existsSync(`${root}registry/pro/icons/sunui-quest-sprites.tsx`) && "Pro sprites not present" }, () => {
  const src = readFileSync(`${root}registry/pro/icons/sunui-quest-sprites.tsx`, "utf8");
  const body = src.slice(src.indexOf("export const questSprites = {"), src.indexOf("\n} satisfies"));
  const names = keysOf(src, "questSprites");
  assert.ok(names.length >= 12, `only ${names.length} sprites`);
  for (const block of body.split(/\n {2}(?=\/\/|"?[a-z])/).filter((b) => b.includes("["))) {
    const name = block.match(/"?([a-z0-9-]+)"?: \[/)?.[1];
    const rows = [...block.matchAll(/^ {4}"([^"]*)",$/gm)].map((m) => m[1]);
    assert.equal(rows.length, 32, `${name}: ${rows.length} rows`);
    rows.forEach((row, y) => {
      assert.equal(row.length, 32, `${name} row ${y}`);
      assert.ok(row[0] === "." && row[31] === ".", `${name} row ${y} touches the edge`);
    });
    assert.equal(rows[0].replace(/\./g, ""), "", `${name}: first row must stay empty`);
    assert.equal(rows[31].replace(/\./g, ""), "", `${name}: last row must stay empty`);
  }
});
