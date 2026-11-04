import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-32 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">This page took the day off.</h1>
      <p className="mt-3 text-subtle">The block or page you are looking for does not exist.</p>
      <Link href="/" className="mt-8 inline-flex rounded-xl bg-fg px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90">
        Browse blocks
      </Link>
    </div>
  );
}
