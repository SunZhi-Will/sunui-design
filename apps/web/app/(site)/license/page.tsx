import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "License",
  description: "What you can and cannot do with SunUI free and Pro blocks.",
};

export default function LicensePage() {
  return (
    <article className="mx-auto max-w-2xl py-16 sm:py-20">
      <h1 className="text-4xl font-semibold tracking-tight">License</h1>
      <p className="mt-3 text-sm text-subtle">Draft for review. Last updated November 4, 2026.</p>

      <section className="mt-10 grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Free blocks</h2>
        <p className="text-pretty text-subtle">
          Free blocks are released under the MIT license. Use, modify and distribute them however you like.
        </p>
      </section>

      <section className="mt-10 grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Pro blocks, in plain words</h2>
        <p className="text-pretty text-subtle">
          A Pro license is for one developer. A Team license covers up to five developers at the same company. The
          license never expires.
        </p>
        <h3 className="mt-4 font-medium">You can</h3>
        <ul className="grid list-disc gap-1.5 pl-5 text-subtle">
          <li>Use Pro blocks in unlimited projects, for yourself or for clients.</li>
          <li>Use them in SaaS products, websites, internal tools and apps you sell to end users.</li>
          <li>Modify the source as much as you need.</li>
          <li>Ship compiled Pro blocks inside an open source project, as long as the Pro source files are not published.</li>
        </ul>
        <h3 className="mt-4 font-medium">You cannot</h3>
        <ul className="grid list-disc gap-1.5 pl-5 text-subtle">
          <li>Redistribute, resell or publish the Pro source code, including in a public repository.</li>
          <li>Use Pro blocks to build a UI kit, template marketplace, theme or page builder that competes with SunUI.</li>
          <li>Use the source as training data or output for an AI component generator.</li>
          <li>Share your license key with people outside your license.</li>
        </ul>
      </section>

      <section className="mt-10 grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
        <p className="text-pretty text-subtle">
          Not sure if your use case is covered? Open an issue on GitHub before you buy and we will answer.
        </p>
      </section>
    </article>
  );
}
