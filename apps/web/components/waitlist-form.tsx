"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "done" | "error";

export function WaitlistForm({ source, className }: { source: string; className?: string }) {
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
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Something went wrong.");
      setStatus("done");
      setMessage(data.message ?? "You are on the list.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <p role="status" className={cn("rounded-xl border border-line bg-card px-4 py-3 text-sm", className)}>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={cn("grid gap-2", className)}>
      <div className="flex gap-2">
        <label htmlFor={`email-${source}`} className="sr-only">
          Email
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-xl border border-line bg-card px-4 py-2.5 text-sm outline-none placeholder:text-subtle focus-visible:border-accent"
        />
        {/* 防機器人：真人看不到這個欄位 */}
        <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-xl bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? "Joining…" : "Join waitlist"}
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
