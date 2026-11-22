import type { Metadata } from "next";

import { SpriteStackStudy } from "./study";

export const metadata: Metadata = {
  title: "Sprite stacking study",
  robots: { index: false },
};

/**
 * Sprite stacking 樣張（2026-11-22）：拿現有像素圖示疊成可轉的偽 3D，看能用在哪些介面上。
 * 只是樣張，不進導覽，不進 registry。背景：reports/Sprite Stacking 偽3D深度分析-2026-11-22.md
 */
export default function Page() {
  return <SpriteStackStudy />;
}
