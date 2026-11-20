"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Heading = { id: string; text: string };

/**
 * 文件頁右側的「本頁內容」：讀文章裡的 h2 排成目錄，捲動時標出目前在哪一段。
 * 標題沒有 id 的話在這裡補上（依出現順序）。少於兩個標題就不顯示。只在 xl 以上出現，寬螢幕右半邊原本是空的。
 */
export function DocsToc({ label }: { label: string }) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>("article.docs h2")];
    const list = nodes.map((node, i) => {
      if (!node.id) node.id = `section-${i + 1}`;
      node.style.scrollMarginTop = "6rem";
      return { id: node.id, text: node.textContent ?? "" };
    });
    setHeadings(list);
    setActive(list[0]?.id ?? null);
    if (nodes.length < 2) return;
    // 標題進到畫面上三分之一時算「到了這一段」
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-80px 0px -66% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);

  if (headings.length < 2) return null;
  return (
    <nav aria-label={label} className="text-sm">
      <p className="mb-3 font-medium">{label}</p>
      <ul className="grid gap-0.5 border-l border-line">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={active === heading.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1 pl-3.5 transition-colors",
                active === heading.id ? "border-fg text-fg" : "border-transparent text-subtle hover:text-fg",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
