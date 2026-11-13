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

function isDark() {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Google 官方登入按鈕（Google Identity Services），寫法沿用 VideoAligner 的 AccountView。
 * 按鈕拿到 ID token 後交給 server action 驗證，白名單內的帳號才會登入。
 */
export function GoogleButton({ clientId }: { clientId: string }) {
  const target = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const render = () => {
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
      google.accounts.id.renderButton(el, {
        type: "standard",
        theme: isDark() ? "filled_black" : "outline",
        size: "large",
        shape: "rectangular",
        text: "signin_with",
        logo_alignment: "center",
        width: String(Math.min(400, el.clientWidth || 360)),
        locale: "zh-TW",
      });
      setReady(true);
    };
    if (window.google) {
      render();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = render;
    script.onerror = () => setError("無法載入 Google 登入，請改用 email。");
    document.head.append(script);
    return () => script.remove();
  }, [clientId]);

  return (
    <div>
      <div className="relative h-10">
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
