"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  AnimatedCheckbox,
  ConfettiBurst,
  CopyFeedback,
  FloatingLabelInput,
  HoldToConfirm,
  LikeBurst,
  microInteractions,
  NotificationBadge,
  PasswordToggle,
  SendPlaneButton,
  SlideToConfirm,
  SuccessCheck,
  SwipeToDelete,
  ToggleSwitch,
  type MicroInteractionId,
} from "./micro-interactions";
import { copy } from "./demo";

export const variants = microInteractions;

// Only this one is shown on the home page as the representative, chosen because it moves by itself, so the card needs no hover to show the effect
export const featured = "slide-to-confirm";

// Operation hints below the card (the demo has no such copy, all four languages are here); the button text of swipe and long press is itself the hint, so it is not labeled separately
const hintCopy = {
  en: { click: "Click", type: "Click and type", swipe: "Swipe a row left" },
  "zh-TW": { click: "點一下", type: "點進去輸入", swipe: "把一列往左滑" },
  "zh-CN": { click: "点一下", type: "点进去输入", swipe: "把一行向左滑" },
  ja: { click: "クリック", type: "クリックして入力", swipe: "行を左にスワイプ" },
};

type Hint = keyof (typeof hintCopy)["en"];

const hints: Record<MicroInteractionId, Hint | null> = {
  "like-burst": "click",
  confetti: "click",
  "success-check": null,
  "checkbox-draw": "click",
  "toggle-switch": "click",
  "copy-feedback": "click",
  "notification-badge": "click",
  "floating-label": "type",
  "slide-to-confirm": null,
  "hold-to-confirm": null,
  "swipe-to-delete": "swipe",
  "send-plane": "click",
  "password-reveal": "click",
};

/** Home catalog: one card per micro-interaction, with the same content as that cell in the demo. */
export default function MicroInteractionsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const h = useDemoText(hintCopy);
  const id = variant as MicroInteractionId;
  const hint = hints[id];
  return (
    <div className="flex flex-col items-center gap-5">
      <Interaction id={id} t={t} />
      {hint && <span className="text-xs text-muted-foreground">{h[hint]}</span>}
    </div>
  );
}

type Copy = (typeof copy)["en"];

function Interaction({ id, t }: { id: MicroInteractionId; t: Copy }): ReactNode {
  switch (id) {
    case "like-burst":
      return <LikeBurst label={t.like} />;
    case "confetti":
      return <ConfettiBurst>{t.celebrate}</ConfettiBurst>;
    case "success-check":
      return <SuccessCheckReplay message={t.paid} replay={t.replay} />;
    case "checkbox-draw":
      return <AnimatedCheckbox label={t.task} />;
    case "toggle-switch":
      return <ToggleSwitch label={t.switchLabel} defaultChecked />;
    case "copy-feedback":
      return (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs">
          <span className="truncate">SUN-2026-OFF</span>
          <CopyFeedback text="SUN-2026-OFF" label={t.copy} copiedLabel={t.copied} />
        </div>
      );
    case "notification-badge":
      return <Notifications t={t} />;
    case "floating-label":
      return <FloatingLabelInput label={t.email} type="email" autoComplete="email" className="w-60" />;
    case "slide-to-confirm":
      // The track is full width and would shrink to 0 inside the centered stage, so give it a fixed width
      return (
        <div className="w-64">
          <SlideToConfirm label={t.slide} confirmedLabel={t.confirmed} resetAfter={2200} />
        </div>
      );
    case "hold-to-confirm":
      return <HoldToConfirm label={t.hold} doneLabel={t.deleted} />;
    case "swipe-to-delete":
      return <SwipeRows t={t} />;
    case "send-plane":
      return <SendPlaneButton label={t.send} sentLabel={t.sent} />;
    case "password-reveal":
      return <PasswordToggle label={t.password} showLabel={t.show} hideLabel={t.hide} defaultValue="sunui-demo" className="w-60" />;
  }
}

/** The checkmark plays only once on mount, so add a replay button */
function SuccessCheckReplay({ message, replay }: { message: string; replay: string }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-center gap-3">
      <SuccessCheck key={run} message={message} />
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {replay}
      </button>
    </div>
  );
}

function Notifications({ t }: { t: Copy }) {
  const [count, setCount] = useState(2);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label={t.addOne}
        onClick={() => setCount((c) => c + 1)}
        className="grid size-11 place-items-center rounded-md border border-border bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <NotificationBadge count={count} label={t.notifications}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" />
          </svg>
        </NotificationBadge>
      </button>
      <button type="button" onClick={() => setCount(0)} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
        {t.clear}
      </button>
    </div>
  );
}

function SwipeRows({ t }: { t: Copy }) {
  const [rows, setRows] = useState<number[]>([0, 1, 2]);
  return (
    <div className="w-72">
      <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {rows.map((i) => (
          <SwipeToDelete key={i} deleteLabel={t.delete} onDelete={() => setRows((xs) => xs.filter((x) => x !== i))}>
            {t.rows[i]}
          </SwipeToDelete>
        ))}
      </div>
      {rows.length < 3 && (
        <button type="button" onClick={() => setRows([0, 1, 2])} className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline">
          {t.restore}
        </button>
      )}
    </div>
  );
}
