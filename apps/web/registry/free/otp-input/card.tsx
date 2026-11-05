"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { OtpInput, type OtpStatus } from "./otp-input";

const SENT = "246810";

/** 型錄卡片：一組六格驗證碼，輸入 246810 成功，其他號碼會搖頭報錯。 */
export default function OtpInputCard() {
  const locale = useDemoLocale();
  const codeLabel = useDemoText({ en: "Code:", "zh-TW": "驗證碼：", "zh-CN": "验证码：", ja: "コード：" });
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");

  return (
    <div className="mx-auto flex w-fit flex-col items-start gap-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {codeLabel} <span className="font-mono text-foreground">246 810</span>
      </p>
      <OtpInput
        locale={locale}
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
