// Per-agent cost and time for a workflow run: node stats.mjs <transcriptDir>
import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
const rows = [];
for (const f of fs.readdirSync(dir).filter((f) => /^agent-.*\.jsonl$/.test(f))) {
  let out = 0, fresh = 0, cached = 0, model = "", first = "", t0 = null, t1 = null, tools = 0, done = false;
  for (const l of fs.readFileSync(path.join(dir, f), "utf8").split("\n")) {
    if (!l) continue;
    let j; try { j = JSON.parse(l); } catch { continue; }
    if (j.timestamp) { const t = Date.parse(j.timestamp); t0 ??= t; t1 = t; }
    const m = j.message;
    if (!m) continue;
    if (!first && m.role === "user") first = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    if (m.usage) { out += m.usage.output_tokens || 0; fresh += (m.usage.input_tokens || 0) + (m.usage.cache_creation_input_tokens || 0); cached += m.usage.cache_read_input_tokens || 0; model = m.model || model; }
    if (Array.isArray(m.content)) for (const c of m.content) { if (c.type === "tool_use") { tools++; if (c.name === "StructuredOutput") done = true; } }
  }
  let meta = {}; try { meta = JSON.parse(fs.readFileSync(path.join(dir, f.replace(/\.jsonl$/, ".meta.json")), "utf8")); } catch {}
  const desc = meta.description || "?";
  const role = desc.split(" ")[0] === "fix" ? "fix-harness" : desc.split(" ")[0];
  const block = desc.split(" ")[1] || "?";
  rows.push({ role, block, model: model.replace("claude-", ""), out, fresh, cached, tools, min: t0 ? (t1 - t0) / 60000 : 0, done });
}
const by = {};
for (const r of rows) {
  const k = `${r.role} (${r.model})`;
  by[k] ||= { n: 0, running: 0, out: 0, fresh: 0, cached: 0, min: 0, tools: 0 };
  const b = by[k]; b.n++; if (!r.done) b.running++; b.out += r.out; b.fresh += r.fresh; b.cached += r.cached; b.min += r.min; b.tools += r.tools;
}
const k = (n) => (n / 1000).toFixed(0) + "k";
console.log("role (model)".padEnd(26), "n", "open", "out".padStart(7), "in".padStart(7), "cache".padStart(8), "avg min".padStart(8), "tools");
let tot = { out: 0, fresh: 0, cached: 0 };
for (const [name, b] of Object.entries(by).sort()) {
  console.log(name.padEnd(26), String(b.n).padStart(1), String(b.running).padStart(4), k(b.out).padStart(7), k(b.fresh).padStart(7), k(b.cached).padStart(8), (b.min / b.n).toFixed(1).padStart(8), String(b.tools).padStart(5));
  tot.out += b.out; tot.fresh += b.fresh; tot.cached += b.cached;
}
console.log("total".padEnd(26), String(rows.length), "", k(tot.out).padStart(7), k(tot.fresh).padStart(7), k(tot.cached).padStart(8));
const open = rows.filter((r) => !r.done).map((r) => `${r.role}:${r.block} ${r.min.toFixed(1)}m`);
if (open.length) console.log("still open:", open.join(", "));
