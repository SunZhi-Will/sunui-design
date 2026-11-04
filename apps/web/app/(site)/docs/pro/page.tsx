import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/code-block";
import { Command } from "@/components/command";
import { proRegistryConfig } from "@/lib/registry";

export const metadata: Metadata = { title: "Using Pro blocks", description: "Install SunUI Pro blocks with your license key." };

export default function ProDocsPage() {
  return (
    <>
      <h1>Using Pro blocks</h1>
      <p>
        Pro blocks are delivered through a private shadcn registry. Your license key authenticates each install, so
        the source still lands in your repo like any other block.
      </p>

      <h2>1. Get a license</h2>
      <p>
        Buy Pro or Team on the <Link href="/pricing">pricing page</Link>. Your license key arrives by email right after
        checkout.
      </p>

      <h2>2. Add the registry</h2>
      <div className="block-gap">
        <CodeBlock code={proRegistryConfig()} lang="json" title="components.json" />
      </div>

      <h2>3. Add your key</h2>
      <p>
        Put the key in <code>.env.local</code>. Keep it out of git; it is personal to your license.
      </p>
      <div className="block-gap">
        <Command value="SUNUI_LICENSE_KEY=your-license-key" />
      </div>

      <h2>4. Install</h2>
      <div className="block-gap">
        <Command value="npx shadcn@latest add @sunui-pro/flash-sale-hero" />
      </div>

      <h2>Troubleshooting</h2>
      <ul>
        <li>401: the key is missing. Check that SUNUI_LICENSE_KEY is set in the shell or .env.local.</li>
        <li>403: the key was revoked or is being shared too widely. Contact support.</li>
        <li>429: too many installs in a short time. Wait a few minutes and retry.</li>
      </ul>
      <p>
        On CI, add <code>SUNUI_LICENSE_KEY</code> as a secret. Every installed file has a header with your license ID,
        so please do not commit Pro source to public repositories.
      </p>
    </>
  );
}
