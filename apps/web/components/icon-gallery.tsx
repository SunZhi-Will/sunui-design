"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { format } from "@/lib/i18n";
import { iconGroups, iconKeywords, pixelIconGroups } from "@/lib/icon-groups";
import type { Messages } from "@/lib/messages";
import { cn } from "@/lib/utils";
import {
  AnimatedPixelIcon,
  animatedPixelIconNames,
  pixelMotionKindOf,
  type AnimatedPixelIconName,
} from "@/registry/icons/sunui-animated-pixel-icons";
import {
  AnimatedIcon,
  animatedIconNames,
  motionKindOf,
  type AnimatedIconName,
  type MotionKind,
} from "@/registry/icons/sunui-animated-icons";
import { Icon, icons, type IconName } from "@/registry/icons/sunui-icons";
import { PixelIcon, pixelIconNames, pixelIcons, type PixelIconName } from "@/registry/icons/sunui-pixel-icons";

const sizes = [16, 20, 24, 32] as const;
// 像素圖示只在 16 的整數倍下銳利
const pixelSizes = [16, 32, 48] as const;
const strokes = [1.25, 1.5, 1.75] as const;
type Style = "line" | "pixel";
type Motion = "static" | "animated";

const animatedSet = new Set<string>(animatedIconNames);
const animatedPixelSet = new Set<string>(animatedPixelIconNames);
const extraKeywords: Record<string, string> = { theme: "dark light mode toggle sun moon 深色 主題" };
const counts: Record<Style, Record<Motion, number>> = {
  line: { static: iconGroups.reduce((sum, group) => sum + group.icons.length, 0), animated: animatedIconNames.length },
  pixel: { static: pixelIconNames.length, animated: animatedPixelIconNames.length },
};

export function IconGallery({ messages: t }: { messages: Messages["iconGallery"] }) {
  const kindLabel: Record<MotionKind, string> = t.kindLabel;
  const kindHint: Record<MotionKind, string> = t.kindHint;
  const [style, setStyle] = useState<Style>("line");
  const [motion, setMotion] = useState<Motion>("static");
  const [query, setQuery] = useState("");
  const [strokeSize, setStrokeSize] = useState<number>(24);
  const [pixelSize, setPixelSize] = useState<number>(32);
  const [stroke, setStroke] = useState<number>(1.5);
  const [accent, setAccent] = useState(true);
  const [pigment, setPigment] = useState(false);
  const [selected, setSelected] = useState<string>("coupon");
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [keylines, setKeylines] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const isPixel = style === "pixel";
  const isMotion = motion === "animated";
  const motionSet = isPixel ? animatedPixelSet : animatedSet;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    // 分組標題與說明換成目前語言，缺的沿用英文
    const source = isPixel ? pixelIconGroups : iconGroups;
    const base = source.map((group) => ({
      ...group,
      ...t.groups[group.id],
      icons: (group.icons as string[]).filter((name) => !isMotion || motionSet.has(name)),
    }));
    if (isMotion && !isPixel) {
      const grouped = new Set(iconGroups.flatMap((group) => group.icons as string[]));
      const rest = animatedIconNames.filter((name) => !grouped.has(name));
      if (rest.length) base.push({ id: "toggles", ...t.groups.toggles, icons: rest });
    }
    return base
      .map((group) => ({
        ...group,
        icons: q
          ? group.icons.filter((name) =>
              `${name} ${iconKeywords[name as IconName | PixelIconName] ?? ""} ${extraKeywords[name] ?? ""}`
                .toLowerCase()
                .includes(q),
            )
          : group.icons,
      }))
      .filter((group) => group.icons.length > 0);
  }, [query, isPixel, isMotion, motionSet, t]);

  // 網址帶 ?icon=coupon&style=pixel 可直接打開某個圖示（參考 iconmcp.com 的分享方式）
  const [linked, setLinked] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("style");
    const name = params.get("icon");
    if (s === "pixel" || s === "line") setStyle(s);
    if (name && name in (s === "pixel" ? pixelIcons : icons)) setSelected(name);
    setLinked(true);
  }, []);
  useEffect(() => {
    if (!linked) return;
    const url = new URL(window.location.href);
    url.searchParams.set("icon", selected);
    if (isPixel) url.searchParams.set("style", "pixel");
    else url.searchParams.delete("style");
    window.history.replaceState(null, "", url);
  }, [linked, selected, isPixel]);

  const total = groups.reduce((sum, group) => sum + group.icons.length, 0);
  const visible = groups.flatMap((group) => group.icons);
  // 切換模式後，選取的圖示若不在清單裡，改選第一個
  useEffect(() => {
    if (visible.length && !visible.includes(selected)) setSelected(visible[0]);
  }, [visible, selected]);

  const kindOf = (name: string): MotionKind | null =>
    !isMotion || !motionSet.has(name)
      ? null
      : isPixel
        ? pixelMotionKindOf(name as AnimatedPixelIconName)
        : motionKindOf(name as AnimatedIconName);
  const kind = kindOf(selected);
  const isAnimated = kind !== null;
  const size = isPixel ? pixelSize : strokeSize;
  const sizeOptions = isPixel ? pixelSizes : sizes;
  const activeProp = kind && kind !== "hover" ? ` active={${kind === "loop" ? "loading" : "on"}}` : "";
  const lineProps = `${strokeSize !== 24 ? ` size={${strokeSize}}` : ""}${stroke !== 1.5 ? ` strokeWidth={${stroke}}` : ""}`;
  const pixelProps = `${pixelSize !== 16 ? ` size={${pixelSize}}` : ""}${pigment ? ` tone="pigment"` : ""}`;
  const component = isPixel ? (isAnimated ? "AnimatedPixelIcon" : "PixelIcon") : isAnimated ? "AnimatedIcon" : "Icon";
  const jsx = `<${component} name="${selected}"${activeProp}${isPixel ? pixelProps : lineProps} />`;

  const tone = pigment ? "pigment" : "ink";
  const tags = `${iconKeywords[selected as IconName | PixelIconName] ?? ""}`.split(/\s+/).filter(Boolean);
  const related = (groups.find((group) => group.icons.includes(selected))?.icons ?? []).filter((name) => name !== selected).slice(0, 8);

  function renderIcon(name: string, px: number) {
    // 剛切換風格的那一次渲染，選取的名稱可能還是另一套的；不存在就先不畫
    if (!(name in (isPixel ? pixelIcons : icons)) && !motionSet.has(name)) return null;
    const k = kindOf(name);
    const active = k && k !== "hover" ? Boolean(toggled[name]) : undefined;
    // key 用名稱：換圖示時重新掛載，不沿用上一個圖示的影格
    if (isPixel) {
      return k ? (
        <AnimatedPixelIcon key={name} name={name as AnimatedPixelIconName} size={px} active={active} tone={tone} />
      ) : (
        <PixelIcon key={name} name={name as PixelIconName} size={px} tone={tone} />
      );
    }
    return k ? (
      <AnimatedIcon key={name} name={name as AnimatedIconName} size={px} strokeWidth={stroke} active={active} />
    ) : (
      <Icon key={name} name={name as IconName} size={px} strokeWidth={stroke} />
    );
  }

  function standaloneSvg() {
    const svg = previewRef.current?.querySelector("svg[data-icon]");
    if (!svg) return null;
    // 複製出去的 SVG 要能獨立使用：把變數換成實際色值或 currentColor，尺寸改成目前選的大小
    return svg.outerHTML
      .replaceAll("var(--sunui-icon-accent, currentColor)", accent ? "#171717" : "currentColor")
      .replaceAll("var(--sunui-pixel-shine, #fff)", "#fff")
      .replace(/var\(--sunui-pigment-[a-z]+, (oklch\([^)]*\))\)/g, "$1")
      .replace(/ width="[^"]*" height="[^"]*"/, ` width="${size}" height="${size}"`)
      .replace(/ data-icon="[^"]*"/, "")
      .replace(/ data-tone="[^"]*"/, "");
  }

  function download() {
    const value = standaloneSvg();
    if (!value) return;
    const url = URL.createObjectURL(new Blob([value], { type: "image/svg+xml" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${selected}${isPixel ? "-pixel" : ""}.svg` });
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copy(kind: "jsx" | "svg") {
    const value = kind === "svg" ? standaloneSvg() : jsx;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1400);
  }

  function toggle(name: string) {
    setToggled((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const styleIcon: Record<Style, ReactNode> = {
    line: <Icon name="coupon" size={16} />,
    pixel: <PixelIcon name="heart" size={16} />,
  };
  const motionIcon: Record<Motion, ReactNode> = {
    static: <Icon name="grid" size={16} />,
    animated: <AnimatedIcon name="activity" size={16} />,
  };

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start", accent && "[--sunui-icon-accent:var(--accent)]")}>
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap gap-2">
          <Tabs
            label={t.styleLabel}
            options={["line", "pixel"] as const}
            value={style}
            onChange={setStyle}
            render={(s) => (
              <>
                {styleIcon[s]}
                {s === "line" ? t.line : t.pixel}
                <span className="font-mono text-[11px] tabular-nums text-subtle">{counts[s][motion]}</span>
              </>
            )}
          />
          <Tabs
            label={t.motionLabel}
            options={["static", "animated"] as const}
            value={motion}
            onChange={setMotion}
            render={(m) => (
              <>
                {motionIcon[m]}
                {t[m]}
                <span className="font-mono text-[11px] tabular-nums text-subtle">{counts[style][m]}</span>
              </>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">{t.searchLabel}</span>
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={format(t.searchPlaceholder, { n: total })}
              className="h-9 w-full rounded-md border border-line bg-card pr-3 pl-9 text-sm outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Segmented
            label={t.size}
            options={sizeOptions as readonly number[]}
            value={size}
            onChange={isPixel ? setPixelSize : setStrokeSize}
          />
          {!isPixel && <Segmented label={t.stroke} options={strokes} value={stroke} onChange={setStroke} />}
          <button
            type="button"
            aria-pressed={accent}
            onClick={() => setAccent((on) => !on)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md border border-line px-3 text-xs font-medium transition-colors",
              accent ? "bg-accent-soft text-accent" : "bg-card text-subtle hover:text-fg",
            )}
          >
            <span className={cn("size-2 rounded-full", accent ? "bg-accent" : "bg-line")} />
            {t.accent}
          </button>
          {isPixel && (
            <button
              type="button"
              aria-pressed={pigment}
              onClick={() => setPigment((on) => !on)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border border-line px-3 text-xs font-medium transition-colors",
                pigment ? "bg-accent-soft text-accent" : "bg-card text-subtle hover:text-fg",
              )}
            >
              <PixelIcon name="potion" size={16} tone={pigment ? "pigment" : "ink"} />
              {t.pigment}
            </button>
          )}
        </div>

        {(isPixel || isMotion) && (
          <p className="mt-4 text-xs text-subtle">
            {[isPixel ? t.pixelHint : null, isMotion ? t.animatedHint : null].filter(Boolean).join(" ")}
          </p>
        )}

        {groups.length === 0 && (
          <p className="mt-10 rounded-md border border-dashed border-line p-8 text-center text-sm text-subtle">
            {format(t.noMatch, { q: query })}
          </p>
        )}

        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`icons-${group.id}`} className="mt-8">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`icons-${group.id}`} className="text-sm font-semibold">
                {group.title}
              </h2>
              <p className="text-xs text-subtle">{group.note}</p>
            </div>
            <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
              {group.icons.map((name) => {
                const k = kindOf(name);
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(name);
                        if (k && k !== "hover") toggle(name);
                      }}
                      aria-pressed={selected === name}
                      className={cn(
                        "relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border bg-card px-1 transition-colors",
                        selected === name ? "border-fg text-fg" : "border-line text-fg/85 hover:border-subtle",
                      )}
                    >
                      {renderIcon(name, size)}
                      <span className="max-w-full truncate font-mono text-[10px] text-subtle">{name}</span>
                      {k && k !== "hover" && (
                        <span className="absolute top-1.5 right-1.5 font-mono text-[9px] tracking-wide text-subtle uppercase">
                          {kindLabel[k]}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside className="rounded-md border border-[#e2e2e2] bg-[#f7f7f7] p-5 text-[#171717] lg:sticky lg:top-20 dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]">
        <p className="text-[11px] font-medium tracking-[0.14em] text-[#171717]/60 uppercase dark:text-[#ededed]/60">
          {isAnimated ? format(t.animatedKind, { kind: kindLabel[kind!] }) : isPixel ? t.pixelSelected : t.selected}
        </p>
        <div ref={previewRef} className="relative mt-4 grid place-items-center rounded-sm border border-dashed border-[#e2e2e2] py-8 dark:border-[#333333]">
          <div className="relative">
            {keylines && <Keylines pixel={isPixel} size={128} />}
            {renderIcon(selected, 128)}
          </div>
          <button
            type="button"
            aria-pressed={keylines}
            onClick={() => setKeylines((on) => !on)}
            className={cn(
              "absolute right-2 bottom-2 h-6 rounded-[5px] border px-2 font-mono text-[10px] transition-colors",
              keylines
                ? "border-[#171717]/30 text-[#171717] dark:border-[#ededed]/30 dark:text-[#ededed]"
                : "border-transparent text-[#171717]/50 hover:text-[#171717] dark:text-[#ededed]/50 dark:hover:text-[#ededed]",
            )}
          >
            {t.keylines}
          </button>
        </div>
        {isAnimated ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-pretty opacity-70">{kindHint[kind!]}</p>
            {kind !== "hover" && (
              <button
                type="button"
                onClick={() => toggle(selected)}
                aria-pressed={Boolean(toggled[selected])}
                className="h-8 shrink-0 rounded-md border border-[#e2e2e2] px-3 font-mono text-[11px] dark:border-[#333333]"
              >
                active={String(Boolean(toggled[selected]))}
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-end justify-center gap-5" aria-label={t.sizeScale}>
            {sizeOptions.map((s) => (
              <div key={s} className="flex flex-col items-center gap-1.5">
                {renderIcon(selected, s)}
                <span className="font-mono text-[10px] tabular-nums opacity-60">{s}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-5 font-mono text-sm tracking-[0.04em]">{selected}</p>
        <pre className="mt-2 overflow-x-auto rounded-sm bg-[#171717]/[0.05] px-3 py-2 font-mono text-[12px] dark:bg-[#ededed]/[0.07]">
          {jsx}
        </pre>
        <div className={cn("mt-3 grid gap-2", isAnimated ? "grid-cols-1" : "grid-cols-2")}>
          <button
            type="button"
            onClick={() => copy("jsx")}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-primary-foreground"
          >
            <Icon name={copied === "jsx" ? "check" : "copy"} size={14} />
            {copied === "jsx" ? t.copied : t.copyJsx}
          </button>
          {!isAnimated && (
            <button
              type="button"
              onClick={() => copy("svg")}
              className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#e2e2e2] text-xs font-medium dark:border-[#333333]"
            >
              <Icon name={copied === "svg" ? "check" : "copy"} size={14} />
              {copied === "svg" ? t.copied : t.copySvg}
            </button>
          )}
        </div>
        {!isAnimated && (
          <button
            type="button"
            onClick={download}
            className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[#e2e2e2] text-xs font-medium dark:border-[#333333]"
          >
            <Icon name="download" size={14} />
            {t.downloadSvg}
          </button>
        )}
        {tags.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-medium tracking-[0.14em] text-[#171717]/60 uppercase dark:text-[#ededed]/60">{t.tags}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="h-6 rounded-[5px] bg-[#171717]/[0.05] px-2 text-[11px] hover:bg-[#171717]/10 dark:bg-[#ededed]/[0.07] dark:hover:bg-[#ededed]/15"
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {related.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-medium tracking-[0.14em] text-[#171717]/60 uppercase dark:text-[#ededed]/60">{t.related}</p>
            <ul className="mt-2 grid grid-cols-8 gap-1">
              {related.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    title={name}
                    aria-label={name}
                    onClick={() => setSelected(name)}
                    className="grid aspect-square w-full place-items-center rounded-[5px] hover:bg-[#171717]/[0.06] dark:hover:bg-[#ededed]/10"
                  >
                    {renderIcon(name, isPixel ? 16 : 20)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

/** 預覽的網格與 keyline（參考 iconmcp.com 的 Grid / Keylines）。數字照 ICONS.md：線條版 24 格、內容 3 到 21、圓 8.5、方 7；像素版 16 格、內容 1 到 14 */
function Keylines({ pixel, size }: { pixel: boolean; size: number }) {
  const n = pixel ? 16 : 24;
  const lines = Array.from({ length: n + 1 }, (_, i) => i);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      className="pointer-events-none absolute inset-0 text-sky-600 dark:text-sky-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      overflow="visible"
    >
      {lines.map((i) => (
        <path key={i} d={`M${i} 0V${n}M0 ${i}H${n}`} vectorEffect="non-scaling-stroke" opacity={i % (pixel ? 4 : 6) === 0 ? 0.35 : 0.14} />
      ))}
      {pixel ? (
        <rect x={1} y={1} width={14} height={14} vectorEffect="non-scaling-stroke" opacity={0.7} />
      ) : (
        <g opacity={0.7}>
          <rect x={3} y={3} width={18} height={18} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <circle cx={12} cy={12} r={8.5} vectorEffect="non-scaling-stroke" />
          <rect x={5} y={5} width={14} height={14} rx={1} vectorEffect="non-scaling-stroke" />
        </g>
      )}
    </svg>
  );
}

function Tabs<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render: (option: T) => ReactNode;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-md border border-line bg-card p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "flex h-8 items-center gap-2 rounded-[5px] px-3 text-sm font-medium transition-colors",
            value === option ? "bg-stage text-fg" : "text-subtle hover:text-fg",
          )}
        >
          {render(option)}
        </button>
      ))}
    </div>
  );
}

function Segmented<T extends number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: number;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 items-center rounded-md border border-line bg-card p-0.5">
      <span className="px-2 text-[11px] text-subtle">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-full rounded-[5px] px-2 font-mono text-[11px] tabular-nums transition-colors",
            value === option ? "bg-stage text-fg" : "text-subtle hover:text-fg",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
