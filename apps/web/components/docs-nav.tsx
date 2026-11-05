"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { Messages } from "@/lib/messages";

const docsPages = [
  { href: "/docs", key: "intro" },
  { href: "/docs/installation", key: "installation" },
  { href: "/docs/pro", key: "pro" },
  { href: "/docs/ai-agents", key: "aiAgents" },
  { href: "/docs/changelog", key: "changelog" },
] as const;

export function DocsNav({ labels }: { labels: Messages["docsNav"] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={labels.label} className="text-sm">
      <ul className="flex gap-1 overflow-x-auto md:grid md:gap-0.5">
        {docsPages.map((page) => (
          <li key={page.href} className="shrink-0">
            <Link
              href={page.href}
              aria-current={pathname === page.href ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-1.5 transition-colors",
                pathname === page.href ? "bg-stage font-medium text-fg" : "text-subtle hover:text-fg",
              )}
            >
              {labels[page.key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
