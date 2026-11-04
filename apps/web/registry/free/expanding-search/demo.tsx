"use client";

import { useState } from "react";

import { ExpandingSearch, type ExpandingSearchSuggestion } from "./expanding-search";

const suggestions: ExpandingSearchSuggestion[] = [
  { id: "button", label: "Magnetic Button", hint: "Block" },
  { id: "otp", label: "OTP Input", hint: "Block" },
  { id: "toast", label: "Toast Stack", hint: "Block" },
  { id: "palette", label: "Command Palette", hint: "Block" },
  { id: "install", label: "Installing with the shadcn CLI", hint: "Docs" },
  { id: "theming", label: "Theming and design tokens", hint: "Docs" },
  { id: "motion", label: "Reduced motion support", hint: "Docs" },
  { id: "pricing", label: "Pricing", hint: "Page" },
];

export default function ExpandingSearchDemo() {
  const [withSuggestions, setWithSuggestions] = useState(true);
  const [slash, setSlash] = useState(true);
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={withSuggestions}
            onChange={(e) => setWithSuggestions(e.target.checked)}
            className="size-4 accent-current"
          />
          Suggestions
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={slash} onChange={(e) => setSlash(e.target.checked)} className="size-4 accent-current" />
          Press <kbd className="rounded border border-border bg-muted px-1 text-[11px]">/</kbd> to open
        </label>
      </div>

      <div className="overflow-visible rounded-2xl border border-border bg-background">
        <header className="flex h-16 items-center gap-6 border-b border-border px-5">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <span className="size-6 rounded-lg bg-primary" aria-hidden="true" />
            Northwind
          </span>
          <nav aria-label="Main" className="hidden gap-5 text-sm text-muted-foreground sm:flex">
            {["Blocks", "Docs", "Pricing"].map((l) => (
              <a key={l} href="#" onClick={(e) => e.preventDefault()} className="rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                {l}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ExpandingSearch
              suggestions={withSuggestions ? suggestions : undefined}
              slashShortcut={slash}
              expandedWidth={260}
              placeholder="Search blocks and docs…"
              onSubmit={(q) => setResult(`Searched for “${q}”`)}
              onSuggestionSelect={(s) => setResult(`Opened ${s.label}`)}
            />
            <span className="size-8 rounded-full bg-muted" aria-hidden="true" />
          </div>
        </header>
        <div className="space-y-3 p-5">
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-3/5 rounded bg-muted" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground" role="status">
        {result ?? "Click the search icon, or press / when nothing else is focused."}
      </p>
    </div>
  );
}
