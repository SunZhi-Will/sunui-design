"use client";

import { useDemoText } from "@/lib/demo-locale";

import { LinkPreviewCard } from "./link-preview-card";
import { demoCopy, useMockResolver } from "./demo";

const message = {
  en: { name: "Mina", text: "This is the one I meant:" },
  "zh-TW": { name: "Mina", text: "我說的是這個：" },
  "zh-CN": { name: "Mina", text: "我说的是这个：" },
  ja: { name: "Mina", text: "言っていたのはこれです：" },
};

/** Catalog card: a link pasted into a chat, first a skeleton inside the same frame, then expanded into a preview card. */
export default function LinkPreviewCardCard() {
  const t = useDemoText(demoCopy);
  const m = useDemoText(message);
  const resolve = useMockResolver(t);
  return (
    <div className="mx-auto flex w-80 gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">M</span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm">
          <span className="font-semibold">{m.name}</span>
          <span className="ml-2 text-muted-foreground">{m.text}</span>
        </p>
        <LinkPreviewCard url="https://outfitters.example.org/field-watch" fetchMeta={resolve} labels={t.labels} layout="stacked" />
      </div>
    </div>
  );
}
