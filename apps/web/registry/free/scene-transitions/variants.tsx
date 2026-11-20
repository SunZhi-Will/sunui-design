"use client";

import { SceneTransitionTile } from "./demo";
import { sceneTransitions, type SceneTransitionName } from "./scene-transitions";

export const variants = sceneTransitions;

// The home page shows only this one as the representative: its shape is distinct, so even the thumbnail reads as a transition
export const featured = "circle-reveal";

/** Home catalog: one card per transition, autoplaying once on screen. */
export default function SceneTransitionsVariant({ variant }: { variant: string }) {
  return (
    <div className="w-80">
      <SceneTransitionTile name={variant as SceneTransitionName} />
    </div>
  );
}
