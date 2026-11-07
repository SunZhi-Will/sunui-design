"use client";

import { SpringRigTile } from "./demo";
import type { SpringRigPreset } from "./spring-rig";

// 與 spring-rig.tsx 的 springRigs 同順序；建置時要能直接讀出字串，所以這裡寫成字面陣列
export const variants = ["bag", "tag", "box", "lamp", "cards"] as const;

// 首頁預設只放這一種當代表：檯燈的關節最多，擺動最好認
export const featured = "lamp";

/** 首頁型錄：一種彈簧骨架一張卡。 */
export default function SpringRigVariant({ variant }: { variant: string }) {
  return (
    <div className="w-64">
      <SpringRigTile preset={variant as SpringRigPreset} />
    </div>
  );
}
