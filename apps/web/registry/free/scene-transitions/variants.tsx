"use client";

import { SceneTransitionTile } from "./demo";
import { sceneTransitions, type SceneTransitionName } from "./scene-transitions";

export const variants = sceneTransitions;

// 首頁預設只放這一種當代表：形狀明顯，縮圖也看得出是轉場
export const featured = "circle-reveal";

/** 首頁型錄：一種轉場一張卡，進入畫面就自動輪播。 */
export default function SceneTransitionsVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <SceneTransitionTile name={variant as SceneTransitionName} />
    </div>
  );
}
