// Locale parity: every piece of user-facing copy exists in every locale.
// TypeScript already checks that messages.ts has the same keys, but not that a
// string is non-empty, that {placeholders} and `code` spans survive translation,
// that arrays keep their length, or anything at all in content/registry-i18n.
// Runs with Node's own test runner and type stripping: `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getMessages } from "../lib/messages.ts";
import { locales } from "../lib/i18n.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

type Leaf = { path: string; value: unknown };

function leaves(value: unknown, path = ""): Leaf[] {
  if (Array.isArray(value)) {
    return [{ path: `${path}.length`, value: value.length }, ...value.flatMap((v, i) => leaves(v, `${path}[${i}]`))];
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [{ path, value }];
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const codeSpans = (s: string) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]).sort();
const links = (s: string) => [...s.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort();

const others = locales.filter((l) => l !== "en");
const en = new Map(leaves(getMessages("en")).map((l) => [l.path, l.value]));

test("messages.ts: every locale has the same leaves as English", () => {
  for (const locale of others) {
    const paths = leaves(getMessages(locale)).map((l) => l.path).sort();
    assert.deepEqual(paths, [...en.keys()].sort(), `${locale} keys differ from en`);
  }
});

test("messages.ts: no empty strings, matching types and array lengths", () => {
  for (const locale of locales) {
    for (const { path, value } of leaves(getMessages(locale))) {
      const base = en.get(path);
      assert.equal(typeof value, typeof base, `${locale} ${path}: type differs from en`);
      if (typeof value === "string") assert.notEqual(value.trim(), "", `${locale} ${path} is empty`);
      if (path.endsWith(".length")) assert.equal(value, base, `${locale} ${path}: array length differs from en`);
      if (typeof value === "function") assert.equal(value.length, (base as Function).length, `${locale} ${path}: argument count differs from en`);
    }
  }
});

test("messages.ts: placeholders, code spans and link targets survive translation", () => {
  for (const locale of others) {
    for (const { path, value } of leaves(getMessages(locale))) {
      const base = en.get(path);
      if (typeof value !== "string" || typeof base !== "string") continue;
      assert.deepEqual(placeholders(value), placeholders(base), `${locale} ${path}: {placeholders} differ`);
      assert.deepEqual(codeSpans(value), codeSpans(base), `${locale} ${path}: \`code\` spans differ`);
      assert.deepEqual(links(value), links(base), `${locale} ${path}: link targets differ`);
    }
  }
});

type Usage = { whenToUse?: string[]; watchOut?: string[] };
type RegistryItem = { name: string; title?: string; description?: string; meta?: { usage?: Usage } };

const registry = JSON.parse(readFileSync(`${root}registry.json`, "utf8")) as { items: RegistryItem[] };
const i18nDir = `${root}content/registry-i18n`;
const i18nFiles = readdirSync(i18nDir).filter((f) => f.endsWith(".json"));

test("registry-i18n: one file per registry item, no orphans", () => {
  const names = registry.items.map((i) => i.name).sort();
  const files = i18nFiles.map((f) => f.replace(/\.json$/, "")).sort();
  assert.deepEqual(names.filter((n) => !files.includes(n)), [], "registry items without a translation file");
  assert.deepEqual(files.filter((f) => !names.includes(f)), [], "translation files without a registry item");
});

test("registry-i18n: each locale has a title, a description and the same usage lists as English", () => {
  for (const item of registry.items) {
    const file = `${i18nDir}/${item.name}.json`;
    let data: Record<string, { title?: string; description?: string } & Usage>;
    try {
      data = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue; // reported by the test above
    }
    const usage = item.meta?.usage ?? {};
    for (const locale of others) {
      const entry = data[locale];
      assert.ok(entry, `${item.name}: missing ${locale}`);
      assert.ok(entry.title?.trim(), `${item.name} ${locale}: empty title`);
      assert.ok(entry.description?.trim(), `${item.name} ${locale}: empty description`);
      for (const key of ["whenToUse", "watchOut"] as const) {
        const want = usage[key]?.length ?? 0;
        const got = entry[key]?.length ?? 0;
        assert.equal(got, want, `${item.name} ${locale}: ${key} has ${got} entries, English has ${want}`);
        entry[key]?.forEach((s, i) => assert.ok(s.trim(), `${item.name} ${locale}: ${key}[${i}] is empty`));
      }
    }
  }
});
