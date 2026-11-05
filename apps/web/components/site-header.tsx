import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { getI18n } from "@/lib/i18n-server";
import { githubUrl } from "@/lib/site";

export async function SiteHeader() {
  const { locale, m } = await getI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <SunMark />
          SunUI
        </Link>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
          <Link href="/" className="rounded-md px-2 py-1.5 text-subtle hover:text-fg sm:px-3">
            {m.nav.blocks}
          </Link>
          <Link href="/icons" className="hidden rounded-md px-2 py-1.5 text-subtle hover:text-fg min-[400px]:block sm:px-3">
            {m.nav.icons}
          </Link>
          <Link href="/docs" className="rounded-md px-2 py-1.5 text-subtle hover:text-fg sm:px-3">
            {m.nav.docs}
          </Link>
          <Link href="/pricing" className="rounded-md px-2 py-1.5 text-subtle hover:text-fg sm:px-3">
            {m.nav.pricing}
          </Link>
          <a href={githubUrl} className="hidden rounded-md px-3 py-1.5 text-subtle hover:text-fg sm:block">
            {m.nav.github}
          </a>
          <LocaleSwitcher locale={locale} label={m.nav.language} />
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
