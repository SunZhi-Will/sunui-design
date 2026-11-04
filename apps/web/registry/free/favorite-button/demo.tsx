"use client";

import { useState } from "react";

import { FavoriteButton } from "./favorite-button";

export default function FavoriteButtonDemo() {
  const [liked, setLiked] = useState(false);
  const base = 1284;

  return (
    <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-8">
      <div className="w-64 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
        <div className="relative aspect-square bg-gradient-to-br from-rose-200 via-orange-100 to-amber-200 dark:from-rose-900/60 dark:via-orange-900/40 dark:to-amber-900/50">
          <FavoriteButton className="absolute top-3 right-3" pressed={liked} onPressedChange={setLiked} />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Ceramic Pour-over</p>
            <p className="text-sm text-muted-foreground">$42</p>
          </div>
          <FavoriteButton size="sm" pressed={liked} onPressedChange={setLiked} count={base + (liked ? 1 : 0)} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <FavoriteButton size="lg" color="amber" defaultPressed />
        <FavoriteButton size="lg" color="violet" />
        <p className="text-xs text-muted-foreground">Sizes and colors</p>
      </div>
    </div>
  );
}
