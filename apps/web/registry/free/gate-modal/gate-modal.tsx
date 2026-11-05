"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/** anon：還沒登入；no-access：已登入但這個帳號沒有存取權 */
export type ContentGateState = "anon" | "no-access";

export interface ContentGateModalLabels {
  /** 彈窗頂端的膠囊小標 */
  kicker?: ReactNode;
  body?: (state: ContentGateState) => ReactNode;
  /** 彈窗裡的補充說明框 */
  note?: ReactNode;
  signIn?: (state: ContentGateState) => ReactNode;
  contactPrompt?: (state: ContentGateState) => ReactNode;
  contact?: ReactNode;
  later?: ReactNode;
  close?: string;
  dialog?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<ContentGateModalLabels>> = {
  en: {
    kicker: "Access check",
    body: (state) =>
      state === "no-access"
        ? "You're signed in, but this account doesn't have access to this course yet. If you bought a ticket, check that you're using the Google account you bought it with."
        : "This is a paid course. Sign in with the Google account you bought your ticket with to unlock it.",
    note: "Once you sign in with the account you bought with, your course access syncs automatically. No code to enter.",
    signIn: (state) =>
      state === "no-access"
        ? "Sign in with another Google account"
        : "Sign in with Google to unlock",
    contactPrompt: (state) =>
      state === "no-access" ? "Account looks right?" : "Haven't bought it yet?",
    contact: "Contact the instructor",
    later: "Maybe later",
    close: "Close",
    dialog: "Course access",
  },
  "zh-TW": {
    kicker: "權限檢查",
    body: (state) =>
      state === "no-access"
        ? "你已經登入，但這個帳號目前還沒有這門課的權限。如果你已購票，請確認登入的是購票時使用的 Google 帳號。"
        : "這是付費課程。請用購票時的 Google 帳號登入來解鎖。",
    note: "用購票帳號登入後，課程權限會自動同步，不需要輸入任何序號。",
    signIn: (state) =>
      state === "no-access" ? "改用其他 Google 帳號登入" : "使用 Google 登入解鎖",
    contactPrompt: (state) =>
      state === "no-access" ? "帳號確定沒錯？" : "還沒購買嗎？",
    contact: "聯絡講師",
    later: "稍後再說",
    close: "關閉",
    dialog: "課程權限",
  },
  "zh-CN": {
    kicker: "权限检查",
    body: (state) =>
      state === "no-access"
        ? "你已经登录，但这个账号目前还没有这门课的权限。如果你已购票，请确认登录的是购票时使用的 Google 账号。"
        : "这是付费课程。请用购票时的 Google 账号登录来解锁。",
    note: "用购票账号登录后，课程权限会自动同步，无需输入任何兑换码。",
    signIn: (state) =>
      state === "no-access" ? "改用其他 Google 账号登录" : "使用 Google 登录解锁",
    contactPrompt: (state) =>
      state === "no-access" ? "确定账号没错？" : "还没购买？",
    contact: "联系讲师",
    later: "稍后再说",
    close: "关闭",
    dialog: "课程权限",
  },
  ja: {
    kicker: "アクセス確認",
    body: (state) =>
      state === "no-access"
        ? "ログイン済みですが、このアカウントにはまだこの講座へのアクセス権がありません。チケットを購入済みの場合は、購入時の Google アカウントでログインしているか確認してください。"
        : "こちらは有料講座です。チケットを購入した Google アカウントでログインするとロックが解除されます。",
    note: "購入時のアカウントでログインすると、受講権限は自動で同期されます。コードの入力は不要です。",
    signIn: (state) =>
      state === "no-access"
        ? "別の Google アカウントでログイン"
        : "Google でログインして解除",
    contactPrompt: (state) =>
      state === "no-access" ? "アカウントに間違いがない場合" : "まだ購入していませんか？",
    contact: "講師に問い合わせる",
    later: "あとで",
    close: "閉じる",
    dialog: "講座へのアクセス",
  },
};

interface SharedProps {
  /** 課程名稱，以白色到 accentTo 的漸層字印出 */
  title: ReactNode;
  /** 標題上方的大寫小字 */
  subtitle: ReactNode;
  state?: ContentGateState;
  /** 課程品牌色，預設是原站 Claude 工作坊的橘與杏色 */
  accentFrom?: string;
  accentTo?: string;
  /** 登入連結；有給就是 <a>，否則是按鈕並呼叫 onSignIn */
  signInHref?: string;
  onSignIn?: () => void;
  contactHref?: string;
  onContact?: () => void;
  /** 登入鈕左側的服務商圖示，預設 Google */
  providerIcon?: ReactNode;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: ContentGateModalLabels;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/* ───────── 圖示（形狀照 lucide） ───────── */

function Svg({
  size,
  children,
  style,
  className,
}: {
  size: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {children}
    </svg>
  );
}

const LockIcon = ({ size, style }: { size: number; style?: CSSProperties }) => (
  <Svg size={size} style={style}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function ActionLink({
  href,
  onClick,
  className,
  style,
  children,
}: {
  href?: string;
  onClick?: () => void;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (href) {
    return (
      <a href={href} onClick={onClick} className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {children}
    </button>
  );
}

/* ───────── 彈窗版：設計品光暈卡 ───────── */

// 彈窗原本只有暗色：卡面是固定的深色漸層，文字層次沿用原站暗色 token
const dark = {
  border: "rgba(255,255,255,0.10)",
  borderSubtle: "rgba(255,255,255,0.06)",
  cardRaised: "rgba(255,255,255,0.08)",
  cardSubtle: "rgba(255,255,255,0.03)",
  textSecondary: "rgba(255,255,255,0.58)",
  textMuted: "rgba(255,255,255,0.50)",
  textDim: "rgba(255,255,255,0.45)",
};

export interface ContentGateModalProps extends SharedProps {
  open: boolean;
  onClose: () => void;
  /** true：portal 到 body、蓋滿視窗並鎖背景捲動；false：蓋滿最近的 relative 父層 */
  fixed?: boolean;
  /** 點遮罩是否關閉，預設 true */
  closeOnBackdrop?: boolean;
}

export function ContentGateModal({
  open,
  onClose,
  fixed = true,
  closeOnBackdrop = true,
  title,
  subtitle,
  state = "anon",
  accentFrom = "#da7756",
  accentTo = "#f5c99b",
  signInHref,
  onSignIn,
  contactHref,
  onContact,
  providerIcon = <GoogleIcon />,
  locale = "en",
  labels,
}: ContentGateModalProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // 鎖背景捲動（只有蓋滿視窗時）
  useEffect(() => {
    if (!open || !fixed) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [open, fixed]);

  // 開啟時把焦點移進面板，關閉時還回原本的觸發元素
  useEffect(() => {
    if (!open || !mounted) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [open, mounted]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // 焦點鎖：Tab 走到最後一個繞回第一個，Shift+Tab 反之
      const nodes = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!mounted || !open) return null;

  const node = (
    <div
      className={cn(
        "inset-0 z-50 flex items-center justify-center p-4",
        fixed ? "fixed" : "absolute",
      )}
      data-lenis-prevent
      style={{
        background: "rgba(3,5,12,0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onMouseDown={(e) => {
        // 按下與放開都在遮罩上才關閉，從卡片內拖曳選字不會誤關
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          style={{
            position: "absolute",
            top: "22%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentFrom}2e 0%, transparent 68%)`,
            filter: "blur(66px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "8%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentTo}1f 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
      </div>

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={l.dialog}
        aria-describedby={titleId}
        tabIndex={-1}
        className={cn(
          "relative w-full overflow-y-auto rounded-3xl p-6 outline-none sm:p-7",
          fixed ? "max-h-[88vh]" : "max-h-full",
        )}
        style={{
          maxWidth: 512,
          background:
            "linear-gradient(165deg, rgba(10,12,24,0.96) 0%, rgba(8,10,20,0.98) 100%)",
          border: `1px solid ${dark.border}`,
          boxShadow: "0 28px 70px rgba(0,0,0,0.58)",
        }}
      >
        {/* 頂端細光條 */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-6 left-6 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentFrom}66 45%, ${accentTo}66 100%)`,
          }}
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/10"
          style={{
            background: dark.cardRaised,
            color: dark.textMuted,
            border: `1px solid ${dark.borderSubtle}`,
          }}
          aria-label={l.close}
        >
          <Svg size={16}>
            <path d="M18 6 6 18M6 6l12 12" />
          </Svg>
        </button>

        <div className="mb-5 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.16em] uppercase"
            style={{
              background: `${accentFrom}1c`,
              border: `1px solid ${accentFrom}40`,
              color: accentFrom,
            }}
          >
            <Svg size={12}>
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
            </Svg>
            {l.kicker}
          </span>
        </div>

        <div className="mb-4 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${accentFrom}30, ${accentTo}24)`,
              border: `1px solid ${accentFrom}4d`,
            }}
          >
            <LockIcon size={26} style={{ color: accentFrom }} />
          </div>
        </div>

        <div id={titleId} className="mb-6 text-center">
          <div
            className="mb-2 text-[12px] font-bold tracking-[0.2em] uppercase"
            style={{ color: accentFrom }}
          >
            {subtitle}
          </div>
          <h2
            className="mb-2 text-xl font-black sm:text-2xl"
            style={{
              background: `linear-gradient(135deg, #ffffff 0%, ${accentTo} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: dark.textMuted }}
          >
            {l.body(state)}
          </p>
        </div>

        <div
          className="mb-5 rounded-2xl px-4 py-3"
          style={{
            background: dark.cardSubtle,
            border: `1px solid ${dark.borderSubtle}`,
          }}
        >
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: dark.textSecondary }}
          >
            {l.note}
          </p>
        </div>

        <ActionLink
          href={signInHref}
          onClick={onSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.985]"
          style={{
            background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
            color: "#ffffff",
            boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
          }}
        >
          {providerIcon}
          <Svg size={15}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </Svg>
          {l.signIn(state)}
        </ActionLink>

        <div
          className="mt-4 flex items-center justify-center gap-3 text-xs"
          style={{ color: dark.textDim }}
        >
          <span>{l.contactPrompt(state)}</span>
          <ActionLink
            href={contactHref}
            onClick={onContact}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-colors hover:opacity-75"
            style={{
              background: dark.cardRaised,
              color: dark.textMuted,
              border: `1px solid ${dark.borderSubtle}`,
            }}
          >
            <Svg size={12}>
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </Svg>
            {l.contact}
          </ActionLink>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold transition-colors hover:opacity-80"
          style={{
            background: "transparent",
            color: dark.textDim,
            border: `1px solid ${dark.borderSubtle}`,
          }}
        >
          {l.later}
        </button>
      </div>
    </div>
  );

  return fixed ? createPortal(node, document.body) : node;
}
