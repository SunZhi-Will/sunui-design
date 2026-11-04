"use client";

import { useRef, useState } from "react";

import { NotificationBell, type NotificationItem } from "./notification-bell";

const minutesAgo = (m: number) => Date.now() - m * 60_000;

const initial: NotificationItem[] = [
  { id: "n1", actor: { name: "Mina Park" }, text: "Mina replied to your design review.", time: minutesAgo(4) },
  { id: "n2", actor: { name: "Leo Chen" }, text: "Leo assigned you to “Checkout redesign”.", time: minutesAgo(52) },
  { id: "n3", text: "Your weekly usage report is ready.", time: minutesAgo(60 * 26), read: true },
];

const incoming = [
  { name: "Ava Lin", text: "Ava mentioned you in #launch." },
  { name: "Noah Wu", text: "Noah approved your pull request." },
  { name: "Sara Kim", text: "Sara shared a file with you." },
  { name: "Kai Tan", text: "Kai left a comment on Pricing v2." },
];

export default function NotificationBellDemo() {
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const n = useRef(0);

  const simulate = () => {
    const sample = incoming[n.current % incoming.length];
    n.current += 1;
    setItems((prev) => [{ id: `new-${n.current}`, actor: { name: sample.name }, text: sample.text, time: Date.now() }, ...prev]);
  };

  return (
    <div className="flex h-[460px] w-full max-w-2xl flex-col rounded-2xl border border-border bg-muted/30">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Acme Workspace</span>
        <NotificationBell
          notifications={items}
          onMarkAllRead={() => setItems((prev) => prev.map((i) => ({ ...i, read: true })))}
          onItemClick={(item) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)))}
        />
      </div>
      <div className="flex flex-1 flex-col items-start gap-3 p-6">
        <p className="max-w-xs text-sm text-muted-foreground">
          Open the bell, click an item to mark it read, or press Escape to close and return focus.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={simulate}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Simulate new notification
          </button>
          <button
            type="button"
            onClick={() => setItems([])}
            className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}
