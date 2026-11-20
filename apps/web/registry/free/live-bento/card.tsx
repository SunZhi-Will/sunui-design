"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AgentVisual, demoCopy } from "./demo";
import { BentoTile, LiveBento } from "./live-bento";

/** Catalog card: one feature tile (title only, so the thumbnail is large); the mini screen replays an agent search once, score bars grow, first place in the brand spot colour. */
export default function LiveBentoCard() {
  const t = useDemoText(demoCopy);
  return (
    <LiveBento className="w-80 grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
      <BentoTile title={t.tiles[3][0]}>
        <AgentVisual t={t} />
      </BentoTile>
    </LiveBento>
  );
}
