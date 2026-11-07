"use client";

import { PhotoLookTile } from "./demo";
import { photoLooks, type PhotoLookName } from "./photo-looks";

export const variants = photoLooks;

// 首頁預設只放這一種當代表：色調差異一眼就看得出來
export const featured = "golden-hour";

/** 首頁型錄：一種攝影風格一張卡，滑過看原圖。 */
export default function PhotoLooksVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <PhotoLookTile effect={variant as PhotoLookName} />
    </div>
  );
}
