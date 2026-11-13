"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** 等付款通知：每 3 秒重新整理伺服器資料，1 分鐘後改顯示「還在等」的說明，但繼續等。 */
export function WaitForPayment({ slow }: { slow: string }) {
  const router = useRouter();
  const [late, setLate] = useState(false);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      router.refresh();
      if (Date.now() - started > 60_000) setLate(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [router]);
  return (
    <div className="mt-6">
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-fg/60" />
      </div>
      {late && <p className="mt-3 text-sm text-subtle">{slow}</p>}
    </div>
  );
}

export function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded border border-line bg-card px-2 py-1 text-xs hover:bg-muted"
    >
      {copied ? done : label}
    </button>
  );
}
