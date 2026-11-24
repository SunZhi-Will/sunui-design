// Plain comparison of acceptance outputs. No model in the loop.
//   node compare.mjs baseline <out.json> <run1.json> <run2.json> [<run3.json> ...]
//   node compare.mjs check <baseline.json> <port.json> <out.json> [<checklist.json>]
import fs from "node:fs";

const [, , mode, ...args] = process.argv;
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const norm = (v) => typeof v === "string" ? v.replace(/\s+/g, " ").trim() : Array.isArray(v) ? v.map(norm) : v;
const same = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));
const numeric = new Set(["px", "ratio", "ms"]);

function tolerance(kind, lo, hi) {
  if (kind === "px") return 1.5;
  if (kind === "ratio") return 0.03;
  if (kind === "ms") return Math.max(40, 0.25 * ((lo + hi) / 2));
  return 0;
}

if (mode === "baseline") {
  const [out, ...runs] = args;
  const data = runs.map(read);
  const keys = new Map();
  for (const [i, r] of data.entries()) {
    for (const c of r.checks || []) {
      if (!keys.has(c.key)) keys.set(c.key, { item: c.item, kind: c.kind, values: Array(data.length).fill(undefined) });
      keys.get(c.key).values[i] = c.value;
    }
  }
  const checks = {};
  const unstable = [];
  for (const [key, k] of keys) {
    const present = k.values.filter((v) => v !== undefined);
    const entry = { item: k.item, kind: k.kind };
    if (present.length < data.length) { entry.unstable = "missing in some runs"; unstable.push(key); }
    if (k.kind === "info") entry.values = k.values;
    else if (numeric.has(k.kind)) {
      const nums = present.map(Number);
      if (nums.some((n) => !Number.isFinite(n))) { entry.unstable = "not a number"; unstable.push(key); }
      entry.min = Math.min(...nums); entry.max = Math.max(...nums);
      const spread = entry.max - entry.min;
      if (spread > 4 * tolerance(k.kind, entry.min, entry.max)) { entry.unstable = `spread ${spread.toFixed(2)} across runs`; unstable.push(key); }
    } else {
      entry.value = present[0];
      if (!present.every((v) => same(v, present[0]))) { entry.unstable = "differs across runs: " + present.map((v) => JSON.stringify(v)).join(" | "); unstable.push(key); }
    }
    checks[key] = entry;
  }
  const tabs = data.map((r) => r.tabOrder || []);
  const tabStable = tabs.every((t) => same(t, tabs[0]));
  const result = {
    block: data[0].block, runs: data.length, checks, tabOrder: tabs[0], tabStable,
    unstable, runErrors: data.map((r) => r.errors || []), consoleErrors: data.map((r) => r.consoleErrors || []),
  };
  fs.writeFileSync(out, JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ keys: keys.size, unstable, tabStable, runErrors: result.runErrors.map((e) => e.length) }, null, 1));
} else if (mode === "check") {
  const [basePath, portPath, out, checklistPath] = args;
  const base = read(basePath);
  const port = read(portPath);
  const got = new Map((port.checks || []).map((c) => [c.key, c]));
  const failing = {};
  const missing = [];
  let compared = 0;
  for (const [key, b] of Object.entries(base.checks)) {
    if (b.kind === "info" || b.unstable) continue;
    compared++;
    const c = got.get(key);
    const fail = (expected) => { (failing[b.item] ||= []).push({ key, kind: b.kind, expected, got: c ? c.value : "(missing)" }); };
    if (!c) { missing.push(key); fail(numeric.has(b.kind) ? [b.min, b.max] : b.value); continue; }
    if (numeric.has(b.kind)) {
      const t = tolerance(b.kind, b.min, b.max);
      const v = Number(c.value);
      if (!(v >= b.min - t && v <= b.max + t)) fail(`${b.min}..${b.max} (±${+t.toFixed(2)})`);
    } else if (!same(c.value, b.value)) fail(b.value);
  }
  const tabOrderEqual = same(port.tabOrder || [], base.tabOrder || []);
  let itemsCovered = null, uncovered = [];
  if (checklistPath) {
    const items = read(checklistPath).items.filter((i) => i.scope === "all" || i.scope === "web").map((i) => i.id);
    const coveredIds = new Set(Object.values(base.checks).filter((b) => b.kind !== "info" && !b.unstable).map((b) => b.item));
    uncovered = items.filter((id) => !coveredIds.has(id));
    itemsCovered = `${items.length - uncovered.length}/${items.length}`;
  }
  const result = {
    block: base.block, label: port.label, compared, failingItems: failing, failingCount: Object.keys(failing).length,
    missingKeys: missing, tabOrderEqual, tabOrderBase: base.tabOrder, tabOrderPort: port.tabOrder,
    consoleErrors: port.consoleErrors || [], scriptErrors: port.errors || [], itemsCovered, uncoveredItems: uncovered,
    pass: Object.keys(failing).length === 0 && tabOrderEqual && !(port.consoleErrors || []).length,
  };
  fs.writeFileSync(out, JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ label: port.label, pass: result.pass, failingItems: Object.keys(failing), tabOrderEqual, consoleErrors: result.consoleErrors.length, scriptErrors: result.scriptErrors.length, itemsCovered }, null, 1));
} else {
  console.error("usage: compare.mjs baseline|check ...");
  process.exit(2);
}
