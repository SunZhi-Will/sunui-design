import { Catalog } from "@/components/catalog";
import { Command } from "@/components/command";
import { getItems, installCommand } from "@/lib/registry";

export default function HomePage() {
  const items = getItems().map(({ name, title, description, meta }) => ({ name, title, description, meta }));

  return (
    <>
      <section className="py-16 sm:py-24">
        <p className="mb-4 text-sm font-medium text-accent">React · Tailwind · Motion</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Interactive blocks you can ship.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-subtle">
          Micro-interactions and production-ready sections for product, SaaS and campaign pages. Install the
          source with one command, then make it yours.
        </p>
        <div className="mt-8 max-w-2xl">
          <Command value={installCommand(items.find((item) => item.meta.tier === "free") ?? items[0])} />
        </div>
      </section>

      <Catalog items={items} />
    </>
  );
}
