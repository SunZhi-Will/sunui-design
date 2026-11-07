import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { CopyButton } from "@/components/copy-button";
import { PreviewFrame } from "@/components/preview-frame";
import { RelatedBlocks as RelatedGrid } from "@/components/related-blocks";
import { RichText } from "@/components/rich-text";
import { TierBadge } from "@/components/tier-badge";
import { agentPrompt } from "@/lib/agent/prompt";
import { propsSignature } from "@/lib/agent/props";
import { getI18n } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import { fileLang, getItem, getItems, installCommand, proRegistryConfig, readRegistryFile } from "@/lib/registry";
import { localizeItem } from "@/lib/registry-i18n";
import { seriesOf } from "@/lib/series";
import { prices } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getItems().map((item) => ({ slug: item.name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = getItem((await params).slug);
  if (!found) return {};
  const { locale, m } = await getI18n();
  const item = localizeItem(found, locale);
  return {
    title: m.block.metaTitle(item.title),
    description: item.description,
    // 分享預覽用 block 自己的標題與描述；圖片來自同層的 opengraph-image
    openGraph: { siteName: "SunUI", type: "website", title: item.title, description: item.description },
    twitter: { card: "summary_large_image", title: item.title, description: item.description },
  };
}

export default async function BlockPage({ params }: Props) {
  const found = getItem((await params).slug);
  if (!found) notFound();
  const { locale, m } = await getI18n();
  const item = localizeItem(found, locale);

  const isPro = item.meta.tier === "pro";
  // Pro 原始碼只透過授權過的 registry 發放，頁面上不顯示
  const sources = isPro
    ? []
    : await Promise.all(
        // A file installed to several targets (a skill in .claude and .agents) is shown once.
        item.files
          .filter((file, i, all) => all.findIndex((f) => f.path === file.path) === i)
          .map(async (file) => ({ file, code: await readRegistryFile(file) })),
      );
  // 給 agent 的 prompt 用英文原文；props 只從免費 block 的主檔抽，Pro 沒有 sources
  const prompt = agentPrompt(found, sources[0] ? propsSignature(sources[0].code, found.name) : null);
  const deps = item.dependencies ?? [];
  const manualDeps = ["clsx", "tailwind-merge", ...deps];

  return (
    <article className="py-10">
      <nav aria-label={m.block.breadcrumb} className="mb-6 text-sm text-subtle">
        <Link href="/" className="hover:text-fg">
          {m.nav.blocks}
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
              className="rounded-sm border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-subtle transition-colors hover:text-fg"
            >
              {m.series.labels[seriesOf(item)]}
            </Link>
          )}
          <span className="rounded-sm border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
            {m.interactions[item.meta.interaction]}
          </span>
          <TierBadge tier={item.meta.tier} />
        </div>
      </header>

      <PreviewFrame name={item.name} locale={locale} labels={m.preview} />

      <UsageGuide item={item} t={m.block} />

      <AgentPrompt prompt={prompt} t={m.block} />

      {isPro ? (
        <ProInstall item={item} t={m.block} seePricing={m.common.seePricing} />
      ) : (
        <FreeInstall item={item} manualDeps={manualDeps} sources={sources} t={m.block} />
      )}

      <RelatedBlocks item={item} m={m} locale={locale} />
    </article>
  );
}

type Item = NonNullable<ReturnType<typeof getItem>>;

// 一鍵把安裝、使用時機、props 與設計規則打包給 coding agent
function AgentPrompt({ prompt, t }: { prompt: string; t: Messages["block"] }) {
  return (
    <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-card p-5">
      <div className="max-w-xl">
        <h2 className="text-sm font-semibold">{t.agentTitle}</h2>
        <p className="mt-1 text-sm text-pretty text-subtle">{t.agentBody}</p>
      </div>
      <CopyButton
        value={prompt}
        labels={{ copy: t.agentCopy, copied: t.agentCopied }}
        className="bg-accent px-4 py-2.5 text-sm text-accent-fg hover:text-accent-fg hover:opacity-90"
      />
    </section>
  );
}

// 參考資料庫式的「何時用、注意什麼、別名」，幫讀者判斷這個 block 是否適合
function UsageGuide({ item, t }: { item: Item; t: Messages["block"] }) {
  const usage = item.meta.usage;
  const whenToUse = usage?.whenToUse ?? [];
  const watchOut = usage?.watchOut ?? [];
  const aliases = usage?.aliases ?? [];
  if (whenToUse.length + watchOut.length + aliases.length === 0) return null;

  return (
    <section aria-label={t.usageGuide} className="mt-8 grid gap-4 md:grid-cols-3">
      {whenToUse.length > 0 && (
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <svg viewBox="0 0 24 24" className="size-4 text-fg" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4.5 4.5L19 7" />
            </svg>
            {t.whenToUse}
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
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <svg viewBox="0 0 24 24" className="size-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            {t.watchOut}
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
        <div className="rounded-lg border border-line bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">{t.alsoCalled}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {aliases.map((alias) => (
              <li key={alias}>
                <Link
                  href={`/?q=${encodeURIComponent(alias)}`}
                  className="inline-block rounded-sm border border-line px-2.5 py-1 text-xs text-subtle transition-colors hover:border-fg hover:text-fg"
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

function RelatedBlocks({ item, m, locale }: { item: Item; m: Messages; locale: Locale }) {
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
    .map(({ other }) => localizeItem(other, locale));

  const t = m.block;
  return (
    <RelatedGrid
      items={related.map((other) => ({ name: other.name, title: other.title, tier: other.meta.tier }))}
      locale={locale}
      heading={t.similar}
      labels={{ livePreview: m.catalog.livePreview, expand: m.catalog.expand, pro: m.tier.pro }}
    />
  );
}

function FreeInstall({
  item,
  manualDeps,
  sources,
  t,
}: {
  item: Item;
  manualDeps: string[];
  sources: { file: Item["files"][number]; code: string }[];
  t: Messages["block"];
}) {
  return (
    <section className="mt-12 grid gap-10">
      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">{t.cliTitle}</h2>
        <p className="mb-4 text-sm text-subtle">{t.cliBody}</p>
        <Command value={installCommand(item)} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">{t.manualTitle}</h2>
        <ol className="grid gap-6 text-sm">
          <li className="grid gap-3">
            <span className="text-subtle">{t.manualStep1}</span>
            <Command value={`npm install ${manualDeps.join(" ")}`} />
          </li>
          <li className="grid gap-3">
            <span className="text-subtle">
              <RichText text={t.manualStep2} codeClassName="font-mono text-fg" />
            </span>
            {sources.map(({ file, code }) => (
              <CodeBlock key={file.path} code={code} lang={fileLang(file.path)} title={file.target ?? file.path.split("/").pop()} />
            ))}
          </li>
        </ol>
      </div>
    </section>
  );
}

function ProInstall({ item, t, seePricing }: { item: Item; t: Messages["block"]; seePricing: string }) {
  return (
    <section className="mt-12 grid gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-fg/80 bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t.proTitle}</h2>
          <p className="mt-1 text-sm text-subtle">{t.proBody}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-fg">
            <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4.5 4.5L19 7" />
            </svg>
            {t.proTerms(prices.pro)}
          </p>
        </div>
        <Link
          href="/pricing"
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          {seePricing}
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">{t.proInstallTitle}</h2>
        <ol className="grid gap-6 text-sm">
          <li className="grid gap-3">
            <span className="text-subtle">
              <RichText text={t.proStep1} codeClassName="font-mono text-fg" />
            </span>
            <CodeBlock code={proRegistryConfig()} lang="json" title="components.json" />
          </li>
          <li className="grid gap-3">
            <span className="text-subtle">
              <RichText text={t.proStep2} codeClassName="font-mono text-fg" />
            </span>
            <Command value="SUNUI_LICENSE_KEY=your-license-key" />
          </li>
          <li className="grid gap-3">
            <span className="text-subtle">{t.proStep3}</span>
            <Command value={installCommand(item)} />
          </li>
        </ol>
      </div>
    </section>
  );
}
