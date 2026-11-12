import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { SiteNavLinks } from "@/components/site-nav-links";
import { ThemeMenu } from "@/components/theme-menu";
import { getI18n } from "@/lib/i18n-server";
import { githubUrl } from "@/lib/site";

export async function SiteHeader() {
  const { locale, m } = await getI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-1 flex shrink-0 items-center gap-2 rounded-md px-1 py-1 font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-accent"
        >
          <SunMark />
          SunUI
        </Link>
        <div className="flex items-center gap-1 text-sm sm:gap-2">
          <nav>
            <SiteNavLinks labels={m.nav} />
          </nav>
          <span aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-line sm:block" />
          <div className="flex items-center gap-1.5">
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={m.nav.github}
              title={m.nav.github}
              className="hidden size-8 place-items-center rounded-md border border-line text-subtle transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent sm:grid"
            >
              <GitHubMark />
            </a>
            <LocaleSwitcher locale={locale} label={m.nav.language} />
            <ThemeMenu labels={m.nav} />
          </div>
        </div>
      </div>
    </header>
  );
}

function SunMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-fg" aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
      </g>
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
