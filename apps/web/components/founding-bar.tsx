import Link from "next/link";

import { FoundingBarDismiss } from "@/components/founding-bar-dismiss";
import { format } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { intlLocale } from "@/lib/messages";
import { foundingState, foundingWindow } from "@/lib/site";

/**
 * Founding member 期間的常駐公告條（reports/Planes 參考分析-2026-11-08.md 第 9 節 F1）。
 * 開賣前寫開賣日，開賣中寫截止日，結束後不出現。下緣是虛線，像一張可撕的紙條。
 * 關閉後記在 localStorage；key 帶著狀態，所以關掉「即將開賣」後，開賣當天還會再出現一次。
 * 先在第一次繪製前用內嵌腳本藏起來，已關閉的人不會看到它閃一下。
 */
export async function FoundingBar() {
  const state = foundingState();
  if (state === "closed") return null;
  const { locale, m } = await getI18n();
  const t = m.pricing.bar;
  const date = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", day: "numeric", timeZone: "Asia/Taipei" });
  const text =
    state === "upcoming"
      ? format(t.upcoming, { seats: foundingWindow.seats, opens: date.format(foundingWindow.opensAt) })
      : format(t.open, { seats: foundingWindow.seats, closes: date.format(new Date(foundingWindow.closesAt.getTime() - 1)) });
  const storageKey = `sunui-founding-bar-${state}`;

  return (
    <div className="founding-bar border-b border-dashed border-line bg-card text-sm [[data-founding-bar=hidden]_&]:hidden">
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(storageKey)}))document.documentElement.dataset.foundingBar="hidden"}catch(e){}`,
        }}
      />
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
        <p className="min-w-0 flex-1 text-pretty">
          <span className="tabular-nums">{text}</span>{" "}
          <Link
            href={state === "upcoming" ? "/pricing#waitlist" : "/pricing"}
            className="font-medium whitespace-nowrap underline underline-offset-4 hover:opacity-80"
          >
            {state === "upcoming" ? t.upcomingCta : t.openCta}
          </Link>
        </p>
        <FoundingBarDismiss storageKey={storageKey} label={t.dismiss} />
      </div>
    </div>
  );
}
