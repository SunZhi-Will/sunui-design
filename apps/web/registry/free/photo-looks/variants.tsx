"use client";

import { PhotoLookTile } from "./demo";
import { photoLooks, type PhotoLookName } from "./photo-looks";

export const variants = photoLooks;

// The home page shows only this one as the representative: the tonal difference is obvious at a glance
export const featured = "golden-hour";

/** Home catalog: one card per photographic look, hover to see the original. */
export default function PhotoLooksVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <PhotoLookTile effect={variant as PhotoLookName} />
    </div>
  );
}
