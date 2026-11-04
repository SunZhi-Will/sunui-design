"use client";

import { useState } from "react";

import { AnimatedTabs, type AnimatedTabsProps } from "./animated-tabs";

type Variant = NonNullable<AnimatedTabsProps["variant"]>;

const issues = [
  { title: "Checkout button overlaps footer on iPhone SE", state: "open" },
  { title: "Dark mode toast has low contrast", state: "open" },
  { title: "Add keyboard shortcut for search", state: "open" },
  { title: "Price rounding on invoices", state: "closed" },
  { title: "Broken link in onboarding email", state: "closed" },
];

function IssueList({ state }: { state?: string }) {
  const rows = state ? issues.filter((i) => i.state === state) : issues;
  return (
    <ul className="divide-y divide-border text-sm">
      {rows.map((r) => (
        <li key={r.title} className="flex items-center gap-3 py-2.5">
          <span
            aria-hidden="true"
            className={r.state === "open" ? "size-2 rounded-full bg-emerald-500" : "size-2 rounded-full bg-muted-foreground/50"}
          />
          <span className="flex-1">{r.title}</span>
          <span className="text-xs text-muted-foreground capitalize">{r.state}</span>
        </li>
      ))}
    </ul>
  );
}

const fileBody = (name: string, lines: string[]) => (
  <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground">
    <span className="text-foreground">{`// ${name}`}</span>
    {"\n" + lines.join("\n")}
  </pre>
);

export default function AnimatedTabsDemo() {
  const [variant, setVariant] = useState<Variant>("underline");

  return (
    <div className="w-full max-w-xl space-y-4">
      <div role="group" aria-label="Variant" className="flex gap-1 text-sm">
        {(["underline", "pill", "folder"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={variant === v}
            onClick={() => setVariant(v)}
            className="rounded-full border border-border px-3 py-1.5 capitalize text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {v}
          </button>
        ))}
      </div>

      {variant === "folder" ? (
        <AnimatedTabs
          key="folder"
          variant="folder"
          aria-label="Open files"
          tabs={[
            { value: "page", label: "page.tsx", content: fileBody("page.tsx", ["export default function Page() {", "  return <Hero />;", "}"]) },
            { value: "layout", label: "layout.tsx", content: fileBody("layout.tsx", ["export default function Layout({ children }) {", "  return <body>{children}</body>;", "}"]) },
            { value: "css", label: "globals.css", content: fileBody("globals.css", ['@import "tailwindcss";', ":root { --radius: 0.75rem; }"]) },
          ]}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <AnimatedTabs
            key={variant}
            variant={variant}
            aria-label="Filter issues"
            tabs={[
              { value: "all", label: "All", count: issues.length, content: <IssueList /> },
              { value: "open", label: "Open", count: 3, content: <IssueList state="open" /> },
              { value: "closed", label: "Closed", count: 2, content: <IssueList state="closed" /> },
              { value: "archived", label: "Archived", count: 0, disabled: true },
            ]}
          />
        </div>
      )}
    </div>
  );
}
