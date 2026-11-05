"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** anon：還沒登入；no-access：已登入但這個帳號沒有存取權 */
export type ContentGateState = "anon" | "no-access";

export interface ContentGateLabels {
  body?: (state: ContentGateState) => ReactNode;
  signIn?: (state: ContentGateState) => ReactNode;
  signingIn?: ReactNode;
  contactPrompt?: (state: ContentGateState) => ReactNode;
  contact?: ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<ContentGateLabels>> = {
  en: {
    body: (state) =>
      state === "no-access"
        ? "You're signed in, but this account doesn't have access to this course yet. If you bought a ticket, check that you're using the Google account you bought it with."
        : "This is a paid course. Sign in with the Google account you bought your ticket with to unlock it.",
    signIn: (state) =>
      state === "no-access"
        ? "Sign in with another Google account"
        : "Sign in with Google to unlock",
    signingIn: "Signing in…",
    contactPrompt: (state) =>
      state === "no-access" ? "Account looks right?" : "Haven't bought it yet?",
    contact: "Contact the instructor",
  },
  "zh-TW": {
    body: (state) =>
      state === "no-access"
        ? "你已經登入，但這個帳號還沒有這門課的存取權。如果你已購票，請確認使用的是購票時的 Google 帳號。"
        : "這是付費課程。請用購票時的 Google 帳號登入來解鎖。",
    signIn: (state) =>
      state === "no-access" ? "改用其他 Google 帳號登入" : "使用 Google 登入解鎖",
    signingIn: "登入中…",
    contactPrompt: (state) =>
      state === "no-access" ? "帳號沒錯？" : "還沒購買？",
    contact: "聯絡講師",
  },
  "zh-CN": {
    body: (state) =>
      state === "no-access"
        ? "你已登录，但这个账号还没有这门课的访问权限。如果你已购票，请确认使用的是购票时的 Google 账号。"
        : "这是付费课程。请用购票时的 Google 账号登录以解锁。",
    signIn: (state) =>
      state === "no-access" ? "使用其他 Google 账号登录" : "使用 Google 登录解锁",
    signingIn: "登录中…",
    contactPrompt: (state) =>
      state === "no-access" ? "账号没问题？" : "还没购买？",
    contact: "联系讲师",
  },
  ja: {
    body: (state) =>
      state === "no-access"
        ? "ログイン済みですが、このアカウントにはまだこの講座へのアクセス権がありません。チケットを購入済みの場合は、購入時の Google アカウントを使っているか確認してください。"
        : "これは有料の講座です。チケットを購入した Google アカウントでログインするとロックが解除されます。",
    signIn: (state) =>
      state === "no-access"
        ? "別の Google アカウントでログイン"
        : "Google でログインして解除",
    signingIn: "ログイン中…",
    contactPrompt: (state) =>
      state === "no-access" ? "アカウントは合っていますか？" : "まだ購入していませんか？",
    contact: "講師に問い合わせる",
  },
};

interface SharedProps {
  /** 課程名稱 */
  title: ReactNode;
  /** 標題上方的大寫小字 */
  subtitle: ReactNode;
  state?: ContentGateState;
  /** 保留給相容舊版的品牌色，頁內版走中性 token，不再使用（不做光暈與漸層） */
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
  labels?: ContentGateLabels;
}

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
  signInHref,
  onSignIn,
  contactHref,
  onContact,
  providerIcon = <GoogleIcon />,
  locale = "en",
  labels,
  children,
  className,
}: ContentGateProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
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
      <div
        className="relative z-10 w-full max-w-md rounded-xl p-8"
        style={{
          background: "var(--cg-card)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg"
            style={{ border: "1px solid var(--cg-border)" }}
          >
            <LockIcon size={20} style={{ color: "var(--cg-muted)" }} />
          </div>
        </div>

        <div className="mb-7 text-center">
          <div
            className="mb-2 text-[11px] font-medium tracking-[0.14em] uppercase"
            style={{ color: "var(--cg-muted)" }}
          >
            {subtitle}
          </div>
          <h2 className="mb-2 text-xl font-semibold" style={{ color: "var(--cg-text)" }}>
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
          className="flex w-full items-center justify-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all hover:opacity-90 active:translate-y-px"
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
