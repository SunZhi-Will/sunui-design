"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const docsPages = [
  { href: "/docs", title: "Introduction" },
  { href: "/docs/installation", title: "Installation" },
  { href: "/docs/pro", title: "Using Pro blocks" },
  { href: "/docs/ai-agents", title: "AI agents and MCP" },
  { href: "/docs/changelog", title: "Changelog" },
];

export function DocsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs" className="text-sm">
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
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
