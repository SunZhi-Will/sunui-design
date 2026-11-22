"use client";

import { useState } from "react";

import { PixelIcon, type PixelIconName } from "@/registry/icons/sunui-pixel-icons";

import { PixelStack } from "./pixel-stack";
import type { ShapeMode } from "./stack-core";

function Section({ n, title, note, children }: { n: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-xs text-muted-foreground">{n}</span>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}

const SHAPES: { icon: PixelIconName; mode: ShapeMode; depth?: number; why: string }[] = [
  { icon: "coin", mode: "slab", depth: 3, why: "slab：擠出 3 格厚" },
  { icon: "shield", mode: "slab", depth: 4, why: "slab：擠出 4 格厚" },
  { icon: "heart", mode: "puff", depth: 8, why: "puff：中間厚、邊緣薄" },
  { icon: "slime", mode: "puff", depth: 10, why: "puff：像吹氣" },
  { icon: "potion", mode: "lathe", why: "lathe：繞軸轉一圈" },
  { icon: "mushroom", mode: "lathe", why: "lathe：圓的蕈傘" },
  { icon: "cupcake", mode: "lathe", why: "lathe" },
  { icon: "lantern", mode: "lathe", why: "lathe" },
];

const MENU: { icon: PixelIconName; label: string; mode: ShapeMode; depth?: number }[] = [
  { icon: "gift", label: "禮物", mode: "slab", depth: 4 },
  { icon: "trophy", label: "排行", mode: "slab", depth: 4 },
  { icon: "chest", label: "寶箱", mode: "slab", depth: 8 },
  { icon: "potion", label: "道具", mode: "lathe" },
  { icon: "gem", label: "鑽石", mode: "puff", depth: 6 },
  { icon: "star", label: "收藏", mode: "puff", depth: 6 },
];

const REWARDS: PixelIconName[] = ["chest", "gem", "crown", "potion", "trophy", "gift"];
const REWARD_MODE: Record<string, { mode: ShapeMode; depth?: number }> = {
  chest: { mode: "slab", depth: 8 },
  gem: { mode: "puff", depth: 6 },
  crown: { mode: "lathe" },
  potion: { mode: "lathe" },
  trophy: { mode: "lathe" },
  gift: { mode: "slab", depth: 10 },
};

function MenuButton({ item }: { item: (typeof MENU)[number] }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onPointerEnter={() => setOn(true)}
      onPointerLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-3 pt-1 pb-3 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="relative h-20 w-20">
        <PixelStack icon={item.icon} mode={item.mode} depth={item.depth} scale={3} behavior="spin" active={on} className="absolute bottom-0 left-1/2 -translate-x-1/2" />
      </span>
      <span>{item.label}</span>
    </button>
  );
}

function RewardReveal() {
  const [k, setK] = useState(0);
  const icon = REWARDS[k % REWARDS.length];
  const m = REWARD_MODE[icon];
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="relative grid h-64 w-full place-items-center">
        {k > 0 && <span key={k} className="ring-pop absolute bottom-10 h-6 w-40 rounded-[50%] border-2 border-[var(--sunui-spot,#2f6bff)]" />}
        {k > 0 ? (
          <PixelStack key={icon} icon={icon} mode={m.mode} depth={m.depth} scale={7} behavior="drag" bloomKey={k} outline />
        ) : (
          <span className="text-sm text-muted-foreground">按下面的按鈕抽一次</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setK((v) => v + 1)}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-transform active:scale-[0.97]"
      >
        {k === 0 ? "抽一次" : "再抽一次"}
      </button>
      <style>{`.ring-pop{animation:ringpop .9s cubic-bezier(.23,1,.32,1) both}@keyframes ringpop{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}@media (prefers-reduced-motion:reduce){.ring-pop{animation:none;opacity:0}}`}</style>
    </div>
  );
}

function LoadingButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        setTimeout(() => setBusy(false), 3000);
      }}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card pr-5 pl-2 text-sm font-medium"
    >
      {busy ? (
        <PixelStack icon="coin" mode="slab" depth={2} scale={2} behavior="auto" speed={7} squash={0.85} bands={3} />
      ) : (
        <PixelIcon name="coin" tone="pigment" size={32} />
      )}
      {busy ? "付款處理中" : "用 120 金幣兌換"}
    </button>
  );
}

export function SpriteStackStudy() {
  const [inspect, setInspect] = useState<PixelIconName>("chest");
  const [slices, setSlices] = useState(0);
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12 text-foreground">
      <header>
        <p className="font-mono text-xs text-muted-foreground">SPRITE STACKING STUDY · 2026-11-22</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">像素圖示，站起來轉</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          參考 danielwh2/sprite-stacking：一疊水平切片，每片轉同一個角度、壓扁、往上抬 1 格。這裡直接拿 SunUI 現有的 125
          個 16 × 16 像素圖示當正面，用三種方式長出體積，不用另外畫。只是樣張，不進型錄、不進 registry。
        </p>
      </header>

      <Section n="01" title="三種成形方式" note="原 repo 要四張視圖。我們的圖示只有正面一張，所以依物件形狀選：扁的擠出、軟的充氣、圓的繞軸轉。全部同一個引擎，光固定在左上，物件轉的時候明暗跟著變。">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SHAPES.map((x) => (
            <figure key={x.icon} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-end gap-3">
                <PixelIcon name={x.icon} tone="pigment" size={32} />
                <PixelStack icon={x.icon} mode={x.mode} depth={x.depth} scale={4} behavior="auto" speed={0.9} />
              </div>
              <figcaption className="text-xs text-muted-foreground">{x.why}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section n="02" title="選單圖示：hover 轉一圈" note="靜止時停在 3/4 角，看得出厚度；游標移入或鍵盤聚焦時轉一整圈、鏡頭稍微抬高，900ms 後停回原位。左邊是現在的平面版，對照用。">
        <div className="flex flex-wrap items-start gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">現在（平面）</span>
            <div className="flex gap-2">
              {MENU.map((m) => (
                <div key={m.icon} className="flex w-[4.5rem] flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm">
                  <PixelIcon name={m.icon} tone="pigment" size={48} />
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">疊層（hover 或 Tab）</span>
            <div className="flex gap-2">
              {MENU.map((m) => (
                <MenuButton key={m.icon} item={m} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section n="03" title="拖曳檢視：商品或獎勵轉台" note="左右拖轉動，放手有慣性；上下拖改俯角。閒置 1.6 秒後慢慢自轉，提示可以拖。切片滑桿把每層拉開，看得到裡面怎麼疊的。">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-[1fr_16rem]">
          <div className="grid min-h-80 place-items-center rounded-xl bg-muted/50">
            <PixelStack
              key={inspect}
              icon={inspect}
              mode={REWARD_MODE[inspect]?.mode ?? "slab"}
              depth={REWARD_MODE[inspect]?.depth}
              scale={8}
              behavior="drag"
              explode={slices}
              outline
              label={`${inspect}，可拖曳轉動`}
            />
          </div>
          <div className="flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-3 gap-2">
              {REWARDS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInspect(r)}
                  aria-pressed={inspect === r}
                  className="grid place-items-center rounded-lg border border-border py-2 aria-pressed:border-foreground aria-pressed:bg-muted"
                >
                  <PixelIcon name={r} tone="pigment" size={32} />
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-muted-foreground">切片間距 {slices.toFixed(1)}</span>
              <input type="range" min={0} max={1.5} step={0.1} value={slices} onChange={(e) => setSlices(Number(e.target.value))} />
            </label>
          </div>
        </div>
      </Section>

      <Section n="04" title="獎勵登場：由下往上長出來" note="原 repo 的規則：登場不要淡入，改成切片由地面往上一層層冒出、彈一下落定，再配一圈地面波紋。適合抽獎、開箱、簽到獎勵。出來之後可以拖。">
        <RewardReveal />
      </Section>

      <div className="grid gap-12 md:grid-cols-2">
        <Section n="05" title="載入中：轉動的金幣" note="按鈕的 loading 狀態直接用圖示本身轉，不另外放 spinner。按一下看 3 秒。">
          <LoadingButton />
        </Section>
        <Section n="06" title="卡片：跟著游標偏一點" note="游標在卡片上移動，物件轉 ±50 度、俯角跟著變。跟 3D 卡片傾斜同一種回饋，但只有物件動，卡片本身不動。">
          <div className="relative h-56 overflow-hidden rounded-2xl border border-border bg-card">
            <PixelStack icon="crown" mode="slab" depth={4} scale={6} behavior="tilt" turn={0} squash={0.5} outline className="absolute inset-0 pb-6" />
          </div>
        </Section>
      </div>

      <Section n="07" title="爆炸圖：hover 分層" note="適合功能介紹或「怎麼做的」卡片：平時是一個物件，游標移入就一片片拉開。">
        <div className="flex flex-wrap gap-4">
          {(["cake", "chest", "boba"] as PixelIconName[]).map((i) => (
            <div key={i} className="relative h-64 w-48 overflow-hidden rounded-2xl border border-border bg-card">
              <PixelStack icon={i} mode={i === "chest" ? "slab" : "lathe"} depth={i === "chest" ? 8 : undefined} scale={5} behavior="explode" className="absolute inset-0 pb-4" />
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
