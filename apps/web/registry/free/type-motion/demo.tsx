"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { TextMask, TextOnPath, VariableWeight } from "./type-motion";

// 示範照片（AI 生成）：和 image-effects 共用的潟湖海景，字形挖空後看得到水色與沙灘
const sea = "/blocks/image-effects/lagoon.webp";

const copy = {
  en: {
    loop: "Loop",
    hover: "Hover",
    replay: "Replay",
    entrance: "Once",
    path: "Free shipping on every order · ",
    ring: "NEW SEASON · NEW SEASON · ",
    arc: "Handmade in small batches",
    weight: "Weight",
    word: "Bold move",
    mask: "OCEAN",
    mask2: "SALE",
  },
  "zh-TW": {
    loop: "循環",
    hover: "滑過",
    replay: "重播",
    entrance: "單次",
    path: "全館滿額免運 · 每天出貨 · ",
    ring: "新品上市 · 新品上市 · ",
    arc: "小批量手工製作",
    weight: "字重變化",
    word: "大膽一點",
    mask: "海洋",
    mask2: "特價",
  },
  "zh-CN": {
    loop: "循环",
    hover: "悬停",
    replay: "重播",
    entrance: "单次",
    path: "全场满额包邮 · 每天发货 · ",
    ring: "新品上市 · 新品上市 · ",
    arc: "小批量手工制作",
    weight: "字重变化",
    word: "大胆一点",
    mask: "海洋",
    mask2: "特价",
  },
  ja: {
    loop: "ループ",
    hover: "ホバー",
    replay: "再生",
    entrance: "1回",
    path: "全品送料無料・毎日発送・",
    ring: "NEW SEASON · NEW SEASON · ",
    arc: "少量ずつ手作りしています",
    weight: "ウェイト",
    word: "大胆に",
    mask: "OCEAN",
    mask2: "SALE",
  },
};

function Tile({ name, hint, replay, children }: { name: string; hint: string; replay?: string; children: ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{hint}</span>
          {replay && (
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {replay}
            </button>
          )}
        </div>
      </div>
      <div
        key={run}
        className="flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 px-4 text-foreground"
      >
        {children}
      </div>
    </div>
  );
}

// 每一格的代號：首頁型錄（variants.tsx）一格一張卡
export const typeMotionTiles = [
  "text-on-path-wave",
  "text-on-path-circle",
  "text-on-path-arc",
  "variable-font-wave",
  "variable-font-word",
  "text-mask-gradient",
  "text-mask-image",
] as const;
export type TypeMotionTileId = (typeof typeMotionTiles)[number];

/** 單一字體動態的示範格：完整 demo 與首頁型錄共用 */
export function TypeMotionTile({ id }: { id: TypeMotionTileId }) {
  const t = useDemoText(copy);
  switch (id) {
    case "text-on-path-wave":
      return (
        <Tile name="text-on-path · wave" hint={t.loop}>
          <TextOnPath text={t.path} preset="wave" className="w-full font-semibold" showPath />
        </Tile>
      );
    case "text-on-path-circle":
      return (
        <Tile name="text-on-path · circle" hint={t.loop}>
          <TextOnPath text={t.ring} preset="circle" className="w-40 font-semibold tracking-widest text-primary" />
        </Tile>
      );
    case "text-on-path-arc":
      return (
        <Tile name="text-on-path · arc" hint={t.hover}>
          <TextOnPath text={t.arc} preset="arc" trigger="hover" duration={6} className="w-full font-medium" showPath />
        </Tile>
      );
    case "variable-font-wave":
      return (
        <Tile name="variable-font · wave" hint={t.loop}>
          <VariableWeight text={t.weight} from={100} to={900} className="text-4xl" />
        </Tile>
      );
    case "variable-font-word":
      return (
        <Tile name="variable-font · word" hint={t.hover}>
          <VariableWeight text={t.word} mode="word" trigger="hover" from={300} to={900} className="text-4xl text-primary" />
        </Tile>
      );
    case "text-mask-gradient":
      return (
        <Tile name="text-mask · gradient" hint={t.loop}>
          <TextMask text={t.mask2} duration={6} />
        </Tile>
      );
    case "text-mask-image":
      return (
        <Tile name="text-mask · image + reveal" hint={t.entrance} replay={t.replay}>
          <TextMask text={t.mask} src={sea} reveal trigger="inView" duration={5} />
        </Tile>
      );
  }
}

export default function TypeMotionDemo() {
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-x-6 gap-y-10 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {typeMotionTiles.map((id) => (
        <TypeMotionTile key={id} id={id} />
      ))}
    </div>
  );
}
