import { DocsNav } from "@/components/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-8 py-10 md:grid-cols-[12rem_1fr] md:gap-12 md:py-14">
      <aside className="md:sticky md:top-20 md:self-start">
        <DocsNav />
      </aside>
      <article className="docs min-w-0 max-w-2xl">{children}</article>
    </div>
  );
}
