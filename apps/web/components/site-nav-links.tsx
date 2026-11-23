"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; match: (path: string) => boolean; className?: string };

/** 頁首主導覽：依目前路徑標示 aria-current，並給連結一致的 hover 與鍵盤焦點樣式。
 * 日文的導覽字最長（ドキュメント），400px 以下字級與內距再縮一階，四個連結才放得下。 */
export function SiteNavLinks({ labels }: { labels: { blocks: string; icons: string; docs: string; pricing: string } }) {
  const pathname = usePathname() ?? "/";
  const items: Item[] = [
    { href: "/blocks", label: labels.blocks, match: (p) => p.startsWith("/blocks") },
    // 360px 以上（幾乎所有現役手機）都顯示；更窄的舊機型放不下，才收起，靠頁尾連結進入
    { href: "/icons", label: labels.icons, match: (p) => p.startsWith("/icons"), className: "hidden min-[360px]:inline-flex" },
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
              className={`inline-flex h-8 items-center rounded-md px-1.5 text-[13px] whitespace-nowrap [:lang(ja)_&]:max-[399px]:px-[3px] [:lang(ja)_&]:max-[399px]:text-[12px] transition-colors min-[400px]:px-2 min-[400px]:text-sm focus-visible:outline-2 focus-visible:outline-accent sm:px-3 ${
                active ? "bg-stage font-medium text-fg" : "text-subtle hover:bg-surface-hover hover:text-fg"
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
