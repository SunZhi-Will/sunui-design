"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { CommandPalette, useModKey } from "./command-palette";
import { demoCopy, useDemoGroups } from "./demo";

/** 型錄卡片：展開中的指令面板，直接打字就會模糊比對、高亮命中的字，方向鍵移動。 */
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
