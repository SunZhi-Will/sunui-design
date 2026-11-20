import type { Metadata } from "next";
import Link from "next/link";

import { getI18n } from "@/lib/i18n-server";
import { getItems } from "@/lib/registry";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.docsIntro.title, description: m.docsIntro.metaDescription };
}

export default async function DocsIntroPage() {
  const { m } = await getI18n();
  const t = m.docsIntro;
  const items = getItems();
  const pro = items.filter((item) => item.meta.tier === "pro").length;

  return (
    <>
      <h1>{t.title}</h1>
      <p>{t.p1(items.length, items.length - pro, pro)}</p>
      <p>{t.p2}</p>

      <h2>{t.principlesTitle}</h2>
      <ul>
        {t.principles.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h2>{t.nextTitle}</h2>
      {/* 全文件最重要的三個入口：卡片，不是一串底線連結 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/docs/installation", label: t.nextInstall },
          { href: "/docs/pro", label: t.nextPro },
          { href: "/docs/ai-agents", label: t.nextAgents },
        ].map((step, i) => (
          <Link
            key={step.href}
            href={step.href}
            className="group flex min-h-28 flex-col justify-between rounded-xl bg-card p-4 !no-underline shadow-e1 transition-shadow hover:shadow-e2 dark:bg-[#131313]"
          >
            <span className="font-mono text-xs text-subtle tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex items-end justify-between gap-3 text-[15px] leading-snug font-medium text-fg">
              {step.label}
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
