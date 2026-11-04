"use client";

import type { ReactNode } from "react";

import { ScriptedDemo, type ScriptedDemoChapter, type ScriptedDemoScene } from "./scripted-demo";

const chapters: ScriptedDemoChapter[] = [
  { id: "add", title: "Add items", caption: "Type what you bought. Totals update as you go." },
  { id: "split", title: "Split", caption: "Tap who shared each item. Leftover cents go to one person, not lost." },
  { id: "send", title: "Send", caption: "Everyone gets a link with exactly what they owe." },
];

const scenes: ScriptedDemoScene[] = [
  { key: "empty", duration: 1800, chapter: "add", target: "add" },
  { key: "items", duration: 2200, chapter: "add", target: "total" },
  { key: "pick", duration: 2000, chapter: "split", target: "chip-ben" },
  { key: "split", duration: 2200, chapter: "split", target: "each" },
  { key: "review", duration: 1800, chapter: "send", target: "send" },
  { key: "sent", duration: 2400, chapter: "send" },
];

const items = [
  { name: "Ramen x3", amount: 42 },
  { name: "Gyoza", amount: 9 },
  { name: "Iced tea x2", amount: 7 },
];

function Row({ name, amount }: { name: string; amount: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
      <span>{name}</span>
      <span className="tabular-nums">${amount.toFixed(2)}</span>
    </div>
  );
}

function Frame({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Dinner at Hoshi</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
      {footer && <div className="mt-3 flex items-center justify-between gap-3">{footer}</div>}
    </div>
  );
}

const people = ["Amy", "Ben", "Chloe"];

function renderScene(key: string) {
  switch (key) {
    case "empty":
      return (
        <Frame title="0 items" footer={<span className="text-sm text-muted-foreground">Nothing yet</span>}>
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            <span>Add the first thing you ordered</span>
            <span data-demo-target="add" className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground">
              Add item
            </span>
          </div>
        </Frame>
      );
    case "items":
      return (
        <Frame title="3 items" footer={<><span className="text-sm text-muted-foreground">Total</span><span data-demo-target="total" className="text-lg font-semibold tabular-nums">$58.00</span></>}>
          {items.map((i) => <Row key={i.name} {...i} />)}
        </Frame>
      );
    case "pick":
    case "split": {
      const picked = key === "split" ? people : ["Amy", "Chloe"];
      return (
        <Frame title="Who had the ramen?" footer={<span data-demo-target="each" className="text-sm tabular-nums">{key === "split" ? "3 people, $14.00 each" : "2 people, $21.00 each"}</span>}>
          <Row {...items[0]} />
          <div className="mt-3 flex flex-wrap gap-2">
            {people.map((p) => (
              <span
                key={p}
                data-demo-target={`chip-${p.toLowerCase()}`}
                className={
                  picked.includes(p)
                    ? "rounded-full bg-foreground px-3 py-1 text-sm text-background"
                    : "rounded-full border border-border px-3 py-1 text-sm text-muted-foreground"
                }
              >
                {p}
              </span>
            ))}
          </div>
        </Frame>
      );
    }
    case "review":
      return (
        <Frame title="Ready to send" footer={<span data-demo-target="send" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Send links</span>}>
          {[["Amy", 19.33], ["Ben", 19.33], ["Chloe", 19.34]].map(([n, a]) => (
            <Row key={n as string} name={n as string} amount={a as number} />
          ))}
        </Frame>
      );
    default:
      return (
        <Frame title="Sent">
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              3 links sent
            </span>
            <span className="text-sm text-muted-foreground">You will see who has paid back here.</span>
          </div>
        </Frame>
      );
  }
}

export default function ScriptedDemoDemo() {
  return (
    <section className="w-full max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Split a dinner bill in three taps</h2>
        <p className="mt-1 text-sm text-muted-foreground">No sign up. Works for any currency.</p>
      </div>
      <ScriptedDemo scenes={scenes} chapters={chapters} renderScene={renderScene} />
    </section>
  );
}
