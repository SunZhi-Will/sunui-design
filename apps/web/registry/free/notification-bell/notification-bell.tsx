"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  pop: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

export interface NotificationItem {
  id: string;
  /** 通知內文 */
  text: ReactNode;
  /** 觸發者；沒有圖片時顯示姓名縮寫，沒有觸發者時顯示鈴鐺 */
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
  /** 徽章上限，超過顯示「max+」 */
  max?: number;
  /** 面板對齊按鈕的哪一側 */
  align?: "start" | "end";
  /** 相對時間的語系，例如 "zh-TW" */
  locale?: string;
  /** 一開始就展開面板 */
  defaultOpen?: boolean;
  /** 自訂空狀態內容 */
  emptyState?: ReactNode;
  labels?: { button?: string; markAll?: string; empty?: string; unread?: string; count?: (n: number) => string };
  className?: string;
}

const defaultLabels = {
  button: "Notifications",
  markAll: "Mark all as read",
  empty: "You're all caught up",
  unread: "Unread",
  count: (n: number) => `${n} unread`,
};

/** 品牌專色：預設跟主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色 */
const spot = "bg-[color:var(--sunui-spot,var(--primary))]";
const spotFg = "text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60],
];

function relativeTime(time: Date, now: number, locale: string) {
  const diff = Math.round((time.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, sec] of UNITS) if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  return rtf.format(0, "second");
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function BellIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2 2 0 0 0 4 0" />
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
  defaultOpen = false,
  emptyState,
  labels,
  className,
}: NotificationBellProps) {
  const reduce = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const countLabel = text.count;
  const panelId = useId();
  const titleId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [now, setNow] = useState(() => Date.now());
  const [bump, setBump] = useState(0);
  const [announce, setAnnounce] = useState("");
  const swing = useAnimationControls();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;
  const badge = unread > max ? `${max}+` : String(unread);

  // 未讀數增加：鈴鐺被敲一下（帶初速的阻尼彈簧，擺一次就停），數字落定一次，並朗讀
  const prevUnread = useRef(unread);
  useEffect(() => {
    if (unread > prevUnread.current) {
      setBump((b) => b + 1);
      setAnnounce(countLabel(unread));
      if (!reduce) swing.start({ rotate: 0, transition: { ...springs.pop, velocity: 420 } });
    }
    prevUnread.current = unread;
    // countLabel 每次渲染都可能是新函式；只在未讀數增加時才有作用，重跑無妨
  }, [unread, reduce, swing, countLabel]);

  // 開啟時更新「現在」，之後每分鐘刷新相對時間；使用者主動開啟才搶焦點
  const userOpened = useRef(false);
  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    if (userOpened.current) panelRef.current?.focus();
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, [open]);

  // 窄螢幕時面板可能超出視窗：用鈴鐺的位置和面板寬度算出要往內推多少，左右各留 16px
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    if (!open) return;
    const fit = () => {
      const root = rootRef.current?.getBoundingClientRect();
      const width = panelRef.current?.offsetWidth ?? 0;
      if (!root || !width) return;
      const edge = 16;
      const over = align === "end" ? edge - (root.right - width) : root.left + width - (window.innerWidth - edge);
      setShift(over > 0 ? over : 0);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open, align]);

  // 點擊外部關閉，不搶焦點；Escape 關閉並把焦點還給鈴鐺
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      if (rootRef.current?.contains(document.activeElement)) buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const instant = { duration: 0 };
  const press = "transition-[background-color,color,scale] duration-150 hover:duration-0 motion-safe:active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      ref={rootRef}
      onBlur={(e) => {
        // Tab 離開整個元件時收合
        if (open && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      className={cn("relative inline-block", className)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unread ? `${text.button}, ${text.count(unread)}` : text.button}
        onClick={() => {
          userOpened.current = true;
          setOpen((o) => !o);
        }}
        className={cn("grid size-10 place-items-center rounded-md text-foreground hover:bg-muted aria-expanded:bg-muted", press)}
      >
        <span className="relative inline-flex">
          {/* 轉軸在鈴鐺頂端的掛點 */}
          <motion.span animate={swing} className="inline-flex origin-[50%_10%]">
            <BellIcon />
          </motion.span>
          <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 translate-x-1/3 -translate-y-1/3">
            <AnimatePresence initial={false}>
              {unread > 0 && (
                <motion.span
                  key="badge"
                  className="block"
                  initial={{ scale: reduce ? 1 : 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: reduce ? 1 : 0, opacity: 0 }}
                  transition={reduce ? instant : springs.pop}
                >
                  {/* 數量增加時落定一次：放大再回彈；減少時不動 */}
                  <motion.span
                    key={bump}
                    initial={reduce || bump === 0 ? false : { scale: 1.35 }}
                    animate={{ scale: 1 }}
                    transition={springs.pop}
                    className={cn(
                      "flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[0.68rem] font-semibold leading-none tabular-nums ring-2 ring-background",
                      spot,
                      spotFg,
                    )}
                  >
                    {badge}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </span>
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
            style={shift ? (align === "end" ? { right: -shift } : { left: -shift }) : undefined}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.96, transition: reduce ? instant : { duration: 0.12, ease: "easeIn" } }}
            transition={reduce ? instant : { duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              // e3：邊線在陰影第一層，不另加 border；深色模式表面提亮一階加頂邊高光
              "absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-card text-card-foreground outline-none",
              "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_16px_32px_-8px_rgb(0_0_0/0.10),0_32px_64px_-16px_rgb(0_0_0/0.10)]",
              "dark:bg-[color-mix(in_oklab,var(--card),white_4%)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_1px_rgb(255_255_255/0.10)]",
              align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-foreground/10 py-2 pl-4 pr-2">
              <h2 id={titleId} className="flex items-baseline gap-2 text-sm font-semibold">
                {text.button}
                {unread > 0 && <span className="text-xs font-medium tabular-nums text-muted-foreground">{unread}</span>}
              </h2>
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={unread === 0}
                className={cn("rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50", press)}
              >
                {text.markAll}
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                {emptyState ?? (
                  <>
                    <span className="grid size-10 place-items-center rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]">
                      <BellIcon />
                    </span>
                    {text.empty}
                  </>
                )}
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto p-1.5">
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    // 新通知從上方展開高度，下面的列跟著滑下去，不跳
                    <motion.li
                      key={n.id}
                      layout={reduce ? false : "position"}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduce ? instant : springs.gentle}
                      className="overflow-hidden"
                    >
                      <Row item={n} now={now} locale={locale} unreadLabel={text.unread} reduce={!!reduce} onClick={onItemClick} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ item, now, locale, unreadLabel, reduce, onClick }: {
  item: NotificationItem;
  now: number;
  locale: string;
  unreadLabel: string;
  reduce: boolean;
  onClick?: (item: NotificationItem) => void;
}) {
  const time = new Date(item.time);
  // 已讀時同一列原地變化：文字轉淡、圓點縮掉，頭像與時間是錨點不動
  const body = (
    <>
      <Avatar actor={item.actor} />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm leading-snug transition-colors duration-200", item.read ? "text-muted-foreground" : "text-foreground")}>
          {item.text}
        </span>
        <time dateTime={time.toISOString()} className="mt-1 block text-xs tabular-nums text-muted-foreground">
          {relativeTime(time, now, locale)}
        </time>
      </span>
      <span className="mt-1.5 grid size-2 shrink-0 place-items-center">
        <AnimatePresence initial={false}>
          {!item.read && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : springs.snappy}
              className={cn("size-2 rounded-full", spot)}
            >
              <span className="sr-only">{unreadLabel}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </>
  );
  // 面板 16px、內距 6px，列的圓角 10px
  const rowClass = "flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2.5 text-left";
  if (!onClick) return <div className={rowClass}>{body}</div>;
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        rowClass,
        "outline-none transition-[background-color,scale] duration-150 hover:bg-muted hover:duration-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-safe:active:scale-[0.99]",
      )}
    >
      {body}
    </button>
  );
}

function Avatar({ actor }: { actor?: NotificationItem["actor"] }) {
  const [failed, setFailed] = useState(false);
  const base = "grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground shadow-[0_0_0_1px_rgb(0_0_0/0.04)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]";
  if (!actor) {
    return (
      <span aria-hidden="true" className={base}>
        <BellIcon className="size-4" />
      </span>
    );
  }
  if (actor.avatarUrl && !failed) {
    return <img src={actor.avatarUrl} alt="" onError={() => setFailed(true)} className={cn(base, "object-cover")} />;
  }
  return (
    <span aria-hidden="true" className={cn(base, "text-xs font-semibold text-foreground")}>
      {initialsOf(actor.name)}
    </span>
  );
}
