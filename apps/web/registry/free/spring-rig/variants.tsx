"use client";

import { SpringRigTile } from "./demo";
import type { SpringRigPreset } from "./spring-rig";

// Same order as springRigs in spring-rig.tsx; the build must be able to read the strings directly, so this is written as a literal array
export const variants = ["bag", "tag", "box", "lamp", "cards"] as const;

// The home page shows only this one as the representative: the lamp has the most joints, and its swing is the easiest to recognize
export const featured = "lamp";

/** Home catalog: one spring rig per card. */
export default function SpringRigVariant({ variant }: { variant: string }) {
  return (
    <div className="w-64">
      <SpringRigTile preset={variant as SpringRigPreset} />
    </div>
  );
}
