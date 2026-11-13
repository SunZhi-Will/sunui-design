"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { loginWithGoogle } from "./actions";

type GoogleId = {
  initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: string }) => void;
  renderButton: (target: HTMLElement, options: Record<string, string>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** Google 官方四色 G 標誌 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-[18px] shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * Google 登入（Google Identity Services）。
 * 看得到的是自己畫的按鈕，跟著主題和其他輸入框同樣的圓角、高度；
 * Google 官方按鈕（iframe）透明疊在上面，實際點到的是它，所以仍然走官方的 ID token 流程。
 * 拿到 ID token 後交給 server action 驗證，白名單內的帳號才會登入。
 */
export function GoogleButton({ clientId }: { clientId: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const wrap = frame.current;
    const el = target.current;
    if (!wrap || !el) return;
    let width = 0;
    let observer: ResizeObserver | undefined;

    // 官方按鈕的寬度在渲染當下決定（200 到 400px），容器寬度變了就重畫，透明熱區才會蓋滿整顆按鈕。
    const draw = () => {
      const google = window.google;
      const next = Math.round(Math.min(400, Math.max(200, wrap.clientWidth)));
      if (!google || !wrap.clientWidth || next === width) return;
      width = next;
      el.replaceChildren();
      google.accounts.id.renderButton(el, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "signin_with",
        width: String(next),
        locale: "zh-TW",
      });
      setReady(true);
    };

    const start = () => {
      const google = window.google;
      if (!google) return;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          setError(undefined);
          startTransition(async () => {
            const result = await loginWithGoogle(credential);
            if (result?.error) setError(result.error);
          });
        },
      });
      draw();
      observer = new ResizeObserver(draw);
      observer.observe(wrap);
    };

    let script: HTMLScriptElement | undefined;
    if (window.google) start();
    else {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = start;
      script.onerror = () => setError("無法載入 Google 登入，請改用 email。");
      document.head.append(script);
    }
    return () => {
      observer?.disconnect();
      script?.remove();
    };
  }, [clientId]);

  const busy = !ready || pending;

  return (
    <div>
      <div
        ref={frame}
        className="group relative h-11 w-full overflow-hidden rounded-lg bg-fg text-bg transition-opacity hover:opacity-90"
      >
        {/* 看得到的按鈕 */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 text-sm font-medium transition-opacity ${busy ? "opacity-50" : ""}`}
        >
          {pending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />
          ) : (
            <GoogleMark />
          )}
          {pending ? "驗證 Google 帳號中…" : "使用 Google 帳號登入"}
        </div>
        {/* 官方按鈕：透明、置中蓋在上面，負責真正的點擊 */}
        <div
          ref={target}
          className={`absolute inset-0 flex items-center justify-center opacity-[0.01] [&_iframe]:!m-0 ${pending ? "pointer-events-none" : ""}`}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
