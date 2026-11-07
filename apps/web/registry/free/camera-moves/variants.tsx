"use client";

import { cameraMoves, type CameraMove } from "./camera-moves";
import { CameraMoveTile } from "./demo";

export const variants = cameraMoves;

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "orbit";

/** 首頁型錄：一種運鏡一張卡。 */
export default function CameraMovesVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <CameraMoveTile move={variant as CameraMove} />
    </div>
  );
}
