import type { Metadata } from "next";
import Link from "next/link";

import { getItems } from "@/lib/registry";

export const metadata: Metadata = { title: "Introduction", description: "What SunUI is and how it works." };

export default function DocsIntroPage() {
  const items = getItems();
  const pro = items.filter((item) => item.meta.tier === "pro").length;

  return (
    <>
      <h1>Introduction</h1>
      <p>
        SunUI is a collection of animated React blocks for commerce and campaign pages: countdowns, coupons, carts,
        checkout, pricing and loyalty. There are {items.length} blocks today, {items.length - pro} free under MIT and{" "}
        {pro} in Pro.
      </p>
      <p>
        SunUI is not a package you import. Each block is copied into your project with the shadcn CLI, so you can read,
        change and own every line.
      </p>

      <h2>Principles</h2>
      <ul>
        <li>Production ready: real states for loading, success, errors, empty and ended.</li>
        <li>Accessible: reduced motion, keyboard support and screen reader announcements in every block.</li>
        <li>Themeable: blocks use shadcn tokens, so they follow your colors and dark mode.</li>
        <li>Honest urgency: countdowns use real end dates, prize mechanics take results from your server.</li>
        <li>One dependency: blocks only need framer-motion and a cn helper.</li>
      </ul>

      <h2>Next steps</h2>
      <ul>
        <li>
          <Link href="/docs/installation">Install your first block</Link>
        </li>
        <li>
          <Link href="/docs/pro">Set up Pro</Link>
        </li>
        <li>
          <Link href="/docs/ai-agents">Use SunUI from an AI agent</Link>
        </li>
      </ul>
    </>
  );
}
