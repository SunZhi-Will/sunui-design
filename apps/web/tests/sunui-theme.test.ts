// public/sunui-theme.css gives projects without shadcn/ui the colour tokens that blocks read.
// If a block starts using a token the file does not define, that block renders without colour
// for those users. This test fails first. Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

// The shadcn token names. Blocks may only use these plus SunUI's own --sunui-* variables.
const TOKENS = [
  "background", "foreground",
  "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground",
  "muted", "muted-foreground", "accent", "accent-foreground",
  "destructive", "destructive-foreground",
  "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
];
const NAMES = [...TOKENS].sort((a, b) => b.length - a.length).join("|");
// Utility classes that take a colour: bg-card, text-muted-foreground, border-border/60, ring-offset-background...
const CLASS = new RegExp(
  `(?<![\\w-])(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow)-(${NAMES})(?![\\w-])`,
  "g",
);
const VAR = new RegExp(`var\\(--(${NAMES})(?![\\w-])`, "g");

/** Source files that the free registry ships (the Pro registry too, when that private repo is present). */
function shippedFiles(): string[] {
  const manifests = ["registry.json", "registry/pro/registry.json"].filter((m) => fs.existsSync(path.join(root, m)));
  const files = new Set<string>();
  for (const m of manifests) {
    for (const item of JSON.parse(read(m)).items) for (const f of item.files ?? []) files.add(f.path);
  }
  return [...files].filter((f) => fs.existsSync(path.join(root, f)));
}

function block(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `sunui-theme.css has no "${selector}" block`);
  return css.slice(start, css.indexOf("\n}", start));
}

const defined = (css: string, name: string) => new RegExp(`--${name}\\s*:`).test(css);

// comments hold an optional --sunui-spot example; they are not definitions
const theme = read("public/sunui-theme.css").replace(/\/\*[\s\S]*?\*\//g, "");
const lightVars = block(theme, ":root");
const darkVars = block(theme, ".dark");
const mapping = block(theme, "@theme inline");

function usage() {
  const asClass = new Map<string, string>(); // token -> first file that uses it as a class
  const asVar = new Map<string, string>();
  for (const f of shippedFiles()) {
    const src = read(f);
    for (const m of src.matchAll(CLASS)) if (!asClass.has(m[1])) asClass.set(m[1], f);
    for (const m of src.matchAll(VAR)) if (!asVar.has(m[1])) asVar.set(m[1], f);
  }
  return { asClass, asVar };
}

test("blocks ship and use colour tokens (sanity check for the scanner)", () => {
  const { asClass } = usage();
  assert.ok(shippedFiles().length > 50, "expected the registry to list block files");
  for (const t of ["foreground", "muted-foreground", "card", "primary"]) assert.ok(asClass.has(t), `expected ${t} to be used`);
});

test("every colour class a block uses is mapped in @theme and defined in light and dark", () => {
  const { asClass } = usage();
  const missing: string[] = [];
  for (const [t, file] of asClass) {
    if (!defined(mapping, `color-${t}`)) missing.push(`--color-${t} in @theme inline (used as a class in ${file})`);
    if (!defined(lightVars, t)) missing.push(`--${t} in :root (used in ${file})`);
    if (!t.startsWith("chart-") && !defined(darkVars, t)) missing.push(`--${t} in .dark (used in ${file})`);
  }
  assert.deepEqual(missing, [], `public/sunui-theme.css is missing:\n${missing.join("\n")}`);
});

test("every var(--token) a block reads is defined in light and dark", () => {
  const { asVar } = usage();
  const missing: string[] = [];
  for (const [t, file] of asVar) {
    if (!defined(lightVars, t)) missing.push(`--${t} in :root (read in ${file})`);
    if (!t.startsWith("chart-") && !defined(darkVars, t)) missing.push(`--${t} in .dark (read in ${file})`);
  }
  assert.deepEqual(missing, [], `public/sunui-theme.css is missing:\n${missing.join("\n")}`);
});

test("light and dark define the same colour variables", () => {
  const names = (css: string) => new Set([...css.matchAll(/--([a-z0-9-]+)\s*:/g)].map((m) => m[1]).filter((n) => n !== "radius" && !n.startsWith("chart-")));
  assert.deepEqual([...names(darkVars)].sort(), [...names(lightVars)].sort());
});
