import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import freeRegistry from "@/registry.json";
import { siteUrl } from "@/lib/site";

export type Tier = "free" | "pro";

export type Interaction =
  | "press"
  | "hover"
  | "drag"
  | "type"
  | "loading"
  | "scroll"
  | "section";

/** 設計語言系列：paper 見 DESIGN.md，product 與 story 見各自的 DESIGN 文件；product、story、showcase 依 PORTING.md 從原始專案移植 */
export type Series = "paper" | "product" | "story" | "showcase" | "motion";

export type RegistryFile = {
  path: string;
  type: string;
  target?: string;
};

export type BlockUsage = {
  whenToUse?: string[];
  watchOut?: string[];
  aliases?: string[];
};

export type RegistryItem = {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  categories?: string[];
  meta: {
    tier: Tier;
    interaction: Interaction;
    /** 省略時視為 paper */
    series?: Series;
    addedAt: string;
    /** 區塊頁的使用指引；aliases 也會被目錄搜尋 */
    usage?: BlockUsage;
  };
  files: RegistryFile[];
};

type Manifest = { name: string; items: RegistryItem[] };

// Pro 清單來自私有 repo（registry/pro），公開 repo 的 clone 沒有它也要能建置
const proManifestPath = path.join(process.cwd(), "registry", "pro", "registry.json");

function loadProManifest(): Manifest | null {
  if (!existsSync(proManifestPath)) return null;
  return JSON.parse(readFileSync(proManifestPath, "utf8")) as Manifest;
}

export const freeManifest = freeRegistry as Manifest;

// 這個檔案是用 fs 讀的，bundler 不會監看它：dev 時每次重讀，否則 dev server 執行中新增的 Pro block 會一直 404
const cachedProManifest = loadProManifest();
const getProManifest = () => (process.env.NODE_ENV === "development" ? loadProManifest() : cachedProManifest);

export function getItems(tier?: Tier): RegistryItem[] {
  const items = [...freeManifest.items, ...(getProManifest()?.items ?? [])];
  return tier ? items.filter((item) => item.meta.tier === tier) : items;
}

const spotCache = new Map<string, boolean>();

/** free block 是否已改用品牌專色 --sunui-spot：讀主檔原始碼判斷，不用另外維護清單 */
export function usesSpot(item: RegistryItem): boolean {
  if (item.meta.tier !== "free" || !item.files[0]) return false;
  const cached = spotCache.get(item.name);
  if (cached !== undefined && process.env.NODE_ENV !== "development") return cached;
  const file = path.join(process.cwd(), item.files[0].path);
  const result = existsSync(file) && readFileSync(file, "utf8").includes("--sunui-spot");
  spotCache.set(item.name, result);
  return result;
}

export function getItem(name: string, tier?: Tier): RegistryItem | undefined {
  return getItems(tier).find((item) => item.name === name);
}

/** Shiki language for a registry file, from its extension. */
export function fileLang(filePath: string) {
  const ext = filePath.split(".").pop() ?? "";
  return ({ md: "markdown", mjs: "js", js: "js", ts: "ts", json: "json", css: "css" } as Record<string, string>)[ext] ?? "tsx";
}

export async function readRegistryFile(file: RegistryFile) {
  return readFile(path.join(process.cwd(), file.path), "utf8");
}

/** 產生符合 shadcn registry-item schema 的 JSON（含原始碼）。 */
export async function buildRegistryItem(item: RegistryItem, banner?: string) {
  const files = await Promise.all(
    item.files.map(async (file) => {
      const content = await readRegistryFile(file);
      return { ...file, content: banner ? withBanner(content, banner) : content };
    }),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    registryDependencies: item.registryDependencies?.map(resolveDependency),
    files,
  };
}

/**
 * registry.json 用 @sunui/<name> 表示「也要裝這個免費 block」（例如共用的 stamp）。
 * 輸出時換成完整網址，買家沒在 components.json 設定 @sunui 也能直接安裝。
 */
function resolveDependency(dep: string) {
  return dep.startsWith("@sunui/") ? `${siteUrl()}/r/${dep.slice("@sunui/".length)}.json` : dep;
}

// 授權註解放在 "use client" 之後，避免破壞指令必須在檔案開頭的規則
function withBanner(content: string, banner: string) {
  const directive = content.match(/^\s*["']use client["'];?\s*\n/);
  if (!directive) return `${banner}\n${content}`;
  return `${directive[0].trimEnd()}\n\n${banner}\n${content.slice(directive[0].length)}`;
}

export function installCommand(item: Pick<RegistryItem, "name" | "meta">) {
  if (item.meta.tier === "pro") return `npx shadcn@latest add @sunui-pro/${item.name}`;
  return `npx shadcn@latest add ${siteUrl()}/r/${item.name}.json`;
}

export function proRegistryConfig() {
  return JSON.stringify(
    {
      registries: {
        "@sunui-pro": {
          url: `${siteUrl()}/r/pro/{name}.json`,
          headers: { Authorization: "Bearer ${SUNUI_LICENSE_KEY}" },
        },
      },
    },
    null,
    2,
  );
}
