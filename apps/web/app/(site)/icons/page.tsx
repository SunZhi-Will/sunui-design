import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { IconGallery } from "@/components/icon-gallery";
import { RichText } from "@/components/rich-text";
import { getI18n } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/site";
import { Icon } from "@/registry/icons/sunui-icons";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.icons.metaTitle, description: m.icons.metaDescription };
}

// 規則卡片的圖示，順序對應字典裡的 icons.rules
const ruleIcons = ["grid", "edit", "stamp", "coupon", "activity"] as const;

export default async function IconsPage() {
  const { m } = await getI18n();
  const t = m.icons;
  const rules = t.rules.map((rule, i) => ({ ...rule, icon: ruleIcons[i] ?? "grid" }));
  return (
    <>
      <section className="pt-14 pb-10 sm:pt-20">
        <p className="mb-4 text-sm font-medium text-accent">{t.eyebrow}</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-subtle">
          {t.lead}
        </p>
        <div className="mt-8 grid max-w-2xl gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-subtle">{t.staticInstall}</p>
            <Command value={`npx shadcn@latest add ${siteUrl()}/r/icons/sunui-icons.json`} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-subtle">{t.animatedInstall}</p>
            <Command value={`npx shadcn@latest add ${siteUrl()}/r/icons/sunui-animated-icons.json`} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-subtle">{t.pixelInstall}</p>
            <Command value={`npx shadcn@latest add ${siteUrl()}/r/icons/sunui-pixel-icons.json`} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-subtle">{t.pixelAnimatedInstall}</p>
            <Command value={`npx shadcn@latest add ${siteUrl()}/r/icons/sunui-animated-pixel-icons.json`} />
          </div>
        </div>
      </section>

      <ul className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rules.map((rule) => (
          <li key={rule.title} className="rounded-md border border-line bg-card p-4">
            <Icon name={rule.icon} size={20} className="text-accent" />
            <h2 className="mt-3 text-sm font-medium">{rule.title}</h2>
            <p className="mt-1 text-xs text-pretty text-subtle">{rule.body}</p>
          </li>
        ))}
      </ul>

      <IconGallery messages={m.iconGallery} />

      <section aria-labelledby="usage-title" className="docs mt-20 max-w-3xl">
        <h2 id="usage-title">{t.usageTitle}</h2>
        <p>
          <RichText text={t.usageBody} />
        </p>
        <div className="block-gap">
          <CodeBlock
            lang="tsx"
            title="example.tsx"
            code={`import { Icon } from "@/components/ui/sunui-icons";

// Decorative, next to a text label
<button><Icon name="cart" size={16} /> Add to cart</button>

// Standalone, announced as "Claimed"
<Icon name="stamp-check" title="Claimed" />

// Turn on the vermilion accent for one subtree
<div className="[--sunui-icon-accent:#171717] dark:[--sunui-icon-accent:#ededed]">
  <Icon name="punch-card" />
</div>`}
          />
        </div>
        <h2>{t.animatedTitle}</h2>
        <p>
          <RichText text={t.animatedBody} />
        </p>
        <div className="block-gap">
          <CodeBlock
            lang="tsx"
            title="animated.tsx"
            code={`import { AnimatedIcon } from "@/components/ui/sunui-animated-icons";

// Plays the tear along the perforation when the button is hovered
<button><AnimatedIcon name="coupon" size={16} /> Claim coupon</button>

// Menu morphs into a close icon
<button aria-expanded={open} onClick={() => setOpen(!open)}>
  <AnimatedIcon name="menu" active={open} title={open ? "Close menu" : "Open menu"} />
</button>

// Fills like a stamp pressing down
<AnimatedIcon name="heart" active={saved} />

// Spins only while loading
<AnimatedIcon name="loader" active={pending} />`}
          />
        </div>
      </section>
    </>
  );
}
