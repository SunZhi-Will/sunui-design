"use client";

import { AnimatePresence, motion } from "framer-motion";

import { LiveBento, type LiveBentoTile } from "./live-bento";

const ease = [0.23, 1, 0.32, 1] as const;

function VersionStack({ tick }: { tick: number }) {
  const v = 12 + (tick % 4);
  return (
    <div className="relative h-24 w-56">
      {[2, 1].map((d) => (
        <div
          key={d}
          className="absolute inset-x-0 h-14 rounded-lg border border-border bg-background"
          style={{ top: d * 8, transform: `scale(${1 - d * 0.05})`, opacity: 1 - d * 0.3 }}
        />
      ))}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={v}
          className="absolute inset-x-0 top-6 flex h-14 items-center justify-between rounded-lg border border-border bg-card px-3 text-sm"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.36, ease }}
        >
          <span className="font-mono text-xs">v{v}</span>
          <span className="text-xs text-muted-foreground">Edited by {["Mia", "Ben", "Ravi", "Lena"][tick % 4]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function LockToggle({ tick }: { tick: number }) {
  const locked = tick % 2 === 0;
  return (
    <div className="flex flex-col items-center gap-2 text-sm">
      <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <motion.path d="M8 11V8a4 4 0 0 1 8 0" animate={{ y: locked ? 0 : -3 }} transition={{ duration: 0.24, ease }} />
      </svg>
      <span className="flex items-center gap-1.5">
        <span className={locked ? "size-1.5 rounded-full bg-amber-500" : "size-1.5 rounded-full bg-emerald-500"} />
        {locked ? "Locked by Mia" : "Open for edits"}
      </span>
    </div>
  );
}

const messages = ["Can you cover Friday close?", "Sure, swap my Sunday?", "Done. Schedule updated."];

function ChatBubble({ tick }: { tick: number }) {
  const shown = tick % (messages.length + 1);
  return (
    <div className="flex w-full max-w-56 flex-col gap-2 text-sm">
      {messages.slice(0, Math.max(1, shown)).map((m, i) => (
        <motion.p
          key={m}
          className={i % 2 ? "self-end rounded-lg bg-primary px-3 py-1.5 text-primary-foreground" : "self-start rounded-lg bg-muted px-3 py-1.5"}
          initial={tick === 0 ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease }}
        >
          {m}
        </motion.p>
      ))}
      {shown < messages.length && shown > 0 && (
        <span className="self-start rounded-lg bg-muted px-3 py-1.5 tracking-[0.3em] text-muted-foreground">...</span>
      )}
    </div>
  );
}

function Counter({ tick }: { tick: number }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{new Intl.NumberFormat("en-US").format(1280 + tick * 7)}</p>
      <p className="mt-1 text-xs text-muted-foreground">shifts filled this month</p>
    </div>
  );
}

function Availability({ tick }: { tick: number }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 28 }, (_, i) => {
        const on = (i * 7 + tick * 3) % 5 > 1;
        return <span key={i} className={on ? "size-2.5 rounded-full bg-emerald-500 transition-colors" : "size-2.5 rounded-full bg-muted transition-colors"} />;
      })}
    </div>
  );
}

const tiles: LiveBentoTile[] = [
  { id: "versions", span: "2x1", title: "Every change is a version", body: "Roll back any schedule to how it looked last Tuesday.", visual: (t) => <VersionStack tick={t} /> },
  { id: "lock", title: "Lock while you edit", body: "Nobody overwrites your draft.", visual: (t) => <LockToggle tick={t} /> },
  { id: "chat", span: "1x2", title: "Swaps happen in chat", body: "Staff trade shifts in LINE. You just approve.", visual: (t) => <ChatBubble tick={t} /> },
  { id: "count", title: "Gaps get filled", body: "Open shifts go to people who said they are free.", visual: (t) => <Counter tick={t} /> },
  { id: "availability", span: "2x1", title: "See who is free at a glance", body: "Availability for the next four weeks, updated as people reply.", visual: (t) => <Availability tick={t} /> },
];

export default function LiveBentoDemo() {
  return (
    <section className="w-full max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Scheduling that runs itself</h2>
        <p className="mt-1 text-sm text-muted-foreground">Built for shops with 5 to 50 staff.</p>
      </div>
      <LiveBento tiles={tiles} />
    </section>
  );
}
