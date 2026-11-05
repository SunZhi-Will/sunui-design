"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { PixelFx, collectBurst, confetti, pixelReveal } from "./pixel-fx";

const copy = {
  en: { eyebrow: "Daily altar", shards: "120 shards", streak: "Day 4 of 7", claim: "Claim", claimed: "Claimed", sealed: "Sealed reward", open: "Break the seal", code: "Shop code", note: "15% off one skin, until Sunday" },
  "zh-TW": { eyebrow: "每日祭壇", shards: "120 碎晶", streak: "連續第 4 天，共 7 天", claim: "領取", claimed: "已領取", sealed: "封印的獎勵", open: "打破封印", code: "商店兌換碼", note: "單一外觀 85 折，至週日" },
  "zh-CN": { eyebrow: "每日祭坛", shards: "120 碎晶", streak: "连续第 4 天，共 7 天", claim: "领取", claimed: "已领取", sealed: "封印的奖励", open: "打破封印", code: "商店兑换码", note: "单一外观 85 折，至周日" },
  ja: { eyebrow: "デイリー祭壇", shards: "欠片 120", streak: "7 日中 4 日目", claim: "受け取る", claimed: "受け取り済み", sealed: "封印された報酬", open: "封印を解く", code: "ショップコード", note: "スキン 1 点 15% オフ、日曜まで" },
};

function Shard() {
  return (
    <svg viewBox="0 0 16 16" className="size-8" shapeRendering="crispEdges" aria-hidden>
      <path fill="#5a4122" d="M7 1h2v1h1v2h1v3h1v4h-1v2h-1v1H9v1H7v-1H6v-1H5v-2H4V7h1V4h1V2h1z" />
      <path fill="#c9a063" d="M7 2h2v2h1v3h1v4h-1v2H9v1H7v-1H6v-2H5V7h1V4h1z" />
      <path fill="#f3e3c0" d="M7 3h1v3H7v3H6V6h1z" />
    </svg>
  );
}

export default function PixelFxDemo() {
  const t = useDemoText(copy);
  const [claimed, setClaimed] = useState(0);
  const [opened, setOpened] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [party, setParty] = useState(0);

  return (
    <div
      className="relative w-full max-w-sm min-w-0 overflow-hidden rounded-[3px] border border-[rgb(234_228_214/0.14)] bg-[#0b0e14] p-4 text-[#eae4d6] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:p-5"
    >
      <p className="text-[11px] font-medium tracking-[0.18em] text-[#c9a063] uppercase">{t.eyebrow}</p>

      <div className="mt-3 flex items-center gap-3 border-b border-[rgb(234_228_214/0.14)] pb-4">
        <div className="relative grid size-12 shrink-0 place-items-center">
          <Shard />
          <div className="pointer-events-none absolute -inset-10">
            <PixelFx effect={collectBurst} trigger={claimed} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium tabular-nums">{t.shards}</p>
          <p className="text-sm text-[rgb(234_228_214/0.6)]">{t.streak}</p>
        </div>
        <button
          type="button"
          disabled={claimed > 0}
          onClick={() => setClaimed(1)}
          className="shrink-0 rounded-[2px] border border-[#c9a063] px-3 py-1.5 text-sm font-medium text-[#c9a063] transition-colors duration-[120ms] hover:bg-[#c9a063] hover:text-[#0b0e14] focus-visible:ring-2 focus-visible:ring-[#c9a063] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] focus-visible:outline-none disabled:border-[rgb(234_228_214/0.14)] disabled:bg-transparent disabled:text-[rgb(234_228_214/0.6)]"
        >
          {claimed ? t.claimed : t.claim}
        </button>
      </div>

      <p className="mt-4 text-sm text-[rgb(234_228_214/0.6)]">{t.sealed}</p>
      <div className="relative mt-2 overflow-hidden rounded-[2px] border border-[rgb(234_228_214/0.14)]">
        <div className="px-4 py-5 text-center" aria-hidden={!revealed} inert={!revealed}>
          <p className="text-[11px] tracking-[0.18em] text-[rgb(234_228_214/0.6)] uppercase">{t.code}</p>
          <p className="mt-1 font-mono text-xl tracking-[0.12em] text-[#c9a063]">ALTAR-7Q4K</p>
          <p className="mt-1 text-sm text-[rgb(234_228_214/0.6)]">{t.note}</p>
        </div>
        {!revealed && (
          <PixelFx
            effect={pixelReveal}
            holdFirstFrame
            trigger={opened}
            onDone={() => {
              setRevealed(true);
              setParty(1);
            }}
          />
        )}
        {!opened && (
          <button
            type="button"
            onClick={() => setOpened(1)}
            className="absolute inset-0 m-auto h-fit w-fit rounded-[2px] border border-[#c9a063] bg-[#0b0e14] px-4 py-2 text-sm font-medium text-[#c9a063] transition-colors duration-[120ms] hover:bg-[#c9a063] hover:text-[#0b0e14] focus-visible:ring-2 focus-visible:ring-[#c9a063] focus-visible:outline-none"
          >
            {t.open}
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {revealed ? `${t.code}: ALTAR-7Q4K` : ""}
      </p>

      <PixelFx effect={confetti} trigger={party} />
    </div>
  );
}
