"use client";

import { useMemo, useState } from "react";

import { CommandPalette, Kbd, useModKey, type CommandGroup } from "./command-palette";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function CommandPaletteDemo() {
  const mod = useModKey();
  const [open, setOpen] = useState(false);
  const [hotkey, setHotkey] = useState(true);
  const [last, setLast] = useState<string | null>(null);
  const [theme, setTheme] = useState("System");

  const groups = useMemo<CommandGroup[]>(() => {
    const run = (label: string) => () => setLast(label);
    return [
      {
        id: "navigation",
        heading: "Navigation",
        items: [
          { id: "dashboard", label: "Go to Dashboard", icon: <Icon d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />, shortcut: ["G", "D"], onSelect: run("Go to Dashboard") },
          { id: "projects", label: "Go to Projects", icon: <Icon d="M3 7h6l2 2h10v10H3z" />, shortcut: ["G", "P"], onSelect: run("Go to Projects") },
          { id: "billing", label: "Go to Billing", keywords: ["invoice", "payment", "plan"], icon: <Icon d="M3 6h18v12H3zM3 10h18" />, shortcut: ["G", "B"], onSelect: run("Go to Billing") },
          { id: "settings", label: "Open Settings", keywords: ["preferences", "account"], icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2" />, shortcut: [mod, ","], onSelect: run("Open Settings") },
        ],
      },
      {
        id: "actions",
        heading: "Actions",
        items: [
          { id: "new-project", label: "Create new project", icon: <Icon d="M12 5v14M5 12h14" />, shortcut: [mod, "N"], onSelect: run("Create new project") },
          { id: "invite", label: "Invite teammate", keywords: ["member", "user"], icon: <Icon d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 8v6M22 11h-6" />, onSelect: run("Invite teammate") },
          { id: "copy-link", label: "Copy share link", icon: <Icon d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />, shortcut: [mod, "⇧", "C"], onSelect: run("Copy share link") },
          { id: "export", label: "Export as CSV", icon: <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />, disabled: true },
        ],
      },
      {
        id: "theme",
        heading: "Theme",
        items: ["Light", "Dark", "System"].map((t) => ({
          id: `theme-${t.toLowerCase()}`,
          label: `Use ${t} theme`,
          keywords: ["appearance", "mode", t.toLowerCase()],
          icon:
            t === "Light" ? (
              <Icon d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2" />
            ) : t === "Dark" ? (
              <Icon d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            ) : (
              <Icon d="M3 5h18v11H3zM8 20h8M12 16v4" />
            ),
          onSelect: () => {
            setTheme(t);
            setLast(`Use ${t} theme`);
          },
        })),
      },
    ];
  }, [mod]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts={hotkey ? "Meta+K Control+K" : undefined}
        className="flex h-11 w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="flex-1 text-left">Search or jump to…</span>
        <span className="flex gap-1" aria-hidden="true">
          <Kbd>{mod}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={hotkey} onChange={(e) => setHotkey(e.target.checked)} className="size-4 accent-current" />
        Global {mod}+K hotkey
      </label>

      <p className="text-sm text-muted-foreground" role="status">
        {last ? (
          <>
            Ran <span className="font-medium text-foreground">{last}</span>, theme: {theme}
          </>
        ) : (
          "Try typing “gp” or “invoice”."
        )}
      </p>

      <CommandPalette
        groups={groups}
        open={open}
        onOpenChange={setOpen}
        hotkey={hotkey}
        defaultRecent={["new-project", "dashboard"]}
      />
    </div>
  );
}
