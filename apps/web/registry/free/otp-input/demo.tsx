"use client";

import { useState } from "react";

import { OtpInput, type OtpStatus } from "./otp-input";

const SENT = "246810";

export default function OtpInputDemo() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");

  return (
    <div className="grid w-full max-w-3xl items-start gap-5 md:grid-cols-[1fr_15rem]">
      <section aria-labelledby="otp-heading" className="rounded-md border border-border bg-card p-5 text-card-foreground sm:p-7">
        <h2 id="otp-heading" className="text-lg font-semibold tracking-tight">
          Confirm it&apos;s you
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We emailed a 6-digit code to <span className="text-foreground">s••••@mail.com</span>. Enter it to finish checking out.
        </p>
        <OtpInput
          className="mt-6"
          value={code}
          groupSize={3}
          status={status}
          onChange={(v) => {
            setCode(v);
            setStatus("idle");
          }}
          onComplete={(v) => setStatus(v === SENT ? "success" : "error")}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Didn&apos;t get it?{" "}
          <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
            Resend code
          </button>
        </p>
      </section>

      {/* 收件匣裡的那封信，買家照著輸入 */}
      <aside
        aria-label="Email preview"
        className="rounded-md border border-[#e7e0d0] bg-[#faf7f0] p-4 text-[#1c1917] dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]"
      >
        <p className="text-[11px] font-medium tracking-[0.14em] text-current/60 uppercase">Inbox</p>
        <p className="mt-2 text-sm font-medium">Your sign-in code</p>
        <p className="mt-1 text-xs text-current/60">Use this code to confirm your order. It expires in 10 minutes.</p>
        <p className="mt-3 border-t border-dashed border-[#e7e0d0] pt-3 font-mono text-xl font-semibold tracking-[0.12em] tabular-nums select-all dark:border-[#38332b]">
          246 810
        </p>
      </aside>
    </div>
  );
}
