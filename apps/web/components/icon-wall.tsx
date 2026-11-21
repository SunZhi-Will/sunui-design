"use client";

import { useReducedMotion } from "framer-motion";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import { format } from "@/lib/i18n";
import { iconGroups, pixelIconGroups } from "@/lib/icon-groups";
import type { Messages } from "@/lib/messages";
import { cn } from "@/lib/utils";
import {
  AnimatedPixelIcon,
  animatedPixelIconNames,
  pixelRecipes,
  type AnimatedPixelIconName,
} from "@/registry/icons/sunui-animated-pixel-icons";
import {
  AnimatedIcon,
  animatedIconNames,
  motionKindOf,
  type AnimatedIconName,
} from "@/registry/icons/sunui-animated-icons";

// 同屏牆：/icons 頁頂的展示模式，所有動態圖示一起錯開播放。
// 圖示庫本身不變（hover 類仍是滑過才播），這裡只從外部定時切換 active。
// 規劃：reports/150 動態圖示同屏深度分析-2026-11-22.md 第 5 節。

type Style = "line" | "pixel";
type Kind = "hover" | "toggle" | "loop";

// 依圖庫的分組順序排，讓同類圖示在牆上相鄰
function ordered<T extends string>(groups: { icons: readonly string[] }[], names: readonly T[]): T[] {
  const set = new Set<string>(names);
  const seen = new Set<string>();
  const out: T[] = [];
  for (const group of groups)
    for (const name of group.icons)
      if (set.has(name) && !seen.has(name)) {
        seen.add(name);
        out.push(name as T);
      }
  for (const name of names) if (!seen.has(name)) out.push(name);
  return out;
}

// 介面類放最前面，牆的第一列就是每個產品都會用到的控制項
const interfaceFirst = <G extends { id: string }>(groups: G[]) =>
  [...groups].sort((a, b) => Number(b.id.endsWith("interface")) - Number(a.id.endsWith("interface")));
const lineNames = ordered(interfaceFirst(iconGroups), animatedIconNames);
const pixelNames = ordered(interfaceFirst(pixelIconGroups), animatedPixelIconNames);

// 每格播放多久（毫秒）：hover 播完一次，toggle 留時間看到兩種狀態，loop 轉幾圈
function playMs(style: Style, name: string): number {
  if (style === "line") {
    const kind = motionKindOf(name as AnimatedIconName);
    return kind === "toggle" ? 1400 : kind === "loop" ? 2200 : 900;
  }
  const recipe = pixelRecipes[name as AnimatedPixelIconName];
  const kind = recipe.kind as Kind;
  if (kind === "toggle") return 1400;
  if (kind === "loop") return 2200;
  return Math.max(600, (recipe.frames.length / recipe.fps) * 1000 + 150);
}

const restMs = () => 1600 + Math.random() * 2400;

export function IconWall({ messages: t }: { messages: Messages["iconWall"] }) {
  const [style, setStyle] = useState<Style>("pixel");
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageShown, setPageShown] = useState(true);
  const [active, setActive] = useState<boolean[]>([]);
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);

  const names: string[] = style === "line" ? lineNames : pixelNames;
  const running = !paused && visible && pageShown && !reduce;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    const onVis = () => setPageShown(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // 一個共用計時器排全部格子：先依序掃過一次（斜向波），之後每格播完休息一段隨機時間再播
  useEffect(() => {
    if (!running) {
      setActive([]);
      return;
    }
    const start = performance.now();
    const next = names.map((_, i) => start + i * 45);
    const until = names.map(() => 0);
    let state = names.map(() => false);
    const id = setInterval(() => {
      const now = performance.now();
      let changed = false;
      const draft = state.slice();
      names.forEach((name, i) => {
        if (draft[i] && now >= until[i]) {
          draft[i] = false;
          next[i] = now + restMs();
          changed = true;
        } else if (!draft[i] && now >= next[i]) {
          draft[i] = true;
          until[i] = now + playMs(style, name);
          changed = true;
        }
      });
      if (changed) {
        state = draft;
        setActive(draft);
      }
    }, 50);
    return () => clearInterval(id);
  }, [running, names, style]);

  return (
    <section aria-labelledby="icon-wall-title" className="mb-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="icon-wall-title" className="text-sm font-medium">
            {t.title}
          </h2>
          <p className="mt-1 text-xs text-pretty text-subtle">{format(t.note, { n: names.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label={t.styleLabel}
            className="flex h-9 items-center rounded-md border border-line bg-card p-0.5"
          >
            {(["pixel", "line"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={style === option}
                onClick={() => setStyle(option)}
                className={cn(
                  "h-full rounded-[5px] px-3 text-xs font-medium transition-colors",
                  style === option ? "bg-stage text-fg" : "text-subtle hover:text-fg",
                )}
              >
                {t[option]}
              </button>
            ))}
          </div>
          {!reduce && (
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
              className="flex h-9 items-center rounded-md border border-line bg-card px-3 text-xs font-medium text-subtle transition-colors hover:text-fg"
            >
              {paused ? t.play : t.pause}
            </button>
          )}
        </div>
      </div>

      <div ref={ref} className="[--sunui-icon-accent:currentColor] rounded-lg border border-line bg-card p-3 sm:p-5">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-y-1 sm:grid-cols-[repeat(auto-fill,minmax(52px,1fr))]">
          {names.map((name, i) => (
            <Cell key={`${style}-${name}`} style={style} name={name} active={Boolean(active[i])} />
          ))}
        </ul>
      </div>
    </section>
  );
}

const Cell = memo(function Cell({ style, name, active }: { style: Style; name: string; active: boolean }) {
  return (
    <li title={name} className="flex h-11 items-center justify-center text-fg/85 sm:h-12">
      {style === "line" ? (
        <AnimatedIcon name={name as AnimatedIconName} size={20} active={active} />
      ) : (
        <AnimatedPixelIcon name={name as AnimatedPixelIconName} size={16} active={active} />
      )}
    </li>
  );
});
