import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { PreviewFrame } from "@/components/preview-frame";
import { TierBadge } from "@/components/tier-badge";
import { interactionLabels } from "@/lib/interactions";
import { getItem, getItems, installCommand, proRegistryConfig, readRegistryFile } from "@/lib/registry";

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

  const isPro = item.meta.tier === "pro";
  // Pro 原始碼只透過授權過的 registry 發放，頁面上不顯示
  const sources = isPro
    ? []
    : await Promise.all(item.files.map(async (file) => ({ file, code: await readRegistryFile(file) })));
  const deps = item.dependencies ?? [];
  const manualDeps = ["clsx", "tailwind-merge", ...deps];

  return (
    <article className="py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-subtle">
        <Link href="/" className="hover:text-fg">
          Blocks
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{item.title}</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{item.title}</h1>
          <p className="mt-3 text-pretty text-subtle">{item.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
            {interactionLabels[item.meta.interaction]}
          </span>
          <TierBadge tier={item.meta.tier} />
        </div>
      </header>

      <PreviewFrame name={item.name} />

      {isPro ? <ProInstall item={item} /> : <FreeInstall item={item} manualDeps={manualDeps} sources={sources} />}
    </article>
  );
}

type Item = NonNullable<ReturnType<typeof getItem>>;

function FreeInstall({
  item,
  manualDeps,
  sources,
}: {
  item: Item;
  manualDeps: string[];
  sources: { file: Item["files"][number]; code: string }[];
}) {
  return (
    <section className="mt-12 grid gap-10">
      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Install with the CLI</h2>
        <p className="mb-4 text-sm text-subtle">
          Uses the shadcn CLI. The source is copied into your project, so you own every line.
        </p>
        <Command value={installCommand(item)} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Or install manually</h2>
        <ol className="grid gap-6 text-sm">
          <li className="grid gap-3">
            <span className="text-subtle">1. Install the dependencies.</span>
            <Command value={`npm install ${manualDeps.join(" ")}`} />
          </li>
          <li className="grid gap-3">
            <span className="text-subtle">
              2. Add a <code className="font-mono text-fg">cn</code> helper at{" "}
              <code className="font-mono text-fg">lib/utils.ts</code> if you do not have one, then copy the component.
            </span>
            {sources.map(({ file, code }) => (
              <CodeBlock key={file.path} code={code} lang="tsx" title={file.path.split("/").pop()} />
            ))}
          </li>
        </ol>
      </div>
    </section>
  );
}

function ProInstall({ item }: { item: Item }) {
  return (
    <section className="mt-12 grid gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent-soft/40 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">This is a Pro block</h2>
          <p className="mt-1 text-sm text-subtle">
            One license unlocks every Pro block, now and in the future.
          </p>
        </div>
        <Link
          href="/pricing"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          See pricing
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Install with your license</h2>
        <ol className="grid gap-6 text-sm">
          <li className="grid gap-3">
            <span className="text-subtle">
              1. Add the SunUI Pro registry to <code className="font-mono text-fg">components.json</code>.
            </span>
            <CodeBlock code={proRegistryConfig()} lang="json" title="components.json" />
          </li>
          <li className="grid gap-3">
            <span className="text-subtle">
              2. Put your license key in <code className="font-mono text-fg">.env.local</code>.
            </span>
            <Command value="SUNUI_LICENSE_KEY=your-license-key" />
          </li>
          <li className="grid gap-3">
            <span className="text-subtle">3. Install the block.</span>
            <Command value={installCommand(item)} />
          </li>
        </ol>
      </div>
    </section>
  );
}
