"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SocialButton, type SocialGroupItem } from "./classic-social-button";

const svg = { className: "h-5 w-5", viewBox: "0 0 24 24", "aria-hidden": true } as const;

const links: SocialGroupItem[] = [
  {
    href: "https://github.com/",
    title: "GitHub",
    icon: (
      <svg {...svg} fill="currentColor">
        <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/",
    title: "LinkedIn",
    icon: (
      <svg {...svg} fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    href: "mailto:hello@example.com",
    title: "Email",
    icon: (
      <svg {...svg} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const copy = {
  en: { role: "Frontend engineer, SunUI Design", findMe: "Find me on", email: "Email" },
  "zh-TW": { role: "前端工程師，SunUI Design", findMe: "在這些地方找到我", email: "電子郵件" },
  "zh-CN": { role: "前端工程师，SunUI Design", findMe: "在这些地方找到我", email: "电子邮件" },
  ja: { role: "フロントエンドエンジニア、SunUI Design", findMe: "各種リンク", email: "メール" },
};

export default function SocialButtonDemo() {
  const t = useDemoText(copy);
  return (
    <section className="w-full max-w-sm min-w-0 rounded-xl border border-border bg-card p-6 text-foreground">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e7e0d6] text-base font-semibold text-[#57493a] dark:bg-[#3a332b] dark:text-[#d8cbbb]" aria-hidden>
          S
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">Sun</h3>
          <p className="truncate text-sm text-muted-foreground">{t.role}</p>
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap gap-4 pb-8" aria-label={t.findMe}>
        {links.map((l) => (
          <li key={l.title} className="relative h-10 w-10">
            <SocialButton {...l} title={l.title === "Email" ? t.email : l.title} titleDisplay="hover" titlePosition="bottom" />
          </li>
        ))}
      </ul>
    </section>
  );
}
