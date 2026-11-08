"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import type { Messages } from "@/lib/messages";
import type { ProIconRenderer, ProIconSet } from "@/lib/pro-icons";
import { cn } from "@/lib/utils";
import { loadProIconRenderers } from "@/registry/__generated__/previews";
import { Icon } from "@/registry/icons/sunui-icons";

type Style = "line" | "pixel";

/**
 * /icons 頁的 Pro 檔期圖示組。清單與關鍵字來自公開索引（lib/pro-icons.ts），
 * 圖示本身由私有 repo 的渲染器畫（沒有 Pro 目錄時改畫鎖頭佔位）。
 * 不提供「複製 SVG」：Pro 圖示只經由授權的 registry 安裝。
 */
export function ProIconShowcase({
  set,
  messages: t,
  installs,
}: {
  set: ProIconSet;
  messages: Messages["proIcons"];
  /** 伺服器端渲染好的安裝指令：線條、像素與各自的動態版 */
  installs: Record<Style | `${Style}-animated`, ReactNode>;
}) {
  const [renderers, setRenderers] = useState<Record<string, ProIconRenderer> | null>(null);
  const [style, setStyle] = useState<Style>("line");
  const [animated, setAnimated] = useState(false);
  const [pigment, setPigment] = useState(true);
  const [selected, setSelected] = useState(set.icons[0]?.name ?? "");
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    loadProIconRenderers?.().then((r) => alive && setRenderers(r));
    return () => {
      alive = false;
    };
  }, []);

  const renderer = renderers?.[set.id];
  const copy = t.sets[set.id] ?? { title: set.title, note: "" };
  const isPixel = style === "pixel";
  const kindOf = (name: string) => {
    const entry = set.icons.find((i) => i.name === name);
    return animated ? (isPixel ? entry?.pixelMotion : entry?.motion) : undefined;
  };
  const visible = set.icons.filter((i) => !animated || (isPixel ? i.pixelMotion : i.motion));
  useEffect(() => {
    if (visible.length && !visible.some((i) => i.name === selected)) setSelected(visible[0].name);
  }, [visible, selected]);

  function draw(name: string, size: number) {
    const kind = kindOf(name);
    if (!renderer) return <Icon name="lock" size={Math.min(size, 24)} className="text-subtle" />;
    const active = kind && kind !== "hover" ? Boolean(toggled[name]) : undefined;
    return isPixel
      ? renderer.pixel(name, { size, tone: pigment ? "pigment" : "ink", animated: Boolean(kind), active })
      : renderer.line(name, { size, strokeWidth: 1.5, animated: Boolean(kind), active });
  }

  const selectedKind = kindOf(selected);
  const component = `${selectedKind ? "Animated" : ""}Lunar${isPixel ? "Pixel" : ""}Icon`;
  const props = `${selectedKind && selectedKind !== "hover" ? " active={on}" : ""}${isPixel ? ` size={32}${pigment ? ` tone="pigment"` : ""}` : ""}`;
  const jsx = `<${component} name="${selected}"${props} />`;
  const pixelSize = 32;

  return (
    <section id="pro-icons" aria-labelledby="pro-icons-title" className="mt-20 scroll-mt-24">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-sm bg-accent px-2 py-0.5 text-[11px] font-medium tracking-wide text-accent-fg uppercase">{t.badge}</span>
        <h2 id="pro-icons-title" className="text-2xl font-semibold tracking-tight">
          {t.title}
        </h2>
      </div>
      <p className="mt-3 max-w-2xl text-pretty text-subtle">{t.lead}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold">{copy.title}</h3>
            <p className="text-xs text-subtle">{copy.note}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div role="tablist" aria-label={t.styleLabel} className="inline-flex rounded-md border border-line bg-card p-0.5">
              {(["line", "pixel"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={style === s}
                  onClick={() => setStyle(s)}
                  className={cn(
                    "flex h-8 items-center rounded-[5px] px-3 text-sm font-medium transition-colors",
                    style === s ? "bg-stage text-fg" : "text-subtle hover:text-fg",
                  )}
                >
                  {s === "line" ? t.line : t.pixel}
                </button>
              ))}
            </div>
            <Toggle on={animated} onClick={() => setAnimated((v) => !v)}>
              {t.animated}
            </Toggle>
            {isPixel && (
              <Toggle on={pigment} onClick={() => setPigment((v) => !v)}>
                {t.pigment}
              </Toggle>
            )}
          </div>

          {!renderer && <p className="mt-4 text-xs text-subtle">{t.locked}</p>}
          {renderer && animated && <p className="mt-4 text-xs text-subtle">{t.animatedHint}</p>}

          <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2 [--sunui-icon-accent:var(--accent)]">
            {visible.map(({ name }) => {
              const kind = kindOf(name);
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(name);
                      if (kind && kind !== "hover") setToggled((prev) => ({ ...prev, [name]: !prev[name] }));
                    }}
                    aria-pressed={selected === name}
                    className={cn(
                      "relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border bg-card px-1 transition-colors",
                      selected === name ? "border-fg text-fg" : "border-line text-fg/85 hover:border-subtle",
                    )}
                  >
                    {draw(name, isPixel ? pixelSize : 24)}
                    <span className="max-w-full truncate font-mono text-[10px] text-subtle">{name}</span>
                    {kind && kind !== "hover" && (
                      <span className="absolute top-1.5 right-1.5 font-mono text-[9px] tracking-wide text-subtle uppercase">{kind}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="rounded-md border border-line bg-card p-5 lg:sticky lg:top-20">
          <p className="text-[11px] font-medium tracking-[0.14em] text-subtle uppercase">{t.selected}</p>
          <div className="mt-4 grid place-items-center rounded-sm border border-dashed border-line py-8 [--sunui-icon-accent:var(--accent)]">
            {draw(selected, isPixel ? 96 : 96)}
          </div>
          <p className="mt-5 font-mono text-sm tracking-[0.04em]">{selected}</p>
          <pre className="mt-2 overflow-x-auto rounded-sm bg-stage px-3 py-2 font-mono text-[12px]">{jsx}</pre>
          <p className="mt-4 text-xs font-medium text-subtle">{t.install}</p>
          <div className="mt-1.5">{installs[selectedKind ? (`${style}-animated` as const) : style]}</div>
          <p className="mt-3 text-xs text-pretty text-subtle">{t.included}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/pricing" className="flex h-9 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
              {t.getPro}
            </Link>
            {set.scenes[0] && (
              <Link href={`/blocks/${set.scenes[0]}`} className="flex h-9 items-center rounded-md border border-line px-3 text-xs font-medium">
                {t.scene}
              </Link>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center gap-2 rounded-md border border-line px-3 text-xs font-medium transition-colors",
        on ? "bg-accent-soft text-accent" : "bg-card text-subtle hover:text-fg",
      )}
    >
      <span className={cn("size-2 rounded-full", on ? "bg-accent" : "bg-line")} />
      {children}
    </button>
  );
}
