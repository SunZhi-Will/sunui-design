"use client";

import { TypeMotionTile, typeMotionTiles, type TypeMotionTileId } from "./demo";

export const variants = typeMotionTiles;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "text-on-path-circle";

/** 首頁型錄：一種字體動態一張卡。 */
export default function TypeMotionVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <TypeMotionTile id={variant as TypeMotionTileId} />
    </div>
  );
}
