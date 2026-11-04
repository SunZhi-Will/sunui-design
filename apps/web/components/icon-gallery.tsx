"use client";

import { useMemo, useRef, useState } from "react";

import { iconGroups, iconKeywords } from "@/lib/icon-groups";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/registry/icons/sunui-icons";

const sizes = [16, 20, 24, 32] as const;
const strokes = [1.25, 1.5, 1.75] as const;

export function IconGallery() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<number>(24);
  const [stroke, setStroke] = useState<number>(1.5);
  const [accent, setAccent] = useState(true);
  const [selected, setSelected] = useState<IconName>("coupon");
  const [copied, setCopied] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return iconGroups;
    return iconGroups
      .map((group) => ({
        ...group,
        icons: group.icons.filter((name) => `${name} ${iconKeywords[name] ?? ""}`.toLowerCase().includes(q)),
      }))
      .filter((group) => group.icons.length > 0);
  }, [query]);

  const total = iconGroups.reduce((sum, group) => sum + group.icons.length, 0);
  const jsx = `<Icon name="${selected}"${size !== 24 ? ` size={${size}}` : ""}${stroke !== 1.5 ? ` strokeWidth={${stroke}}` : ""} />`;

  async function copy(kind: "jsx" | "svg") {
    let value = jsx;
    if (kind === "svg") {
      const svg = previewRef.current?.querySelector("svg");
      if (!svg) return;
      // 複製出去的 SVG 要能獨立使用：把朱紅變數換成實際色值或 currentColor
      value = svg.outerHTML
        .replaceAll("var(--sunui-icon-accent, currentColor)", accent ? "#c8361d" : "currentColor")
        .replace(/ data-icon="[^"]*"/, "");
    }
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div
      className={cn("grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start", accent && "[--sunui-icon-accent:var(--accent)]")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Search icons</span>
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${total} icons, e.g. coupon, 印章`}
              className="h-9 w-full rounded-md border border-line bg-card pr-3 pl-9 text-sm outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Segmented label="Size" options={sizes} value={size} onChange={setSize} />
          <Segmented label="Stroke" options={strokes} value={stroke} onChange={setStroke} />
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
            Vermilion accent
          </button>
        </div>

        {groups.length === 0 && (
          <p className="mt-10 rounded-md border border-dashed border-line p-8 text-center text-sm text-subtle">
            No icon matches “{query}”.
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
              {group.icons.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => setSelected(name)}
                    aria-pressed={selected === name}
                    className={cn(
                      "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border bg-card px-1 transition-colors",
                      selected === name ? "border-fg text-fg" : "border-line text-fg/85 hover:border-subtle",
                    )}
                  >
                    <Icon name={name} size={size} strokeWidth={stroke} />
                    <span className="max-w-full truncate font-mono text-[10px] text-subtle">{name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="rounded-md border border-[#e7e0d0] bg-[#faf7f0] p-5 text-[#1c1917] lg:sticky lg:top-20 dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]">
        <p className="text-[11px] font-medium tracking-[0.14em] text-[#1c1917]/60 uppercase dark:text-[#ece7dc]/60">
          Selected
        </p>
        <div ref={previewRef} className="mt-4 grid place-items-center rounded-sm border border-dashed border-[#e7e0d0] py-8 dark:border-[#38332b]">
          <Icon name={selected} size={72} strokeWidth={stroke} />
        </div>
        <div className="mt-4 flex items-end justify-center gap-5" aria-label="Size scale">
          {sizes.map((s) => (
            <div key={s} className="flex flex-col items-center gap-1.5">
              <Icon name={selected} size={s} strokeWidth={stroke} />
              <span className="font-mono text-[10px] tabular-nums opacity-60">{s}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 font-mono text-sm tracking-[0.04em]">{selected}</p>
        <pre className="mt-2 overflow-x-auto rounded-sm bg-[#1c1917]/[0.05] px-3 py-2 font-mono text-[12px] dark:bg-[#ece7dc]/[0.07]">
          {jsx}
        </pre>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => copy("jsx")}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-primary-foreground"
          >
            <Icon name={copied === "jsx" ? "check" : "copy"} size={14} />
            {copied === "jsx" ? "Copied" : "Copy JSX"}
          </button>
          <button
            type="button"
            onClick={() => copy("svg")}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#e7e0d0] text-xs font-medium dark:border-[#38332b]"
          >
            <Icon name={copied === "svg" ? "check" : "copy"} size={14} />
            {copied === "svg" ? "Copied" : "Copy SVG"}
          </button>
        </div>
      </aside>
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
