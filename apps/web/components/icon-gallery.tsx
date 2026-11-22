"use client";

import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { useStaggerPlay } from "@/components/use-stagger-play";
import { format } from "@/lib/i18n";
import { iconGroups, iconKeywords, pixelIconGroups } from "@/lib/icon-groups";
import { lineIconTone } from "@/lib/line-icon-colors";
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
import {
  AnimatedTwoToneIcon,
  animatedTwoToneIconNames,
  twoToneMotionKindOf,
  type AnimatedTwoToneIconName,
} from "@/registry/icons/sunui-animated-twotone-icons";
import { Icon, icons, type IconName } from "@/registry/icons/sunui-icons";
import { TwoToneIcon, twoToneIconNames, twoToneIcons, type TwoToneIconName } from "@/registry/icons/sunui-twotone-icons";
import { PixelIcon, pixelIconNames, pixelIcons, type PixelIconName } from "@/registry/icons/sunui-pixel-icons";

const sizes = [16, 20, 24, 32] as const;
const strokes = [1.25, 1.5, 1.75] as const;
// 像素圖示只在 16 的整數倍下銳利
const pixelSizes = [16, 32, 48] as const;
// 2026-11-22：三套。像素優先，雙色是新的一套（先做 24 個常用），線條保留
type Style = "pixel" | "twotone" | "line";
type Motion = "static" | "animated";

const animatedSet = new Set<string>(animatedIconNames);
const twoToneSet = new Set<string>(twoToneIconNames);
const animatedTwoToneSet = new Set<string>(animatedTwoToneIconNames);
const sources: Record<Style, Record<string, unknown>> = { pixel: pixelIcons, twotone: twoToneIcons, line: icons };
const animatedPixelSet = new Set<string>(animatedPixelIconNames);
const extraKeywords: Record<string, string> = { theme: "dark light mode toggle sun moon 深色 主題" };
const counts: Record<Style, Record<Motion, number>> = {
  line: { static: iconGroups.reduce((sum, group) => sum + group.icons.length, 0), animated: animatedIconNames.length },
  twotone: { static: twoToneIconNames.length, animated: animatedTwoToneIconNames.length },
  pixel: { static: pixelIconNames.length, animated: animatedPixelIconNames.length },
};

export function IconGallery({ messages: t }: { messages: Messages["iconGallery"] }) {
  const kindLabel: Record<MotionKind, string> = t.kindLabel;
  const kindHint: Record<MotionKind, string> = t.kindHint;
  // 2026-11-22：像素優先；線條與像素都預設彩色，黑白是切換選項
  const [style, setStyle] = useState<Style>("pixel");
  // 2026-11-22：畫布模式。所有圖示排在一張畫布上，有動態版的自動錯開播放；右側面板決定複製靜態或動態版
  const [animatedOn, setAnimatedOn] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [strokeSize, setStrokeSize] = useState<number>(24);
  const [pixelSize, setPixelSize] = useState<number>(32);
  const [stroke, setStroke] = useState<number>(1.5);
  const accent = true;
  // 2026-11-22：/icons 頁預設彩色，黑白改為切換選項
  const [pigment, setPigment] = useState(true);
  const [selected, setSelected] = useState<string>("coupon");
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [keylines, setKeylines] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const isPixel = style === "pixel";
  const isTwoTone = style === "twotone";
  const motionSet = isPixel ? animatedPixelSet : isTwoTone ? animatedTwoToneSet : animatedSet;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    // 分組標題與說明換成目前語言，缺的沿用英文
    const source = isPixel ? pixelIconGroups : iconGroups;
    const base = source.map((group) => ({
      ...group,
      ...t.groups[group.id],
      // 雙色共用線條的分組，只列已經畫好的
      icons: (group.icons as string[]).filter((name) => !isTwoTone || twoToneSet.has(name)),
    }));
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
  }, [query, isPixel, isTwoTone, t]);

  // 網址帶 ?icon=coupon（像素，預設）或 ?icon=coupon&style=line 可直接打開某個圖示（參考 iconmcp.com 的分享方式）
  const [linked, setLinked] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("style");
    const name = params.get("icon");
    if (s === "pixel" || s === "line" || s === "twotone") setStyle(s);
    if (name && name in sources[s === "line" || s === "twotone" ? s : "pixel"]) setSelected(name);
    setLinked(true);
  }, []);
  useEffect(() => {
    if (!linked) return;
    const url = new URL(window.location.href);
    url.searchParams.set("icon", selected);
    // 預設是像素，所以線條才寫進網址
    if (isPixel) url.searchParams.delete("style");
    else url.searchParams.set("style", style);
    window.history.replaceState(null, "", url);
  }, [linked, selected, isPixel, style]);

  const shown = category === "all" ? groups : groups.filter((group) => group.id === category);
  const visible = useMemo(() => [...new Set(shown.flatMap((group) => group.icons))], [shown]);
  const total = counts[style].static;
  const canvasRef = useRef<HTMLDivElement>(null);
  const playing = useStaggerPlay(
    useMemo(() => visible.filter((name) => motionSet.has(name)), [visible, motionSet]),
    style,
    canvasRef,
    paused,
  );
  // 切換模式後，選取的圖示若不在清單裡，改選第一個
  useEffect(() => {
    if (visible.length && !visible.includes(selected)) setSelected(visible[0]);
  }, [visible, selected]);

  const kindOf = (name: string): MotionKind | null =>
    !animatedOn || !motionSet.has(name)
      ? null
      : isPixel
        ? pixelMotionKindOf(name as AnimatedPixelIconName)
        : isTwoTone
          ? twoToneMotionKindOf(name as AnimatedTwoToneIconName)
          : motionKindOf(name as AnimatedIconName);
  const kind = kindOf(selected);
  const isAnimated = kind !== null;
  const size = isPixel ? pixelSize : strokeSize;
  const sizeOptions = isPixel ? pixelSizes : sizes;
  const activeProp = kind && kind !== "hover" ? ` active={${kind === "loop" ? "loading" : "on"}}` : "";
  // 線條上色只要 color；雙色另外要主體色的 CSS 變數
  const tintProp = !pigment ? "" : isTwoTone ? ` style={${JSON.stringify(lineIconTone(selected))}}` : ` color="${lineIconTone(selected).color}"`;
  const lineProps = `${strokeSize !== 24 ? ` size={${strokeSize}}` : ""}${!isTwoTone && stroke !== 1.5 ? ` strokeWidth={${stroke}}` : ""}${tintProp}`;
  const pixelProps = `${pixelSize !== 16 ? ` size={${pixelSize}}` : ""}${pigment ? ` tone="pigment"` : ""}`;
  const component = isPixel
    ? isAnimated ? "AnimatedPixelIcon" : "PixelIcon"
    : isTwoTone
      ? isAnimated ? "AnimatedTwoToneIcon" : "TwoToneIcon"
      : isAnimated ? "AnimatedIcon" : "Icon";
  const jsx = `<${component} name="${selected}"${activeProp}${isPixel ? pixelProps : lineProps} />`;

  const tone = pigment ? "pigment" : "ink";
  const tags = `${iconKeywords[selected as IconName | PixelIconName] ?? ""}`.split(/\s+/).filter(Boolean);
  const related = (groups.find((group) => group.icons.includes(selected))?.icons ?? []).filter((name) => name !== selected).slice(0, 8);

  // 彩色模式下雙色圖示用自己的本色：細節是 color，主體是同色相的淺色
  const lineTint = (name: string) => (pigment ? (lineIconTone(name) as CSSProperties) : undefined);

  function renderIcon(name: string, px: number) {
    // 剛切換風格的那一次渲染，選取的名稱可能還是另一套的；不存在就先不畫
    if (!(name in sources[style]) && !motionSet.has(name)) return null;
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
    if (isTwoTone) {
      return k ? (
        <AnimatedTwoToneIcon key={name} name={name as AnimatedTwoToneIconName} size={px} active={active} style={lineTint(name)} />
      ) : (
        <TwoToneIcon key={name} name={name as TwoToneIconName} size={px} style={lineTint(name)} />
      );
    }
    return k ? (
      <AnimatedIcon key={name} name={name as AnimatedIconName} size={px} strokeWidth={stroke} active={active} style={lineTint(name)} />
    ) : (
      <Icon key={name} name={name as IconName} size={px} strokeWidth={stroke} style={lineTint(name)} />
    );
  }

  function standaloneSvg() {
    const svg = previewRef.current?.querySelector("svg[data-icon]");
    if (!svg) return null;
    // 複製出去的 SVG 要能獨立使用：把變數換成實際色值或 currentColor，尺寸改成目前選的大小
    return svg.outerHTML
      .replaceAll("var(--sunui-icon-accent, currentColor)", accent && (isPixel || !pigment) ? "#171717" : "currentColor")
      .replaceAll("var(--sunui-pixel-shine, #fff)", "#fff")
      .replace(/var\(--sunui-icon-(body|mid), currentColor\)/g, (_, k: "body" | "mid") =>
        !isPixel && pigment ? lineIconTone(selected)[`--sunui-icon-${k}`] : "currentColor",
      )
      .replace(/var\(--sunui-icon-(?:body|mid)-opacity, ([\d.]+)\)/g, (_, v: string) => (!isPixel && pigment ? "1" : v))
      .replaceAll("currentColor", !isPixel && pigment ? lineIconTone(selected).color : "currentColor")
      .replace(/var\(--sunui-pigment-[a-z]+, (oklch\([^)]*\))\)/g, "$1")
      .replace(/ width="[^"]*" height="[^"]*"/, ` width="${size}" height="${size}"`)
      .replace(/ data-icon="[^"]*"/, "")
      .replace(/ data-tone="[^"]*"/, "");
  }

  function download() {
    const value = standaloneSvg();
    if (!value) return;
    const url = URL.createObjectURL(new Blob([value], { type: "image/svg+xml" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${selected}${isPixel ? "-pixel" : isTwoTone ? "-twotone" : ""}.svg` });
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
    twotone: <TwoToneIcon name="heart" size={16} />,
    pixel: <PixelIcon name="heart" size={16} />,
  };

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start", accent && "[--sunui-icon-accent:var(--accent)]", !isPixel && pigment && "[--sunui-icon-accent:currentColor]")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
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
          <Tabs
            label={t.styleLabel}
            options={["pixel", "twotone", "line"] as const}
            value={style}
            onChange={(next) => {
              setStyle(next);
              setCategory("all");
            }}
            render={(s) => (
              <>
                {styleIcon[s]}
                {s === "line" ? t.line : s === "twotone" ? t.twoTone : t.pixel}
                <span className="font-mono text-[11px] tabular-nums text-subtle">{counts[s].static}</span>
              </>
            )}
          />
          <Choice
            label={t.colorLabel}
            options={[
              { value: true, label: t.color },
              { value: false, label: t.mono },
            ]}
            value={pigment}
            onChange={setPigment}
          />
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
            className="flex h-9 items-center rounded-md border border-line bg-card px-3 text-xs font-medium text-subtle transition-colors hover:text-fg motion-reduce:hidden"
          >
            {paused ? t.play : t.pause}
          </button>
        </div>

        <div role="tablist" aria-label={t.categoryLabel} className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {[{ id: "all", title: t.all }, ...groups].map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={category === group.id}
              onClick={() => setCategory(group.id)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors",
                category === group.id ? "bg-fg text-bg" : "text-subtle hover:bg-stage hover:text-fg",
              )}
            >
              {group.title}
            </button>
          ))}
        </div>

        <div ref={canvasRef} className="mt-3 rounded-lg border border-line bg-card p-2 sm:p-3">
          {visible.length === 0 ? (
            <p className="p-8 text-center text-sm text-subtle">{format(t.noMatch, { q: query })}</p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1">
              {visible.map((name) => (
                <CanvasCell
                  key={`${style}-${name}`}
                  name={name}
                  variant={style}
                  animated={motionSet.has(name)}
                  color={pigment}
                  on={Boolean(playing[name])}
                  selected={selected === name}
                  onSelect={setSelected}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="rounded-md border border-foreground/10 bg-card p-5 text-foreground lg:sticky lg:top-20">
        <p className="text-[11px] font-medium tracking-[0.14em] text-foreground/60 uppercase">
          {isAnimated ? format(t.animatedKind, { kind: kindLabel[kind!] }) : isPixel ? t.pixelSelected : t.selected}
        </p>
        <div ref={previewRef} className="relative mt-4 grid place-items-center rounded-sm border border-dashed border-foreground/10 py-8">
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
                ? "border-foreground/30 text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground",
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
                className="h-8 shrink-0 rounded-md border border-foreground/10 px-3 font-mono text-[11px]"
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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Segmented
            label={t.size}
            options={sizeOptions as readonly number[]}
            value={size}
            onChange={isPixel ? setPixelSize : setStrokeSize}
          />
          {style === "line" && <Segmented label={t.stroke} options={strokes} value={stroke} onChange={setStroke} />}
          {motionSet.has(selected) && (
            <button
              type="button"
              aria-pressed={animatedOn}
              onClick={() => setAnimatedOn((on) => !on)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border border-line px-3 text-xs font-medium transition-colors",
                animatedOn ? "bg-stage text-fg" : "bg-card text-subtle hover:text-fg",
              )}
            >
              <AnimatedIcon name="activity" size={14} />
              {t.animated}
            </button>
          )}
        </div>
        <p className="mt-5 font-mono text-sm tracking-[0.04em]">{selected}</p>
        <pre className="mt-2 overflow-x-auto rounded-sm bg-foreground/5 px-3 py-2 font-mono text-[12px]">
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
              className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-foreground/10 text-xs font-medium"
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
            className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-foreground/10 text-xs font-medium"
          >
            <Icon name="download" size={14} />
            {t.downloadSvg}
          </button>
        )}
        {tags.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-medium tracking-[0.14em] text-foreground/60 uppercase">{t.tags}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="h-6 rounded-[5px] bg-foreground/5 px-2 text-[11px] hover:bg-foreground/10"
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
            <p className="text-[11px] font-medium tracking-[0.14em] text-foreground/60 uppercase">{t.related}</p>
            <ul className="mt-2 grid grid-cols-8 gap-1">
              {related.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    title={name}
                    aria-label={name}
                    onClick={() => setSelected(name)}
                    className="grid aspect-square w-full place-items-center rounded-[5px] hover:bg-foreground/[0.06]"
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
      className="pointer-events-none absolute inset-0 text-accent"
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

/** 畫布上的一格：沒有文字，名稱放在 title 與 aria-label；有動態版就由外部的 on 驅動播放 */
const CanvasCell = memo(function CanvasCell({
  name,
  variant,
  animated,
  color,
  on,
  selected,
  onSelect,
}: {
  name: string;
  variant: Style;
  animated: boolean;
  color: boolean;
  on: boolean;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  const tone = color ? "pigment" : "ink";
  const pixel = variant === "pixel";
  const tint = color && !pixel ? (lineIconTone(name) as CSSProperties) : undefined;
  return (
    <li>
      <button
        type="button"
        title={name}
        aria-label={name}
        aria-pressed={selected}
        onClick={() => onSelect(name)}
        className={cn(
          "grid h-14 w-full place-items-center rounded-md text-fg/85 transition-colors",
          selected ? "bg-stage ring-1 ring-fg ring-inset" : "hover:bg-stage",
        )}
      >
        {pixel ? (
          animated ? (
            <AnimatedPixelIcon name={name as AnimatedPixelIconName} size={32} active={on} tone={tone} />
          ) : (
            <PixelIcon name={name as PixelIconName} size={32} tone={tone} />
          )
        ) : variant === "twotone" ? (
          animated ? (
            <AnimatedTwoToneIcon name={name as AnimatedTwoToneIconName} size={24} active={on} style={tint} />
          ) : (
            <TwoToneIcon name={name as TwoToneIconName} size={24} style={tint} />
          )
        ) : animated ? (
          <AnimatedIcon name={name as AnimatedIconName} size={24} active={on} style={tint} />
        ) : (
          <Icon name={name as IconName} size={24} style={tint} />
        )}
      </button>
    </li>
  );
});

function Choice<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 items-center rounded-md border border-line bg-card p-0.5">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-full rounded-[5px] px-3 text-xs font-medium transition-colors",
            value === option.value ? "bg-stage text-fg" : "text-subtle hover:text-fg",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
