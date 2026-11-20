"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { CommandPalette, useModKey } from "./command-palette";
import { demoCopy, useDemoGroups } from "./demo";

/** Catalog card: an open command palette; typing fuzzy-matches and highlights the matched characters, arrow keys move. */
export default function CommandPaletteCard() {
  const t = useDemoText(demoCopy);
  const mod = useModKey();
  const [, setPage] = useState("dashboard");
  const groups = useDemoGroups(t, mod, setPage);
  return (
    <div className="mx-auto flex h-[268px] w-80 justify-center">
      <CommandPalette
        inline
        hotkey={false}
        groups={groups}
        placeholder={t.placeholder}
        labels={t.labels}
        recentLimit={0}
        className="h-full"
      />
    </div>
  );
}
