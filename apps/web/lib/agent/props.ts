// 從免費 block 的原始碼抽出主元件的 props 介面，放進區塊頁的「複製給 agent」prompt。
// 純字串處理，不 import 任何東西，方便用 node --test 直接測。Pro 原始碼永遠不會傳進來。

export type PropsSignature = { component: string; code: string };

function pascal(name: string) {
  return name.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
}

/** 從 `start`（一個 `{`）找到對應的 `}`，略過字串與註解裡的括號。 */
function matchBrace(source: string, start: number) {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (c === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
      if (i === -1) return -1;
    } else if (c === "/" && source[i + 1] === "*") {
      i = source.indexOf("*/", i + 2) + 1;
      if (i === 0) return -1;
    } else if (c === '"' || c === "'" || c === "`") {
      const end = source.indexOf(c, i + 1);
      if (end === -1) return -1;
      i = end;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return -1;
}

/**
 * 找出 block 主元件的 props 介面。先找 `<PascalName>Props`，找不到就用第一個有對應
 * `export function` 的 `export interface XProps`。都沒有就回傳 null，prompt 只是少一段。
 */
export function propsSignature(source: string, blockName: string): PropsSignature | null {
  const declared = [...source.matchAll(/export (?:interface (\w+)Props\b[^{]*|type (\w+)Props\s*=\s*)\{/g)];
  if (declared.length === 0) return null;
  const exported = (component: string) => new RegExp(`export (?:default )?function ${component}\\b`).test(source);
  const preferred = pascal(blockName);
  const hit =
    declared.find((m) => (m[1] ?? m[2]) === preferred && exported(preferred)) ??
    declared.find((m) => exported(m[1] ?? m[2]));
  if (!hit || hit.index === undefined) return null;

  const open = hit.index + hit[0].length - 1;
  const close = matchBrace(source, open);
  if (close === -1) return null;
  const code = source.slice(hit.index, close + 1) + (hit[2] ? ";" : "");
  return { component: hit[1] ?? hit[2], code };
}
