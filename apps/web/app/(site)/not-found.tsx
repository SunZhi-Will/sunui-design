import Link from "next/link";

import { getI18n } from "@/lib/i18n-server";

export default async function NotFound() {
  const { m } = await getI18n();
  return (
    <div className="py-32 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{m.notFound.title}</h1>
      <p className="mt-3 text-subtle">{m.notFound.body}</p>
      <Link href="/" className="mt-8 inline-flex rounded-xl bg-fg px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90">
        {m.notFound.cta}
      </Link>
    </div>
  );
}
