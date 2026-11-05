"use client";

import { useState } from "react";

import { OtpInput, type OtpStatus } from "./otp-input";

const SENT = "246810";

/** 型錄卡片：一組六格驗證碼，輸入 246810 成功，其他號碼會搖頭報錯。 */
export default function OtpInputCard() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");

  return (
    <div className="mx-auto flex w-fit flex-col items-start gap-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        Code: <span className="font-mono text-foreground">246 810</span>
      </p>
      <OtpInput
        value={code}
        groupSize={3}
        status={status}
        onChange={(v) => {
          setCode(v);
          setStatus("idle");
        }}
        onComplete={(v) => setStatus(v === SENT ? "success" : "error")}
      />
    </div>
  );
}
