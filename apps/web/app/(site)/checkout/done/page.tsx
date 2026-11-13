import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { checkoutCopy } from "@/lib/checkout-copy";
import { getLocale } from "@/lib/i18n-server";
import { decryptLicenseKey } from "@/lib/license-key";
import { getOrder, ORDER_COOKIE } from "@/lib/orders";
import { siteUrl } from "@/lib/site";

import { CopyButton, WaitForPayment } from "./client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = checkoutCopy(await getLocale());
  return { title: t.done.title, robots: { index: false } };
}

function Code({ children, copy, label }: { children: string; copy: string; label: string }) {
  return (
    <div className="relative mt-2 rounded-md border border-line bg-bg">
      <pre className="overflow-x-auto p-3 pr-20 font-mono text-xs leading-relaxed">{children}</pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={children} label={label} done={copy} />
      </div>
    </div>
  );
}

export default async function CheckoutDonePage({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const t = checkoutCopy(await getLocale()).done;
  const id = (await searchParams).o ?? "";
  const order = await getOrder(id).catch(() => null);
  const [cookieId, viewToken] = ((await cookies()).get(ORDER_COOKIE)?.value ?? "").split(".");
  const owner = Boolean(order && cookieId === order.id && viewToken && viewToken === order.viewToken);

  if (!order || order.status === "amount_mismatch" || order.status === "disputed" || order.status === "refunded") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">{t.problemTitle}</h1>
        <p className="mt-2 text-sm text-subtle">{t.problemBody}</p>
        {order && <p className="mt-4 font-mono text-xs text-subtle">{order.id}</p>}
      </Shell>
    );
  }

  if (order.status === "pending") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">{t.pendingTitle}</h1>
        <p className="mt-2 text-sm text-subtle">{t.pendingBody}</p>
        <WaitForPayment slow={t.pendingSlow} />
        <p className="mt-6 font-mono text-xs text-subtle">{order.id}</p>
      </Shell>
    );
  }

  const key = owner && order.keyEnc ? await decryptLicenseKey(order.keyEnc, process.env.SUNUI_ADMIN_TOKEN ?? "dev-secret") : null;
  if (!key) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-2 text-sm text-subtle">{t.otherBrowser}</p>
        <p className="mt-4 font-mono text-xs text-subtle">{order.id}</p>
      </Shell>
    );
  }

  const registry = `"registries": {\n  "@sunui-pro": {\n    "url": "${siteUrl()}/r/pro/{name}.json",\n    "headers": { "Authorization": "Bearer \${SUNUI_LICENSE_KEY}" }\n  }\n}`;
  return (
    <Shell>
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-subtle">{t.paidBody}</p>

      <p className="mt-6 text-sm font-medium">{t.keyLabel}</p>
      <Code copy={t.copied} label={t.copy}>{key}</Code>
      <p className="mt-2 text-xs text-subtle">{t.keyPrivate}</p>

      <h2 className="mt-8 text-sm font-medium">{t.steps}</h2>
      <ol className="mt-3 space-y-5 text-sm">
        <li>
          1. {t.step1}
          <Code copy={t.copied} label={t.copy}>{`SUNUI_LICENSE_KEY=${key}`}</Code>
        </li>
        <li>
          2. {t.step2}
          <Code copy={t.copied} label={t.copy}>{registry}</Code>
        </li>
        <li>
          3. {t.step3}
          <Code copy={t.copied} label={t.copy}>{"npx shadcn@latest add @sunui-pro/coupon-claim-card"}</Code>
        </li>
      </ol>
      <p className="mt-6 text-xs text-subtle">{t.emailNote(order.email)}</p>
      <Link href="/" className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90">
        {t.browse}
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl py-16 sm:py-20">
      <div className="rounded-lg border border-line bg-card p-6 sm:p-8">{children}</div>
    </div>
  );
}
