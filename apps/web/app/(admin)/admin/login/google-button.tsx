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

/**
 * Google 官方登入按鈕（Google Identity Services），寫法沿用 VideoAligner 的 AccountView。
 * 按鈕拿到 ID token 後交給 server action 驗證，白名單內的帳號才會登入。
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

    // Google 按鈕是固定寬度的 iframe（200 到 400px），寬度在渲染當下決定。
    // 用 ResizeObserver 跟著容器寬度重畫，第一次量到 0 或視窗縮放時才不會偏窄。
    const draw = () => {
      const google = window.google;
      const next = Math.round(Math.min(400, Math.max(200, wrap.clientWidth)));
      if (!google || !wrap.clientWidth || next === width) return;
      width = next;
      el.replaceChildren();
      google.accounts.id.renderButton(el, {
        type: "standard",
        // 一律用白色 outline 款：暗色的 filled_black 在 iframe 邊緣會露出一圈白框
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "signin_with",
        logo_alignment: "center",
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

  return (
    <div>
      <div ref={frame} className="relative flex h-10 justify-center">
        {/* Google 按鈕載入前先放一個同尺寸的佔位，版面不會跳 */}
        {!ready && <div aria-hidden="true" className="absolute inset-0 animate-pulse rounded-md border border-line bg-muted" />}
        <div ref={target} className={pending ? "pointer-events-none opacity-50" : undefined} />
      </div>
      {pending && (
        <p role="status" className="mt-2 text-sm text-subtle">
          驗證 Google 帳號中…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
