import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { IconGallery } from "@/components/icon-gallery";
import { siteUrl } from "@/lib/site";
import { Icon } from "@/registry/icons/sunui-icons";

export const metadata: Metadata = {
  title: "Icons",
  description:
    "SunUI stroke icons on a 24px grid: notched coupons, zigzag receipts, tilted stamps and the everyday controls, with one optional vermilion accent.",
};

const rules = [
  { icon: "grid", title: "24px grid, 2px margin", body: "Shapes live between 3 and 21. Circles reach 8.5, squares 7 from center." },
  { icon: "edit", title: "1.5 stroke, round caps", body: "Matches the 1px paper edge at 24px. Drop to 1.25 above 32px." },
  { icon: "stamp", title: "One vermilion spot", body: "Each icon marks at most one accent part. It stays ink until you set the variable." },
  { icon: "coupon", title: "Real paper details", body: "Notches, perforations, zigzag tears and a stamp tilted about 10°." },
] as const;

export default function IconsPage() {
  return (
    <>
      <section className="pt-14 pb-10 sm:pt-20">
        <p className="mb-4 text-sm font-medium text-accent">SunUI Icons</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Icons cut from the same paper.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-subtle">
          One stroke set for every SunUI series. Coupons with real notches, receipts that tear, stamps that land a little
          crooked, and the plain controls around them. Copy one SVG, or install the whole set as a single file.
        </p>
        <div className="mt-8 max-w-2xl">
          <Command value={`npx shadcn@latest add ${siteUrl()}/r/icons/sunui-icons.json`} />
        </div>
      </section>

      <ul className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rules.map((rule) => (
          <li key={rule.title} className="rounded-md border border-line bg-card p-4">
            <Icon name={rule.icon} size={20} className="text-accent" />
            <h2 className="mt-3 text-sm font-medium">{rule.title}</h2>
            <p className="mt-1 text-xs text-pretty text-subtle">{rule.body}</p>
          </li>
        ))}
      </ul>

      <IconGallery />

      <section aria-labelledby="usage-title" className="docs mt-20 max-w-3xl">
        <h2 id="usage-title">Usage</h2>
        <p>
          Icons inherit <code>currentColor</code> and are hidden from screen readers unless you pass a{" "}
          <code>title</code>.
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
<div className="[--sunui-icon-accent:#c8361d] dark:[--sunui-icon-accent:#ec6a4f]">
  <Icon name="punch-card" />
</div>`}
          />
        </div>
      </section>
    </>
  );
}
