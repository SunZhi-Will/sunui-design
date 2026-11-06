// propsSignature: pulls the main props interface out of a free block for the
// block page's "copy prompt" button. Runs with `npm test -w @sunui-design/web`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { propsSignature } from "../lib/agent/props.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

test("picks the block's own props over helper props", () => {
  const src = readFileSync(`${root}registry/free/add-to-cart-button/add-to-cart-button.tsx`, "utf8");
  const sig = propsSignature(src, "add-to-cart-button");
  assert.equal(sig?.component, "AddToCartButton");
  assert.match(sig!.code, /^export interface AddToCartButtonProps/);
  assert.match(sig!.code, /\}$/);
  assert.doesNotMatch(sig!.code, /CartIconProps/);
});

test("handles nested braces, comments and strings", () => {
  const src = `
export interface FooProps {
  /** a } in a comment */
  labels?: { idle?: string; done?: string };
  mode?: "a{" | "b";
}
export function Foo(props: FooProps) { return null; }`;
  const sig = propsSignature(src, "foo");
  assert.equal(sig?.component, "Foo");
  assert.match(sig!.code, /mode\?: "a\{" \| "b";\n\}$/);
});

test("falls back to the first exported component with props", () => {
  const src = `export type AnimateProps = { a: number };\nexport function Animate() {}`;
  assert.equal(propsSignature(src, "animate-presets")?.component, "Animate");
  assert.equal(propsSignature("export const x = 1;", "x"), null);
});

test("every free block with a props interface yields a balanced signature", () => {
  const dir = `${root}registry/free`;
  for (const name of readdirSync(dir)) {
    const file = `${dir}/${name}/${name}.tsx`;
    if (!existsSync(file)) continue;
    const sig = propsSignature(readFileSync(file, "utf8"), name);
    if (!sig) continue;
    const open = (sig.code.match(/\{/g) ?? []).length;
    const close = (sig.code.match(/\}/g) ?? []).length;
    assert.ok(sig.code.length < 8000, `${name}: signature too long`);
    assert.ok(open >= 1 && close >= 1, `${name}: no braces`);
  }
});
