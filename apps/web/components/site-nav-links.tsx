"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; match: (path: string) => boolean; className?: string };

/** 頁首主導覽：依目前路徑標示 aria-current，並給連結一致的 hover 與鍵盤焦點樣式。 */
export function SiteNavLinks({ labels }: { labels: { blocks: string; icons: string; docs: string; pricing: string } }) {
  const pathname = usePathname() ?? "/";
  const items: Item[] = [
    { href: "/", label: labels.blocks, match: (p) => p === "/" || p.startsWith("/blocks") },
    { href: "/icons", label: labels.icons, match: (p) => p.startsWith("/icons"), className: "hidden min-[400px]:inline-flex" },
    { href: "/docs", label: labels.docs, match: (p) => p.startsWith("/docs") },
    { href: "/pricing", label: labels.pricing, match: (p) => p.startsWith("/pricing") },
  ];

  return (
    <ul className="flex items-center gap-0.5 sm:gap-1">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <li key={item.href} className={item.className ?? "inline-flex"}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-8 items-center rounded-md px-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent sm:px-3 ${
                active ? "bg-accent-soft font-medium text-fg" : "text-subtle hover:bg-accent-soft/60 hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
