"use client";

import { PointCloudTile } from "./demo";
import { pointCloudShapes, type PointCloudShape } from "./point-cloud";

export const variants = pointCloudShapes;

// 首頁預設只放這一種當代表：會自己轉動，輪廓最清楚
export const featured = "sphere";

/** 首頁型錄：一種點雲形狀一張卡。 */
export default function PointCloudVariant({ variant }: { variant: string }) {
  return (
    <div className="w-72">
      <PointCloudTile shape={variant as PointCloudShape} />
    </div>
  );
}
