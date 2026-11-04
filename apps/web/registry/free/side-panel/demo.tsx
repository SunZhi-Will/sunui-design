"use client";

import { useState } from "react";

import { SidePanel, type SidePanelSide } from "./side-panel";

const sides: SidePanelSide[] = ["right", "left", "bottom"];

export default function SidePanelDemo() {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<SidePanelSide>("right");
  const [notify, setNotify] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <div className="w-full max-w-3xl space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Side" className="flex gap-1">
          {sides.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => setSide(s)}
              className="rounded-full border border-border px-3 py-1.5 capitalize text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-muted-foreground" aria-live="polite">
          {saved ? `Saved: ${saved}` : "Press Escape or click outside to close"}
        </span>
      </div>

      <div className="relative h-[26rem] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="font-semibold">Workspace</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open settings
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 p-5" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>

        <SidePanel
          open={open}
          onOpenChange={setOpen}
          side={side}
          size="sm"
          portal={false}
          title="Project settings"
          description="Changes apply to everyone in this workspace."
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaved(notify ? "notifications on" : "notifications off");
                  setOpen(false);
                }}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                Save
              </button>
            </div>
          }
        >
          <form className="space-y-4 text-sm" onSubmit={(e) => e.preventDefault()}>
            <label className="block space-y-1.5">
              <span className="font-medium">Project name</span>
              <input
                defaultValue="Aurora"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="font-medium">Email notifications</span>
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-current" />
            </label>
          </form>
        </SidePanel>
      </div>
    </div>
  );
}
