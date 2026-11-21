"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  DotMatrixLoader,
  Loader,
  MultiStepLoader,
  Skeleton,
  TopLoadingBar,
  dotMatrixPalettes,
  dotMatrixPatterns,
  loaderVariants,
  type DotMatrixLoaderProps,
  type DotMatrixPalette,
  type DotMatrixPattern,
  type DotMatrixState,
  type LoadingEffectId,
} from "./loading-effects";

export const copy = {
  en: {
    loading: "Loading",
    replay: "Replay",
    start: "Start loading",
    finish: "Finish",
    page: "Page content",
    steps: ["Uploading files", "Checking format", "Generating preview", "Publishing"],
    done: "Done",
    names: {
      "bouncing-dots": "Bouncing dots",
      equalizer: "Equalizer",
      "ring-spinner": "Ring spinner",
      "spinner-check": "Spinner to check",
      orbit: "Orbit",
      "pulse-dot": "Pulse dot",
      "progress-ring": "Progress ring",
      bar: "Progress bar",
      "indeterminate-bar": "Indeterminate bar",
      "typing-indicator": "Typing indicator",
      liquid: "Liquid fill",
      "top-loading-bar": "Top loading bar",
      "multi-step": "Multi-step",
      "skeleton-shimmer": "Skeleton shimmer",
      "dot-matrix": "Dot matrix",
    } satisfies Record<LoadingEffectId, string>,
    failed: "Failed",
    waiting: "Waiting",
    uploaded: "Uploaded",
    states: { loading: "Loading", progress: "Progress", success: "Success", error: "Error" } satisfies Record<DotMatrixState, string>,
    style: "Style",
    styles: { classic: "Classic", pixel: "Pixel", diamond: "Diamond", ring: "Ring", neon: "Neon LED", grain: "Grain", bars: "Bars", amber: "Amber panel" } satisfies Record<StyleKey, string>,
    colour: "Colour",
    palettes: { spot: "Theme", status: "Status", aurora: "Aurora", sunset: "Sunset", lagoon: "Lagoon", prism: "Prism" } satisfies Record<DotMatrixPalette, string>,
    patterns: { wave: "Wave", spiral: "Spiral", rain: "Rain", ripple: "Ripple", snake: "Snake", scan: "Scan" } satisfies Record<DotMatrixPattern, string>,
  },
  "zh-TW": {
    loading: "載入中",
    replay: "重播",
    start: "開始載入",
    finish: "完成",
    page: "頁面內容",
    steps: ["上傳檔案", "檢查格式", "產生預覽", "發佈"],
    done: "已完成",
    names: {
      "bouncing-dots": "跳動圓點",
      equalizer: "等化器",
      "ring-spinner": "缺口圓環",
      "spinner-check": "轉圈到打勾",
      orbit: "軌道",
      "pulse-dot": "脈衝圓點",
      "progress-ring": "進度圓環",
      bar: "進度條",
      "indeterminate-bar": "不定進度條",
      "typing-indicator": "輸入中提示",
      liquid: "液體填充",
      "top-loading-bar": "頂部載入條",
      "multi-step": "多步驟",
      "skeleton-shimmer": "骨架閃光",
      "dot-matrix": "點陣",
    } satisfies Record<LoadingEffectId, string>,
    failed: "失敗",
    waiting: "等待中",
    uploaded: "已上傳",
    states: { loading: "載入", progress: "進度", success: "成功", error: "錯誤" } satisfies Record<DotMatrixState, string>,
    style: "樣式",
    styles: { classic: "原版", pixel: "像素方格", diamond: "菱形", ring: "空心環", neon: "霓虹 LED", grain: "縮放顆粒", bars: "直條", amber: "琥珀面板" } satisfies Record<StyleKey, string>,
    colour: "顏色",
    palettes: { spot: "主題色", status: "狀態色", aurora: "極光", sunset: "夕陽", lagoon: "潟湖", prism: "稜鏡" } satisfies Record<DotMatrixPalette, string>,
    patterns: { wave: "波浪", spiral: "螺旋", rain: "雨滴", ripple: "漣漪", snake: "蛇行", scan: "掃描" } satisfies Record<DotMatrixPattern, string>,
  },
  "zh-CN": {
    loading: "加载中",
    replay: "重播",
    start: "开始加载",
    finish: "完成",
    page: "页面内容",
    steps: ["上传文件", "检查格式", "生成预览", "发布"],
    done: "已完成",
    names: {
      "bouncing-dots": "跳动圆点",
      equalizer: "均衡器",
      "ring-spinner": "缺口圆环",
      "spinner-check": "转圈到打勾",
      orbit: "轨道",
      "pulse-dot": "脉冲圆点",
      "progress-ring": "进度圆环",
      bar: "进度条",
      "indeterminate-bar": "不定进度条",
      "typing-indicator": "输入中提示",
      liquid: "液体填充",
      "top-loading-bar": "顶部加载条",
      "multi-step": "多步骤",
      "skeleton-shimmer": "骨架闪光",
      "dot-matrix": "点阵",
    } satisfies Record<LoadingEffectId, string>,
    failed: "失败",
    waiting: "等待中",
    uploaded: "已上传",
    states: { loading: "加载", progress: "进度", success: "成功", error: "错误" } satisfies Record<DotMatrixState, string>,
    style: "样式",
    styles: { classic: "原版", pixel: "像素方格", diamond: "菱形", ring: "空心环", neon: "霓虹 LED", grain: "缩放颗粒", bars: "直条", amber: "琥珀面板" } satisfies Record<StyleKey, string>,
    colour: "颜色",
    palettes: { spot: "主题色", status: "状态色", aurora: "极光", sunset: "夕阳", lagoon: "潟湖", prism: "棱镜" } satisfies Record<DotMatrixPalette, string>,
    patterns: { wave: "波浪", spiral: "螺旋", rain: "雨滴", ripple: "涟漪", snake: "蛇行", scan: "扫描" } satisfies Record<DotMatrixPattern, string>,
  },
  ja: {
    loading: "読み込み中",
    replay: "もう一度",
    start: "読み込み開始",
    finish: "完了",
    page: "ページの内容",
    steps: ["ファイルをアップロード", "形式をチェック", "プレビューを生成", "公開"],
    done: "完了しました",
    names: {
      "bouncing-dots": "バウンスドット",
      equalizer: "イコライザー",
      "ring-spinner": "リングスピナー",
      "spinner-check": "スピナーからチェック",
      orbit: "オービット",
      "pulse-dot": "パルスドット",
      "progress-ring": "プログレスリング",
      bar: "プログレスバー",
      "indeterminate-bar": "不確定バー",
      "typing-indicator": "入力中インジケーター",
      liquid: "リキッド",
      "top-loading-bar": "トップローディングバー",
      "multi-step": "マルチステップ",
      "skeleton-shimmer": "スケルトン",
      "dot-matrix": "ドットマトリクス",
    } satisfies Record<LoadingEffectId, string>,
    failed: "失敗しました",
    waiting: "待機中",
    uploaded: "アップロード完了",
    states: { loading: "読み込み", progress: "進捗", success: "成功", error: "エラー" } satisfies Record<DotMatrixState, string>,
    style: "スタイル",
    styles: { classic: "クラシック", pixel: "ピクセル", diamond: "ダイヤ", ring: "リング", neon: "ネオン LED", grain: "グレイン", bars: "バー", amber: "アンバーパネル" } satisfies Record<StyleKey, string>,
    colour: "カラー",
    palettes: { spot: "テーマ", status: "ステータス", aurora: "オーロラ", sunset: "サンセット", lagoon: "ラグーン", prism: "プリズム" } satisfies Record<DotMatrixPalette, string>,
    patterns: { wave: "ウェーブ", spiral: "スパイラル", rain: "レイン", ripple: "リップル", snake: "スネーク", scan: "スキャン" } satisfies Record<DotMatrixPattern, string>,
  },
};

export const VALUES = [12, 38, 64, 87, 100];

function Tile({ name, action, children }: { name: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex min-h-40 flex-col rounded-xl border border-border bg-card text-card-foreground">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <span className="text-xs font-medium text-muted-foreground">{name}</span>
        {action}
      </div>
      <div className="flex flex-1 items-center justify-center p-5">{children}</div>
    </div>
  );
}

export const smallBtn =
  "rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const STATES: DotMatrixState[] = ["loading", "progress", "success", "error"];
/** Swatch for each palette, drawn with the same hues the dots use */
const SWATCH: Record<DotMatrixPalette, string> = {
  spot: "var(--sunui-spot, var(--primary))",
  status: "linear-gradient(135deg, var(--sunui-spot, var(--primary)) 50%, oklch(0.7 0.16 155) 50%)",
  aurora: "linear-gradient(135deg, oklch(0.72 0.15 165), oklch(0.72 0.15 130), oklch(0.72 0.15 95))",
  sunset: "linear-gradient(135deg, oklch(0.72 0.17 75), oklch(0.72 0.17 30), oklch(0.72 0.17 345))",
  lagoon: "linear-gradient(135deg, oklch(0.7 0.14 150), oklch(0.7 0.14 245))",
  prism: "linear-gradient(135deg, oklch(0.7 0.17 0), oklch(0.7 0.17 110), oklch(0.7 0.17 220), oklch(0.7 0.17 330))",
};
/** One row of colour swatches, used once at the top of the demo for every loader */
export function PaletteSwatches({ value, onChange, label }: { value: DotMatrixPalette; onChange: (p: DotMatrixPalette) => void; label: string }) {
  const t = useDemoText(copy);
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center justify-center gap-1.5">
      {dotMatrixPalettes.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          aria-label={t.palettes[p]}
          title={t.palettes[p]}
          onClick={() => onChange(p)}
          className={
            "grid size-6 place-items-center rounded-full transition-shadow " +
            (value === p ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : "hover:ring-1 hover:ring-border")
          }
        >
          <span className="size-4 rounded-full" style={{ background: SWATCH[p] }} />
        </button>
      ))}
    </div>
  );
}

/**
 * Eight looks built from the same loader by shape, glow, emphasis and palette.
 * Dark ones sit on a dark panel because glow only reads against a dark surface.
 */
const STYLE_KEYS = ["classic", "pixel", "diamond", "ring", "neon", "grain", "bars", "amber"] as const;
type StyleKey = (typeof STYLE_KEYS)[number];
type Style = Pick<DotMatrixLoaderProps, "shape" | "glow" | "emphasis" | "color"> & { palette: DotMatrixPalette; dark?: boolean };
const STYLES: Record<StyleKey, Style> = {
  classic: { shape: "dot", palette: "aurora" },
  pixel: { shape: "square", palette: "sunset" },
  diamond: { shape: "diamond", palette: "lagoon" },
  ring: { shape: "ring", palette: "status" },
  neon: { shape: "dot", glow: true, palette: "prism", dark: true },
  grain: { shape: "dot", emphasis: "scale", palette: "aurora" },
  bars: { shape: "bar", palette: "sunset" },
  amber: { shape: "square", glow: true, palette: "spot", color: "oklch(0.8 0.16 75)", dark: true },
};

/**
 * Dot matrix: the six patterns side by side under one state switch.
 * Progress counts up by itself and turns into success at 100, so one click shows the whole upload.
 */
export function DotMatrixShowcase({
  compact = false,
  auto = false,
  palette: controlled,
  onPalette,
}: {
  compact?: boolean;
  auto?: boolean;
  /** When the demo page owns the colour, the tile follows it and hides its own swatches */
  palette?: DotMatrixPalette;
  onPalette?: (p: DotMatrixPalette) => void;
}) {
  const t = useDemoText(copy);
  const [state, setState] = useState<DotMatrixState>(auto ? "progress" : "loading");
  const [value, setValue] = useState(0);
  const [run, setRun] = useState(0);
  const [style, setStyle] = useState<StyleKey>("classic");
  const [own, setOwn] = useState<DotMatrixPalette>("aurora");
  const palette = controlled ?? own;
  const setPalette = (p: DotMatrixPalette) => (onPalette ? onPalette(p) : setOwn(p));
  const look = STYLES[style];
  const pickStyle = (k: StyleKey) => {
    setStyle(k);
    setPalette(STYLES[k].palette);
  };
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Progress: about three seconds from 0 to 100 in uneven steps (real uploads are uneven), then success
  useEffect(() => {
    if (state !== "progress") return;
    setValue(0);
    let v = 0;
    const step = () => {
      v = Math.min(100, v + 4 + Math.round(Math.random() * 9));
      setValue(v);
      timer.current = setTimeout(v >= 100 ? () => setState("success") : step, v >= 100 ? 350 : 160 + Math.random() * 120);
    };
    timer.current = setTimeout(step, 400);
    return () => clearTimeout(timer.current);
  }, [state, run]);

  // Card mode: loops loading, progress, success on its own
  useEffect(() => {
    if (!auto || state === "progress") return;
    const id = setTimeout(() => {
      if (state !== "loading") {
        const next = STYLE_KEYS[(STYLE_KEYS.indexOf(style) + 1) % STYLE_KEYS.length];
        setStyle(next);
        // Card mode is never controlled, so it writes its own palette
        setOwn(STYLES[next].palette);
      }
      setState(state === "loading" ? "progress" : "loading");
    }, state === "loading" ? 2400 : 1800);
    return () => clearTimeout(id);
  }, [auto, state, style]);

  const status =
    state === "loading" ? t.waiting : state === "progress" ? `${value}%` : state === "success" ? t.uploaded : t.failed;
  const patterns = compact ? dotMatrixPatterns.slice(0, 3) : dotMatrixPatterns;

  return (
    <div className="flex w-full flex-col gap-4">
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <div role="radiogroup" className="flex rounded-lg border border-border bg-muted/50 p-0.5">
            {STATES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={state === s}
                onClick={() => {
                  setState(s);
                  setRun((r) => r + 1);
                }}
                className={
                  "rounded-md px-2.5 py-1 text-xs transition-colors " +
                  (state === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
                }
              >
                {t.states[s]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={smallBtn}
            onClick={() => {
              if (state === "success") setState("progress");
              setRun((r) => r + 1);
            }}
          >
            {t.replay}
          </button>
        </div>
      )}
      {!compact && (
        <div role="radiogroup" aria-label={t.style} className="flex flex-wrap justify-center gap-1">
          {STYLE_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={style === k}
              onClick={() => pickStyle(k)}
              className={
                "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors " +
                (style === k ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {t.styles[k]}
            </button>
          ))}
        </div>
      )}
      {!compact && !controlled && <PaletteSwatches value={palette} onChange={setPalette} label={t.colour} />}
      <div
        className={
          (compact ? "grid grid-cols-3 gap-6" : "grid grid-cols-3 gap-x-4 gap-y-5") +
          " rounded-xl transition-colors duration-300 " +
          (look.dark ? "bg-neutral-950 p-4 text-neutral-400" : "p-4")
        }
      >
        {patterns.map((p) => (
          <div key={p} className="flex flex-col items-center gap-2">
            <DotMatrixLoader
              key={`${p}-${run}`}
              pattern={p}
              palette={palette}
              shape={look.shape}
              glow={look.glow}
              emphasis={look.emphasis}
              color={palette === "spot" ? look.color : undefined}
              state={state}
              value={value}
              size="lg"
              label={t.loading}
              doneLabel={t.done}
              errorLabel={t.failed}
            />
            {!compact && (
              <span className={"text-[11px] " + (look.dark ? "text-neutral-400" : "text-muted-foreground")}>{t.patterns[p as DotMatrixPattern]}</span>
            )}
          </div>
        ))}
      </div>
      <p aria-hidden className="flex items-center justify-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
        <span className="size-1.5 rounded-full bg-current" />
        {status}
      </p>
    </div>
  );
}

export default function LoadingEffectsDemo() {
  const t = useDemoText(copy);
  // Effects with determinate progress share one auto-advancing value
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState(0);
  const [palette, setPalette] = useState<DotMatrixPalette>("aurora");

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % VALUES.length), 1500);
    return () => clearInterval(id);
  }, []);
  const value = VALUES[step];

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex items-center justify-center gap-3 sm:col-span-2 lg:col-span-3">
        <span className="text-xs text-muted-foreground">{t.colour}</span>
        <PaletteSwatches value={palette} onChange={setPalette} label={t.colour} />
      </div>
      {loaderVariants.map((v) => {
        const wide = v === "bar" || v === "indeterminate-bar";
        return (
          <Tile key={v} name={t.names[v]}>
            <Loader variant={v} size="lg" palette={palette} value={value} done={value === 100} label={t.loading} doneLabel={t.done} className={wide ? "w-full max-w-56" : undefined} />
          </Tile>
        );
      })}

      <Tile
        name={t.names["top-loading-bar"]}
        action={
          <button type="button" className={smallBtn} onClick={() => setLoading((l) => !l)}>
            {loading ? t.finish : t.start}
          </button>
        }
      >
        <div className="relative w-full overflow-hidden rounded-lg border border-border bg-background">
          <TopLoadingBar loading={loading} position="absolute" label={t.loading} palette={palette} />
          <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full bg-muted" />
            ))}
          </div>
          <div className="space-y-2 p-3">
            <p className="text-xs text-muted-foreground">{t.page}</p>
            <div className="h-2 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </Tile>

      <Tile
        name={t.names["multi-step"]}
        action={
          <button type="button" className={smallBtn} onClick={() => setRun((r) => r + 1)}>
            {t.replay}
          </button>
        }
      >
        <MultiStepLoader key={run} steps={t.steps} label={t.loading} interval={1100} palette={palette} />
      </Tile>

      <Tile name={t.names["skeleton-shimmer"]}>
        <Skeleton media lines={2} label={t.loading} className="max-w-60" />
      </Tile>

      <div className="sm:col-span-2 lg:col-span-3">
        <Tile name={t.names["dot-matrix"]}>
          <div className="w-full max-w-md">
            <DotMatrixShowcase palette={palette} onPalette={setPalette} />
          </div>
        </Tile>
      </div>
    </div>
  );
}
