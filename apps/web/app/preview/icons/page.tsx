import type { Metadata } from "next";

import { IconCheckSheet, type CheckSet, type CheckSheet, type CheckTheme } from "@/components/icon-check-sheet";

export const metadata: Metadata = {
  title: "Icon check",
  robots: { index: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) =>
  one(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// 在任何圖示程式執行前就記錄錯誤，寫進 <html data-err>，scripts/check-icons.mjs 用 --dump-dom 讀回
const errorProbe = `(() => {
  const r = document.documentElement;
  const add = (m) => { r.dataset.err = (r.dataset.err ? r.dataset.err + " | " : "") + String(m).slice(0, 300); };
  window.addEventListener("error", (e) => add(e.message + (e.lineno ? " @" + e.lineno : "")));
  window.addEventListener("unhandledrejection", (e) => add("unhandled: " + (e.reason && e.reason.message || e.reason)));
  const ce = console.error.bind(console);
  console.error = (...a) => { add(a.map((x) => x && x.message || x).join(" ")); ce(...a); };
})();`;

/**
 * 圖示自檢頁：只給 scripts/check-icons.mjs 截圖用，不進網站導覽。
 * /preview/icons?set=line|pixel&sheet=sizes|frames&theme=light|dark&only=a,b&with=c,d&accent=off&page=1&per=24
 */
export default async function IconCheckPage({ searchParams }: Props) {
  const params = await searchParams;
  const set: CheckSet = one(params.set) === "pixel" ? "pixel" : "line";
  const sheet: CheckSheet = one(params.sheet) === "frames" ? "frames" : "sizes";
  const theme: CheckTheme = one(params.theme) === "dark" ? "dark" : "light";
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: errorProbe }} />
      {/* 開發模式左下角的 Next 徽章會壓到圖示 */}
      <style>{"nextjs-portal{display:none!important}"}</style>
      <IconCheckSheet
        set={set}
        sheet={sheet}
        theme={theme}
        only={list(params.only)}
        refs={list(params.with)}
        accent={one(params.accent) !== "off"}
        page={Number(one(params.page)) || 1}
        per={Number(one(params.per)) || (sheet === "frames" ? 24 : 48)}
      />
    </>
  );
}
