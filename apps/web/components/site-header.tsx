import Link from "next/link";

import { githubUrl } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <SunMark />
          SunUI
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5 text-subtle hover:text-fg">
            Blocks
          </Link>
          <Link href="/docs" className="rounded-md px-3 py-1.5 text-subtle hover:text-fg">
            Docs
          </Link>
          <Link href="/pricing" className="rounded-md px-3 py-1.5 text-subtle hover:text-fg">
            Pricing
          </Link>
          <a href={githubUrl} className="hidden rounded-md px-3 py-1.5 text-subtle hover:text-fg sm:block">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function SunMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-accent" aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
      </g>
    </svg>
  );
}
