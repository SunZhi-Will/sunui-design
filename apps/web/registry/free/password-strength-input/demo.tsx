"use client";

import { useState, type FormEvent } from "react";

import { PasswordStrengthInput, defaultPasswordRules, type PasswordRule } from "./password-strength-input";

const strictRules: PasswordRule[] = [
  ...defaultPasswordRules.filter((r) => r.id !== "length"),
  { id: "length12", label: "At least 12 characters", test: (v) => v.length >= 12 },
  { id: "no-common", label: "Does not contain \"password\"", test: (v) => v.length > 0 && !/password/i.test(v) },
];

export default function PasswordStrengthInputDemo() {
  const [strict, setStrict] = useState(false);
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={strict}
          onChange={(e) => {
            setStrict(e.target.checked);
            setSubmitted(false);
          }}
          className="size-4 accent-current"
        />
        Strict rules (custom rules array)
      </label>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm"
      >
        <div>
          <h3 className="text-lg font-semibold">Create your account</h3>
          <p className="mt-1 text-sm text-muted-foreground">Pick a password you have not used elsewhere.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="pw-demo-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="pw-demo-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <PasswordStrengthInput
          key={strict ? "strict" : "default"}
          name="password"
          placeholder="Enter a password"
          rules={strict ? strictRules : undefined}
          onStrengthChange={(_, all) => setReady(all)}
        />
        <button
          type="submit"
          disabled={!ready}
          className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create account
        </button>
        <p role="status" className="min-h-5 text-center text-sm text-emerald-600 dark:text-emerald-400">
          {submitted ? "Looks good. Account created (demo)." : ""}
        </p>
      </form>
    </div>
  );
}
