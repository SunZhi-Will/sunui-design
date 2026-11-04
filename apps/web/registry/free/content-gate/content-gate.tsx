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

export interface ContentGateLabels {
  /** 彈窗頂端的膠囊小標 */
  kicker?: ReactNode;
  body?: (state: ContentGateState) => ReactNode;
  /** 彈窗裡的補充說明框 */
  note?: ReactNode;
  signIn?: (state: ContentGateState) => ReactNode;
  signingIn?: ReactNode;
  contactPrompt?: (state: ContentGateState) => ReactNode;
  contact?: ReactNode;
  later?: ReactNode;
  close?: string;
  dialog?: string;
}

const defaultLabels: Required<ContentGateLabels> = {
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
  signingIn: "Signing in…",
  contactPrompt: (state) =>
    state === "no-access" ? "Account looks right?" : "Haven't bought it yet?",
  contact: "Contact the instructor",
  later: "Maybe later",
  close: "Close",
  dialog: "Course access",
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
  labels?: ContentGateLabels;
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

function Spinner() {
  return (
    <svg
      className="motion-safe:animate-spin"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="32"
        strokeDashoffset="12"
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

/* ───────── 頁內版：整頁的上鎖卡片 ───────── */

/*
 * 跟著深淺色切換的 token（原站 base.css 的灰階雙主題）。
 * 淺色是 Notion 式純白，深色是近黑。
 */
const gateVars =
  "[--cg-surface:#ffffff] [--cg-card:#ffffff] [--cg-border:rgba(15,23,42,0.06)] [--cg-text:rgba(15,23,42,0.95)] [--cg-muted:rgba(15,23,42,0.66)] [--cg-dim:rgba(15,23,42,0.55)] [--cg-p1:#1a1a1a] [--cg-bg:#ffffff] dark:[--cg-surface:#0e0e0e] dark:[--cg-card:rgba(255,255,255,0.05)] dark:[--cg-border:rgba(255,255,255,0.10)] dark:[--cg-text:rgba(255,255,255,0.93)] dark:[--cg-muted:rgba(255,255,255,0.50)] dark:[--cg-dim:rgba(255,255,255,0.45)] dark:[--cg-p1:#e5e5e5] dark:[--cg-bg:#000000]";

export interface ContentGateProps extends SharedProps {
  /** 卡片下方的區塊，例如學員見證 */
  children?: ReactNode;
  className?: string;
}

export function ContentGate({
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
  labels,
  children,
  className,
}: ContentGateProps) {
  const l = { ...defaultLabels, ...labels };
  const [signingIn, setSigningIn] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden px-4 py-10",
        gateVars,
        className,
      )}
      style={{ background: "var(--cg-surface)" }}
    >
      {/* 背景光暈 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentFrom}22 0%, transparent 65%)`,
            filter: "blur(80px)",
          }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8"
        style={{
          background: "var(--cg-card)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${accentFrom}33, ${accentTo}22)`,
              border: "1px solid var(--cg-border)",
            }}
          >
            <LockIcon size={24} style={{ color: "var(--cg-p1)" }} />
          </div>
        </div>

        <div className="mb-7 text-center">
          <div
            className="mb-2 text-[12px] font-bold tracking-[0.2em] uppercase"
            style={{ color: "var(--cg-p1)" }}
          >
            {subtitle}
          </div>
          <h2
            className="mb-2 text-xl font-black"
            style={{
              background: `linear-gradient(135deg, var(--cg-text) 0%, ${accentTo} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </h2>
          <p className="text-sm" style={{ color: "var(--cg-muted)" }}>
            {l.body(state)}
          </p>
        </div>

        {/* 按下後轉圈並停用，避免重複觸發登入 */}
        <ActionLink
          href={signingIn ? undefined : signInHref}
          onClick={() => {
            if (signingIn) return;
            setSigningIn(true);
            onSignIn?.();
          }}
          className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "var(--cg-text)",
            color: "var(--cg-bg)",
            pointerEvents: signingIn ? "none" : "auto",
            opacity: signingIn ? 0.7 : 1,
            cursor: signingIn ? "default" : "pointer",
          }}
        >
          {signingIn ? <Spinner /> : providerIcon}
          <span aria-live="polite">
            {signingIn ? l.signingIn : l.signIn(state)}
          </span>
        </ActionLink>

        <p
          className="mt-5 text-center text-xs"
          style={{ color: "var(--cg-dim)" }}
        >
          {l.contactPrompt(state)}
          <ActionLink
            href={contactHref}
            onClick={onContact}
            className="ml-1 underline underline-offset-2 transition-colors hover:opacity-60"
            style={{ color: "var(--cg-muted)" }}
          >
            {l.contact}
          </ActionLink>
        </p>
      </div>

      {children && <div className="relative z-10 mt-8 w-full">{children}</div>}
    </div>
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
  labels,
}: ContentGateModalProps) {
  const l = { ...defaultLabels, ...labels };
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

/* ───────── 試看上限的付費牆覆蓋層 ───────── */

export interface PreviewPaywallLabels {
  title?: ReactNode;
  body?: (previewCount: number) => ReactNode;
  cta?: ReactNode;
}

export interface PreviewPaywallProps {
  /** 免費試看的張數或集數 */
  previewCount: number;
  href?: string;
  onClick?: () => void;
  /** 按鈕漸層，預設原站的品牌金 */
  ctaFrom?: string;
  ctaTo?: string;
  labels?: PreviewPaywallLabels;
  className?: string;
}

/** 蓋在播放器上（父層要 relative），試看到最後一張時顯示 */
export function PreviewPaywall({
  previewCount,
  href,
  onClick,
  ctaFrom = "#F5C045",
  ctaTo = "#A67C1E",
  labels,
  className,
}: PreviewPaywallProps) {
  const l = {
    title: "Buy the course to keep watching",
    body: (n: number) =>
      `You've previewed ${n} slides. Buy the course to unlock everything.`,
    cta: "View course & buy",
    ...labels,
  };
  return (
    <div
      role="region"
      aria-label={typeof l.title === "string" ? l.title : undefined}
      className={cn(
        "absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 px-4",
        className,
      )}
      style={{
        background:
          "linear-gradient(to top, rgba(6,6,14,0.98) 60%, rgba(6,6,14,0.4) 100%)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div style={{ color: "#fff" }}>
        <LockIcon size={34} />
      </div>
      <div className="text-center">
        <p className="mb-1 text-lg font-bold" style={{ color: "#fff" }}>
          {l.title}
        </p>
        <p className="text-sm" style={{ color: "#a3a3a3" }}>
          {l.body(previewCount)}
        </p>
      </div>
      <ActionLink
        href={href}
        onClick={onClick}
        className="rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          background: `linear-gradient(135deg, ${ctaFrom}, ${ctaTo})`,
          color: "#fff",
        }}
      >
        {l.cta}
      </ActionLink>
    </div>
  );
}
