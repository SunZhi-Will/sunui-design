"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  /** 通知內文 */
  text: ReactNode;
  /** 觸發者；沒有圖片時顯示姓名縮寫 */
  actor?: { name: string; avatarUrl?: string };
  /** 發生時間 */
  time: Date | number | string;
  read?: boolean;
}

export interface NotificationBellProps {
  notifications: NotificationItem[];
  /** 點擊「全部標為已讀」 */
  onMarkAllRead?: () => void;
  /** 點擊單則通知；通常在此標為已讀並導頁 */
  onItemClick?: (item: NotificationItem) => void;
  /** 徽章上限，超過顯示 99+ */
  max?: number;
  /** 面板對齊按鈕的哪一側 */
  align?: "start" | "end";
  /** 相對時間的語系 */
  locale?: string;
  /** 自訂空狀態內容 */
  emptyState?: ReactNode;
  labels?: {
    button?: string;
    panel?: string;
    markAll?: string;
    empty?: string;
    unread?: string;
  };
  className?: string;
}

const defaultLabels = {
  button: "Notifications",
  panel: "Notifications",
  markAll: "Mark all as read",
  empty: "You're all caught up",
  unread: "Unread",
};

/** 依姓名產生固定色相，同一人永遠同色 */
function hueOf(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function relativeTime(time: Date, now: number, locale: string) {
  const diff = Math.round((time.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, sec] of UNITS) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return rtf.format(0, "second");
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificationBell({
  notifications,
  onMarkAllRead,
  onItemClick,
  max = 99,
  align = "end",
  locale = "en",
  emptyState,
  labels,
  className,
}: NotificationBellProps) {
  const reduce = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const panelId = useId();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [shake, setShake] = useState(0);
  const [announce, setAnnounce] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;
  const badge = unread > max ? `${max}+` : String(unread);

  // 未讀數增加時搖鈴並朗讀
  const prevUnread = useRef(unread);
  useEffect(() => {
    if (unread > prevUnread.current) {
      setShake((s) => s + 1);
      setAnnounce(`${unread} unread notifications`);
    }
    prevUnread.current = unread;
  }, [unread]);

  // 開啟時更新「現在」時間，並每分鐘刷新相對時間
  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    panelRef.current?.focus();
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, [open]);

  // 點擊外部關閉（不搶焦點，使用者點到哪就停在哪）
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close(true);
    }
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 28 };

  return (
    <div
      ref={rootRef}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        // Tab 離開整個元件時收合
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null) && e.relatedTarget) setOpen(false);
      }}
      className={cn("relative inline-block", className)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unread ? `${text.button}, ${unread} ${text.unread.toLowerCase()}` : text.button}
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <motion.span
          key={shake}
          className="inline-flex origin-top"
          animate={shake > 0 && !reduce ? { rotate: [0, -18, 15, -11, 7, -3, 0] } : { rotate: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <BellIcon />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key={badge}
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background tabular-nums"
              initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
              transition={spring}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <span className="sr-only" aria-live="polite">
        {announce}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
            className={cn(
              "absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl outline-none",
              align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id={titleId} className="text-sm font-semibold">
                {text.panel}
              </h2>
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={unread === 0}
                className="rounded-md px-2 py-1 text-xs font-medium text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:text-muted-foreground"
              >
                {text.markAll}
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                {emptyState ?? (
                  <>
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <BellIcon />
                    </span>
                    {text.empty}
                  </>
                )}
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {notifications.map((n) => {
                  const time = new Date(n.time);
                  const body = (
                    <>
                      <Avatar actor={n.actor} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm", n.read ? "text-muted-foreground" : "text-foreground")}>{n.text}</span>
                        <time dateTime={time.toISOString()} className="mt-0.5 block text-xs text-muted-foreground">
                          {relativeTime(time, now, locale)}
                        </time>
                      </span>
                      {!n.read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                          <span className="sr-only">{text.unread}</span>
                        </span>
                      )}
                    </>
                  );
                  const rowClass = "flex w-full items-start gap-3 px-4 py-3 text-left";
                  return (
                    <li key={n.id}>
                      {onItemClick ? (
                        <button
                          type="button"
                          onClick={() => onItemClick(n)}
                          className={cn(rowClass, "outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
                        >
                          {body}
                        </button>
                      ) : (
                        <div className={rowClass}>{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ actor }: { actor?: NotificationItem["actor"] }) {
  const [failed, setFailed] = useState(false);
  if (!actor) {
    return (
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <BellIcon />
      </span>
    );
  }
  if (actor.avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={actor.avatarUrl} alt="" onError={() => setFailed(true)} className="size-9 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ background: `hsl(${hueOf(actor.name)} 55% 45%)` }}
    >
      {initialsOf(actor.name)}
    </span>
  );
}
