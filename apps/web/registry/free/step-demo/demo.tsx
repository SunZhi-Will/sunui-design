"use client";

import { useMemo, type ReactNode } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { StepDemo, cue, ease, lerp, typed, typingTime, type StepDemoStep, type StepViewProps } from "./step-demo";

// 茶行的活動工具：描述 → 產生 → 上線。每個畫面只依 t 畫出來，時間點用具名常數排。

const copy = {
  en: {
    names: ["Describe", "Generate", "Publish"],
    crumbs: "Campaigns / Autumn sale",
    promptLabel: "What is the campaign?",
    prompt: "Autumn sale: 15% off all oolong, ends Sunday",
    cps: 45,
    generate: "Generate banner",
    making: "Making…",
    kicker: "AUTUMN SALE",
    headline: "15% off oolong",
    sub: "Ends Sunday · Kumo Tea",
    made: "Made 3 variants in 0:41",
    variants: "Variants",
    publish: "Publish to store",
    published: "Published",
    toast: "Live on home, cart and 2 product pages",
    visits: "Visits, first hour",
    redeemed: "Codes redeemed",
  },
  "zh-TW": {
    names: ["描述", "產生", "上線"],
    crumbs: "活動 / 秋季特賣",
    promptLabel: "這次的活動是？",
    prompt: "秋季特賣：烏龍茶全面 85 折，週日截止",
    cps: 16,
    generate: "產生橫幅",
    making: "製作中…",
    kicker: "秋季特賣",
    headline: "烏龍茶 85 折",
    sub: "週日截止 · 雲間茶行",
    made: "0:41 內產生 3 個版本",
    variants: "版本",
    publish: "發布到商店",
    published: "已發布",
    toast: "已上線：首頁、購物車與 2 個商品頁",
    visits: "第一小時造訪",
    redeemed: "已使用優惠碼",
  },
  "zh-CN": {
    names: ["描述", "生成", "上线"],
    crumbs: "活动 / 秋季特卖",
    promptLabel: "这次的活动是？",
    prompt: "秋季特卖：乌龙茶全场 85 折，周日截止",
    cps: 16,
    generate: "生成横幅",
    making: "制作中…",
    kicker: "秋季特卖",
    headline: "乌龙茶 85 折",
    sub: "周日截止 · 云间茶行",
    made: "0:41 内生成 3 个版本",
    variants: "版本",
    publish: "发布到店铺",
    published: "已发布",
    toast: "已上线：首页、购物车与 2 个商品页",
    visits: "第一小时访问",
    redeemed: "已使用优惠码",
  },
  ja: {
    names: ["説明", "生成", "公開"],
    crumbs: "キャンペーン / 秋のセール",
    promptLabel: "どんなキャンペーン？",
    prompt: "秋のセール：烏龍茶すべて 15% オフ、日曜まで",
    cps: 16,
    generate: "バナーを生成",
    making: "作成中…",
    kicker: "秋のセール",
    headline: "烏龍茶 15% オフ",
    sub: "日曜まで · 雲間茶舗",
    made: "0:41 で 3 案を作成",
    variants: "案",
    publish: "ストアに公開",
    published: "公開済み",
    toast: "公開中：トップ、カート、商品ページ 2 件",
    visits: "最初の 1 時間の訪問",
    redeemed: "使用されたコード",
  },
};

type Copy = (typeof copy)["en"];

/* ---------- 具名時間點（秒） ---------- */

const TYPE_FROM = 1.5;
const READY = 2.0; // 第二步：產生完成
const PICK = 4.8; // 第二步：點選第二個版本
const PUBLISH = 1.4; // 第三步：按下發布
const LIVE = 2.0; // 第三步：上線

// 三個版本靠底色層次區分，不依賴主題的強調色是否接近前景色。
const TONES = ["bg-primary text-primary-foreground", "bg-muted text-foreground", "bg-card text-foreground ring-1 ring-inset ring-border"];

function Spinner({ t }: { t: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="size-5" style={{ transform: `rotate(${t * 360}deg)` }} aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

function Banner({ c, tone = 0, small }: { c: Copy; tone?: number; small?: boolean }) {
  return (
    <div className={cn("relative h-full overflow-hidden rounded-xl", TONES[tone], small ? "p-3" : "p-10")}>
      <span className={cn("absolute rounded-full bg-current opacity-10", small ? "-right-4 -bottom-6 size-16" : "-right-16 -bottom-24 size-80")} />
      <span className={cn("absolute rounded-full bg-current opacity-10", small ? "right-6 -top-6 size-10" : "right-28 -top-20 size-48")} />
      <p className={cn("font-medium tracking-[0.14em] opacity-70", small ? "text-[8px]" : "text-sm")}>{c.kicker}</p>
      <p className={cn("font-semibold tracking-tight", small ? "mt-1 text-sm" : "mt-4 text-6xl")}>{c.headline}</p>
      {!small ? <p className="mt-5 text-lg opacity-80">{c.sub}</p> : null}
    </div>
  );
}

/** 共用外殼：上方工具列、左側面板、右側畫布 */
function Shell({ c, panel, canvas }: { c: Copy; panel: ReactNode; canvas: ReactNode }) {
  return (
    <div className="flex h-full flex-col text-foreground">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6">
        <span className="size-6 rounded-md bg-primary" />
        <span className="text-base font-semibold">Kumo Studio</span>
        <span className="text-base text-muted-foreground">{c.crumbs}</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[330px] shrink-0 flex-col gap-5 border-r border-border p-6">{panel}</div>
        <div className="relative min-w-0 flex-1 bg-muted/40 p-8">{canvas}</div>
      </div>
    </div>
  );
}

function PromptBox({ c, text, focus }: { c: Copy; text: string; focus?: boolean }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{c.promptLabel}</p>
      <div data-aim="prompt" className={cn("mt-2 min-h-28 rounded-lg border bg-card p-4 text-lg leading-snug", focus ? "border-ring ring-2 ring-ring/30" : "border-border")}>
        {text}
        {focus ? <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 bg-foreground" /> : null}
      </div>
    </div>
  );
}

function ActionButton({ aim, label, pressed, busy, t, done }: { aim: string; label: string; pressed?: boolean; busy?: boolean; t: number; done?: boolean }) {
  return (
    <div data-aim={aim} className={cn("flex h-12 items-center justify-center gap-2 rounded-lg text-base font-medium transition-transform duration-150", done ? "bg-muted text-foreground" : "bg-primary text-primary-foreground", pressed && "scale-[0.97]")}>
      {busy ? <Spinner t={t} /> : done ? <span className="size-2 rounded-full bg-emerald-500" /> : null}
      {label}
    </div>
  );
}

/* ---------- 三個步驟 ---------- */

function useClickAt(c: Copy) {
  return TYPE_FROM + typingTime(c.prompt, c.cps) + 1.1;
}

function Describe({ t }: StepViewProps) {
  const c = useDemoText(copy);
  const click = useClickAt(c);
  return (
    <Shell
      c={c}
      panel={
        <>
          <PromptBox c={c} text={typed(c.prompt, t, TYPE_FROM, c.cps)} focus={cue(t, 1.2)} />
          <ActionButton aim="generate" label={cue(t, click) ? c.making : c.generate} busy={cue(t, click)} pressed={t >= click && t < click + 0.18} t={t} />
        </>
      }
      canvas={<div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-border text-lg text-muted-foreground">1200 × 628</div>}
    />
  );
}

function Generate({ t }: StepViewProps) {
  const c = useDemoText(copy);
  const reveal = ease(t, READY, 0.9, "linear");
  const settle = ease(t, READY + 0.9, 0.9);
  const picked = cue(t, PICK) ? 1 : 0;
  return (
    <Shell
      c={c}
      panel={
        <>
          <PromptBox c={c} text={c.prompt} />
          <ActionButton aim="generate" label={cue(t, READY) ? c.made : c.making} busy={!cue(t, READY)} done={cue(t, READY)} t={t} />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{c.variants}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TONES.map((_, i) => {
                const p = ease(t, 3.0 + i * 0.2, 0.36);
                return (
                  <div key={i} data-aim={`variant-${i}`} className={cn("h-20 rounded-xl ring-offset-2 ring-offset-background", picked === i && "ring-2 ring-ring")} style={{ opacity: p, transform: `translateY(${lerp(8, 0, p)}px)` }}>
                    <Banner c={c} tone={i} small />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      }
      canvas={
        <div className="relative h-full overflow-hidden rounded-xl">
          {/* 產生中：骨架掃光 */}
          {!cue(t, READY) ? (
            <div className="absolute inset-0 overflow-hidden rounded-xl bg-muted">
              <div className="absolute inset-y-0 w-1/3 bg-background/60" style={{ transform: `translateX(${lerp(-100, 300, (t % 1.2) / 1.2)}%)` }} />
            </div>
          ) : null}
          {/* 結果：模糊暗底上由上往下畫出，掃描線跟著走，最後亮度回穩 */}
          {cue(t, READY) ? (
            <>
              <div className="absolute inset-0" style={{ filter: "blur(10px) brightness(0.5) saturate(0.4)", transform: "scale(1.08)", opacity: 1 - settle }}>
                <Banner c={c} tone={picked} />
              </div>
              <div className="absolute inset-0" style={{ clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)`, filter: `brightness(${lerp(1.35, 1, settle)}) saturate(${lerp(1.1, 1, settle)})` }}>
                <Banner c={c} tone={picked} />
              </div>
              {reveal < 1 ? <div className="absolute inset-x-0 h-0.5 bg-amber-400" style={{ top: `${reveal * 100}%` }} /> : null}
            </>
          ) : null}
        </div>
      }
    />
  );
}

function Publish({ t }: StepViewProps) {
  const c = useDemoText(copy);
  const toast = ease(t, LIVE, 0.36);
  const count = ease(t, LIVE + 0.4, 3, "out");
  return (
    <Shell
      c={c}
      panel={
        <>
          <PromptBox c={c} text={c.prompt} />
          <ActionButton aim="publish" label={cue(t, LIVE) ? c.published : c.publish} busy={cue(t, PUBLISH) && !cue(t, LIVE)} done={cue(t, LIVE)} pressed={t >= PUBLISH && t < PUBLISH + 0.18} t={t} />
          <dl className="grid grid-cols-2 gap-3">
            {(
              [
                [c.visits, Math.round(1284 * count)],
                [c.redeemed, Math.round(96 * count)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-card p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</dd>
              </div>
            ))}
          </dl>
        </>
      }
      canvas={
        <div className="relative h-full">
          <Banner c={c} tone={1} />
          <div className="absolute right-12 bottom-12 flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3.5 text-base shadow-sm" style={{ opacity: toast, transform: `translateY(${lerp(12, 0, toast)}px)` }}>
            <span className="size-2 rounded-full bg-emerald-500" />
            {c.toast}
          </div>
        </div>
      }
    />
  );
}

export default function StepDemoDemo() {
  const locale = useDemoLocale();
  const c = useDemoText(copy);
  const click = useClickAt(c);

  const steps = useMemo<StepDemoStep[]>(
    () => [
      {
        id: "describe",
        name: c.names[0],
        dur: Math.max(6, click + 1.4),
        View: Describe,
        cursor: [
          { at: 0.8, to: "prompt", click: 1.2 },
          { at: click - 0.4, to: "generate", click },
        ],
      },
      {
        id: "generate",
        name: c.names[1],
        dur: 6.2,
        View: Generate,
        cursor: [
          { at: 0, to: "generate", hide: true },
          { at: PICK - 0.4, to: "variant-1", click: PICK },
        ],
      },
      {
        id: "publish",
        name: c.names[2],
        dur: 6.5,
        View: Publish,
        cursor: [
          { at: 0, to: [190, 330] },
          { at: PUBLISH - 0.4, to: "publish", click: PUBLISH },
          { at: LIVE + 0.6, to: [300, 560], hide: true },
        ],
      },
    ],
    [c, click],
  );

  return (
    <div className="w-full max-w-4xl min-w-0">
      <StepDemo steps={steps} size={[960, 600]} url="studio.kumotea.com/campaigns" controls="scrubber" locale={locale} />
    </div>
  );
}

