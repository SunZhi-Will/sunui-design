import Link from "next/link";

import { NotFoundSuggestions } from "@/components/not-found-suggestions";
import { getI18n } from "@/lib/i18n-server";
import { getItems } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";

export default async function NotFound() {
  const { locale, m } = await getI18n();
  // 404 頁讀不到網址參數，所以把精簡清單交給 client 端依網址比對推薦
  const items = getItems().map((raw) => {
    const item = localizeItem(raw, locale);
    return { name: item.name, title: item.title, tier: item.meta.tier, aliases: item.meta.usage?.aliases ?? [] };
  });

  return (
    <div className="flex flex-col items-center py-24 text-center sm:py-32">
      <div className="stage-dots relative flex h-28 w-48 items-center justify-center rounded-lg border border-dashed border-line bg-card">
        <span className="font-mono text-4xl font-semibold tracking-tight text-subtle">404</span>
        <span className="absolute -top-2.5 right-4 rotate-6 rounded-sm bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-fg shadow-sm">
          off
        </span>
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">{m.notFound.title}</h1>
      <p className="mt-3 text-subtle">{m.notFound.body}</p>
      <NotFoundSuggestions items={items} labels={{ tried: m.notFound.tried, suggest: m.notFound.suggest, tier: m.tier }} />
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex rounded-md bg-fg px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90">
          {m.notFound.cta}
        </Link>
        <Link
          href="/docs"
          className="inline-flex rounded-md border border-line px-5 py-2.5 text-sm font-medium text-fg hover:bg-stage"
        >
          {m.notFound.docs}
        </Link>
      </div>
    </div>
  );
}
