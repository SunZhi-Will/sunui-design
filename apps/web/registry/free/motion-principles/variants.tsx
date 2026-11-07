"use client";

import { MotionPrincipleTile } from "./demo";
import { motionPrinciples, type MotionPrincipleName } from "./motion-principles";

export const variants = motionPrinciples;

// 首頁預設只放這一種當代表，挑常駐循環的，卡片不用重播就看得到
export const featured = "squash-stretch";

/** 首頁型錄：一種動態原理一張卡。 */
export default function MotionPrinciplesVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <MotionPrincipleTile effect={variant as MotionPrincipleName} />
    </div>
  );
}
