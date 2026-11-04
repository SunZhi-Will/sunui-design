"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ScriptedDemoScene {
  key: string;
  /** 這一幕停留的毫秒數 */
  duration: number;
  /** 所屬章節 id */
  chapter: string;
  /** 游標要移到的元素：stage 內 data-demo-target 的值 */
  target?: string;
}

export interface ScriptedDemoChapter {
  id: string;
  title: ReactNode;
  caption?: ReactNode;
}

export interface ScriptedDemoProps {
  scenes: ScriptedDemoScene[];
  chapters: ScriptedDemoChapter[];
  renderScene: (key: string) => ReactNode;
  autoPlay?: boolean;
  loop?: boolean;
  labels?: { play?: string; pause?: string; replay?: string; next?: string; stage?: string; chapters?: string };
  className?: string;
}

const defaultLabels = {
  play: "Play demo",
  pause: "Pause demo",
  replay: "Replay demo",
  next: "Next step",
  stage: "Product demo",
  chapters: "Demo chapters",
};

const ease = [0.23, 1, 0.32, 1] as const;
const cursorEase = [0.65, 0, 0.35, 1] as const;

export function ScriptedDemo({ scenes, chapters, renderScene, autoPlay = true, loop = true, labels, className }: ScriptedDemoProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ended, setEnded] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const scene = scenes[index];
  const running = playing && inView && visible && !reduce && !ended;

  // 進入視窗才播放、分頁隱藏就暫停
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // 目前章節的進度，以 motion value 驅動進度條，不逐幀 setState
  const chapterScenes = scenes.filter((s) => s.chapter === scene?.chapter);
  const chapterTotal = chapterScenes.reduce((sum, s) => sum + s.duration, 0) || 1;
  const before = chapterScenes.slice(0, chapterScenes.indexOf(scene)).reduce((sum, s) => sum + s.duration, 0);
  const progress = useMotionValue(0);
  const elapsed = useRef(0);
  const lastIndex = useRef(-1);

  useEffect(() => {
    if (!scene) return;
    if (lastIndex.current !== index) {
      lastIndex.current = index;
      elapsed.current = 0;
      progress.set(before / chapterTotal);
    }
    if (!running) return;
    const t0 = performance.now();
    const remaining = Math.max(0, scene.duration - elapsed.current);
    const controls: AnimationPlaybackControls = animate(progress, (before + scene.duration) / chapterTotal, {
      duration: remaining / 1000,
      ease: "linear",
    });
    const timer = setTimeout(() => {
      if (index < scenes.length - 1) setIndex(index + 1);
      else if (loop) setIndex(0);
      else setEnded(true);
    }, remaining);
    return () => {
      elapsed.current += performance.now() - t0;
      controls.stop();
      clearTimeout(timer);
    };
  }, [index, running, scene, scenes.length, loop, before, chapterTotal, progress]);

  // 量測目標元素，把假游標移過去
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !scene?.target) return setCursor(null);
    const el = stage.querySelector<HTMLElement>(`[data-demo-target="${scene.target}"]`);
    if (!el) return setCursor(null);
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursor({ x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 });
  }, [index, scene?.target]);

  const goChapter = (id: string) => {
    const first = scenes.findIndex((s) => s.chapter === id);
    if (first < 0) return;
    setEnded(false);
    setIndex(first);
  };

  const activeChapter = chapters.find((c) => c.id === scene?.chapter);
  const activeChapterIdx = chapters.findIndex((c) => c.id === scene?.chapter);

  const toggle = () => {
    if (ended) {
      setEnded(false);
      setIndex(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  return (
    <div ref={rootRef} className={cn("w-full space-y-3", className)}>
      <div
        ref={stageRef}
        aria-label={t.stage}
        role="group"
        inert
        className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={scene?.key}
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
            transition={{ duration: 0.24, ease }}
          >
            {scene && renderScene(scene.key)}
          </motion.div>
        </AnimatePresence>

        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-10"
            initial={false}
            animate={cursor ? { x: cursor.x, y: cursor.y, opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7, ease: cursorEase }}
          >
            <AnimatePresence>
              {cursor && (
                <motion.span
                  key={index}
                  className="absolute -top-4 -left-4 size-8 rounded-full border border-primary"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: [0.4, 1.6], opacity: [0.6, 0] }}
                  transition={{ delay: 0.7, duration: 0.5, ease }}
                />
              )}
            </AnimatePresence>
            <svg viewBox="0 0 20 20" className="size-5 -translate-x-0.5 -translate-y-0.5 text-foreground drop-shadow-sm" aria-hidden="true">
              <path d="M3 2.5 16 9.2l-5.6 1.5L8 16.5Z" fill="currentColor" className="stroke-background" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div role="tablist" aria-label={t.chapters} className="grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${chapters.length}, minmax(0, 1fr))` }}>
          {chapters.map((c, i) => {
            const active = c.id === scene?.chapter;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => goChapter(c.id)}
                className="group min-w-0 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden="true" className="block h-0.5 w-full overflow-hidden rounded-full bg-border">
                  <motion.span
                    className="block h-full origin-left bg-primary"
                    style={active ? { scaleX: progress } : { scaleX: i < activeChapterIdx ? 1 : 0 }}
                  />
                </span>
                <span className={cn("mt-2 block truncate text-sm font-medium transition-colors", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  {c.title}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={reduce ? () => setIndex((i) => (i + 1) % scenes.length) : toggle}
          aria-label={reduce ? t.next : ended ? t.replay : playing ? t.pause : t.play}
          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {reduce ? (
              <path d="m6 3.5 4.5 4.5L6 12.5" />
            ) : ended ? (
              <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.5h2.5" />
            ) : playing ? (
              <path d="M5.5 3.5v9M10.5 3.5v9" />
            ) : (
              <path d="M5 3.2v9.6L12.5 8Z" />
            )}
          </svg>
        </button>
      </div>
      {activeChapter?.caption && <p className="text-sm text-muted-foreground">{activeChapter.caption}</p>}
    </div>
  );
}
