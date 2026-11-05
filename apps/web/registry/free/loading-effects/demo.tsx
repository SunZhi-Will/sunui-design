"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { Loader, MultiStepLoader, Skeleton, TopLoadingBar, loaderVariants, type LoadingEffectId } from "./loading-effects";

export const copy = {
  en: {
    loading: "Loading",
    replay: "Replay",
    start: "Start loading",
    finish: "Finish",
    page: "Page content",
    steps: ["Uploading files", "Checking format", "Generating preview", "Publishing"],
    names: {
      "bouncing-dots": "Bouncing dots",
      equalizer: "Equalizer",
      "ring-spinner": "Ring spinner",
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
    } satisfies Record<LoadingEffectId, string>,
  },
  "zh-TW": {
    loading: "載入中",
    replay: "重播",
    start: "開始載入",
    finish: "完成",
    page: "頁面內容",
    steps: ["上傳檔案", "檢查格式", "產生預覽", "發佈"],
    names: {
      "bouncing-dots": "跳動圓點",
      equalizer: "等化器",
      "ring-spinner": "缺口圓環",
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
    } satisfies Record<LoadingEffectId, string>,
  },
  "zh-CN": {
    loading: "加载中",
    replay: "重播",
    start: "开始加载",
    finish: "完成",
    page: "页面内容",
    steps: ["上传文件", "检查格式", "生成预览", "发布"],
    names: {
      "bouncing-dots": "跳动圆点",
      equalizer: "均衡器",
      "ring-spinner": "缺口圆环",
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
    } satisfies Record<LoadingEffectId, string>,
  },
  ja: {
    loading: "読み込み中",
    replay: "もう一度",
    start: "読み込み開始",
    finish: "完了",
    page: "ページの内容",
    steps: ["ファイルをアップロード", "形式をチェック", "プレビューを生成", "公開"],
    names: {
      "bouncing-dots": "バウンスドット",
      equalizer: "イコライザー",
      "ring-spinner": "リングスピナー",
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
    } satisfies Record<LoadingEffectId, string>,
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

export default function LoadingEffectsDemo() {
  const t = useDemoText(copy);
  // 確定進度的效果共用一個自動前進的數值
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % VALUES.length), 1500);
    return () => clearInterval(id);
  }, []);
  const value = VALUES[step];

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {loaderVariants.map((v) => {
        const wide = v === "bar" || v === "indeterminate-bar";
        return (
          <Tile key={v} name={t.names[v]}>
            <Loader variant={v} size="lg" value={value} label={t.loading} className={wide ? "w-full max-w-56" : undefined} />
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
          <TopLoadingBar loading={loading} position="absolute" label={t.loading} />
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
        <MultiStepLoader key={run} steps={t.steps} label={t.loading} interval={1100} />
      </Tile>

      <Tile name={t.names["skeleton-shimmer"]}>
        <Skeleton media lines={2} label={t.loading} className="max-w-60" />
      </Tile>
    </div>
  );
}
