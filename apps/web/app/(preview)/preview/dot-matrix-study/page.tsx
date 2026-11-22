import type { Metadata } from "next";

import { DotMatrixStudy } from "./study";

export const metadata: Metadata = {
  title: "Dot matrix study",
  robots: { index: false },
};

/**
 * 點陣載入的變化樣張（2026-11-22）：同一個 DotMatrixLoader，換形狀、發光、強調方式與配色，八種並排。
 * 只是樣張，不進導覽，不進 registry。背景：reports/點陣載入參考分析-2026-11-22.md
 */
export default function Page() {
  // data-preview-stage: same wrapper as block previews, so scripts/record-cards.mjs can frame and record this page.
  // 1100px tall so the recorder's 640:550 frame is not capped by the page height and keeps all four columns
  return (
    <div data-preview-stage className="flex min-h-[1100px] items-center justify-center">
      <DotMatrixStudy />
    </div>
  );
}
