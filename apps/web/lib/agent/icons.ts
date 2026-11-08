import { iconGroups, iconKeywords, pixelIconGroups } from "@/lib/icon-groups";
import { siteUrl } from "@/lib/site";
import { icons, type IconName, type IconNode } from "@/registry/icons/sunui-icons";
import {
  pixelIcons,
  pixelPaths,
  resolvePalette,
  tonesFor,
  type PixelIconName,
} from "@/registry/icons/sunui-pixel-icons";

// 給 agent 用的圖示索引：用語意搜尋、輸出可直接貼上的 SVG 或 TSX。
// 參考 iconmcp.com 的 search_icons / get_icon（見 reports/iconmcp 參考分析-2026-11-07.md），
// 只讀取 registry/icons 的幾何，不另存一份。

export type IconStyle = "line" | "pixel";
export type IconEntry = { name: string; style: IconStyle; group: string; groupTitle: string; keywords: string[] };

const pixelExtraGroups = new Map(pixelIconGroups.flatMap((g) => g.icons.map((name) => [name as string, g] as const)));
const lineGroupOf = new Map(iconGroups.flatMap((g) => g.icons.map((name) => [name as string, g] as const)));

function keywordsOf(name: string) {
  return (iconKeywords[name as IconName] ?? "").split(/\s+/).filter(Boolean);
}

export const iconIndex: IconEntry[] = [
  ...(Object.keys(icons) as IconName[]).map((name) => {
    const group = lineGroupOf.get(name);
    return { name, style: "line" as const, group: group?.id ?? "other", groupTitle: group?.title ?? "Other", keywords: keywordsOf(name) };
  }),
  ...(Object.keys(pixelIcons) as PixelIconName[]).map((name) => {
    const group = pixelExtraGroups.get(name);
    return { name, style: "pixel" as const, group: group?.id ?? "pixel-other", groupTitle: group?.title ?? "Other", keywords: keywordsOf(name) };
  }),
];

export function findIcon(name: string, style: IconStyle) {
  const clean = name.trim().toLowerCase();
  return iconIndex.find((entry) => entry.style === style && entry.name === clean);
}

// ---------- 搜尋 ----------

const cjk = /[぀-ヿ㐀-鿿]/;

/** 去掉英文複數，讓 coupons、boxes 也找得到 */
function stem(word: string) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(sh|ch|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** 編輯距離不超過 1（替換、插入、刪除、相鄰互換），容忍一個打錯的字 */
function nearlySame(a: string, b: string) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 4) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

function scoreWord(word: string, entry: IconEntry): number {
  const w = stem(word);
  const parts = entry.name.split("-");
  if (cjk.test(word)) {
    return entry.keywords.some((k) => k === word) ? 6 : entry.keywords.some((k) => k.includes(word) || word.includes(k)) ? 4 : 0;
  }
  if (parts.some((p) => p === w || p === word)) return 8;
  if (entry.keywords.some((k) => stem(k.toLowerCase()) === w)) return 5;
  if (entry.groupTitle.toLowerCase().split(/\W+/).includes(w)) return 2;
  if (w.length >= 3 && [...parts, ...entry.keywords].some((k) => k.toLowerCase().startsWith(w))) return 2;
  if ([...parts, ...entry.keywords].some((k) => nearlySame(stem(k.toLowerCase()), w))) return 1.5;
  return 0;
}

/** styles：同名圖示在哪些風格裡有（沒指定 style 時合併成一筆） */
export type IconHit = IconEntry & { score: number; matchedAllWords: boolean; styles: IconStyle[] };

/** 沒指定風格時，同名的線條版與像素版合併成一筆，保留分數高的那筆 */
function mergeStyles(hits: IconHit[]) {
  const byName = new Map<string, IconHit>();
  for (const hit of hits) {
    const seen = byName.get(hit.name);
    if (!seen) byName.set(hit.name, hit);
    else seen.styles = [...new Set([...seen.styles, hit.style])];
  }
  return [...byName.values()];
}

export function searchIcons({ query, style, group, limit = 10 }: { query?: string; style?: IconStyle; group?: string; limit?: number }) {
  const pool = iconIndex.filter((entry) => (!style || entry.style === style) && (!group || entry.group === group));
  const q = (query ?? "").trim().toLowerCase();
  if (!q) {
    const all = pool.map((e) => ({ ...e, score: 0, matchedAllWords: true, styles: [e.style] }));
    return { weak: false, results: (style ? all : mergeStyles(all)).slice(0, limit) };
  }

  const whole = q.replace(/\s+/g, "-");
  const words = q.split(/[\s,，、]+/).filter(Boolean);
  const hits: IconHit[] = [];
  for (const entry of pool) {
    const scores = words.map((word) => scoreWord(word, entry));
    let score = scores.reduce((sum, s) => sum + s, 0);
    if (score === 0) continue;
    if (entry.name === whole) score += 10;
    // 原型排在變體前面：bell 先於 bell-lock，stamp 先於 stamp-check
    score -= (entry.name.split("-").length - 1) * 0.5;
    // 同名時線條版優先，除非指定 pixel
    if (!style && entry.style === "pixel") score -= 0.25;
    hits.push({ ...entry, score: Math.round(score * 100) / 100, matchedAllWords: scores.every((s) => s > 0), styles: [entry.style] });
  }
  hits.sort((a, b) => Number(b.matchedAllWords) - Number(a.matchedAllWords) || b.score - a.score || a.name.localeCompare(b.name));
  const results = style ? hits : mergeStyles(hits);
  return { weak: !results.some((h) => h.matchedAllWords && h.score >= 4), results: results.slice(0, limit) };
}

/** 名稱打錯時給最接近的幾個 */
export function suggestIcons(name: string, style: IconStyle) {
  return searchIcons({ query: name.replace(/-/g, " "), style, limit: 5 }).results.map((h) => h.name);
}

// ---------- 輸出 ----------

export type RenderOptions = {
  format: "svg" | "tsx";
  size: number;
  /** 線條版線寬，預設 1.5 */
  stroke?: number;
  /** 圖示顏色，省略時跟隨 currentColor */
  color?: string;
  /** accent 部位顏色；省略時跟著 --sunui-icon-accent，沒設定就是墨色 */
  accent?: string;
  /** 像素版：ink 或 pigment */
  tone?: "ink" | "pigment";
};

const safeColor = (value: string | undefined) =>
  value && /^[#a-z0-9(),.%\s/-]{1,64}$/i.test(value) && !/url\(|expression/i.test(value) ? value : undefined;

function lineBody(nodes: readonly IconNode[], accent: string, jsx: boolean) {
  const attr = (k: string, v: string | number | undefined) => (v === undefined ? "" : ` ${jsx ? camel(k) : k}="${v}"`);
  return nodes
    .map((node) => {
      if (typeof node === "string") return `<path d="${node}"/>`;
      const paint = node.accent ? accent : "currentColor";
      const common = `${attr("stroke", node.fill ? "none" : node.accent ? paint : undefined)}${attr("fill", node.fill ? paint : undefined)}${attr("stroke-dasharray", node.dash)}`;
      if ("d" in node) return `<path${common} d="${node.d}"/>`;
      if ("c" in node) return `<circle${common} cx="${node.c[0]}" cy="${node.c[1]}" r="${node.c[2]}"/>`;
      const [x, y, w, h, rx] = node.r;
      return `<rect${common} x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
    })
    .join("\n    ");
}

function pixelBody(name: PixelIconName, tone: "ink" | "pigment", accent: string, jsx: boolean) {
  const paths = pixelPaths(name);
  const palette = resolvePalette(name, tone);
  // 獨立使用時不依賴 CSS 變數：沿用元件的色階，只把 var(--sunui-pigment-x, 基準色) 換成基準色、亮點換成白色
  const plain = (fill: string) =>
    fill
      .replace(/var\(--sunui-pigment-[a-z]+, (oklch\([^)]*\))\)/g, "$1")
      .replace("var(--sunui-pixel-shine, #fff)", "#fff")
      .replace("var(--sunui-icon-accent, currentColor)", accent);
  const tones = tonesFor(paths, palette).map((t) => ({
    char: t.char,
    fill: plain(t.fill),
    opacity: t.opacity === 1 ? undefined : t.opacity,
  }));
  return tones
    .filter((t) => paths[t.char])
    .map((t) => `<path d="${paths[t.char]}" fill="${t.fill}"${t.opacity ? ` ${jsx ? "fillOpacity" : "fill-opacity"}="${t.opacity}"` : ""}/>`)
    .join("\n    ");
}

const camel = (k: string) => k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
const pascal = (name: string) => name.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

export function renderIcon(entry: IconEntry, options: RenderOptions) {
  const jsx = options.format === "tsx";
  const color = safeColor(options.color);
  const accent = safeColor(options.accent) ?? "var(--sunui-icon-accent, currentColor)";
  const isPixel = entry.style === "pixel";
  const stroke = options.stroke ?? 1.5;
  const size = jsx ? "{size}" : `"${options.size}"`;
  const svgAttrs = isPixel
    ? [`viewBox="0 0 16 16"`, jsx ? `shapeRendering="crispEdges"` : `shape-rendering="crispEdges"`]
    : [
        `viewBox="0 0 24 24"`,
        `fill="none"`,
        `stroke="currentColor"`,
        jsx ? `strokeWidth="${stroke}"` : `stroke-width="${stroke}"`,
        jsx ? `strokeLinecap="round"` : `stroke-linecap="round"`,
        jsx ? `strokeLinejoin="round"` : `stroke-linejoin="round"`,
      ];
  const body = isPixel
    ? pixelBody(entry.name as PixelIconName, options.tone ?? "ink", accent, jsx)
    : lineBody(icons[entry.name as IconName], accent, jsx);
  const colorAttr = color ? (jsx ? ` style={{ color: "${color}" }}` : ` style="color:${color}"`) : "";

  if (!jsx) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} ${svgAttrs.join(" ")}${colorAttr} aria-hidden="true">\n    ${body}\n</svg>`;
  }
  const fn = `${pascal(entry.name)}${isPixel ? "PixelIcon" : "Icon"}`;
  return [
    `export function ${fn}({ size = ${options.size}, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) {`,
    `  return (`,
    `    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} ${svgAttrs.join(" ")}${colorAttr} aria-hidden="true" {...props}>`,
    `      ${body.replaceAll("\n    ", "\n      ")}`,
    `    </svg>`,
    `  );`,
    `}`,
  ].join("\n");
}

/** 裝整套圖示庫的方式；用多個圖示時比逐一貼 SVG 好 */
export function iconLibraryUsage(entry: IconEntry) {
  const base = siteUrl();
  const lib = entry.style === "pixel" ? "sunui-pixel-icons" : "sunui-icons";
  const component = entry.style === "pixel" ? "PixelIcon" : "Icon";
  return [
    `Install the whole set once: \`npx shadcn@latest add ${base}/r/icons/${lib}.json\``,
    `Then: \`import { ${component} } from "@/components/ui/${lib}"\` and \`<${component} name="${entry.name}" />\``,
    entry.style === "line"
      ? "Animated versions (hover, toggle, loading) of many icons: " + `${base}/r/icons/sunui-animated-icons.json`
      : "Frame-by-frame animated versions: " + `${base}/r/icons/sunui-animated-pixel-icons.json`,
  ].join("\n");
}

export function iconSetsSummary() {
  const line = iconGroups.map((g) => `- line/${g.id} (${g.icons.length}): ${g.title}. ${g.note}`);
  const pixel = pixelIconGroups.map((g) => `- pixel/${g.id} (${g.icons.length}): ${g.title}. ${g.note}`);
  return [
    `SunUI icons: ${Object.keys(icons).length} line icons (24px grid, 1.5 stroke) and ${Object.keys(pixelIcons).length} pixel sprites (16px grid). Use one style per screen.`,
    "",
    "Line groups:",
    ...line,
    "",
    "Pixel groups:",
    ...pixel,
  ].join("\n");
}
