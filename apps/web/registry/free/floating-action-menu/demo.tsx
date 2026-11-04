"use client";

import { useState } from "react";

import { FloatingActionMenu, type FloatingActionMenuItem } from "./floating-action-menu";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function FloatingActionMenuDemo() {
  const [variant, setVariant] = useState<"radial" | "stack">("radial");
  const [last, setLast] = useState<string>("Nothing yet");

  const items: FloatingActionMenuItem[] = [
    { id: "note", label: "New note", icon: <Icon d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />, onSelect: () => setLast("New note") },
    { id: "photo", label: "Upload photo", icon: <Icon d="M4 7h3l2-2h6l2 2h3v12H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />, onSelect: () => setLast("Upload photo") },
    { id: "share", label: "Share", icon: <Icon d="M4 12v7h16v-7M12 3v12M7 8l5-5 5 5" />, onSelect: () => setLast("Share") },
    {
      id: "chat",
      label: "Start chat",
      icon: <Icon d="M4 5h16v11H9l-5 4z" />,
      onSelect: () => setLast("Start chat"),
      className: "bg-emerald-500 text-white border-transparent hover:bg-emerald-600",
    },
  ];

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Layout">
        {(["radial", "stack"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={variant === v}
            onClick={() => setVariant(v)}
            className="rounded-full border border-border px-3 py-1.5 text-sm capitalize text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {v}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground" aria-live="polite">
          Last action: <strong className="font-medium text-foreground">{last}</strong>
        </span>
      </div>
      <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-muted/40">
        <div className="space-y-2 p-6" aria-hidden="true">
          <div className="h-3 w-40 rounded-full bg-muted" />
          <div className="h-3 w-64 rounded-full bg-muted" />
          <div className="h-3 w-52 rounded-full bg-muted" />
        </div>
        <FloatingActionMenu key={variant} items={items} variant={variant} fixed={false} />
      </div>
    </div>
  );
}
