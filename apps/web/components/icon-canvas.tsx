"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { useStaggerPlay } from "@/components/use-stagger-play";
import { format } from "@/lib/i18n";
import { iconGroups, iconKeywords, pixelIconGroups } from "@/lib/icon-groups";
import { lineIconTone } from "@/lib/line-icon-colors";
import type { Messages } from "@/lib/messages";
import { DURATION, EASE_SITE } from "@/lib/motion";
import { proIconSets, type ProIconEntry, type ProIconRenderer, type ProIconSet } from "@/lib/pro-icons";
import { cn } from "@/lib/utils";
import { loadProIconRenderers } from "@/registry/__generated__/previews";
import {
  AnimatedPixelIcon,
  animatedPixelIconNames,
  pixelMotionKindOf,
  type AnimatedPixelIconName,
} from "@/registry/icons/sunui-animated-pixel-icons";
import {
  AnimatedIcon,
  animatedIconNames,
  motionKindOf,
  type AnimatedIconName,
  type MotionKind,
} from "@/registry/icons/sunui-animated-icons";
import {
  AnimatedTwoToneIcon,
  animatedTwoToneIconNames,
  twoToneMotionKindOf,
  type AnimatedTwoToneIconName,
} from "@/registry/icons/sunui-animated-twotone-icons";
import { Icon, icons, type IconName } from "@/registry/icons/sunui-icons";
import { PixelIcon, pixelIconNames, pixelIcons, type PixelIconName } from "@/registry/icons/sunui-pixel-icons";
import { TwoToneIcon, twoToneIconNames, twoToneIcons, type TwoToneIconName } from "@/registry/icons/sunui-twotone-icons";

// 2026-11-25：/icons 改成滿版的無限畫布（使用者：「滿版的圖案…無限畫布…點擊後會有卡片」）。
// 圖示鋪滿整個畫面、可以一直拖下去（清單首尾相接重複鋪）；點一個圖示，旁邊浮出細節卡片，卡片跟著那一格走。
// 舊的「左格子 + 右側已選面板」在 components/icon-gallery.tsx，沒有刪。

type Style = "pixel" | "twotone" | "line";

const sizes = [16, 20, 24, 32] as const;
const strokes = [1.25, 1.5, 1.75] as const;
// 像素圖示只在 16 的整數倍下銳利，所以縮放是分段換尺寸，不用 CSS scale
const pixelSizes = [16, 32, 48] as const;
const ZOOMS = [
  { cell: 64, pixel: 32, twotone: 24, line: 20 },
  { cell: 96, pixel: 48, twotone: 32, line: 28 },
  { cell: 128, pixel: 64, twotone: 44, line: 40 },
] as const;
// 少於這個數量（例如搜尋結果）就不重複鋪，只排一塊置中
const TILE_MIN = 24;
const TOOLBAR_SPACE = 72;
const PAD = 12;

const animatedSet = new Set<string>(animatedIconNames);
const twoToneSet = new Set<string>(twoToneIconNames);
const animatedTwoToneSet = new Set<string>(animatedTwoToneIconNames);
const animatedPixelSet = new Set<string>(animatedPixelIconNames);
const sources: Record<Style, Record<string, unknown>> = { pixel: pixelIcons, twotone: twoToneIcons, line: icons };
const extraKeywords: Record<string, string> = { theme: "dark light mode toggle sun moon 深色 主題" };
const counts: Record<Style, number> = {
  line: iconGroups.reduce((sum, group) => sum + group.icons.length, 0),
  twotone: twoToneIconNames.length,
  pixel: pixelIconNames.length,
};

// 2026-11-25：Pro 檔期圖示也放進同一張畫布（使用者：「Pro 也要合併進去」）。
// 名稱寫成 pro/<圖示組>/<圖示>，跟免費圖示不會撞名；圖示由私有 repo 的渲染器畫，公開 clone 沒有時畫鎖頭。
// Pro 圖示沒有複製 SVG 與下載，只給授權安裝指令（規則見 AGENTS.md「Pro code」）。
type ProRef = { set: ProIconSet; entry: ProIconEntry };
type Renderers = Record<string, ProIconRenderer> | null;
type ProInstalls = Record<string, Record<Style | `${Style}-animated`, ReactNode>>;
const proById = new Map<string, ProRef>(
  proIconSets.flatMap((set) => set.icons.map((entry) => [`pro/${set.id}/${entry.name}`, { set, entry }] as const)),
);
const proTotal = proById.size;
const proMotion = (ref: ProRef, style: Style) =>
  style === "pixel" ? ref.entry.pixelMotion : style === "twotone" ? ref.entry.twotoneMotion : ref.entry.motion;
const shortName = (id: string) => proById.get(id)?.entry.name ?? id;

function drawPro(
  renderers: Renderers,
  id: string,
  style: Style,
  o: { size: number; color: boolean; animated: boolean; active?: boolean },
): ReactNode {
  const ref = proById.get(id);
  const r = ref && renderers?.[ref.set.id];
  if (!ref || !r) return <Icon name="lock" size={Math.min(o.size, 24)} className="text-subtle" />;
  const name = ref.entry.name;
  if (style === "pixel") return r.pixel(name, { size: o.size, tone: o.color ? "pigment" : "ink", animated: o.animated, active: o.active });
  if (style === "twotone") return r.twotone(name, { size: o.size, animated: o.animated, active: o.active, colored: o.color });
  return r.line(name, { size: o.size, strokeWidth: 1.5, animated: o.animated, active: o.active, colored: o.color });
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

type Layout = { n: number; cols: number; rows: number; tiled: boolean };
type Selection = { name: string; c: number; r: number };
type Origin = { dx: number; dy: number; s: number };

const cardVariants = {
  from: (o: Origin | null) =>
    o
      ? { opacity: 0, x: o.dx, y: o.dy, scale: o.s, transition: { duration: 0.24, ease: EASE_SITE } }
      : { opacity: 0, scale: 0.94, y: 12, transition: { duration: DURATION.panelOut, ease: EASE_SITE } },
  shown: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.9, opacity: { duration: 0.14 } },
  },
};
// 卡片裡的兩欄在卡片落定時依序浮上來
const sectionVariants = {
  from: { opacity: 0, y: 10 },
  shown: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.06, duration: DURATION.reveal, ease: EASE_SITE } }),
};

function makeLayout(n: number): Layout {
  const tiled = n >= TILE_MIN;
  const cols = tiled ? Math.max(8, Math.ceil(Math.sqrt(n * 1.6))) : Math.max(1, Math.min(n, Math.ceil(Math.sqrt(n * 2))));
  return { n, cols, rows: Math.max(1, Math.ceil(n / cols)), tiled };
}

/** 第 c 欄第 r 列是哪個圖示。重複鋪時，清單照順序一列一列接下去，欄每 cols 格重複一次 */
function nameAt(list: readonly string[], L: Layout, c: number, r: number): string | null {
  if (!L.n) return null;
  if (L.tiled) return list[mod(r * L.cols + mod(c, L.cols), L.n)];
  if (c < 0 || r < 0 || c >= L.cols) return null;
  const i = r * L.cols + c;
  return i < L.n ? list[i] : null;
}

export function IconCanvas({
  messages: t,
  proMessages: pt,
  proInstalls,
}: {
  messages: Messages["iconGallery"];
  proMessages: Messages["proIcons"];
  /** 伺服器端渲染好的 Pro 安裝指令，依圖示組 id 與風格 */
  proInstalls: ProInstalls;
}) {
  const kindLabel: Record<MotionKind, string> = t.kindLabel;
  const kindHint: Record<MotionKind, string> = t.kindHint;
  const reduce = useReducedMotion() ?? false;

  const [style, setStyle] = useState<Style>("pixel");
  const [pigment, setPigment] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [sel, setSel] = useState<Selection | null>(null);
  const [dragging, setDragging] = useState(false);

  // 卡片裡的選項
  const [strokeSize, setStrokeSize] = useState<number>(24);
  const [pixelSize, setPixelSize] = useState<number>(32);
  const [stroke, setStroke] = useState<number>(1.5);
  const [animatedOn, setAnimatedOn] = useState(true);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [keylines, setKeylines] = useState(false);

  const isPixel = style === "pixel";
  const isTwoTone = style === "twotone";
  const motionSet = isPixel ? animatedPixelSet : isTwoTone ? animatedTwoToneSet : animatedSet;
  const hasMotion = useCallback(
    (id: string) => {
      const ref = proById.get(id);
      return ref ? Boolean(proMotion(ref, style)) : motionSet.has(id);
    },
    [style, motionSet],
  );

  const [renderers, setRenderers] = useState<Renderers>(null);
  useEffect(() => {
    let alive = true;
    loadProIconRenderers?.().then((r) => alive && setRenderers(r));
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = isPixel ? pixelIconGroups : iconGroups;
    return source
      .map((group) => ({
        ...group,
        ...t.groups[group.id],
        icons: (group.icons as string[]).filter((name) => !isTwoTone || twoToneSet.has(name)),
      }))
      .map((group) => ({
        ...group,
        icons: q
          ? group.icons.filter((name) =>
              `${name} ${iconKeywords[name as IconName | PixelIconName] ?? ""} ${extraKeywords[name] ?? ""}`.toLowerCase().includes(q),
            )
          : group.icons,
      }))
      .concat(
        proIconSets.map((set) => ({
          id: `pro-${set.id}`,
          title: `${pt.sets[set.id]?.title ?? set.title} · ${pt.badge}`,
          note: pt.sets[set.id]?.note ?? "",
          icons: set.icons
            .filter((e) => !q || `${e.name} ${e.keywords} pro ${set.title} ${pt.sets[set.id]?.title ?? ""}`.toLowerCase().includes(q))
            .map((e) => `pro/${set.id}/${e.name}`),
        })),
      )
      .filter((group) => group.icons.length > 0);
  }, [query, isPixel, isTwoTone, t, pt]);

  const shown = category === "all" ? groups : groups.filter((group) => group.id === category);
  const visible = useMemo(() => [...new Set(shown.flatMap((group) => group.icons))], [shown]);
  const layout = useMemo(() => makeLayout(visible.length), [visible.length]);
  const listKey = `${style}|${visible.join(",")}`;
  const Z = ZOOMS[zoom];
  const cell = Z.cell;

  // ---- 相機：拖曳時直接改 DOM，不經過 React；只有跨過一格時才更新要畫哪些格子 ----
  const viewportRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // 卡片從被點的那一格飛到畫面中央，關掉時飛回去
  const [origin, setOrigin] = useState<Origin | null>(null);
  const cam = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const cellRef = useRef(cell);
  const selRef = useRef<Selection | null>(sel);
  const listRef = useRef<{ list: readonly string[]; layout: Layout }>({ list: visible, layout });
  const raf = useRef(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [range, setRange] = useState({ c0: 0, c1: -1, r0: 0, r1: -1 });

  // 卡片打開時，被選的那一格浮在模糊上面，位置跟著相機
  const spotRef = useRef<HTMLDivElement>(null);
  const placeSpot = useCallback(() => {
    const el = spotRef.current;
    const s = selRef.current;
    const vp = viewportRef.current;
    if (!el || !s || !vp) return;
    const rect = vp.getBoundingClientRect();
    const k = cellRef.current;
    el.style.left = `${rect.left + s.c * k - cam.current.x}px`;
    el.style.top = `${rect.top + s.r * k - cam.current.y}px`;
    el.style.width = `${k}px`;
    el.style.height = `${k}px`;
  }, []);

  const apply = useCallback(() => {
    const { x, y } = cam.current;
    const c = cellRef.current;
    const { w, h } = sizeRef.current;
    if (layerRef.current) layerRef.current.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
    if (dotsRef.current) dotsRef.current.style.backgroundPosition = `${-x - c / 2}px ${-y - c / 2}px`;
    const next = {
      c0: Math.floor(x / c) - 1,
      c1: Math.ceil((x + w) / c),
      r0: Math.floor(y / c) - 1,
      r1: Math.ceil((y + h) / c),
    };
    setRange((prev) =>
      prev.c0 === next.c0 && prev.c1 === next.c1 && prev.r0 === next.r0 && prev.r1 === next.r1 ? prev : next,
    );
    placeSpot();
  }, [placeSpot]);

  const stop = useCallback(() => cancelAnimationFrame(raf.current), []);

  const animateTo = useCallback(
    (x: number, y: number, instant = false) => {
      stop();
      if (instant || reduce) {
        cam.current = { x, y };
        apply();
        return;
      }
      const from = { ...cam.current };
      const start = performance.now();
      const dur = 460;
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        cam.current = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
        apply();
        if (p < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, reduce, stop],
  );

  /** 把某一格移到舒服的位置：寬螢幕在左邊四成處，右邊留給卡片；窄螢幕在上方，下方留給卡片 */
  const focusCell = useCallback(
    (c: number, r: number, instant = false) => {
      const { w, h } = sizeRef.current;
      const k = cellRef.current;
      // 卡片開著時放在卡片左邊的空白中間，才不會被卡片蓋住
      const fx = w < 640 ? 0.5 : selRef.current ? Math.max(0.08, (w - Math.min(680, w - 32)) / 4 / w) : 0.38;
      const fy = w < 640 ? 0.26 : 0.5;
      animateTo(c * k + k / 2 - w * fx, r * k + k / 2 - h * fy, instant);
    },
    [animateTo],
  );

  const centerBlock = useCallback(
    (instant = false) => {
      const { w, h } = sizeRef.current;
      const k = cellRef.current;
      const L = listRef.current.layout;
      animateTo((L.cols * k) / 2 - w / 2, (L.rows * k) / 2 - h / 2 + TOOLBAR_SPACE / 4, instant);
    },
    [animateTo],
  );

  /** 離 (c, r) 最近、畫著這個圖示的格子 */
  const findNearest = useCallback((name: string, c: number, r: number, radius = 10): Selection | null => {
    const { list, layout: L } = listRef.current;
    for (let d = 0; d <= radius; d++) {
      for (let dr = -d; dr <= d; dr++) {
        for (let dc = -d; dc <= d; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue;
          if (nameAt(list, L, c + dc, r + dr) === name) return { name, c: c + dc, r: r + dr };
        }
      }
    }
    return null;
  }, []);

  const canonical = useCallback((name: string): Selection | null => {
    const { list, layout: L } = listRef.current;
    const i = list.indexOf(name);
    return i < 0 ? null : { name, c: i % L.cols, r: Math.floor(i / L.cols) };
  }, []);

  /** 選一個圖示：附近有就選附近那格，沒有就飛到它在清單裡的位置 */
  const goTo = useCallback(
    (name: string, instant = false) => {
      const s = selRef.current;
      const { w, h } = sizeRef.current;
      const k = cellRef.current;
      const cc = s ? s.c : Math.floor((cam.current.x + w / 2) / k);
      const rr = s ? s.r : Math.floor((cam.current.y + h / 2) / k);
      const near = findNearest(name, cc, rr);
      if (near) {
        const sx = near.c * k - cam.current.x;
        const sy = near.r * k - cam.current.y;
        setSel(near);
        // 卡片開著時中間被卡片蓋住，一律移到卡片旁邊
        if (s || sx < PAD || sy < TOOLBAR_SPACE || sx + k > w - PAD || sy + k > h - PAD) focusCell(near.c, near.r, instant);
        return;
      }
      const far = canonical(name);
      if (!far) return setSel(null);
      setSel(far);
      focusCell(far.c, far.r, instant);
    },
    [canonical, findNearest, focusCell],
  );

  useLayoutEffect(() => {
    selRef.current = sel;
    listRef.current = { list: visible, layout };
    placeSpot();
  });

  // 縮放時讓畫面中心不動
  const zoomCenter = useRef<{ x: number; y: number } | null>(null);
  const changeZoom = useCallback((next: number) => {
    const z = clamp(next, 0, ZOOMS.length - 1);
    setZoom((prev) => {
      if (prev === z) return prev;
      const { w, h } = sizeRef.current;
      const k = ZOOMS[prev].cell;
      zoomCenter.current = { x: (cam.current.x + w / 2) / k, y: (cam.current.y + h / 2) / k };
      return z;
    });
  }, []);
  useLayoutEffect(() => {
    cellRef.current = cell;
    const center = zoomCenter.current;
    zoomCenter.current = null;
    if (center) {
      const { w, h } = sizeRef.current;
      cam.current = { x: center.x * cell - w / 2, y: center.y * cell - h / 2 };
    }
    apply();
  }, [cell, apply]);

  // 量畫布大小
  const ready = useRef(false);
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      sizeRef.current = { w: width, h: height };
      setSize({ w: width, h: height });
      if (!ready.current && width > 0) {
        ready.current = true;
        // 手機一開始用小格，一個畫面才看得到夠多圖示
        if (width < 640) {
          cellRef.current = ZOOMS[0].cell;
          setZoom(0);
        }
        centerBlock(true);
      } else apply();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [apply, centerBlock]);

  // 網址帶 ?icon=scissors&style=line 直接打開那個圖示的卡片
  const pending = useRef<string | null>(null);
  const [linked, setLinked] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("style");
    const name = params.get("icon");
    const st: Style = s === "line" || s === "twotone" ? s : "pixel";
    if (s === "line" || s === "twotone") setStyle(s);
    if (name && (name in sources[st] || proById.has(name))) pending.current = name;
    setLinked(true);
  }, []);

  // 換風格、搜尋或分類之後：選的圖示還在就留著（找最近的一格），不在就關掉卡片
  const lastKey = useRef("");
  useLayoutEffect(() => {
    if (!linked || !size.w) return;
    if (lastKey.current === listKey) return;
    const first = lastKey.current === "";
    lastKey.current = listKey;
    const wanted = pending.current ?? selRef.current?.name ?? null;
    pending.current = null;
    if (wanted && visible.includes(wanted)) {
      if (first) {
        const far = canonical(wanted);
        if (far) {
          // 從分享連結進來：先把畫布捲到畫面上（扣掉頂部選單），浮起來的那一格才會在對的位置
          const vp = viewportRef.current;
          if (vp) window.scrollTo({ top: vp.getBoundingClientRect().top + window.scrollY - 56, behavior: "instant" });
          setSel(far);
          selRef.current = far;
          focusCell(far.c, far.r, true);
        }
      } else goTo(wanted);
      return;
    }
    setSel(null);
    if (!layout.tiled || !first) centerBlock(first);
  }, [linked, size.w, listKey, visible, layout.tiled, canonical, focusCell, goTo, centerBlock]);

  useEffect(() => {
    if (!linked) return;
    const url = new URL(window.location.href);
    if (sel) url.searchParams.set("icon", sel.name);
    else url.searchParams.delete("icon");
    if (isPixel) url.searchParams.delete("style");
    else url.searchParams.set("style", style);
    window.history.replaceState(null, "", url);
  }, [linked, sel, isPixel, style]);

  // ---- 拖曳與慣性 ----
  const drag = useRef<{ id: number; x: number; y: number; cx: number; cy: number; moved: boolean; t: number; lx: number; ly: number; vx: number; vy: number } | null>(null);
  const suppressClick = useRef(false);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("[data-canvas-ui]")) return;
    stop();
    suppressClick.current = false;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: cam.current.x, cy: cam.current.y, moved: false, t: performance.now(), lx: e.clientX, ly: e.clientY, vx: 0, vy: 0 };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    const now = performance.now();
    const dt = Math.max(1, now - d.t);
    d.vx = 0.8 * ((e.clientX - d.lx) / dt) + 0.2 * d.vx;
    d.vy = 0.8 * ((e.clientY - d.ly) / dt) + 0.2 * d.vy;
    d.t = now;
    d.lx = e.clientX;
    d.ly = e.clientY;
    cam.current = { x: d.cx - dx, y: d.cy - dy };
    apply();
  }
  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (!d.moved) return;
    suppressClick.current = true;
    setDragging(false);
    // 放開前停了一下就不滑
    if (reduce || performance.now() - d.t > 80) return;
    let vx = d.vx;
    let vy = d.vy;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const f = Math.pow(0.94, dt / 16);
      vx *= f;
      vy *= f;
      cam.current = { x: cam.current.x - vx * dt, y: cam.current.y - vy * dt };
      apply();
      if (Math.hypot(vx, vy) > 0.02) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }
  function onCanvasClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const target = e.target as HTMLElement;
    if (!target.closest("[data-canvas-ui]") && !target.closest("[data-cell]")) setSel(null);
  }

  // 滾輪：直向留給網頁捲動；橫向（觸控板左右滑）移動畫布；按著 Ctrl / ⌘ 或捏合是縮放
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let acc = 0;
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-canvas-ui]")) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const now = performance.now();
        if (now < lock) return;
        acc += e.deltaY;
        if (Math.abs(acc) > 30) {
          changeZoom(cellIndex() + (acc > 0 ? -1 : 1));
          acc = 0;
          lock = now + 280;
        }
        return;
      }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        stop();
        cam.current = { x: cam.current.x + e.deltaX, y: cam.current.y + e.deltaY };
        apply();
      }
    };
    const cellIndex = () => ZOOMS.findIndex((z) => z.cell === cellRef.current);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply, changeZoom, stop]);

  // ---- 卡片的開關與焦點 ----
  const opener = useRef<HTMLElement | null>(null);
  const originOf = useCallback(
    (rect: { left: number; top: number; width: number; height: number }): Origin | null =>
      reduce
        ? null
        : {
            dx: rect.left + rect.width / 2 - window.innerWidth / 2,
            dy: rect.top + rect.height / 2 - window.innerHeight / 2,
            s: Math.max(0.12, rect.width / Math.min(680, window.innerWidth - 32)),
          },
    [reduce],
  );
  const onSelect = useCallback(
    (name: string, c: number, r: number, _viaKeyboard: boolean, el: HTMLElement) => {
      opener.current = el;
      const rect = el.getBoundingClientRect();
      setOrigin(originOf(rect));
      const next = { name, c, r };
      setSel(next);
      // 被點的那一格在卡片底下時，移到卡片旁邊的空白，才看得到它浮在模糊上面
      const vw = window.innerWidth;
      const cw = Math.min(680, vw - 32);
      const cx = rect.left + rect.width / 2;
      if (vw >= 640 && cx > (vw - cw) / 2 - rect.width / 2 && cx < (vw + cw) / 2 + rect.width / 2) {
        selRef.current = next;
        focusCell(c, r);
      }
    },
    [originOf, focusCell],
  );
  const close = useCallback(() => {
    // 飛回那一格現在的位置（開著卡片時畫布可能已經移過）
    const s = selRef.current;
    const vp = viewportRef.current?.getBoundingClientRect();
    if (s && vp) {
      const k = cellRef.current;
      setOrigin(originOf({ left: vp.left + s.c * k - cam.current.x, top: vp.top + s.r * k - cam.current.y, width: k, height: k }));
    }
    setSel(null);
    const el = opener.current;
    if (el?.isConnected) el.focus({ preventScroll: true });
  }, [originOf]);
  const open = Boolean(sel);
  useEffect(() => {
    if (!open) return;
    cardRef.current?.focus({ preventScroll: true });
    // 開著卡片時鎖住網頁捲動；保留捲軸的位置，版面不會跳
    const html = document.documentElement;
    const prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
    html.style.overflow = "hidden";
    html.style.scrollbarGutter = "stable";
    return () => {
      html.style.overflow = prev.overflow;
      html.style.scrollbarGutter = prev.gutter;
    };
  }, [open]);

  // 換到相關圖示時，原本按的按鈕會被換掉，焦點掉到 body；拉回卡片，Esc 才會有效
  useEffect(() => {
    if (open && (!document.activeElement || document.activeElement === document.body)) cardRef.current?.focus({ preventScroll: true });
  }, [open, sel?.name]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !viewportRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // 焦點留在卡片裡
  function trapFocus(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>("button, input, select, [href], [tabindex]:not([tabindex='-1'])")];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === e.currentTarget)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && sel) {
      e.preventDefault();
      close();
      return;
    }
    if (e.target !== e.currentTarget) return;
    const k = cellRef.current;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-k, 0], ArrowRight: [k, 0], ArrowUp: [0, -k], ArrowDown: [0, k] };
    const mv = moves[e.key];
    if (mv) {
      e.preventDefault();
      animateTo(cam.current.x + mv[0] * 2, cam.current.y + mv[1] * 2);
    } else if (e.key === "+" || e.key === "=") changeZoom(zoom + 1);
    else if (e.key === "-") changeZoom(zoom - 1);
  }

  // ---- 自動播放：同名的格子一起播 ----
  const playing = useStaggerPlay(
    useMemo(() => visible.filter(hasMotion), [visible, hasMotion]),
    style,
    viewportRef,
    paused,
  );

  // ---- 卡片內容（沿用舊面板的邏輯） ----
  const selected = sel?.name ?? "";
  const previewRef = useRef<HTMLDivElement>(null);
  const selPro = proById.get(selected) ?? null;
  const kindOf = (name: string): MotionKind | null =>
    proById.has(name)
      ? (animatedOn && proMotion(proById.get(name)!, style)) || null
      : !animatedOn || !motionSet.has(name)
      ? null
      : isPixel
        ? pixelMotionKindOf(name as AnimatedPixelIconName)
        : isTwoTone
          ? twoToneMotionKindOf(name as AnimatedTwoToneIconName)
          : motionKindOf(name as AnimatedIconName);
  const kind = selected ? kindOf(selected) : null;
  const isAnimated = kind !== null;
  const iconSize = isPixel ? pixelSize : strokeSize;
  const sizeOptions = isPixel ? pixelSizes : sizes;
  const activeProp = kind && kind !== "hover" ? ` active={${kind === "loop" ? "loading" : "on"}}` : "";
  const tintProp = !pigment || !selected ? "" : isTwoTone ? ` style={${JSON.stringify(lineIconTone(selected))}}` : ` color="${lineIconTone(selected).color}"`;
  const lineProps = `${strokeSize !== 24 ? ` size={${strokeSize}}` : ""}${!isTwoTone && stroke !== 1.5 ? ` strokeWidth={${stroke}}` : ""}${tintProp}`;
  const pixelProps = `${pixelSize !== 16 ? ` size={${pixelSize}}` : ""}${pigment ? ` tone="pigment"` : ""}`;
  const component = isPixel
    ? isAnimated ? "AnimatedPixelIcon" : "PixelIcon"
    : isTwoTone
      ? isAnimated ? "AnimatedTwoToneIcon" : "TwoToneIcon"
      : isAnimated ? "AnimatedIcon" : "Icon";
  const jsx = selPro
    ? `<${isAnimated ? "Animated" : ""}${selPro.set.component}${isPixel ? "Pixel" : isTwoTone ? "TwoTone" : ""}Icon name="${selPro.entry.name}"${activeProp}${isPixel ? ` size={${pixelSize}}${pigment ? ` tone="pigment"` : ""}` : ""} />`
    : `<${component} name="${selected}"${activeProp}${isPixel ? pixelProps : lineProps} />`;
  const tone = pigment ? "pigment" : "ink";
  const tags = `${selPro ? selPro.entry.keywords : (iconKeywords[selected as IconName | PixelIconName] ?? "")}`
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12);
  const related = (groups.find((group) => group.icons.includes(selected))?.icons ?? []).filter((name) => name !== selected).slice(0, 8);
  const lineTint = (name: string) => (pigment ? (lineIconTone(name) as CSSProperties) : undefined);

  function renderIcon(name: string, px: number) {
    const k = kindOf(name);
    const active = k && k !== "hover" ? Boolean(toggled[name]) : undefined;
    if (proById.has(name)) {
      return <span key={`${name}-${style}-${tone}-${Boolean(k)}`} className="contents">{drawPro(renderers, name, style, { size: px, color: pigment, animated: Boolean(k), active })}</span>;
    }
    if (!(name in sources[style]) && !motionSet.has(name)) return null;
    if (isPixel) {
      return k ? (
        <AnimatedPixelIcon key={name} name={name as AnimatedPixelIconName} size={px} active={active} tone={tone} />
      ) : (
        <PixelIcon key={name} name={name as PixelIconName} size={px} tone={tone} />
      );
    }
    if (isTwoTone) {
      return k ? (
        <AnimatedTwoToneIcon key={`${name}-${tone}`} name={name as AnimatedTwoToneIconName} size={px} active={active} style={lineTint(name)} />
      ) : (
        <TwoToneIcon key={`${name}-${tone}`} name={name as TwoToneIconName} size={px} style={lineTint(name)} />
      );
    }
    return k ? (
      <AnimatedIcon key={`${name}-${tone}`} name={name as AnimatedIconName} size={px} strokeWidth={stroke} active={active} style={lineTint(name)} />
    ) : (
      <Icon key={`${name}-${tone}`} name={name as IconName} size={px} strokeWidth={stroke} style={lineTint(name)} />
    );
  }

  function standaloneSvg() {
    const svg = previewRef.current?.querySelector("svg[data-icon]");
    if (!svg) return null;
    return svg.outerHTML
      .replaceAll("var(--sunui-icon-accent, currentColor)", "currentColor")
      .replaceAll("var(--sunui-pixel-shine, #fff)", "#fff")
      .replace(/var\(--sunui-icon-(body|mid), currentColor\)/g, (_, k: "body" | "mid") =>
        !isPixel && pigment ? lineIconTone(selected)[`--sunui-icon-${k}`] : "currentColor",
      )
      .replace(/var\(--sunui-icon-(?:body|mid)-opacity, ([\d.]+)\)/g, (_, v: string) => (!isPixel && pigment ? "1" : v))
      .replaceAll("currentColor", !isPixel && pigment ? lineIconTone(selected).color : "currentColor")
      .replace(/var\(--sunui-pigment-[a-z]+, (oklch\([^)]*\))\)/g, "$1")
      .replace(/ width="[^"]*" height="[^"]*"/, ` width="${iconSize}" height="${iconSize}"`)
      .replace(/ data-icon="[^"]*"/, "")
      .replace(/ data-tone="[^"]*"/, "");
  }

  function download() {
    const value = standaloneSvg();
    if (!value) return;
    const url = URL.createObjectURL(new Blob([value], { type: "image/svg+xml" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${selected}${isPixel ? "-pixel" : isTwoTone ? "-twotone" : ""}.svg` });
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copy(which: "jsx" | "svg") {
    const value = which === "svg" ? standaloneSvg() : jsx;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 1400);
  }

  const styleIcon: Record<Style, ReactNode> = {
    line: <Icon name="coupon" size={16} />,
    twotone: <TwoToneIcon name="heart" size={16} />,
    pixel: <PixelIcon name="heart" size={16} />,
  };

  // ---- 這一幀要畫的格子 ----
  const cells: ReactNode[] = [];
  if (size.w > 0) {
    for (let r = range.r0; r <= range.r1; r++) {
      for (let c = range.c0; c <= range.c1; c++) {
        const name = nameAt(visible, layout, c, r);
        if (!name) continue;
        cells.push(
          <CanvasCell
            key={`${c},${r},${style},${name},${pigment}`}
            name={name}
            c={c}
            r={r}
            cell={cell}
            iconSize={Z[style]}
            variant={style}
            animated={hasMotion(name)}
            color={pigment}
            on={Boolean(playing[name])}
            renderers={renderers}
            proLabel={pt.badge}
            selected={sel?.c === c && sel?.r === r}
            onSelect={onSelect}
          />,
        );
      }
    }
  }

  return (
    // id 給 /r/pro 回應裡的「Icon sets: /icons#pro-icons」連結用：Pro 圖示組現在就在這張畫布上
    <section
      id="pro-icons"
      aria-label={t.canvasLabel}
      className="relative mx-[calc(50%-50vw)] scroll-mt-14 [--sunui-icon-accent:currentColor]"
    >
      {/* 可拖曳、可用方向鍵移動的畫布；格子本身是按鈕 */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={viewportRef}
        role="application"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-roledescription="canvas"
        aria-label={`${t.canvasLabel}. ${t.dragHint}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onCanvasClick}
        onKeyDown={onKeyDown}
        className={cn(
          "relative h-[calc(100svh-3.5rem)] max-h-[1000px] min-h-[520px] touch-none overflow-hidden border-y border-line bg-bg outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {/* 格線交點的小點，跟著相機移動 */}
        <div
          ref={dotsRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, var(--line-strong) 1px, transparent 1.5px)",
            backgroundSize: `${cell}px ${cell}px`,
          }}
        />

        <div ref={layerRef} className="absolute top-0 left-0 will-change-transform">
          {cells}
        </div>

        {visible.length === 0 && (
          <p className="absolute inset-0 grid place-items-center text-sm text-subtle">{format(t.noMatch, { q: query })}</p>
        )}

        {/* 四邊淡出，讓畫布像是繼續延伸出去 */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-bg via-bg/70 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent" />

        {/* 上方工具列 */}
        <div data-canvas-ui className="absolute inset-x-3 top-3 z-20 flex cursor-auto flex-wrap items-center gap-2 sm:inset-x-4">
          <label className="relative min-w-0 flex-1 basis-48 sm:max-w-72">
            <span className="sr-only">{t.searchLabel}</span>
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={format(t.searchPlaceholder, { n: counts[style] + proTotal })}
              className="h-9 w-full rounded-md bg-card pr-3 pl-9 text-sm shadow-e1 outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Segment
            label={t.styleLabel}
            options={["pixel", "twotone", "line"] as const}
            value={style}
            onChange={(next) => {
              setStyle(next);
              setCategory("all");
            }}
            render={(s) => (
              <>
                {styleIcon[s]}
                <span className="hidden sm:inline">{s === "line" ? t.line : s === "twotone" ? t.twoTone : t.pixel}</span>
                <span className="font-mono text-[11px] tabular-nums text-subtle">{counts[s] + proTotal}</span>
              </>
            )}
          />
          <Segment
            label={t.colorLabel}
            options={["color", "mono"] as const}
            value={pigment ? "color" : "mono"}
            onChange={(v) => setPigment(v === "color")}
            render={(v) => (v === "color" ? t.color : t.mono)}
          />
          <label className="relative">
            <span className="sr-only">{t.categoryLabel}</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-9 appearance-none rounded-md bg-card pr-8 pl-3 text-sm font-medium shadow-e1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[{ id: "all", title: t.all }, ...groups].map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-subtle" />
          </label>
        </div>

        {/* 左下：數量與操作提示 */}
        <p
          data-canvas-ui
          className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-md bg-card px-3 py-1.5 text-xs text-subtle shadow-e1 sm:left-4"
        >
          <span className="font-mono tabular-nums text-fg">{format(t.countLabel, { n: visible.length })}</span>
          <span aria-hidden className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{t.dragHint}</span>
        </p>

        {/* 右下：播放、縮放、回到中央 */}
        <div
          data-canvas-ui
          className={cn(
            "absolute right-3 bottom-3 z-20 flex cursor-auto items-center gap-0.5 rounded-md bg-card p-0.5 shadow-e1 sm:right-4",
          )}
        >
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
            className="h-8 rounded-[4px] px-2.5 text-xs font-medium text-subtle transition-colors hover:bg-stage hover:text-fg motion-reduce:hidden"
          >
            {paused ? t.play : t.pause}
          </button>
          <span aria-hidden className="mx-0.5 h-4 w-px bg-line motion-reduce:hidden" />
          <ToolButton label={t.zoomOut} onClick={() => changeZoom(zoom - 1)} disabled={zoom === 0}>
            <Icon name="minus" size={14} />
          </ToolButton>
          <span className="w-8 text-center font-mono text-[11px] tabular-nums text-subtle">{["S", "M", "L"][zoom]}</span>
          <ToolButton label={t.zoomIn} onClick={() => changeZoom(zoom + 1)} disabled={zoom === ZOOMS.length - 1}>
            <Icon name="plus" size={14} />
          </ToolButton>
          <ToolButton label={t.recenter} onClick={() => (sel ? focusCell(sel.c, sel.r) : centerBlock())}>
            <Icon name="map-pin" size={14} />
          </ToolButton>
        </div>

        {/* 細節卡片：在畫面正中央，四周模糊；從被點的那一格飛出來 */}
        <AnimatePresence custom={origin}>
          {sel && (
            <motion.div
              key="backdrop"
              data-canvas-ui
              aria-hidden
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: DURATION.panelIn, ease: EASE_SITE } }}
              exit={{ opacity: 0, transition: { duration: DURATION.panelOut, ease: EASE_SITE } }}
              className="fixed inset-0 z-50 touch-none bg-bg/45 backdrop-blur-md"
            />
          )}
          {sel && (
            <motion.div
              key="spot"
              ref={spotRef}
              aria-hidden
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: DURATION.panelIn, ease: EASE_SITE } }}
              exit={{ opacity: 0, transition: { duration: DURATION.panelOut, ease: EASE_SITE } }}
              className="pointer-events-none fixed z-50 p-1"
            >
              <div className="grid size-full place-items-center rounded-xl bg-card text-fg/85 shadow-e2 ring-2 ring-fg">
                <CellIcon
                  name={sel.name}
                  variant={style}
                  animated={hasMotion(sel.name)}
                  color={pigment}
                  on={Boolean(playing[sel.name])}
                  renderers={renderers}
                  size={Z[style]}
                />
              </div>
            </motion.div>
          )}
          {sel && (
            <motion.div
              key="card"
              ref={cardRef}
              data-canvas-ui
              role="dialog"
              aria-modal="true"
              aria-label={shortName(selected)}
              tabIndex={-1}
              custom={origin}
              variants={cardVariants}
              initial="from"
              animate="shown"
              exit="from"
              onKeyDown={trapFocus}
              className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100svh-2rem)] w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 cursor-auto overflow-y-auto overscroll-contain rounded-2xl bg-card p-5 text-fg shadow-e3 outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-mono text-sm tracking-[0.04em]">
                    <span className="truncate">{shortName(selected)}</span>
                    {selPro && (
                      <span className="shrink-0 rounded-[4px] bg-fg px-1.5 py-px font-sans text-[10px] font-semibold tracking-wide text-bg">
                        {pt.badge} · {pt.sets[selPro.set.id]?.title ?? selPro.set.title}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium tracking-[0.14em] text-subtle uppercase">
                    {isAnimated ? format(t.animatedKind, { kind: kindLabel[kind!] }) : isPixel ? t.pixelSelected : t.selected}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t.close}
                  className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-stage hover:text-fg"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <motion.div variants={sectionVariants} custom={0} initial="from" animate="shown">
              <div ref={previewRef} className="relative grid aspect-square place-items-center rounded-xl bg-stage/60">
                <div className="relative">
                  {keylines && <Keylines pixel={isPixel} size={160} />}
                  {renderIcon(selected, 160)}
                </div>
                <button
                  type="button"
                  aria-pressed={keylines}
                  onClick={() => setKeylines((on) => !on)}
                  className={cn(
                    "absolute right-2 bottom-2 h-6 rounded-[5px] px-2 font-mono text-[10px] transition-colors",
                    keylines ? "bg-card text-fg shadow-e1" : "text-subtle hover:text-fg",
                  )}
                >
                  {t.keylines}
                </button>
              </div>

              {isAnimated ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-pretty text-subtle">{kindHint[kind!]}</p>
                  {kind !== "hover" && (
                    <button
                      type="button"
                      onClick={() => setToggled((prev) => ({ ...prev, [selected]: !prev[selected] }))}
                      aria-pressed={Boolean(toggled[selected])}
                      className="btn-secondary h-8 shrink-0 rounded-md px-3 font-mono text-[11px]"
                    >
                      active={String(Boolean(toggled[selected]))}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex items-end justify-center gap-5" aria-label={t.sizeScale}>
                  {sizeOptions.map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1.5">
                      {renderIcon(selected, s)}
                      <span className="font-mono text-[10px] tabular-nums text-subtle">{s}</span>
                    </div>
                  ))}
                </div>
              )}

              </motion.div>
              <motion.div variants={sectionVariants} custom={1} initial="from" animate="shown" className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Segment
                  label={t.size}
                  prefix={t.size}
                  options={sizeOptions.map(String) as readonly string[]}
                  value={String(iconSize)}
                  onChange={(v) => (isPixel ? setPixelSize : setStrokeSize)(Number(v))}
                  render={(v) => <span className="font-mono text-[11px] tabular-nums">{v}</span>}
                  compact
                />
                {style === "line" && !selPro && (
                  <Segment
                    label={t.stroke}
                    prefix={t.stroke}
                    options={strokes.map(String) as readonly string[]}
                    value={String(stroke)}
                    onChange={(v) => setStroke(Number(v))}
                    render={(v) => <span className="font-mono text-[11px] tabular-nums">{v}</span>}
                    compact
                  />
                )}
                {hasMotion(selected) && (
                  <button
                    type="button"
                    aria-pressed={animatedOn}
                    onClick={() => setAnimatedOn((on) => !on)}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                      animatedOn ? "bg-stage text-fg" : "text-subtle hover:text-fg",
                    )}
                  >
                    <AnimatedIcon name="activity" size={14} />
                    {t.animated}
                  </button>
                )}
              </div>

              <pre className="mt-3 overflow-x-auto rounded-md bg-stage/60 px-3 py-2 font-mono text-[12px]">{jsx}</pre>
              {selPro ? (
                <div className="mt-3">
                  {!renderers && <p className="mb-2 text-xs text-pretty text-subtle">{pt.locked}</p>}
                  <p className="text-xs font-medium text-subtle">{pt.install}</p>
                  <div className="mt-1.5">{proInstalls[selPro.set.id]?.[isAnimated ? (`${style}-animated` as const) : style]}</div>
                  <p className="mt-2 text-xs text-pretty text-subtle">{pt.included}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/pricing" className="btn-primary flex h-9 items-center rounded-md px-3 text-xs font-medium">
                      {pt.getPro}
                    </Link>
                    {selPro.set.scenes[0] && pt.sets[selPro.set.id]?.scene && (
                      <Link href={`/blocks/${selPro.set.scenes[0]}`} className="btn-secondary flex h-9 items-center rounded-md px-3 text-xs font-medium">
                        {pt.sets[selPro.set.id]?.scene}
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
              <div className={cn("mt-2 grid gap-2", isAnimated ? "grid-cols-1" : "grid-cols-3")}>
                <button
                  type="button"
                  onClick={() => copy("jsx")}
                  className="btn-primary flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-medium"
                >
                  <Icon name={copied === "jsx" ? "check" : "copy"} size={14} />
                  {copied === "jsx" ? t.copied : t.copyJsx}
                </button>
                {!isAnimated && (
                  <>
                    <button
                      type="button"
                      onClick={() => copy("svg")}
                      className="btn-secondary flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-medium"
                    >
                      <Icon name={copied === "svg" ? "check" : "copy"} size={14} />
                      {copied === "svg" ? t.copied : "SVG"}
                    </button>
                    <button
                      type="button"
                      onClick={download}
                      aria-label={t.downloadSvg}
                      title={t.downloadSvg}
                      className="btn-secondary flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-medium"
                    >
                      <Icon name="download" size={14} />
                      .svg
                    </button>
                  </>
                )}
              </div>
              )}

              {tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-medium tracking-[0.14em] text-subtle uppercase">{t.tags}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <li key={tag}>
                        <button
                          type="button"
                          onClick={() => setQuery(tag)}
                          className="h-6 rounded-[5px] bg-stage/70 px-2 text-[11px] transition-colors hover:bg-stage"
                        >
                          {tag}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {related.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-medium tracking-[0.14em] text-subtle uppercase">{t.related}</p>
                  <ul className="mt-2 grid grid-cols-8 gap-1">
                    {related.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          title={shortName(name)}
                          aria-label={shortName(name)}
                          onClick={() => goTo(name)}
                          className="grid aspect-square w-full place-items-center rounded-[5px] transition-colors hover:bg-stage"
                        >
                          {renderIcon(name, isPixel ? 16 : 20)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/** 畫布上的一格：沒有文字，名稱放在 title 與 aria-label；動態由外部的 on 驅動 */
const CanvasCell = memo(function CanvasCell({
  name,
  c,
  r,
  cell,
  iconSize,
  variant,
  animated,
  color,
  on,
  renderers,
  proLabel,
  selected,
  onSelect,
}: {
  name: string;
  c: number;
  r: number;
  cell: number;
  iconSize: number;
  variant: Style;
  animated: boolean;
  color: boolean;
  on: boolean;
  renderers: Renderers;
  proLabel: string;
  selected: boolean;
  onSelect: (name: string, c: number, r: number, viaKeyboard: boolean, el: HTMLElement) => void;
}) {
  const pro = proById.has(name);
  return (
    <div data-cell className="absolute p-1" style={{ left: c * cell, top: r * cell, width: cell, height: cell }}>
      <button
        type="button"
        title={pro ? `${shortName(name)} · ${proLabel}` : name}
        aria-label={pro ? `${shortName(name)}, ${proLabel}` : name}
        aria-pressed={selected}
        onClick={(e) => onSelect(name, c, r, e.detail === 0, e.currentTarget)}
        className={cn(
          "relative grid size-full cursor-pointer place-items-center rounded-xl text-fg/85 transition-[background-color,box-shadow,scale] duration-150 ease-site active:scale-95",
          selected ? "bg-card shadow-e2 ring-2 ring-fg" : "hover:bg-card hover:shadow-e1",
        )}
      >
        <CellIcon name={name} variant={variant} animated={animated} color={color} on={on} size={iconSize} renderers={renderers} />
        {/* Pro 的小記號：格子夠大時才出現 */}
        {pro && cell >= 96 && (
          <span aria-hidden className="absolute top-1.5 right-1.5 rounded-[3px] bg-fg/10 px-1 font-mono text-[9px] leading-[14px] font-semibold tracking-wide text-subtle">
            {proLabel.toUpperCase()}
          </span>
        )}
      </button>
    </div>
  );
});

/** 格子裡的圖示本體；畫布格子和卡片打開時浮在模糊上面的那一格共用 */
function CellIcon({
  name,
  variant,
  animated,
  color,
  on,
  size: iconSize,
  renderers,
}: {
  name: string;
  variant: Style;
  animated: boolean;
  color: boolean;
  on: boolean;
  size: number;
  renderers: Renderers;
}) {
  if (proById.has(name)) return <>{drawPro(renderers, name, variant, { size: iconSize, color, animated, active: animated ? on : undefined })}</>;
  const tone = color ? "pigment" : "ink";
  const tint = color && variant !== "pixel" ? (lineIconTone(name) as CSSProperties) : undefined;
  return (
    <>
      {variant === "pixel" ? (
        animated ? (
          <AnimatedPixelIcon name={name as AnimatedPixelIconName} size={iconSize} active={on} tone={tone} />
        ) : (
          <PixelIcon name={name as PixelIconName} size={iconSize} tone={tone} />
        )
      ) : variant === "twotone" ? (
        animated ? (
          <AnimatedTwoToneIcon name={name as AnimatedTwoToneIconName} size={iconSize} active={on} style={tint} />
        ) : (
          <TwoToneIcon name={name as TwoToneIconName} size={iconSize} style={tint} />
        )
      ) : animated ? (
        <AnimatedIcon name={name as AnimatedIconName} size={iconSize} active={on} style={tint} />
      ) : (
        <Icon name={name as IconName} size={iconSize} style={tint} />
      )}
    </>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-8 place-items-center rounded-[4px] text-subtle transition-colors hover:bg-stage hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** 分段控制：軌道用 stage 灰，不用藍色（2026-11-25 使用者），選中格 card + e1 */
function Segment<T extends string>({
  label,
  prefix,
  options,
  value,
  onChange,
  render,
  compact,
}: {
  label: string;
  prefix?: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render: (option: T) => ReactNode;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex items-center rounded-md bg-stage p-0.5", compact ? "h-8" : "h-9 shadow-e1")}>
      {prefix && <span className="px-2 text-[11px] text-subtle">{prefix}</span>}
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "flex h-full items-center gap-1.5 rounded-[4px] text-sm font-medium transition-colors",
            compact ? "px-2" : "px-3",
            value === option ? "bg-card text-fg shadow-e1" : "text-subtle hover:text-fg",
          )}
        >
          {render(option)}
        </button>
      ))}
    </div>
  );
}

/** 預覽的網格與 keyline，數字照 ICONS.md：線條版 24 格、內容 3 到 21、圓 8.5、方 7；像素版 16 格、內容 1 到 14 */
function Keylines({ pixel, size }: { pixel: boolean; size: number }) {
  const n = pixel ? 16 : 24;
  const lines = Array.from({ length: n + 1 }, (_, i) => i);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      className="pointer-events-none absolute inset-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      overflow="visible"
    >
      {lines.map((i) => (
        <path key={i} d={`M${i} 0V${n}M0 ${i}H${n}`} vectorEffect="non-scaling-stroke" opacity={i % (pixel ? 4 : 6) === 0 ? 0.35 : 0.14} />
      ))}
      {pixel ? (
        <rect x={1} y={1} width={14} height={14} vectorEffect="non-scaling-stroke" opacity={0.7} />
      ) : (
        <g opacity={0.7}>
          <rect x={3} y={3} width={18} height={18} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <circle cx={12} cy={12} r={8.5} vectorEffect="non-scaling-stroke" />
          <rect x={5} y={5} width={14} height={14} rx={1} vectorEffect="non-scaling-stroke" />
        </g>
      )}
    </svg>
  );
}
