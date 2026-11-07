"use client";

import { RasterTile } from "./demo";
import { rasterModes, type RasterMode } from "./raster-image";

export const variants = rasterModes;

// 首頁預設只放這一種當代表：網點最像印刷品，縮圖也認得出來
export const featured = "halftone";

/** 首頁型錄：一種點陣化樣式一張卡，進場時跑一次顯影。 */
export default function RasterImageVariant({ variant }: { variant: string }) {
  return (
    <div className="w-72">
      <RasterTile mode={variant as RasterMode} animateIn />
    </div>
  );
}
