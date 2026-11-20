"use client";

import { useEffect, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { Loader, MultiStepLoader, Skeleton, TopLoadingBar, loaderVariants, loadingEffects, type LoaderVariant } from "./loading-effects";
import { copy, smallBtn, VALUES } from "./demo";

// loaderVariants is a subset of loadingEffects (the Loader variants); the other three are standalone components, together giving one card per effect
export const variants = loadingEffects;

// Only this one is shown on the home page as the representative, chosen because it moves by itself, so the card needs no hover to show the effect
export const featured = "equalizer";

const isLoader = (v: string): v is LoaderVariant => (loaderVariants as readonly string[]).includes(v);

/** Home catalog: one card per loading effect. */
export default function LoadingEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  // Effects with determinate progress use an auto-advancing value, same as the demo
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % VALUES.length), 1500);
    return () => clearInterval(id);
  }, []);

  // Top loading bar: switches between loading and done by itself in the card, and the button can also switch it by hand
  useEffect(() => {
    if (variant !== "top-loading-bar") return;
    const id = setTimeout(() => setLoading((l) => !l), loading ? 2400 : 1200);
    return () => clearTimeout(id);
  }, [variant, loading]);

  if (isLoader(variant)) {
    const wide = variant === "bar" || variant === "indeterminate-bar";
    return (
      <div className={wide ? "w-56" : undefined}>
        <Loader variant={variant} size="lg" value={VALUES[step]} done={VALUES[step] === 100} label={t.loading} doneLabel={t.done} className={wide ? "w-full" : undefined} />
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
    // The card has no replay button, so it restarts automatically when it finishes
    return <MultiStepLoader steps={t.steps} label={t.loading} interval={1100} loop className="w-64" />;
  }

  return <Skeleton media lines={2} label={t.loading} className="w-60" />;
}
