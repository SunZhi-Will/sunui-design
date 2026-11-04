import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <SunMark />
          SunUI
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5 text-muted hover:text-fg">
            Blocks
          </Link>
          <span className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-muted sm:flex">
            Pro
            <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
              soon
            </span>
          </span>
          <a
            href="https://github.com/SunZhi-Will/sunui-design"
            className="rounded-md px-3 py-1.5 text-muted hover:text-fg"
          >
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
