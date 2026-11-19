"use client";

import { RasterTile } from "./demo";
import { rasterModes, type RasterMode } from "./raster-image";

export const variants = rasterModes;

// The home page shows only this one as the representative: halftone looks most like print and is recognizable even as a thumbnail
export const featured = "halftone";

/** Home catalog: one card per rasterization style, with a develop-in animation that runs once on entry. */
export default function RasterImageVariant({ variant }: { variant: string }) {
  return (
    <div className="w-72">
      <RasterTile mode={variant as RasterMode} animateIn />
    </div>
  );
}
