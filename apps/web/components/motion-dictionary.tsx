"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { MotionDemo } from "@/components/motion-demo";
import type { DemoKey, MotionPageCopy, Verdict } from "@/content/motion-dictionary";
import { cn } from "@/lib/utils";

export type DictionaryEntry = {
  id: string;
  name: string;
  localName: string | null;
  aliases: string[];
  verdict: Verdict;
  how: string;
  blocks: { name: string; title: string }[];
  planned: string | null;
  demo: DemoKey | null;
};

export type DictionaryGroup = { id: string; title: string; entries: DictionaryEntry[] };

type Copy = Pick<MotionPageCopy, "legend" | "filterLabel" | "all" | "searchLabel" | "searchPlaceholder" | "empty" | "aka" | "blocks" | "planned" | "play">;

const verdicts: Verdict[] = ["allow", "limit", "avoid"];

const badge: Record<Verdict, string> = {
  allow: "border-fg/70 text-fg",
  limit: "border-dashed border-subtle text-subtle",
  avoid: "border-[#c8361d]/60 text-[#c8361d] dark:border-[#ec6a4f]/60 dark:text-[#ec6a4f]",
};

export function MotionDictionary({ groups, copy }: { groups: DictionaryGroup[]; copy: Copy }) {
  const [filter, setFilter] = useState<Verdict | "all">("all");
  const [query, setQuery] = useState("");
  const searchId = useId();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        entries: group.entries.filter((entry) => {
          if (filter !== "all" && entry.verdict !== filter) return false;
          if (!q) return true;
          return [entry.name, entry.localName ?? "", ...entry.aliases].some((s) => s.toLowerCase().includes(q));
        }),
      }))
      .filter((group) => group.entries.length > 0);
  }, [groups, filter, query]);

  const counts = useMemo(() => {
    const all = groups.flatMap((g) => g.entries);
    return { all: all.length, ...Object.fromEntries(verdicts.map((v) => [v, all.filter((e) => e.verdict === v).length])) } as Record<
      Verdict | "all",
      number
    >;
  }, [groups]);

  return (
    <div className="not-prose mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={copy.filterLabel} className="flex flex-wrap gap-1.5">
          {(["all", ...verdicts] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
              className={cn(
                "rounded-sm border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                filter === v ? "border-fg bg-fg text-bg" : "border-line text-subtle hover:text-fg",
              )}
            >
              {v === "all" ? copy.all : copy.legend[v].label} <span className="tabular-nums opacity-70">{counts[v]}</span>
            </button>
          ))}
        </div>
        <label htmlFor={searchId} className="sr-only">
          {copy.searchLabel}
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.searchPlaceholder}
          className="h-9 w-full rounded-md border border-line bg-card px-3 text-sm text-fg placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-64"
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.reduce((n, g) => n + g.entries.length, 0)}
      </p>

      {visible.length === 0 && <p className="mt-8 text-sm text-subtle">{copy.empty}</p>}

      {visible.map((group) => (
        <section key={group.id} aria-labelledby={`motion-${group.id}`} className="mt-10">
          <h2 id={`motion-${group.id}`} className="!mt-0 text-lg font-semibold text-fg">
            {group.title}
          </h2>
          <ul className="mt-3 divide-y divide-line border-y border-line !p-0 !list-none">
            {group.entries.map((entry) => (
              <li key={entry.id} id={entry.id} className="scroll-mt-24 py-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 className="font-medium text-fg">{entry.name}</h3>
                  {entry.localName && <span className="text-sm text-subtle">{entry.localName}</span>}
                  <span className={cn("ml-auto shrink-0 rounded-[3px] border px-1.5 py-0.5 text-[11px] font-medium tracking-wide", badge[entry.verdict])}>
                    {copy.legend[entry.verdict].label}
                  </span>
                </div>
                {entry.aliases.length > 0 && (
                  <p className="!mt-1 text-xs text-subtle">
                    {copy.aka}: {entry.aliases.join(", ")}
                  </p>
                )}
                <p className="!mt-2 text-sm">{entry.how}</p>
                {(entry.blocks.length > 0 || entry.planned) && (
                  <p className="!mt-2 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
                    <span>{copy.blocks}:</span>
                    {entry.blocks.map((b) => (
                      <Link key={b.name} href={`/blocks/${b.name}`} className="rounded-sm border border-line px-2 py-0.5 !no-underline text-fg hover:bg-stage">
                        {b.title}
                      </Link>
                    ))}
                    {entry.planned && (
                      <span className="rounded-sm border border-dashed border-line px-2 py-0.5 font-mono">
                        {entry.planned} · {copy.planned}
                      </span>
                    )}
                  </p>
                )}
                {entry.demo && <MotionDemo demo={entry.demo} playLabel={copy.play} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
