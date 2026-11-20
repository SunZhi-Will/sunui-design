import { DocsNav } from "@/components/docs-nav";
import { DocsToc } from "@/components/docs-toc";
import { getI18n } from "@/lib/i18n-server";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const { m } = await getI18n();
  return (
    <div className="grid gap-8 py-10 md:grid-cols-[12rem_1fr] md:gap-12 md:py-14 xl:grid-cols-[12rem_minmax(0,42rem)_1fr]">
      <aside className="min-w-0 md:sticky md:top-20 md:self-start">
        <DocsNav labels={m.docsNav} />
      </aside>
      <article className="docs min-w-0 max-w-2xl">{children}</article>
      <aside className="hidden min-w-0 xl:sticky xl:top-20 xl:block xl:self-start xl:justify-self-end xl:w-52">
        <DocsToc label={m.common.onThisPage} />
      </aside>
    </div>
  );
}
