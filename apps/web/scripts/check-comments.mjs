#!/usr/bin/env node
// Fails when a comment in a free block contains CJK characters.
// Free block source is copied into buyers' projects by `npx shadcn add` and shown
// in the code view on the English block page, so comments there must be English.
// User-facing copy belongs in lib/messages.ts and content/registry-i18n/, not here.
//
//   node apps/web/scripts/check-comments.mjs [--list]
//
// Only comments are checked (JS comments from the TypeScript parser, plus CSS /* */
// comments inside template literals), never strings or JSX text.
// --list prints every offending comment instead of one line per file.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "registry", "free");
const list = process.argv.includes("--list");
const CJK = /[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/;
const COMMENT = new Set([ts.SyntaxKind.SingleLineCommentTrivia, ts.SyntaxKind.MultiLineCommentTrivia]);
const TEMPLATE = new Set([
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
]);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(c|m)?[jt]sx?$/.test(e.name)) out.push(p);
  }
  return out;
}

// The scanner alone cannot tell a regex or a JSX text run from a comment, so walk the
// parsed tree and collect the comment ranges attached to each token.
function comments(file, src) {
  const kind = /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, kind);
  const seen = new Map();
  const add = (ranges) => {
    for (const r of ranges ?? []) if (COMMENT.has(r.kind)) seen.set(r.pos, r);
  };
  const visit = (node) => {
    if (node.kind !== ts.SyntaxKind.JsxText) {
      add(ts.getLeadingCommentRanges(src, node.pos));
      add(ts.getTrailingCommentRanges(src, node.end));
    }
    // CSS shipped as a template literal (a <style> block) carries its own /* */ comments.
    if (TEMPLATE.has(node.kind)) {
      const start = node.getStart(sf);
      for (const m of node.getText(sf).matchAll(/\/\*[\s\S]*?\*\//g)) {
        seen.set(start + m.index, { pos: start + m.index, end: start + m.index + m[0].length });
      }
    }
    node.getChildren(sf).forEach(visit);
  };
  visit(sf);
  return [...seen.values()].map((r) => ({
    line: sf.getLineAndCharacterOfPosition(r.pos).line + 1,
    text: src.slice(r.pos, r.end),
  }));
}

if (!fs.existsSync(dir)) process.exit(0);
let total = 0;
for (const file of walk(dir)) {
  const src = fs.readFileSync(file, "utf8");
  const bad = comments(file, src).filter((c) => CJK.test(c.text));
  if (!bad.length) continue;
  total += bad.length;
  const rel = path.relative(root, file);
  if (list) for (const c of bad) console.log(`${rel}:${c.line}  ${c.text.split("\n")[0].trim()}`);
  else console.log(`${rel}: ${bad.length} comment(s) with CJK, first at line ${bad[0].line}`);
}
if (total) {
  console.error(`\n${total} comment(s) under registry/free contain CJK characters. Write comments in English.`);
  process.exit(1);
}
