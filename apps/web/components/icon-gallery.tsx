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
  const [selected, setSelected] = useState<string>("coupon");
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
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
  const pixelProps = pixelSize !== 16 ? ` size={${pixelSize}}` : "";
  const component = isPixel ? (isAnimated ? "AnimatedPixelIcon" : "PixelIcon") : isAnimated ? "AnimatedIcon" : "Icon";
  const jsx = `<${component} name="${selected}"${activeProp}${isPixel ? pixelProps : lineProps} />`;

  function renderIcon(name: string, px: number) {
    // 剛切換風格的那一次渲染，選取的名稱可能還是另一套的；不存在就先不畫
    if (!(name in (isPixel ? pixelIcons : icons)) && !motionSet.has(name)) return null;
    const k = kindOf(name);
    const active = k && k !== "hover" ? Boolean(toggled[name]) : undefined;
    // key 用名稱：換圖示時重新掛載，不沿用上一個圖示的影格
    if (isPixel) {
      return k ? (
        <AnimatedPixelIcon key={name} name={name as AnimatedPixelIconName} size={px} active={active} />
      ) : (
        <PixelIcon key={name} name={name as PixelIconName} size={px} />
      );
    }
    return k ? (
      <AnimatedIcon key={name} name={name as AnimatedIconName} size={px} strokeWidth={stroke} active={active} />
    ) : (
      <Icon key={name} name={name as IconName} size={px} strokeWidth={stroke} />
    );
  }

  async function copy(kind: "jsx" | "svg") {
    let value = jsx;
    if (kind === "svg") {
      const svg = previewRef.current?.querySelector("svg");
      if (!svg) return;
      // 複製出去的 SVG 要能獨立使用：把變數換成實際色值或 currentColor
      value = svg.outerHTML
        .replaceAll("var(--sunui-icon-accent, currentColor)", accent ? "#c8361d" : "currentColor")
        .replaceAll("var(--sunui-pixel-shine, #fff)", "#fff")
        .replace(/ data-icon="[^"]*"/, "");
    }
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

      <aside className="rounded-md border border-[#e7e0d0] bg-[#faf7f0] p-5 text-[#1c1917] lg:sticky lg:top-20 dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
        <p className="text-[11px] font-medium tracking-[0.14em] text-[#1c1917]/60 uppercase dark:text-[#ece7dc]/60">
          {isAnimated ? format(t.animatedKind, { kind: kindLabel[kind!] }) : isPixel ? t.pixelSelected : t.selected}
        </p>
        <div ref={previewRef} className="mt-4 grid place-items-center rounded-sm border border-dashed border-[#e7e0d0] py-8 dark:border-[#38332b]">
          {renderIcon(selected, isPixel ? 64 : 72)}
        </div>
        {isAnimated ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-pretty opacity-70">{kindHint[kind!]}</p>
            {kind !== "hover" && (
              <button
                type="button"
                onClick={() => toggle(selected)}
                aria-pressed={Boolean(toggled[selected])}
                className="h-8 shrink-0 rounded-md border border-[#e7e0d0] px-3 font-mono text-[11px] dark:border-[#38332b]"
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
        <pre className="mt-2 overflow-x-auto rounded-sm bg-[#1c1917]/[0.05] px-3 py-2 font-mono text-[12px] dark:bg-[#ece7dc]/[0.07]">
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
              className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#e7e0d0] text-xs font-medium dark:border-[#38332b]"
            >
              <Icon name={copied === "svg" ? "check" : "copy"} size={14} />
              {copied === "svg" ? t.copied : t.copySvg}
            </button>
          )}
        </div>
      </aside>
    </div>
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
