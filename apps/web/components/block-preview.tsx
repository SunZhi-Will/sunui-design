"use client";

import { previews } from "@/registry/previews";

export function BlockPreview({ name }: { name: string }) {
  const Preview = previews[name];
  return Preview ? <Preview /> : null;
}
