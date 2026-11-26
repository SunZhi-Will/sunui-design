import type { Metadata } from "next";
import { Dela_Gothic_One, Noto_Sans_JP, Noto_Sans_SC, Noto_Sans_TC } from "next/font/google";

import { AnimeStudy } from "./study";

export const metadata: Metadata = {
  title: "Anime study",
  robots: { index: false },
};

// 擬聲字樣張用的開源字型（SIL OFL）；只在這頁載入
const dela = Dela_Gothic_One({ weight: "400", subsets: ["latin"], preload: false, variable: "--font-anime-dela" });
const notoJp = Noto_Sans_JP({ weight: "900", subsets: ["latin"], preload: false, variable: "--font-anime-jp" });
const notoTc = Noto_Sans_TC({ weight: "900", subsets: ["latin"], preload: false, variable: "--font-anime-tc" });
const notoSc = Noto_Sans_SC({ weight: "900", subsets: ["latin"], preload: false, variable: "--font-anime-sc" });

/**
 * 動漫作畫系列樣張（2026-11-26，階段 0）：三個樣式方向並排、256px 驗收、擬聲字六槽三語。
 * 只是樣張，不進導覽，不進 registry。規劃：reports/動漫作畫特效元件深度分析與完整規劃-2026-11-26.md
 */
export default function Page() {
  return (
    <AnimeStudy
      fontClass={[dela.variable, notoJp.variable, notoTc.variable, notoSc.variable].join(" ")}
      fam={{
        ja: dela.style.fontFamily,
        jaAlt: notoJp.style.fontFamily,
        "zh-TW": notoTc.style.fontFamily,
        "zh-CN": notoSc.style.fontFamily,
      }}
    />
  );
}
