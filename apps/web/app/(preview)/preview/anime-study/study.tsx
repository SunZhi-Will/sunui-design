"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { AnimeButton, AnimeCheckbox, AnimeProgress, AnimeToggle, paletteFor, WORDS, type Ctx, type Dir, type Families, type Lang } from "./controls";
import { drawWord, type WordStyle } from "./fx";

const CSS = `
.anime-tone-shadow{position:relative}
.anime-tone-shadow::before{content:"";position:absolute;inset:-2.5px;transform:translate(5px,6px);border-radius:inherit;background:radial-gradient(var(--foreground) 1.1px,transparent 1.45px) 0 0/5px 5px;z-index:-2;pointer-events:none}
.anime-tone-shadow::after{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--tone-bg,var(--card));z-index:-1;pointer-events:none}
.anime-tone-fill{--tone-bg:radial-gradient(var(--sunui-spot,var(--primary)) 1.25px,transparent 1.6px) 0 0/4px 4px,color-mix(in oklch,var(--sunui-spot,var(--primary)) 22%,var(--card));background:var(--tone-bg)}
.anime-mute *{color:transparent!important}
`;

const DIRS: { dir: Dir; title: string; tag?: string; notes: string[] }[] = [
  {
    dir: "ink",
    title: "A. 墨線硬影",
    tag: "報告建議",
    notes: ["3px 墨線加品牌色淡色硬投影，靜止時就認得出來", "特效全量：衝擊星、碎片、煙、實心擬聲字", "打擊那一格整顆反白"],
  },
  {
    dir: "craft",
    title: "B. 質感外殼",
    notes: ["外殼完全照 craft：1px 邊線、近乎看不見的陰影", "特效份量約六成，擬聲字小一號、空心", "不反白；靜止時和一般 SunUI 元件分不出來"],
  },
  {
    dir: "tone",
    title: "C. 網點墨稿",
    notes: ["黑白墨線，投影與填色改成網點（漫畫網點紙）", "品牌色只在選中、點綴與進度", "擬聲字用網點字"],
  },
];

const LANGS: { key: Lang; label: string }[] = [
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

function Controls({ ctx }: { ctx: Ctx }) {
  return (
    <div className="flex flex-col items-start gap-7">
      <div className="flex flex-wrap items-center gap-4">
        <AnimeButton ctx={ctx}>確認</AnimeButton>
        <AnimeButton ctx={ctx} primary={false}>取消</AnimeButton>
      </div>
      <AnimeCheckbox ctx={ctx}>記住我</AnimeCheckbox>
      <AnimeToggle ctx={ctx} label="通知" />
      <AnimeProgress ctx={ctx} />
    </div>
  );
}

// ───────── 擬聲字樣張 ─────────

const SLOTS = ["impact", "click", "swish", "pop", "skid", "rumble"] as const;
const SLOT_LABEL: Record<(typeof SLOTS)[number], string> = { impact: "衝擊", click: "點擊", swish: "咻", pop: "彈出", skid: "滑停", rumble: "轟鳴" };

function WordCell({ text, style, family, ready }: { text: string; style: WordStyle; family: string; ready: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !ready) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = 150;
    const h = 92;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const P = paletteFor("ink", c.parentElement ?? c);
    const size = [...text].length > 3 ? 34 : 44;
    g.translate(w / 2, h / 2 + 4);
    g.rotate(-0.1);
    drawWord(g, P, text, 0, 0, size, style, family, 11);
  }, [text, style, family, ready]);
  return <canvas ref={ref} aria-label={text} className="h-[92px] w-[150px]" />;
}

function Lettering({ fam, ready }: { fam: Families; ready: boolean }) {
  const rows: { label: string; lang: Lang; family: string }[] = [
    { label: "ja · Dela Gothic One", lang: "ja", family: fam.ja },
    { label: "ja · Noto Sans JP 900", lang: "ja", family: fam.jaAlt },
    { label: "zh-TW · Noto Sans TC 900", lang: "zh-TW", family: fam["zh-TW"] },
    { label: "zh-CN · Noto Sans SC 900", lang: "zh-CN", family: fam["zh-CN"] },
  ];
  const styles: { key: WordStyle; label: string }[] = [
    { key: "solid", label: "實心（墨字白邊）" },
    { key: "hollow", label: "空心（白字墨邊）" },
    { key: "dotted", label: "網點" },
  ];
  return (
    <div className="flex flex-col gap-10">
      {styles.map((s) => (
        <div key={s.key}>
          <h3 className="mb-3 text-sm font-semibold">{s.label}</h3>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-max text-left text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2 font-medium">字型</th>
                  {SLOTS.map((k) => (
                    <th key={k} className="px-3 py-2 font-medium">{SLOT_LABEL[k]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="px-3 py-1 whitespace-nowrap text-muted-foreground">{r.label}</td>
                    {SLOTS.map((k) => (
                      <td key={k} className="px-1">
                        <WordCell text={WORDS[r.lang][k]} style={s.key} family={r.family} ready={ready} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────── 頁面 ─────────

export function AnimeStudy({ fam, fontClass }: { fam: Families; fontClass: string }) {
  const [lang, setLang] = useState<Lang>("zh-TW");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 畫布上的字要等字型真的下載完
    const all = [...new Set(Object.values(WORDS).flatMap((w) => Object.values(w)).join(""))].join("");
    Promise.all(Object.values(fam).map((f) => document.fonts.load(`900 40px ${f}`, all))).finally(() => setReady(true));
  }, [fam]);

  return (
    <main className={cn("mx-auto max-w-6xl px-4 py-12 text-foreground", fontClass)}>
      <style>{CSS}</style>
      <header className="mb-10">
        <p className="mb-2 font-mono text-xs text-muted-foreground">anime-study · 階段 0 樣張 · 2026-11-26</p>
        <h1 className="text-3xl font-semibold tracking-tight">動漫作畫系列：樣式方向比較</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          同一套特效引擎、同樣四個控制項，只換外殼與特效份量。每個都可以點：按鈕、勾選、開關、進度條。顏色全部來自品牌專色與 --foreground，深色模式也看一下。系統開了「減少動態」時特效全關，只剩狀態變化。
          規劃：reports/動漫作畫特效元件深度分析與完整規劃-2026-11-26.md
        </p>
        <div className="mt-5 inline-flex rounded-lg border border-border p-0.5 text-sm" role="radiogroup" aria-label="擬聲字語言">
          {LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              role="radio"
              aria-checked={lang === l.key}
              onClick={() => setLang(l.key)}
              className={cn("rounded-md px-3 py-1.5", lang === l.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-14">
        <Section n="01" title="三個方向並排" note="點每一個控制項感受一下。看三件事：靜止時像不像同一個產品、打擊那一格清不清楚、特效會不會蓋到字。">
          <div className="grid gap-5 md:grid-cols-3">
            {DIRS.map((d) => (
              <div key={d.dir} className="flex flex-col rounded-2xl border border-border">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{d.title}</h3>
                    {d.tag && <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{d.tag}</span>}
                  </div>
                  <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-muted-foreground">
                    {d.notes.map((n) => (
                      <li key={n}>· {n}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 px-6 py-12">
                  <Controls ctx={{ dir: d.dir, lang, fam }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section n="02" title="256px 驗收" note="DESIGN.md 的規則：卡片縮到 256px、遮掉文字，還認得出是這個系列。靠的是靜止時看得到的外殼，不是動態。">
          <div className="flex flex-wrap gap-5">
            {DIRS.map((d) => (
              <div key={d.dir}>
                <div className="anime-mute pointer-events-none h-[180px] w-[256px] overflow-hidden rounded-xl border border-border bg-card p-5">
                  <div style={{ zoom: 0.62 }}>
                    <Controls ctx={{ dir: d.dir, lang, fam }} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{d.title}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          n="03"
          title="擬聲字：六個槽位、三種語言、三種字樣"
          note="這是程式用開源字型（SIL OFL）即時畫的樣張：每個字各自轉一點、大小不一、越後面越往上。選定後階段 1 會把字形轉成路徑放進引擎，不再依賴字型下載。Dela Gothic One 沒有這些中文字，所以中文只比 Noto 黑體。"
        >
          <Lettering fam={fam} ready={ready} />
        </Section>

        <Section n="04" title="要你決定的" note="看完上面三段後回答即可。">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>外殼選 A、B、C，或混合（例如 A 的外殼加 C 的網點陰影）。</li>
            <li>特效份量：A、C 的全量，還是 B 的六成。</li>
            <li>擬聲字字樣：實心、空心、網點，或像 A 一樣依控制項混用（打擊實心、滑停網點、點擊空心）。</li>
            <li>日文字型：Dela Gothic One 還是 Noto Sans JP。</li>
            <li>中文介面用中文擬聲字（砰、喀），還是一律日文（ドン、カチッ）。</li>
          </ol>
        </Section>
      </div>
    </main>
  );
}
