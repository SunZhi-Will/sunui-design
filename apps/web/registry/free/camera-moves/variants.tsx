"use client";

import { cameraMoves, type CameraMove } from "./camera-moves";
import { CameraMoveTile } from "./demo";

export const variants = cameraMoves;

// The home page shows only this one move as the representative; pick one that moves by itself so the card needs no hover to show the effect
export const featured = "orbit";

/** Home catalog: one move per card. */
export default function CameraMovesVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <CameraMoveTile move={variant as CameraMove} />
    </div>
  );
}
