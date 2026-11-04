import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { PreviewFrame } from "@/components/preview-frame";
import { TierBadge } from "@/components/tier-badge";
import { interactionLabels } from "@/lib/interactions";
import { getItem, getItems, installCommand, proRegistryConfig, readRegistryFile } from "@/lib/registry";
import { seriesLabels, seriesOf } from "@/lib/series";

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
          {seriesOf(item) !== "paper" && (
            <Link
              href={`/?series=${seriesOf(item)}#blocks`}
              className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-subtle transition-colors hover:text-fg"
            >
              {seriesLabels[seriesOf(item)]}
            </Link>
          )}
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
            {interactionLabels[item.meta.interaction]}
          </span>
          <TierBadge tier={item.meta.tier} />
        </div>
      </header>

      <PreviewFrame name={item.name} />

      <UsageGuide item={item} />

      {isPro ? <ProInstall item={item} /> : <FreeInstall item={item} manualDeps={manualDeps} sources={sources} />}

      <RelatedBlocks item={item} />
    </article>
  );
}

type Item = NonNullable<ReturnType<typeof getItem>>;

// 參考資料庫式的「何時用、注意什麼、別名」，幫讀者判斷這個 block 是否適合
function UsageGuide({ item }: { item: Item }) {
  const usage = item.meta.usage;
  const whenToUse = usage?.whenToUse ?? [];
  const watchOut = usage?.watchOut ?? [];
  const aliases = usage?.aliases ?? [];
  if (whenToUse.length + watchOut.length + aliases.length === 0) return null;

  return (
    <section aria-label="Usage guide" className="mt-8 grid gap-4 md:grid-cols-3">
      {whenToUse.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <svg viewBox="0 0 24 24" className="size-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4.5 4.5L19 7" />
            </svg>
            When to use it
          </h2>
          <ul className="grid gap-2 text-sm text-subtle">
            {whenToUse.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-subtle" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
      {watchOut.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <svg viewBox="0 0 24 24" className="size-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            Watch out
          </h2>
          <ul className="grid gap-2 text-sm text-subtle">
            {watchOut.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-subtle" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
      {aliases.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Also called</h2>
          <ul className="flex flex-wrap gap-1.5">
            {aliases.map((alias) => (
              <li key={alias}>
                <Link
                  href={`/?q=${encodeURIComponent(alias)}`}
                  className="inline-block rounded-full border border-line px-2.5 py-1 text-xs text-subtle transition-colors hover:border-accent/60 hover:text-fg"
                >
                  {alias}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RelatedBlocks({ item }: { item: Item }) {
  const related = getItems()
    .filter((other) => other.name !== item.name)
    .map((other) => ({
      other,
      // 同系列優先，避免紙感頁面推薦遊戲介面
      score:
        (seriesOf(other) === seriesOf(item) ? 4 : 0) +
        (other.meta.interaction === item.meta.interaction ? 2 : 0) +
        (other.categories ?? []).filter((c) => item.categories?.includes(c)).length +
        (other.meta.usage?.aliases ?? []).filter((a) => item.meta.usage?.aliases?.includes(a)).length * 2,
    }))
    .sort((a, b) => b.score - a.score || a.other.title.localeCompare(b.other.title))
    .slice(0, 6)
    .map(({ other }) => other);

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="mt-16">
      <h2 id="related-title" className="mb-4 text-lg font-semibold tracking-tight">
        Similar blocks
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((other) => (
          <li key={other.name}>
            <Link
              href={`/blocks/${other.name}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-line bg-card p-4 transition-colors hover:border-accent/60"
            >
              <span className="min-w-0">
                <span className="block font-medium">{other.title}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-subtle">{other.description}</span>
              </span>
              <TierBadge tier={other.meta.tier} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
