"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { OtpInput, type OtpStatus } from "./otp-input";

const SENT = "246810";

const copy = {
  en: {
    heading: "Confirm it's you",
    sentBefore: "We emailed a 6-digit code to ",
    sentAfter: ". Enter it to finish checking out.",
    noCode: "Didn't get it?",
    resend: "Resend code",
    preview: "Email preview",
    inbox: "Inbox",
    subject: "Your sign-in code",
    body: "Use this code to confirm your order. It expires in 10 minutes.",
  },
  "zh-TW": {
    heading: "確認是你本人",
    sentBefore: "我們已寄送 6 位數驗證碼到 ",
    sentAfter: "，輸入後即可完成結帳。",
    noCode: "沒收到？",
    resend: "重新寄送",
    preview: "信件預覽",
    inbox: "收件匣",
    subject: "你的登入驗證碼",
    body: "請用這組驗證碼確認訂單，10 分鐘內有效。",
  },
  "zh-CN": {
    heading: "确认是你本人",
    sentBefore: "我们已将 6 位验证码发送至 ",
    sentAfter: "，输入后即可完成结账。",
    noCode: "没收到？",
    resend: "重新发送",
    preview: "邮件预览",
    inbox: "收件箱",
    subject: "你的登录验证码",
    body: "请使用此验证码确认订单，10 分钟内有效。",
  },
  ja: {
    heading: "ご本人確認",
    sentBefore: "6 桁のコードを ",
    sentAfter: " にお送りしました。入力して購入手続きを完了してください。",
    noCode: "届きませんか？",
    resend: "コードを再送",
    preview: "メールのプレビュー",
    inbox: "受信トレイ",
    subject: "サインインコード",
    body: "このコードでご注文を確認してください。有効期限は 10 分です。",
  },
};

export default function OtpInputDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");

  return (
    <div className="grid w-full max-w-3xl grid-cols-[minmax(0,1fr)] items-start gap-5 md:grid-cols-[1fr_15rem]">
      <section aria-labelledby="otp-heading" className="rounded-md border border-border bg-card p-5 text-card-foreground sm:p-7">
        <h2 id="otp-heading" className="text-lg font-semibold tracking-tight">
          {t.heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.sentBefore}
          <span className="text-foreground">s••••@mail.com</span>
          {t.sentAfter}
        </p>
        <OtpInput
          className="mt-6"
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
        <p className={status === "success" ? "invisible mt-2 text-sm" : "mt-2 text-sm text-muted-foreground"}>
          {t.noCode}{" "}
          <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
            {t.resend}
          </button>
        </p>
      </section>

      {/* 收件匣裡的那封信，買家照著輸入 */}
      <aside
        aria-label={t.preview}
        className="rounded-md border border-[#e2e2e2] bg-[#f7f7f7] p-4 text-[#171717] dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]"
      >
        <p className="text-[11px] font-medium tracking-[0.14em] text-current/60 uppercase">{t.inbox}</p>
        <p className="mt-2 text-sm font-medium">{t.subject}</p>
        <p className="mt-1 text-xs text-current/60">{t.body}</p>
        <p className="mt-3 border-t border-dashed border-[#e2e2e2] pt-3 font-mono text-xl font-semibold tracking-[0.12em] tabular-nums select-all dark:border-[#333333]">
          246 810
        </p>
      </aside>
    </div>
  );
}
