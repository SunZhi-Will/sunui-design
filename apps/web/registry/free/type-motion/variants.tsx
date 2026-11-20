"use client";

import { TypeMotionTile, typeMotionTiles, type TypeMotionTileId } from "./demo";

export const variants = typeMotionTiles;

// The home page shows only this one as the representative, one that moves on its own so the card needs no hover to show the effect
export const featured = "text-on-path-circle";

/** Home catalog: one card per typographic motion. */
export default function TypeMotionVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <TypeMotionTile id={variant as TypeMotionTileId} />
    </div>
  );
}
