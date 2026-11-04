import Link from "next/link";

import { githubUrl } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-subtle sm:px-6">
        <p>SunUI by Sun. Free blocks are MIT licensed.</p>
        <nav className="flex gap-4">
          <Link href="/pricing" className="hover:text-fg">
            Pricing
          </Link>
          <Link href="/license" className="hover:text-fg">
            License
          </Link>
          <a href={githubUrl} className="hover:text-fg">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
