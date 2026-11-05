import Link from "next/link";

import { getI18n } from "@/lib/i18n-server";
import { githubUrl } from "@/lib/site";

export async function SiteFooter() {
  const { m } = await getI18n();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-subtle sm:px-6">
        <p>{m.footer.tagline}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/icons" className="hover:text-fg">
            {m.nav.icons}
          </Link>
          <Link href="/docs" className="hover:text-fg">
            {m.nav.docs}
          </Link>
          <Link href="/docs/changelog" className="hover:text-fg">
            {m.footer.changelog}
          </Link>
          <Link href="/pricing" className="hover:text-fg">
            {m.nav.pricing}
          </Link>
          <Link href="/license" className="hover:text-fg">
            {m.footer.license}
          </Link>
          <a href={githubUrl} className="hover:text-fg">
            {m.nav.github}
          </a>
        </nav>
      </div>
    </footer>
  );
}
