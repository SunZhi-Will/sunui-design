import { readFile } from "node:fs/promises";
import path from "node:path";

import registry from "@/registry.json";

export type Tier = "free" | "pro";

export type Interaction =
  | "press"
  | "hover"
  | "drag"
  | "type"
  | "loading"
  | "scroll"
  | "section";

export type RegistryFile = {
  path: string;
  type: string;
  target?: string;
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
    addedAt: string;
  };
  files: RegistryFile[];
};

export const registryName = registry.name;

export function getItems(): RegistryItem[] {
  return registry.items as RegistryItem[];
}

export function getItem(name: string): RegistryItem | undefined {
  return getItems().find((item) => item.name === name);
}

export async function readRegistryFile(file: RegistryFile) {
  return readFile(path.join(process.cwd(), file.path), "utf8");
}

/** 產生符合 shadcn registry-item schema 的 JSON（含原始碼）。 */
export async function buildRegistryItem(item: RegistryItem) {
  const files = await Promise.all(
    item.files.map(async (file) => ({
      ...file,
      content: await readRegistryFile(file),
    })),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    files,
  };
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100").replace(/\/$/, "");
}

export function installCommand(name: string) {
  return `npx shadcn@latest add ${siteUrl()}/r/${name}.json`;
}
