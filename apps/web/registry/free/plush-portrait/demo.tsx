"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import {
  PlushPortrait,
  plushFrames,
  type PlushFaces,
  type PlushFrame,
} from "./plush-portrait";

// A fictional person, generated for this demo. Every face shares one framing.
const dir = "/blocks/plush-portrait";
const faces: PlushFaces = {
  rest: `${dir}/rest.webp`,
  hover: `${dir}/hover.webp`,
  grab: `${dir}/grab.webp`,
  pull: `${dir}/pull.webp`,
  dazed: `${dir}/dazed.webp`,
  blink: `${dir}/blink.webp`,
  idle: `${dir}/idle.webp`,
  lookLeft: `${dir}/look-left.webp`,
  lookRight: `${dir}/look-right.webp`,
};

const copy = {
  en: {
    hello: "Hi, I'm",
    name: "Mei",
    body: "I design small things people touch every day. Go on, grab my cheek and pull. I'll forgive you.",
    hint: "Hover, grab and stretch. Leave it alone and she gets bored.",
    alt: "Portrait of Mei, smiling",
    poke: "Poke Mei",
    frame: "Frame",
    frames: { circle: "Circle", square: "Square", none: "None" },
  },
  "zh-TW": {
    hello: "嗨，我是",
    name: "小梅",
    body: "我設計每天會被碰到的小東西。來吧，捏住我的臉頰往外拉，我不會生氣。",
    hint: "滑過、抓住、拉長。放著不管她會開始無聊。",
    alt: "小梅微笑的肖像",
    poke: "戳一下小梅",
    frame: "外框",
    frames: { circle: "圓形", square: "方形", none: "無" },
  },
  "zh-CN": {
    hello: "嗨，我是",
    name: "小梅",
    body: "我设计每天会被碰到的小东西。来吧，捏住我的脸颊往外拉，我不会生气。",
    hint: "滑过、抓住、拉长。放着不管她会开始无聊。",
    alt: "小梅微笑的肖像",
    poke: "戳一下小梅",
    frame: "外框",
    frames: { circle: "圆形", square: "方形", none: "无" },
  },
  ja: {
    hello: "こんにちは、",
    name: "メイです",
    body: "毎日さわる小さなものをデザインしています。どうぞ、ほっぺをつまんで引っぱってみて。怒りません。",
    hint: "ホバー、つかむ、のばす。放っておくと退屈しはじめます。",
    alt: "笑顔のメイの肖像",
    poke: "メイをつつく",
    frame: "フレーム",
    frames: { circle: "円", square: "四角", none: "なし" },
  },
};

export default function PlushPortraitDemo() {
  const t = useDemoText(copy);
  const [frame, setFrame] = useState<PlushFrame>("circle");

  return (
    // The stretch canvas reaches past the portrait; clip it so the page never scrolls sideways.
    <div className="w-full overflow-x-clip">
      <div className="mx-auto grid w-full max-w-4xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_1.05fr] md:gap-12">
        <div className="order-2 md:order-1">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t.hello} <span className="text-primary">{t.name}</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
            {t.body}
          </p>
          <p className="mt-6 text-xs text-muted-foreground">{t.hint}</p>
          <div
            className="mt-6 flex items-center gap-2"
            role="group"
            aria-label={t.frame}
          >
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              {t.frame}
            </span>
            {plushFrames.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrame(f)}
                aria-pressed={frame === f}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  frame === f
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.frames[f]}
              </button>
            ))}
          </div>
        </div>
        <div className="order-1 mx-auto w-full max-w-[420px] md:order-2">
          <PlushPortrait
            faces={faces}
            alt={t.alt}
            pokeLabel={t.poke}
            frame={frame}
          />
        </div>
      </div>
    </div>
  );
}
