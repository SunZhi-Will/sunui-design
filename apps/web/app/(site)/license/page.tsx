import type { Metadata } from "next";

import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.license.metaTitle, description: m.license.metaDescription };
}

export default async function LicensePage() {
  const { m } = await getI18n();
  const t = m.license;
  return (
    <article className="mx-auto max-w-2xl py-16 sm:py-20">
      <h1 className="text-4xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-3 text-sm text-subtle">{t.updated}</p>

      <section className="mt-10 grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{t.freeTitle}</h2>
        <p className="text-pretty text-subtle">{t.freeBody}</p>
      </section>

      <section className="mt-10 grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{t.proTitle}</h2>
        <p className="text-pretty text-subtle">{t.proBody}</p>
        <h3 className="mt-4 font-medium">{t.canTitle}</h3>
        <ul className="grid list-disc gap-1.5 pl-5 text-subtle">
          {t.can.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h3 className="mt-4 font-medium">{t.cannotTitle}</h3>
        <ul className="grid list-disc gap-1.5 pl-5 text-subtle">
          {t.cannot.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{t.questionsTitle}</h2>
        <p className="text-pretty text-subtle">{t.questionsBody}</p>
      </section>
    </article>
  );
}
