"use client";

import { useState } from "react";

import { OtpInput, type OtpStatus } from "./otp-input";

const CORRECT = "246810";

export default function OtpInputDemo() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Check your inbox</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the 6 digit code. Try <span className="font-mono text-foreground">{CORRECT}</span> or paste it.
        </p>
      </div>
      <OtpInput
        value={code}
        groupSize={3}
        status={status}
        onChange={(v) => {
          setCode(v);
          setStatus("idle");
        }}
        onComplete={(v) => setStatus(v === CORRECT ? "success" : "error")}
      />
      <button
        type="button"
        onClick={() => {
          setCode("");
          setStatus("idle");
        }}
        className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Reset
      </button>
    </div>
  );
}
