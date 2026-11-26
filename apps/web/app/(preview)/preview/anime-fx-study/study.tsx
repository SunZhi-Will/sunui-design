"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  at,
  burst,
  drawWord,
  kira,
  lines,
  paletteOf,
  puff,
  sfxStyles,
  sfxWords,
  shards,
  splash,
  ticks,
  useBackLayer,
  wob,
  type Palette,
  type SfxLang,
  type SfxSlot,
  type SfxStyle,
} from "@/registry/free/anime-fx/anime-fx";

import { BlockPreview } from "@/components/block-preview";
import { DemoLocaleProvider } from "@/lib/demo-locale";
import AnimeButtonDemo from "@/registry/free/anime-button/demo";
import AnimeCheckboxDemo from "@/registry/free/anime-checkbox/demo";
import AnimeProgressDemo from "@/registry/free/anime-progress/demo";

import { Toggle } from "./controls";
import { AnimeButton } from "@/registry/free/anime-button/anime-button";
import { AnimeCheckbox } from "@/registry/free/anime-checkbox/anime-checkbox";
import { AnimeProgress } from "@/registry/free/anime-progress/anime-progress";

const LANGS: { key: SfxLang; label: string }[] = [
  { key: "ja", label: "日本語" },
  { key: "zh-TW", label: "繁中" },
  { key: "zh-CN", label: "简中" },
];

function Section({ n, title, note, children }: { n: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-mono text-xs text-muted-foreground">{n}</span>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}

type Effect = { id: string; label: string; fire: (P: Palette, c: ReturnType<typeof at>, back: ReturnType<ReturnType<typeof useBackLayer>["layer"]>) => void };

const EFFECTS: Effect[] = [
  { id: "burst", label: "burst 衝擊星", fire: (P, c, back) => burst(P, c.x, c.y, { r: 56, layer: back }) },
  { id: "puff", label: "puff 煙", fire: (P, c) => puff(P, c.x, c.y, { size: 16, vy: -24 }) },
  { id: "shards", label: "shards 碎片", fire: (P, c) => shards(P, c.x, c.y, { n: 9, speed: 200, size: 7 }) },
  { id: "ticks", label: "ticks 楔形", fire: (P, c) => ticks(P, c.x, c.y, { n: 5, r: 10, len: 18, fan: 0.6 }) },
  { id: "lines", label: "lines 速度線", fire: (P, c) => lines(P, c.x + 40, c.y, { n: 6, len: 60 }) },
  { id: "wob", label: "wob 晃動弧", fire: (P, c) => (wob(P, c.x - 18, c.y, { dir: -1 }), wob(P, c.x + 18, c.y, { dir: 1 })) },
  { id: "kira", label: "kira 閃光", fire: (P, c) => kira(P, c.x, c.y, { r: 20, life: 0.8 }) },
  { id: "splash", label: "splash 水花", fire: (P, c) => splash(P, c.x, c.y + 14, { w: 40, h: 30 }) },
];

function EffectTile({ e }: { e: Effect }) {
  const pad = useRef<HTMLButtonElement>(null);
  const back = useBackLayer(60);
  return (
    <div className="relative isolate">
      <canvas {...back.props} />
      <button
        ref={pad}
        type="button"
        data-effect={e.id}
        onClick={() => pad.current && e.fire(paletteOf(pad.current), at(pad.current), back.layer())}
        className="grid h-28 w-full place-items-end rounded-xl border border-dashed border-border p-3 text-left text-xs text-muted-foreground hover:border-foreground/40"
      >
        {e.label}
      </button>
    </div>
  );
}

const SLOTS: SfxSlot[] = ["impact", "click", "swish", "pop", "skid", "rumble"];

function WordCell({ text, lang, style }: { text: string; lang: SfxLang; style: SfxStyle }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = 150 * dpr;
    c.height = 92 * dpr;
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.translate(75, 50);
    g.rotate(-0.1);
    drawWord(g, paletteOf(c.parentElement ?? c), text, lang, 0, 0, [...text].length > 3 ? 34 : 44, style, 11);
  }, [text, lang, style]);
  return <canvas ref={ref} aria-label={text} className="h-[92px] w-[150px]" />;
}

export function AnimeFxStudy() {
  const [lang, setLang] = useState<SfxLang>("zh-TW");
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const confirm = () => {
    timers.current.forEach(clearTimeout);
    setDone(false);
    timers.current = [window.setTimeout(() => setDone(true), 650), window.setTimeout(() => setDone(false), 2600)];
  };
  const upload = () => {
    timers.current.forEach(clearTimeout);
    setProgress(0);
    timers.current = [18, 34, 52, 71, 86, 100].map((v, i) => window.setTimeout(() => setProgress(v), 380 + i * 420));
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 text-foreground">
      <header className="mb-10">
        <p className="mb-2 font-mono text-xs text-muted-foreground">anime-fx-study · 階段 1 · 2026-11-26</p>
        <h1 className="text-3xl font-semibold tracking-tight">anime-fx 正式引擎</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          registry/free/anime-fx 的驗收頁：八種特效、跑在引擎上的四個 A 墨線硬影控制項、從開源字型轉成路徑的擬聲字。擬聲字不再需要下載字型。影格表：node apps/web/scripts/anime-frames.mjs。
        </p>
        <div className="mt-5 inline-flex rounded-lg border border-border p-0.5 text-sm" role="radiogroup" aria-label="擬聲字語言">
          {LANGS.map((l) => (
            <button key={l.key} type="button" role="radio" aria-checked={lang === l.key} onClick={() => setLang(l.key)} className={cn("rounded-md px-3 py-1.5", lang === l.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-14">
        <Section n="01" title="八種特效" note="點每一格。全部是亮面、陰影面、外框三層扁平色，靠縮小或變細離場。顏色跟著品牌專色與 --card，深淺模式都試。">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {EFFECTS.map((e) => (
              <EffectTile key={e.id} e={e} />
            ))}
          </div>
        </Section>

        <Section n="02" title="A 墨線硬影控制項" note="按鈕、勾選框、進度條已經是 registry/free 的 block（階段 2）；開關還是樣張，階段 4 再做。">
          <div id="controls" className="flex flex-col items-start gap-8 rounded-2xl border border-border px-8 py-14">
            <div className="flex flex-wrap items-center gap-4">
              <AnimeButton lang={lang} status={done ? "done" : "idle"} onClick={confirm}>
                確認
              </AnimeButton>
              <AnimeButton lang={lang} variant="secondary">
                取消
              </AnimeButton>
            </div>
            <AnimeCheckbox lang={lang}>記住我</AnimeCheckbox>
            <Toggle lang={lang} label="通知" />
            <div className="w-full max-w-[260px]">
              <AnimeProgress lang={lang} value={progress} label="上傳" doneLabel="完成" />
              <button type="button" onClick={upload} className="mt-3 text-[13px] font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
                {progress === 0 ? "開始上傳" : "再跑一次"}
              </button>
            </div>
          </div>
        </Section>

        <Section n="04" title="階段 2 的三個 block（demo）" note="registry/free 的 anime-button、anime-checkbox、anime-progress 各自的 demo.tsx。語言跟著網址的 ?l=（en、zh-TW、zh-CN、ja），擬聲字跟著 <html lang>。還沒進 registry.json。">
          <DemoLocaleProvider>
            <div id="demos" className="grid gap-5 md:grid-cols-3">
              {[AnimeButtonDemo, AnimeCheckboxDemo, AnimeProgressDemo].map((Demo, i) => (
                <div key={i} className="flex justify-center rounded-2xl border border-border">
                  <Demo />
                </div>
              ))}
            </div>
          </DemoLocaleProvider>
        </Section>

        <Section n="05" title="階段 3：Pro 場景 anime-preregister" note="registry/pro 的場景，經預覽清單載入（Pro repo 不在時這格是空的）。目前 299,999 人，送出就衝破 30 萬人、召喚券解鎖。">
          <DemoLocaleProvider>
            <div id="scene" className="flex justify-center rounded-2xl border border-border px-4 py-8">
              <BlockPreview name="anime-preregister" />
            </div>
          </DemoLocaleProvider>
        </Section>

        <Section n="03" title="擬聲字（路徑版）" note="字形取自 SIL OFL 授權的 Dela Gothic One、Noto Sans TC／SC 900，只取了用到的 19 個字，全部約 12KB。粗框是各槽位的預設字樣。">
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-max text-left text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2 font-medium">語言 · 字樣</th>
                  {SLOTS.map((s) => (
                    <th key={s} className="px-3 py-2 font-medium">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LANGS.flatMap((l) =>
                  (["solid", "hollow", "dotted"] as const).map((st) => (
                    <tr key={l.key + st} className="border-t border-border">
                      <td className="px-3 py-1 whitespace-nowrap text-muted-foreground">
                        {l.key} · {st}
                      </td>
                      {SLOTS.map((s) => (
                        <td key={s} className={cn("px-1", sfxStyles[s] === st && "outline-2 -outline-offset-4 outline-[var(--sunui-spot)] rounded-lg")}>
                          <WordCell text={sfxWords[l.key][s]} lang={l.key} style={st} />
                        </td>
                      ))}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </main>
  );
}
