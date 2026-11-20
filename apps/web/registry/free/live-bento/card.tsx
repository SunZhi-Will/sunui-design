"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AgentVisual, demoCopy } from "./demo";
import { BentoTile, LiveBento } from "./live-bento";

/** 型錄卡片：一格功能方塊（只放標題，讓縮圖夠大），小畫面在畫面內重播一次代理搜尋，計分條長出來、第一名用品牌專色。 */
export default function LiveBentoCard() {
  const t = useDemoText(demoCopy);
  return (
    <LiveBento className="w-80 grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
      <BentoTile title={t.tiles[3][0]}>
        <AgentVisual t={t} />
      </BentoTile>
    </LiveBento>
  );
}
