"use client";

import { useEffect, useState } from "react";

import {
  DotMatrixLoader,
  type DotMatrixLoaderProps,
  type DotMatrixPattern,
  type DotMatrixState,
} from "@/registry/free/loading-effects/loading-effects";

type Variation = {
  title: string;
  note: string;
  dark?: boolean;
  props: Partial<DotMatrixLoaderProps>;
};

const VARIATIONS: Variation[] = [
  { title: "1. 原版", note: "圓點，暗點保留，主題色", props: { shape: "dot", palette: "spot" } },
  { title: "2. 像素方格", note: "方格像素，夕陽漸層", props: { shape: "square", palette: "sunset" } },
  { title: "3. 菱形", note: "轉 45 度的方塊，潟湖漸層", props: { shape: "diamond", palette: "lagoon" } },
  { title: "4. 空心環", note: "暗的時候是外框，亮起時由外往內填滿，成功轉綠", props: { shape: "ring", palette: "status" } },
  { title: "5. 霓虹 LED", note: "深底、發光、稜鏡漸層", dark: true, props: { shape: "dot", glow: true, palette: "prism" } },
  { title: "6. 縮放顆粒", note: "暗點縮成小點，亮點長大，極光漸層", props: { shape: "dot", emphasis: "scale", palette: "aurora" } },
  { title: "7. 直條", note: "每格是一根短直條，像等化器，夕陽漸層", props: { shape: "bar", palette: "sunset" } },
  {
    title: "8. 琥珀面板",
    note: "深底、方格、發光、單一琥珀色，像老式點陣看板",
    dark: true,
    props: { shape: "square", glow: true, color: "oklch(0.8 0.16 75)" },
  },
];

const PATTERNS: DotMatrixPattern[] = ["wave", "spiral", "ripple"];
const STATES: (DotMatrixState | "auto")[] = ["auto", "loading", "progress", "success", "error"];
const STATE_LABEL: Record<DotMatrixState | "auto", string> = {
  auto: "自動輪播",
  loading: "載入",
  progress: "進度",
  success: "成功",
  error: "錯誤",
};

/** loading, progress to 100, success, loading, error, again */
const SEQUENCE: DotMatrixState[] = ["loading", "progress", "success", "loading", "error"];

export function DotMatrixStudy() {
  const [mode, setMode] = useState<DotMatrixState | "auto">("auto");
  const [step, setStep] = useState(0);
  const [value, setValue] = useState(0);
  const auto = SEQUENCE[step % SEQUENCE.length];
  const state = mode === "auto" ? auto : mode;
  // ?one=1..8 (and optionally &pattern=spiral) shows a single loader, enlarged, for recording a preview video
  const [one, setOne] = useState<{ v: Variation; pattern: DotMatrixPattern } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const n = Number(q.get("one"));
    if (n >= 1 && n <= VARIATIONS.length) setOne({ v: VARIATIONS[n - 1], pattern: (q.get("pattern") as DotMatrixPattern) || "wave" });
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    if (auto === "progress") {
      setValue(0);
      let v = 0;
      let id: ReturnType<typeof setTimeout>;
      const tick = () => {
        v = Math.min(100, v + 7);
        setValue(v);
        id = setTimeout(v >= 100 ? () => setStep((s) => s + 1) : tick, v >= 100 ? 300 : 140);
      };
      id = setTimeout(tick, 300);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setStep((s) => s + 1), auto === "loading" ? 2600 : 1800);
    return () => clearTimeout(id);
  }, [mode, auto, step]);

  useEffect(() => {
    if (mode === "progress") setValue(58);
  }, [mode]);

  if (one) {
    return (
      <div
        className={
          "flex h-[400px] w-[640px] flex-col items-center justify-center gap-6 rounded-3xl border " +
          (one.v.dark ? "border-neutral-800 bg-neutral-950 text-neutral-400" : "border-border bg-card text-muted-foreground")
        }
      >
        {/* transform does not take layout space, so the scaled loader gets a real 200px slot */}
        <div className="grid size-[200px] place-items-center">
          <div className="scale-[3.2]">
            <DotMatrixLoader pattern={one.pattern} state={state} value={value} size="lg" {...one.v.props} />
          </div>
        </div>
        <p className="text-sm tabular-nums">
          {STATE_LABEL[state]}
          {state === "progress" ? ` ${value}%` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">點陣載入：八種變化</h1>
          <p className="text-sm text-muted-foreground">同一個 DotMatrixLoader，只換 shape、glow、emphasis、palette。每張示範波浪、螺旋、漣漪三種樣式。</p>
        </div>
        <div role="radiogroup" className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          {STATES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={mode === s}
              onClick={() => setMode(s)}
              className={
                "rounded-md px-2.5 py-1 text-xs transition-colors " +
                (mode === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
              }
            >
              {STATE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {VARIATIONS.map((v) => (
          <figure
            key={v.title}
            className={
              "flex flex-col gap-4 rounded-xl border p-4 " +
              (v.dark ? "border-neutral-800 bg-neutral-950 text-neutral-100" : "border-border bg-card text-card-foreground")
            }
          >
            <div className="flex items-center justify-around gap-2 py-3">
              {PATTERNS.map((p) => (
                <DotMatrixLoader key={p} pattern={p} state={state} value={value} size="lg" {...v.props} />
              ))}
            </div>
            <figcaption>
              <p className="text-sm font-medium">{v.title}</p>
              <p className={"text-xs " + (v.dark ? "text-neutral-400" : "text-muted-foreground")}>{v.note}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-4 text-center text-xs tabular-nums text-muted-foreground">
        {STATE_LABEL[state]}
        {state === "progress" ? ` ${value}%` : ""}
      </p>
    </div>
  );
}
