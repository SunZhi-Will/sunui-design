"use client";

import { useRef } from "react";

import { ToastStack, useToasts, type ToastInput } from "./toast-stack";

const samples: ToastInput[] = [
  { title: "Changes saved", description: "Your profile was updated.", tone: "success" },
  { title: "Upload failed", description: "The file is larger than 10 MB.", tone: "error" },
  { title: "New comment", description: "Mina replied to your design review.", tone: "info" },
  { title: "Draft archived", tone: "default" },
];

export default function ToastStackDemo() {
  const { toasts, push, dismiss, clear } = useToasts();
  const n = useRef(0);

  const fire = () => {
    const sample = samples[n.current % samples.length];
    n.current += 1;
    push(sample);
  };

  return (
    <div className="relative h-[420px] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-muted/30">
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="max-w-xs text-sm text-muted-foreground">
          Hover or tab into the stack to fan it out and pause timers. Swipe a toast sideways or press Escape to dismiss.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fire}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Show toast
          </button>
          <button
            type="button"
            onClick={() =>
              push({
                title: "Message deleted",
                description: "This stays until you act.",
                duration: Infinity,
                action: { label: "Undo", onClick: () => push({ title: "Message restored", tone: "success" }) },
              })
            }
            className="rounded-full border border-border bg-card px-4 py-2 text-sm text-card-foreground hover:bg-muted"
          >
            With action
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss} fixed={false} />
    </div>
  );
}
