// Test harness only: one Vite project serves several rounds of ports.
// A file under rounds/<r>/ that imports "@/x" gets rounds/<r>/x when that file exists, else src/x.
import fs from "node:fs";
import path from "node:path";
export default function rounds(root) {
  return {
    name: "sunui-rounds",
    enforce: "pre",
    resolveId(source, importer) {
      if (!source.startsWith("@/") || !importer) return null;
      const rest = source.slice(2);
      const m = importer.replace(/\\/g, "/").match(/\/rounds\/([^/]+)\//);
      const exts = ["", ".ts", ".js"];
      if (m) for (const e of exts) { const p = path.join(root, "rounds", m[1], rest + e); if (fs.existsSync(p) && fs.statSync(p).isFile()) return p; }
      for (const e of exts) { const p = path.join(root, "src", rest + e); if (fs.existsSync(p) && fs.statSync(p).isFile()) return p; }
      return null;
    },
  };
}
