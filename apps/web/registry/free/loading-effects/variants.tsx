"use client";

import { useEffect, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { Loader, MultiStepLoader, Skeleton, TopLoadingBar, loaderVariants, loadingEffects, type LoaderVariant } from "./loading-effects";
import { copy, smallBtn, VALUES } from "./demo";

// loaderVariants 是 loadingEffects 的子集（Loader 的 variant），另外三個是獨立元件，合起來每種一張卡
export const variants = loadingEffects;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "equalizer";

const isLoader = (v: string): v is LoaderVariant => (loaderVariants as readonly string[]).includes(v);

/** 首頁型錄：一種載入效果一張卡。 */
export default function LoadingEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  // 確定進度的效果跟 demo 一樣用自動前進的數值
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % VALUES.length), 1500);
    return () => clearInterval(id);
  }, []);

  // 頂部載入條：卡片裡自動在載入與完成之間切換，按鈕也能手動切
  useEffect(() => {
    if (variant !== "top-loading-bar") return;
    const id = setTimeout(() => setLoading((l) => !l), loading ? 2400 : 1200);
    return () => clearTimeout(id);
  }, [variant, loading]);

  if (isLoader(variant)) {
    const wide = variant === "bar" || variant === "indeterminate-bar";
    return (
      <div className={wide ? "w-56" : undefined}>
        <Loader variant={variant} size="lg" value={VALUES[step]} label={t.loading} className={wide ? "w-full" : undefined} />
      </div>
    );
  }

  if (variant === "top-loading-bar") {
    return (
      <div className="flex w-64 flex-col items-center gap-3">
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
        <button type="button" className={smallBtn} onClick={() => setLoading((l) => !l)}>
          {loading ? t.finish : t.start}
        </button>
      </div>
    );
  }

  if (variant === "multi-step") {
    // 卡片裡沒有重播鈕，改成跑完自動重來
    return <MultiStepLoader steps={t.steps} label={t.loading} interval={1100} loop className="w-64" />;
  }

  return <Skeleton media lines={2} label={t.loading} className="w-60" />;
}
