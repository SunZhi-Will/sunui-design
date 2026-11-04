import type { Metadata } from "next";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Installation", description: "Install SunUI blocks with the shadcn CLI." };

export default function InstallationPage() {
  return (
    <>
      <h1>Installation</h1>
      <p>SunUI works in any React project with Tailwind CSS v4 and the shadcn CLI, including Next.js, Vite and Remix.</p>

      <h2>1. Set up shadcn</h2>
      <p>
        If your project does not have a <code>components.json</code> yet, initialize shadcn. It adds the theme tokens
        and the <code>cn</code> helper that SunUI blocks use.
      </p>
      <div className="block-gap">
        <Command value="npx shadcn@latest init" />
      </div>

      <h2>2. Add a block</h2>
      <p>Every block page shows its install command. For example:</p>
      <div className="block-gap">
        <Command value={`npx shadcn@latest add ${siteUrl()}/r/countdown-banner.json`} />
      </div>
      <p>
        The CLI copies the source into <code>components/</code> and installs <code>framer-motion</code> if needed.
      </p>

      <h2>3. Optional: use the @sunui namespace</h2>
      <p>Register the free registry once, then install blocks by name.</p>
      <div className="block-gap">
        <CodeBlock
          lang="json"
          title="components.json"
          code={JSON.stringify({ registries: { "@sunui": `${siteUrl()}/r/{name}.json` } }, null, 2)}
        />
      </div>
      <div className="block-gap">
        <Command value="npx shadcn@latest add @sunui/countdown-banner" />
      </div>

      <h2>Manual install</h2>
      <p>
        Prefer copy and paste? Install <code>framer-motion clsx tailwind-merge</code>, add a <code>cn</code> helper at{" "}
        <code>lib/utils.ts</code>, then copy the source shown on any free block page.
      </p>
    </>
  );
}
