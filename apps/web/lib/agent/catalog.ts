import { locales } from "@/lib/i18n";
import { getItem, getItems, installCommand, proRegistryConfig, type RegistryItem, type Series, type Tier } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";
import { siteUrl } from "@/lib/site";

// 給 MCP、llms-full.txt 與 SKILL.md 共用的型錄查詢。只讀 metadata，永遠不碰 Pro 原始碼。

export function seriesOf(item: RegistryItem): Series {
  return item.meta.series ?? "paper";
}

type Field = { text: string; weight: number };

// 每個 block 的可搜尋欄位，含三種翻譯，讓代理用中文或日文描述需求也找得到
const haystacks = new Map<string, Field[]>();

function fieldsOf(item: RegistryItem): Field[] {
  const cached = haystacks.get(item.name);
  if (cached) return cached;
  const usage = item.meta.usage;
  const fields: Field[] = [
    { text: item.name.replace(/-/g, " "), weight: 6 },
    { text: item.title, weight: 6 },
    { text: (usage?.aliases ?? []).join(" | "), weight: 5 },
    { text: (item.categories ?? []).join(" "), weight: 4 },
    { text: item.description, weight: 2 },
    { text: (usage?.whenToUse ?? []).join(" "), weight: 2 },
  ];
  for (const locale of locales) {
    if (locale === "en") continue;
    const t = localizeItem(item, locale);
    if (t.title !== item.title) fields.push({ text: t.title, weight: 5 });
    if (t.description !== item.description) fields.push({ text: t.description, weight: 2 });
    const when = t.meta.usage?.whenToUse;
    if (when && when !== usage?.whenToUse) fields.push({ text: when.join(" "), weight: 1 });
  }
  const normalized = fields.map((f) => ({ ...f, text: f.text.toLowerCase() }));
  haystacks.set(item.name, normalized);
  return normalized;
}

const cjk = /[぀-ヿ㐀-鿿가-힯]/;

function terms(query: string) {
  return query
    .toLowerCase()
    .split(/[\s,.;:!?/|()"'“”「」『』、，。；：！？]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 || cjk.test(t));
}

// 中日文沒有空白斷詞，整串比對失敗時改用雙字切片
function bigrams(term: string) {
  const out: string[] = [];
  for (let i = 0; i < term.length - 1; i++) out.push(term.slice(i, i + 2));
  return out;
}

function score(item: RegistryItem, queryTerms: string[]) {
  const fields = fieldsOf(item);
  let total = 0;
  for (const term of queryTerms) {
    let best = 0;
    for (const field of fields) {
      if (field.text.includes(term)) {
        best = Math.max(best, field.weight);
      } else if (cjk.test(term) && term.length > 2) {
        const grams = bigrams(term);
        const hit = grams.filter((g) => field.text.includes(g)).length / grams.length;
        if (hit >= 0.5) best = Math.max(best, field.weight * hit);
      }
    }
    total += best;
  }
  return total;
}

export type SearchFilters = {
  query?: string;
  tier?: Tier;
  series?: Series;
  category?: string;
  limit?: number;
};

export function searchBlocks({ query, tier, series, category, limit = 8 }: SearchFilters) {
  let items = getItems(tier);
  if (series) items = items.filter((item) => seriesOf(item) === series);
  if (category) items = items.filter((item) => item.categories?.includes(category.toLowerCase()));
  const queryTerms = query ? terms(query) : [];
  if (queryTerms.length === 0) return items.slice(0, limit).map((item) => ({ item, score: 0 }));
  return items
    .map((item) => ({ item, score: score(item, queryTerms) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit);
}

export function blockUrl(item: RegistryItem) {
  return `${siteUrl()}/blocks/${item.name}`;
}

/** 搜尋結果的一行摘要。 */
export function blockLine(item: RegistryItem) {
  return `- **${item.name}** (${item.meta.tier}, ${seriesOf(item)}, ${item.meta.interaction}): ${item.description}`;
}

/** 單一 block 的完整說明（Markdown），給代理在安裝前判斷用。 */
export function describeBlock(item: RegistryItem) {
  const usage = item.meta.usage;
  const list = (title: string, lines?: string[]) =>
    lines?.length ? [`## ${title}`, ...lines.map((l) => `- ${l}`)].join("\n") : null;
  const sunuiDeps = (item.registryDependencies ?? []).filter((dep) => dep.startsWith("@sunui"));
  return [
    `# ${item.title} (\`${item.name}\`)`,
    item.description,
    [
      `- Tier: ${item.meta.tier === "pro" ? "Pro (license required)" : "Free (MIT)"}`,
      `- Series: ${seriesOf(item)} (call get_design_rules with this series before editing the block)`,
      `- Interaction: ${item.meta.interaction}`,
      `- Categories: ${(item.categories ?? []).join(", ") || "none"}`,
      `- npm dependencies: ${(item.dependencies ?? []).join(", ") || "none"}`,
      sunuiDeps.length ? `- Installs these SunUI blocks too: ${sunuiDeps.join(", ")}` : null,
      `- Files: ${item.files.map((f) => f.path.split("/").pop()).join(", ")}`,
      `- Live preview: ${blockUrl(item)}`,
    ]
      .filter(Boolean)
      .join("\n"),
    list("When to use", usage?.whenToUse),
    list("Watch out", usage?.watchOut),
    usage?.aliases?.length ? `Also known as: ${usage.aliases.join(", ")}` : null,
    ["## Install", "```bash", installCommand(item), "```"].join("\n"),
    item.meta.tier === "pro" ? proSetup() : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function proSetup() {
  return [
    "## Pro setup (once per project)",
    "Add the private registry to `components.json`:",
    "```json",
    proRegistryConfig(),
    "```",
    "Then put `SUNUI_LICENSE_KEY=<key>` in `.env.local`. Never print, commit or ask the user to paste the key into chat.",
    `If the CLI stops with "missing environment variable SUNUI_LICENSE_KEY", the user has no key set up yet: tell them Pro needs a license from ${siteUrl()}/pricing and offer a free block instead.`,
    "If the CLI shows an Unauthorized or Forbidden message, show that message to the user; it says what to do. A 503 means the license server is down: try again later.",
    "Do not try to work around the license or recreate Pro blocks by hand.",
  ].join("\n");
}

export type InstallPlan = {
  found: RegistryItem[];
  missing: string[];
  commands: string[];
  npmDependencies: string[];
  needsPro: boolean;
};

/** 多個 block 合併成最少的安裝指令；免費與 Pro 分開，因為 Pro 要先設定 registry。 */
export function planInstall(names: string[]): InstallPlan {
  const found: RegistryItem[] = [];
  const missing: string[] = [];
  for (const raw of names) {
    const name = raw.trim().replace(/^@sunui(-pro)?\//, "").replace(/\.json$/, "");
    const item = getItem(name);
    if (!item) missing.push(raw);
    else if (!found.includes(item)) found.push(item);
  }
  const free = found.filter((i) => i.meta.tier === "free");
  const pro = found.filter((i) => i.meta.tier === "pro");
  const commands: string[] = [];
  if (free.length) commands.push(`npx shadcn@latest add ${free.map((i) => `${siteUrl()}/r/${i.name}.json`).join(" ")}`);
  if (pro.length) commands.push(`npx shadcn@latest add ${pro.map((i) => `@sunui-pro/${i.name}`).join(" ")}`);
  const npmDependencies = [...new Set(found.flatMap((i) => i.dependencies ?? []))];
  return { found, missing, commands, npmDependencies, needsPro: pro.length > 0 };
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row[j];
      row[j] = next;
    }
  }
  return row[b.length];
}

/** 名稱打錯時的建議：先找拼字接近的，再補上搜尋結果。 */
export function suggestNames(name: string) {
  const target = name.toLowerCase().replace(/^@sunui(-pro)?\//, "");
  const typos = getItems()
    .map((item) => ({ name: item.name, d: editDistance(target, item.name) }))
    .filter((c) => c.d <= Math.max(2, Math.floor(target.length / 4)))
    .sort((a, b) => a.d - b.d)
    .map((c) => c.name);
  const related = searchBlocks({ query: target.replace(/-/g, " "), limit: 3 }).map((hit) => hit.item.name);
  return [...new Set([...typos, ...related])].slice(0, 3);
}

/** 依類別分組的精簡型錄，給 SKILL.md 的 references 與 MCP resource。 */
export function catalogMarkdown() {
  const groups = new Map<Series, RegistryItem[]>();
  for (const item of getItems()) {
    const series = seriesOf(item);
    groups.set(series, [...(groups.get(series) ?? []), item]);
  }
  const order: Series[] = ["paper", "product", "story", "showcase", "motion"];
  return [
    "# SunUI block catalog",
    `Generated from the live registry. ${getItems().length} blocks. Tier is free (MIT) or pro (license).`,
    ...order
      .filter((s) => groups.has(s))
      .map((s) => [`## ${s}`, ...groups.get(s)!.map(blockLine)].join("\n")),
  ].join("\n\n");
}
