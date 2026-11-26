import type { Metadata } from "next";

import { AnimeFxStudy } from "./study";

export const metadata: Metadata = {
  title: "anime-fx study",
  robots: { index: false },
};

/**
 * anime-fx 引擎驗收頁（2026-11-26，階段 1）。只是樣張，不進導覽，不進 registry。
 * 規劃：reports/動漫作畫特效元件深度分析與完整規劃-2026-11-26.md；規則：DESIGN-anime.md
 */
export default function Page() {
  return <AnimeFxStudy />;
}
