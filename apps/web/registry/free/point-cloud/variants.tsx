"use client";

import { PointCloudTile } from "./demo";
import { pointCloudShapes, type PointCloudShape } from "./point-cloud";

export const variants = pointCloudShapes;

// The home page shows only this one as the representative: it turns by itself and has the clearest outline
export const featured = "sphere";

/** Home catalog: one card per point-cloud shape. */
export default function PointCloudVariant({ variant }: { variant: string }) {
  return (
    <div className="w-72">
      <PointCloudTile shape={variant as PointCloudShape} />
    </div>
  );
}
