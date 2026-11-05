"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  ExplodedView,
  MotionPrinciple,
  Stagger,
  isLoopingMotionPrinciple,
  motionPrinciples,
  type MotionPrincipleName,
} from "./motion-principles";

const copy = {
  en: { entrance: "Once", loop: "Loop", replay: "Replay", linear: "linear", eased: "eased", sale: "SALE" },
  "zh-TW": { entrance: "單次", loop: "循環", replay: "重播", linear: "等速", eased: "緩動", sale: "特價" },
  "zh-CN": { entrance: "单次", loop: "循环", replay: "重播", linear: "匀速", eased: "缓动", sale: "特价" },
  ja: { entrance: "1回", loop: "ループ", replay: "再生", linear: "等速", eased: "イージング", sale: "SALE" },
};

const accent = "var(--chart-2, var(--primary))";

/* ---------- 示範用的簡單 SVG 主角 ---------- */

function Ball({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="block text-primary">
      <circle cx="20" cy="20" r="18" fill="currentColor" />
      <ellipse cx="14" cy="13" rx="5" ry="3.5" fill="var(--background)" opacity="0.35" />
    </svg>
  );
}

function Square() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" className="block text-primary">
      <rect x="3" y="3" width="34" height="34" rx="8" fill="currentColor" />
      <circle cx="15" cy="17" r="2.5" fill="var(--background)" />
      <circle cx="26" cy="17" r="2.5" fill="var(--background)" />
    </svg>
  );
}

function Heart({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="block" style={{ color: accent }}>
      <path
        fill="currentColor"
        d="M12 21s-7.5-4.6-9.6-9.4C1 8.3 3 4.5 6.7 4.5c2.1 0 3.8 1.2 5.3 3.1 1.5-1.9 3.2-3.1 5.3-3.1 3.7 0 5.7 3.8 4.3 7.1C19.5 16.4 12 21 12 21z"
      />
    </svg>
  );
}

function Star({ size = 40, outline = false }: { size?: number; outline?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="block text-primary">
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
        fill={outline ? "none" : "currentColor"}
        stroke="currentColor"
        strokeWidth={outline ? 1.4 : 0}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bell() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true" className="block text-primary">
      <path fill="currentColor" d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.6A6 6 0 0 1 18 10v4.5l2 2.5H4l2-2.5V10a6 6 0 0 1 4.5-5.9v-.6A1.5 1.5 0 0 1 12 2z" />
      <circle cx="12" cy="19.5" r="2.2" fill="currentColor" />
    </svg>
  );
}

function Flag() {
  return (
    <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true" className="block">
      <rect x="2" y="2" width="2.5" height="32" rx="1" fill="currentColor" className="text-foreground" />
      <path d="M4.5 3h17l-4 5 4 5h-17z" fill={accent} />
    </svg>
  );
}

function Petal() {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden="true" className="block text-primary">
      <path d="M7 1c4 4 6 8 6 12a6 6 0 0 1-12 0c0-4 2-8 6-12z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function Shard() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true" className="block">
      <path d="M11 1l10 20H1z" fill={accent} opacity="0.8" />
      <circle cx="11" cy="15" r="3" fill="currentColor" className="text-primary" />
    </svg>
  );
}

function Sketch() {
  return (
    <svg width="96" height="72" viewBox="0 0 96 72" aria-hidden="true" className="block text-foreground">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 52c-9 0-13-12-4-16 0-10 13-14 19-7 4-9 20-9 23 1 10-2 16 9 10 16 4 7-2 13-9 11z" />
        <path d="M30 60l-3 8M46 60l-3 8M62 60l-3 8" />
      </g>
    </svg>
  );
}

function Gauge() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" className="block text-primary">
      <rect x="20" y="6" width="4" height="34" rx="2" fill="currentColor" style={{ transformOrigin: "22px 38px" }} />
      <circle cx="22" cy="38" r="5" fill="currentColor" />
    </svg>
  );
}

/** 手機分層：背殼、主機板、螢幕、玻璃 */
function PhoneLayers() {
  const w = 54;
  const h = 96;
  const layer = (children: ReactNode) => (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="block">
      {children}
    </svg>
  );
  return [
    layer(<rect x="1" y="1" width={w - 2} height={h - 2} rx="10" className="fill-muted-foreground" />),
    layer(
      <g>
        <rect x="6" y="8" width={w - 12} height={h - 16} rx="5" fill={accent} opacity="0.9" />
        <rect x="12" y="16" width="14" height="10" rx="2" className="fill-background" opacity="0.7" />
        <rect x="12" y="34" width={w - 24} height="30" rx="3" className="fill-background" opacity="0.4" />
      </g>,
    ),
    layer(
      <g>
        <rect x="4" y="5" width={w - 8} height={h - 10} rx="7" className="fill-primary" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x={11 + (i % 2) * 18}
            y={14 + Math.floor(i / 2) * 18}
            width="13"
            height="13"
            rx="3"
            className="fill-primary-foreground"
            opacity="0.8"
          />
        ))}
      </g>,
    ),
    layer(<rect x="1" y="1" width={w - 2} height={h - 2} rx="10" fill="none" className="stroke-foreground" strokeWidth="1.5" opacity="0.6" />),
  ];
}

/* ---------- 示範格 ---------- */

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
        className="relative flex h-44 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 text-foreground"
      >
        {children}
      </div>
    </div>
  );
}

function Subject({ effect, sale, linear, eased }: { effect: MotionPrincipleName; sale: string; linear: string; eased: string }) {
  const trigger = isLoopingMotionPrinciple(effect) ? "loop" : "inView";
  switch (effect) {
    case "burst":
      return (
        <MotionPrinciple effect="burst" trigger={trigger} color={accent}>
          <Heart />
        </MotionPrinciple>
      );
    case "easing":
      return (
        <div className="flex w-full flex-col gap-6 px-4">
          {(["linear", "inOut"] as const).map((e) => (
            <div key={e} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">{e === "linear" ? linear : eased}</span>
              <div className="flex flex-1 justify-center">
                <MotionPrinciple effect="easing" ease={e} trigger={trigger} distance={150} duration={1.4}>
                  <Ball size={26} />
                </MotionPrinciple>
              </div>
            </div>
          ))}
        </div>
      );
    case "overshoot":
      return (
        <MotionPrinciple effect="overshoot" trigger={trigger}>
          <Gauge />
        </MotionPrinciple>
      );
    case "squash-stretch":
      return (
        <div className="translate-y-8">
          <MotionPrinciple effect="squash-stretch" trigger="loop">
            <Ball />
          </MotionPrinciple>
        </div>
      );
    case "motion-trail":
      return (
        <MotionPrinciple effect="motion-trail" trigger={trigger}>
          <Ball size={30} />
        </MotionPrinciple>
      );
    case "impact-shake":
      return (
        <MotionPrinciple effect="impact-shake" trigger={trigger}>
          <span className="inline-block rounded-md bg-foreground px-4 py-2 text-2xl font-black tracking-tight text-background">
            {sale}
          </span>
        </MotionPrinciple>
      );
    case "anticipation":
      return (
        <MotionPrinciple effect="anticipation" trigger={trigger}>
          <Square />
        </MotionPrinciple>
      );
    case "follow-through":
      return (
        <div className="translate-y-4">
          <MotionPrinciple effect="follow-through" trigger={trigger} trailing={<Flag />}>
            <Ball size={44} />
          </MotionPrinciple>
        </div>
      );
    case "bounce":
      return (
        <div className="translate-y-10">
          <MotionPrinciple effect="bounce" trigger={trigger}>
            <Ball />
          </MotionPrinciple>
        </div>
      );
    case "wiggle":
      return (
        <MotionPrinciple effect="wiggle" trigger={trigger}>
          <Bell />
        </MotionPrinciple>
      );
    case "pulse":
      return (
        <MotionPrinciple effect="pulse" trigger={trigger} color={accent}>
          <Heart />
        </MotionPrinciple>
      );
    case "ping-pong":
      return (
        <MotionPrinciple effect="ping-pong" trigger={trigger}>
          <Square />
        </MotionPrinciple>
      );
    case "stop-motion":
      return (
        <div className="translate-y-4">
          <MotionPrinciple effect="stop-motion" trigger={trigger}>
            <Star />
          </MotionPrinciple>
        </div>
      );
    case "repeater":
      return (
        <MotionPrinciple effect="repeater" trigger={trigger} distance={40} count={10}>
          <Petal />
        </MotionPrinciple>
      );
    case "kaleidoscope":
      return (
        <MotionPrinciple effect="kaleidoscope" trigger={trigger} distance={30}>
          <Shard />
        </MotionPrinciple>
      );
    case "line-boil":
      return (
        <MotionPrinciple effect="line-boil" trigger={trigger}>
          <Sketch />
        </MotionPrinciple>
      );
    case "exploded-view":
      return (
        <div className="translate-y-4">
          <ExplodedView trigger={trigger} distance={22}>
            {PhoneLayers()}
          </ExplodedView>
        </div>
      );
    case "stagger":
      return (
        <Stagger trigger="inView" className="flex h-28 items-end gap-2" stagger={0.1}>
          {[40, 64, 52, 88, 72, 100].map((h, i) => (
            <span key={i} className="block w-5 rounded-t-md bg-primary" style={{ height: h }} />
          ))}
        </Stagger>
      );
  }
}

export default function MotionPrinciplesDemo() {
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-x-6 gap-y-10 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {motionPrinciples.map((effect) => {
        const looping = isLoopingMotionPrinciple(effect) || effect === "squash-stretch";
        return (
          <Tile key={effect} name={effect} hint={looping ? t.loop : t.entrance} replay={looping ? undefined : t.replay}>
            <Subject effect={effect} sale={t.sale} linear={t.linear} eased={t.eased} />
          </Tile>
        );
      })}
    </div>
  );
}
