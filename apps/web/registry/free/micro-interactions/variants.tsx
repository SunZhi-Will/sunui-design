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

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "slide-to-confirm";

// 卡片下方的操作提示（demo 沒有這組文案，四語都在這裡）；滑動與長按的按鈕文字本身就是提示，不另外標
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

/** 首頁型錄：一種微互動一張卡，內容跟 demo 的那一格相同。 */
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
      // 滑軌是滿版寬，置中的舞台裡會縮成 0，給它一個固定寬度
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

/** 打勾只在掛載時播一次，放一顆重播鈕 */
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
