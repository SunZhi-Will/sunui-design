"use client";

import { useState } from "react";

import type { Messages } from "@/lib/messages";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "done" | "error";

export function WaitlistForm({
  source,
  className,
  messages: t,
}: {
  source: string;
  className?: string;
  messages: Messages["waitlist"];
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), company: form.get("company"), source }),
      });
      // 伺服器回傳英文訊息，這裡依狀態碼改用目前語言的文字
      if (!response.ok) {
        setStatus("error");
        setMessage(
          response.status === 400
            ? t.invalidEmail
            : response.status === 429
              ? t.tooMany
              : response.status >= 500
                ? t.unavailable
                : t.generic,
        );
        return;
      }
      setStatus("done");
      setMessage(t.success);
    } catch {
      setStatus("error");
      setMessage(t.generic);
    }
  }

  if (status === "done") {
    return (
      <p role="status" className={cn("rounded-md border border-line bg-card px-4 py-3 text-sm", className)}>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={cn("grid gap-2", className)}>
      <div className="flex gap-2">
        <label htmlFor={`email-${source}`} className="sr-only">
          {t.email}
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.placeholder}
          className="min-w-0 flex-1 rounded-md border border-line bg-card px-4 py-2.5 text-sm outline-none placeholder:text-subtle focus-visible:border-fg"
        />
        {/* 防機器人：真人看不到這個欄位 */}
        <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-md bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? t.joining : t.join}
        </button>
      </div>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </form>
  );
}
