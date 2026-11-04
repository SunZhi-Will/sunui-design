import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { PreviewFrame } from "@/components/preview-frame";
import { TierBadge } from "@/components/tier-badge";
import { interactionLabels } from "@/lib/interactions";
import { getItem, getItems, installCommand, readRegistryFile } from "@/lib/registry";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getItem((await params).slug);
  if (!item) return {};
  return {
    title: `${item.title}, React Component`,
    description: item.description,
  };
}

export default async function BlockPage({ params }: Props) {
  const item = getItem((await params).slug);
  if (!item) notFound();

  const sources = await Promise.all(
    item.files.map(async (file) => ({ file, code: await readRegistryFile(file) })),
  );
  const deps = item.dependencies ?? [];
  const manualDeps = ["clsx", "tailwind-merge", ...deps];

  return (
    <article className="py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-fg">
          Blocks
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{item.title}</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{item.title}</h1>
          <p className="mt-3 text-pretty text-muted">{item.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            {interactionLabels[item.meta.interaction]}
          </span>
          <TierBadge tier={item.meta.tier} />
        </div>
      </header>

      <PreviewFrame name={item.name} />

      <section className="mt-12 grid gap-10">
        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Install with the CLI</h2>
          <p className="mb-4 text-sm text-muted">
            Uses the shadcn CLI. The source is copied into your project, so you own every line.
          </p>
          <Command value={installCommand(item.name)} />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Or install manually</h2>
          <ol className="grid gap-6 text-sm">
            <li className="grid gap-3">
              <span className="text-muted">1. Install the dependencies.</span>
              <Command value={`npm install ${manualDeps.join(" ")}`} />
            </li>
            <li className="grid gap-3">
              <span className="text-muted">
                2. Add a <code className="font-mono text-fg">cn</code> helper at{" "}
                <code className="font-mono text-fg">lib/utils.ts</code> if you do not have one, then copy the
                component.
              </span>
              {sources.map(({ file, code }) => (
                <CodeBlock key={file.path} code={code} lang="tsx" title={file.path.split("/").pop()} />
              ))}
            </li>
          </ol>
        </div>
      </section>
    </article>
  );
}
