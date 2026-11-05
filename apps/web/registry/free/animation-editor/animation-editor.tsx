"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* 型別                                                               */
/* ------------------------------------------------------------------ */

export interface AnimationElement<T = unknown> {
  id: string;
  type?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  groupId?: string;
  data?: T;
}

/** 某一刻的畫布狀態：所有元素、畫布位置、畫布縮放 */
export interface CanvasSnapshot<T = unknown> {
  elements: AnimationElement<T>[];
  offset: { x: number; y: number };
  scale: number;
}

export interface AnimationKeyframe<T = unknown> extends CanvasSnapshot<T> {
  id: string;
  name: string;
  /** 時間戳（秒） */
  timestamp: number;
}

export type InterpolatedElement<T = unknown> = AnimationElement<T> & { opacity: number };

export interface InterpolatedState<T = unknown> {
  elements: InterpolatedElement<T>[];
  offset: { x: number; y: number };
  scale: number;
}

/* ------------------------------------------------------------------ */
/* 工具函式（編輯器、預覽與外部共用）                                 */
/* ------------------------------------------------------------------ */

export function cloneAnimationElement<T>(el: AnimationElement<T>): AnimationElement<T> {
  return {
    ...el,
    position: { ...el.position },
    size: { ...el.size },
    data: el.data ? (JSON.parse(JSON.stringify(el.data)) as T) : el.data,
  };
}

export function sortKeyframes<T>(keyframes: AnimationKeyframe<T>[]) {
  return [...keyframes].sort((a, b) => a.timestamp - b.timestamp);
}

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

/** 依捲動進度（0 到 1）算出插值後的畫布狀態，與原本預覽的規則相同 */
export function interpolateKeyframes<T>(keyframes: AnimationKeyframe<T>[], progress: number): InterpolatedState<T> {
  if (keyframes.length === 0) return { elements: [], offset: { x: 0, y: 0 }, scale: 1 };

  const sorted = sortKeyframes(keyframes);
  if (sorted.length === 1) {
    return {
      elements: sorted[0].elements.map((el) => ({ ...el, opacity: 1 })),
      offset: sorted[0].offset,
      scale: sorted[0].scale,
    };
  }

  const maxTimestamp = sorted[sorted.length - 1].timestamp;
  const currentTime = progress * maxTimestamp;

  let currentFrameIndex = 0;
  let nextFrameIndex = 0;
  let isAtKeyframe = false;

  // 正好落在某個關鍵影格的時間點
  for (let i = 0; i < sorted.length; i++) {
    if (Math.abs(currentTime - sorted[i].timestamp) < 0.01) {
      currentFrameIndex = i;
      nextFrameIndex = i;
      isAtKeyframe = true;
      break;
    }
  }

  if (!isAtKeyframe) {
    for (let i = 0; i < sorted.length - 1; i++) {
      if (currentTime > sorted[i].timestamp && currentTime < sorted[i + 1].timestamp) {
        currentFrameIndex = i;
        nextFrameIndex = i + 1;
        break;
      }
    }
    if (currentTime <= sorted[0].timestamp) {
      currentFrameIndex = 0;
      nextFrameIndex = 0;
      isAtKeyframe = true;
    }
    if (currentTime >= maxTimestamp) {
      currentFrameIndex = sorted.length - 1;
      nextFrameIndex = sorted.length - 1;
      isAtKeyframe = true;
    }
  }

  const current = sorted[currentFrameIndex];
  const next = sorted[nextFrameIndex];
  const sameFrame = currentFrameIndex === nextFrameIndex;
  const timeRange = sameFrame || isAtKeyframe ? 0 : next.timestamp - current.timestamp;
  const t = timeRange > 0 ? (currentTime - current.timestamp) / timeRange : 0;

  const currentMap = new Map(current.elements.map((el) => [el.id, el]));
  const nextMap = new Map(next.elements.map((el) => [el.id, el]));

  const visibleIds = new Set<string>();
  currentMap.forEach((_, id) => visibleIds.add(id));
  if (!(isAtKeyframe || sameFrame)) nextMap.forEach((_, id) => visibleIds.add(id));

  const elements: InterpolatedElement<T>[] = [];
  visibleIds.forEach((id) => {
    const a = currentMap.get(id);
    const b = nextMap.get(id);

    // 只在其中一格存在的元素做淡入淡出
    let opacity = 1;
    if (a && !b && !sameFrame) opacity = 1 - t;
    else if (!a && b && !sameFrame) opacity = t;

    if (a && b && !sameFrame) {
      elements.push({
        ...cloneAnimationElement(a),
        position: { x: lerp(a.position.x, b.position.x, t), y: lerp(a.position.y, b.position.y, t) },
        size: { width: lerp(a.size.width, b.size.width, t), height: lerp(a.size.height, b.size.height, t) },
        zIndex: Math.round(lerp(a.zIndex, b.zIndex, t)),
        opacity,
      });
      return;
    }
    const only = a ?? b;
    if (only) elements.push({ ...cloneAnimationElement(only), opacity });
  });

  return {
    elements: elements.filter((el) => el.opacity > 0),
    offset: { x: lerp(current.offset.x, next.offset.x, t), y: lerp(current.offset.y, next.offset.y, t) },
    scale: lerp(current.scale, next.scale, t),
  };
}

/** 依進度算出「目前第幾個關鍵影格」（從 0 起算） */
export function getKeyframeIndexAt<T>(keyframes: AnimationKeyframe<T>[], progress: number) {
  if (keyframes.length === 0) return 0;
  const sorted = sortKeyframes(keyframes);
  const currentTime = progress * sorted[sorted.length - 1].timestamp;
  for (let i = 0; i < sorted.length; i++) {
    if (currentTime <= sorted[i].timestamp) return i;
  }
  return sorted.length - 1;
}

/** 畫布層的 CSS（位移加縮放，原點左上） */
export function getCanvasStyle(state: Pick<CanvasSnapshot, "offset" | "scale">): CSSProperties {
  return {
    transform: `translate(${state.offset.x}px, ${state.offset.y}px) scale(${state.scale})`,
    transformOrigin: "0 0",
  };
}

/** 單一元素的 CSS（絕對定位、尺寸、層級、透明度） */
export function getElementStyle(el: AnimationElement | InterpolatedElement): CSSProperties {
  return {
    position: "absolute",
    left: el.position.x,
    top: el.position.y,
    width: el.size.width,
    height: el.size.height,
    zIndex: el.zIndex,
    opacity: "opacity" in el ? el.opacity : 1,
  };
}

type Frame = { x: number; y: number; width: number; height: number; opacity: number };

function elementFrames<T>(sorted: AnimationKeyframe<T>[], elementId: string): Frame[] | null {
  const found = sorted.map((kf) => kf.elements.find((el) => el.id === elementId));
  if (!found.some(Boolean)) return null;
  return found.map((el, i) => {
    // 這一格沒有該元素：沿用最近一格的位置，透明度 0
    let ref = el;
    if (!ref) {
      for (let j = i - 1; j >= 0 && !ref; j--) ref = found[j];
      for (let j = i + 1; j < found.length && !ref; j++) ref = found[j];
    }
    const r = ref!;
    return { x: r.position.x, y: r.position.y, width: r.size.width, height: r.size.height, opacity: el ? 1 : 0 };
  });
}

function frameTimes<T>(sorted: AnimationKeyframe<T>[]) {
  const max = sorted.length ? sorted[sorted.length - 1].timestamp : 0;
  return { max, times: sorted.map((kf) => (max > 0 ? kf.timestamp / max : 0)) };
}

/**
 * 把關鍵影格轉成某個元素的 framer-motion props（以時間戳秒數播放、線性插值）。
 * 用法：<motion.div style={{ position: "absolute", left: 0, top: 0 }} {...toElementMotionProps(kfs, id)} />
 */
export function toElementMotionProps<T>(keyframes: AnimationKeyframe<T>[], elementId: string, options?: { repeat?: number }) {
  const sorted = sortKeyframes(keyframes);
  const frames = elementFrames(sorted, elementId);
  if (!frames) return null;
  const { max, times } = frameTimes(sorted);
  const pick = (k: keyof Frame) => frames.map((f) => f[k]);
  return {
    initial: frames[0],
    animate: { x: pick("x"), y: pick("y"), width: pick("width"), height: pick("height"), opacity: pick("opacity") },
    transition: { duration: Math.max(max, 0.001), times, ease: "linear" as const, repeat: options?.repeat ?? 0 },
  };
}

/** 畫布層（offset、scale）的 framer-motion props */
export function toCanvasMotionProps<T>(keyframes: AnimationKeyframe<T>[], options?: { repeat?: number }) {
  const sorted = sortKeyframes(keyframes);
  if (!sorted.length) return null;
  const { max, times } = frameTimes(sorted);
  return {
    style: { transformOrigin: "0 0" } as CSSProperties,
    initial: { x: sorted[0].offset.x, y: sorted[0].offset.y, scale: sorted[0].scale },
    animate: { x: sorted.map((k) => k.offset.x), y: sorted.map((k) => k.offset.y), scale: sorted.map((k) => k.scale) },
    transition: { duration: Math.max(max, 0.001), times, ease: "linear" as const, repeat: options?.repeat ?? 0 },
  };
}

/**
 * 把關鍵影格轉成某個元素的 CSS @keyframes 與 animation 樣式。
 * 回傳的 css 放進 <style>，style 套在元素上（元素需 position: absolute; left: 0; top: 0）。
 */
export function toElementCssAnimation<T>(
  keyframes: AnimationKeyframe<T>[],
  elementId: string,
  name = `kf-${elementId}`,
  options?: { iterationCount?: number | "infinite" },
) {
  const sorted = sortKeyframes(keyframes);
  const frames = elementFrames(sorted, elementId);
  if (!frames) return null;
  const { max, times } = frameTimes(sorted);
  const body = frames
    .map(
      (f, i) =>
        `${+(times[i] * 100).toFixed(3)}%{transform:translate(${f.x}px,${f.y}px);width:${f.width}px;height:${f.height}px;opacity:${f.opacity}}`,
    )
    .join("");
  return {
    css: `@keyframes ${name}{${body}}`,
    style: {
      animation: `${name} ${Math.max(max, 0.001)}s linear ${options?.iterationCount ?? 1} both`,
    } as CSSProperties,
  };
}

/* ------------------------------------------------------------------ */
/* 樣式常數                                                           */
/* ------------------------------------------------------------------ */

/** 原本 canvas/page.tsx 的 .glassmorphism-panel，收斂成跟隨主題的實底面板（沿用名稱以免破壞 import） */
export const glassPanelStyle: CSSProperties = {
  background: "var(--card)",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)",
};

/** 強調色衍生的 CSS 變數；預設為畫布工具藍 #2563eb，只用在時間軸的標記與指示線 */
export function accentVars(accent = "#2563eb"): CSSProperties {
  return {
    "--ae-accent": accent,
    "--ae-accent-strong": `color-mix(in srgb, ${accent}, black 15%)`,
    "--ae-accent-stronger": `color-mix(in srgb, ${accent}, black 30%)`,
    "--ae-accent-soft": `color-mix(in srgb, ${accent}, white 25%)`,
    "--ae-accent-light": `color-mix(in srgb, ${accent}, white 45%)`,
  } as CSSProperties;
}

// 時間軸左右保留的百分比邊距
const MIN_PADDING = 4;
const AVAILABLE_WIDTH = 100 - MIN_PADDING * 2;

function timelinePosition(timestamp: number, maxTimestamp: number, index: number, count: number) {
  let position = maxTimestamp <= 0 ? MIN_PADDING : MIN_PADDING + (timestamp / maxTimestamp) * AVAILABLE_WIDTH;
  if (index === 0 && position < MIN_PADDING) position = MIN_PADDING;
  else if (index === count - 1 && position > 100 - MIN_PADDING) position = 100 - MIN_PADDING;
  if (isNaN(position) || !isFinite(position)) position = MIN_PADDING;
  return position;
}

/* ------------------------------------------------------------------ */
/* 圖示（照原本 heroicons outline 路徑）                              */
/* ------------------------------------------------------------------ */

function Icon({ d, className, style }: { d: string | string[]; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {(Array.isArray(d) ? d : [d]).map((p) => (
        <path key={p} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={p} />
      ))}
    </svg>
  );
}

const ICON = {
  chevronUp: "M5 15l7-7 7 7",
  plus: "M12 4v16m8-8H4",
  check: "M5 13l4 4L19 7",
  play: [
    "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
    "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  ],
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
};

/* ------------------------------------------------------------------ */
/* 編輯器                                                             */
/* ------------------------------------------------------------------ */

export interface AnimationEditorLabels {
  title: string;
  addKeyframe: string;
  saveKeyframe: string;
  preview: string;
  previewTitle: string;
  name: string;
  time: string;
  elements: string;
  zoom: string;
  deleteKeyframe: string;
  empty: string;
  copy: string;
  delete: string;
  copyShortcut: string;
  deleteShortcut: string;
  expand: string;
  collapse: string;
  timestamp: string;
  newKeyframeName: (n: number) => string;
  copySuffix: string;
  /** 欄位名稱與值之間的冒號 */
  colon: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, AnimationEditorLabels> = {
  en: {
    title: "Animation timeline",
    addKeyframe: "Add keyframe",
    saveKeyframe: "Save the current canvas state to this keyframe",
    preview: "Preview",
    previewTitle: "Preview animation",
    name: "Name",
    time: "Time",
    elements: "Elements",
    zoom: "Zoom",
    deleteKeyframe: "Delete keyframe",
    empty: "No keyframes yet. Click “Add keyframe” to start",
    copy: "Copy",
    delete: "Delete",
    copyShortcut: "Ctrl+C",
    deleteShortcut: "Delete",
    expand: "Expand",
    collapse: "Collapse",
    timestamp: "Keyframe time in seconds",
    newKeyframeName: (n) => `Keyframe ${n}`,
    copySuffix: " (copy)",
    colon: ": ",
  },
  "zh-TW": {
    title: "動畫時間軸",
    addKeyframe: "新增關鍵影格",
    saveKeyframe: "把目前的畫布狀態存到這個關鍵影格",
    preview: "預覽",
    previewTitle: "預覽動畫",
    name: "名稱",
    time: "時間",
    elements: "元素",
    zoom: "縮放",
    deleteKeyframe: "刪除關鍵影格",
    empty: "還沒有關鍵影格，按「新增關鍵影格」開始",
    copy: "複製",
    delete: "刪除",
    copyShortcut: "Ctrl+C",
    deleteShortcut: "Delete",
    expand: "展開",
    collapse: "收合",
    timestamp: "關鍵影格時間（秒）",
    newKeyframeName: (n) => `關鍵影格 ${n}`,
    copySuffix: "（副本）",
    colon: "：",
  },
  "zh-CN": {
    title: "动画时间轴",
    addKeyframe: "添加关键帧",
    saveKeyframe: "把当前的画布状态保存到这个关键帧",
    preview: "预览",
    previewTitle: "预览动画",
    name: "名称",
    time: "时间",
    elements: "元素",
    zoom: "缩放",
    deleteKeyframe: "删除关键帧",
    empty: "还没有关键帧，点击“添加关键帧”开始",
    copy: "复制",
    delete: "删除",
    copyShortcut: "Ctrl+C",
    deleteShortcut: "Delete",
    expand: "展开",
    collapse: "收起",
    timestamp: "关键帧时间（秒）",
    newKeyframeName: (n) => `关键帧 ${n}`,
    copySuffix: "（副本）",
    colon: "：",
  },
  ja: {
    title: "アニメーションタイムライン",
    addKeyframe: "キーフレームを追加",
    saveKeyframe: "現在のキャンバスの状態をこのキーフレームに保存",
    preview: "プレビュー",
    previewTitle: "アニメーションをプレビュー",
    name: "名前",
    time: "時間",
    elements: "要素",
    zoom: "ズーム",
    deleteKeyframe: "キーフレームを削除",
    empty: "キーフレームはまだありません。「キーフレームを追加」から始めましょう",
    copy: "コピー",
    delete: "削除",
    copyShortcut: "Ctrl+C",
    deleteShortcut: "Delete",
    expand: "展開",
    collapse: "折りたたむ",
    timestamp: "キーフレームの時間（秒）",
    newKeyframeName: (n) => `キーフレーム ${n}`,
    copySuffix: "（コピー）",
    colon: "：",
  },
};

export interface AnimationEditorProps<T = unknown> {
  /** 關鍵影格清單（受控） */
  value: AnimationKeyframe<T>[];
  onChange: (keyframes: AnimationKeyframe<T>[]) => void;
  /** 目前畫布狀態：新增或儲存關鍵影格時擷取 */
  snapshot: CanvasSnapshot<T>;
  /** 選中關鍵影格時，把該格的畫布狀態套回畫布 */
  onApplyKeyframe?: (snapshot: CanvasSnapshot<T>, keyframe: AnimationKeyframe<T>) => void;
  selectedKeyframeId?: string | null;
  defaultSelectedKeyframeId?: string | null;
  onSelectedKeyframeIdChange?: (id: string | null) => void;
  /** 按下「預覽」 */
  onPreview?: (keyframes: AnimationKeyframe<T>[]) => void;
  /** 畫布上有選中元素時設為 false，讓 Ctrl+C 與 Delete 交給畫布處理 */
  shortcutsEnabled?: boolean;
  /** 快捷鍵監聽範圍：整個視窗（原本行為）或只在面板內 */
  shortcutScope?: "window" | "panel";
  /** true：固定在視窗底部（原本行為）；false：跟著版面排列 */
  fixed?: boolean;
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<AnimationEditorLabels>;
  className?: string;
}

export function AnimationEditor<T = unknown>({
  value: keyframes,
  onChange,
  snapshot,
  onApplyKeyframe,
  selectedKeyframeId: selectedProp,
  defaultSelectedKeyframeId = null,
  onSelectedKeyframeIdChange,
  onPreview,
  shortcutsEnabled = true,
  shortcutScope = "window",
  fixed = true,
  accent,
  locale = "en",
  labels: labelsProp,
  className,
}: AnimationEditorProps<T>) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const reduce = useReducedMotion() ?? false;

  const [selectedInner, setSelectedInner] = useState<string | null>(defaultSelectedKeyframeId);
  const selectedKeyframeId = selectedProp !== undefined ? selectedProp : selectedInner;
  const setSelectedKeyframeId = useCallback(
    (id: string | null) => {
      if (selectedProp === undefined) setSelectedInner(id);
      onSelectedKeyframeIdChange?.(id);
    },
    [selectedProp, onSelectedKeyframeIdChange],
  );

  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [draggingKeyframeId, setDraggingKeyframeId] = useState<string | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; timestamp: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; keyframeId: string } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 掛載後觸發滑入動畫
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 點擊外部或 Esc 關閉右鍵選單
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  // 收起與展開
  const handleToggleMinimize = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => setIsMinimized(true), reduce ? 0 : 300);
    }
  }, [isMinimized, reduce]);

  const handleSelectKeyframe = useCallback(
    (keyframe: AnimationKeyframe<T>) => {
      setSelectedKeyframeId(keyframe.id);
      onApplyKeyframe?.(
        { elements: keyframe.elements.map(cloneAnimationElement), offset: { ...keyframe.offset }, scale: keyframe.scale },
        keyframe,
      );
    },
    [setSelectedKeyframeId, onApplyKeyframe],
  );

  const handleUpdateKeyframeTimestamp = useCallback(
    (id: string, timestamp: number) => onChange(keyframes.map((k) => (k.id === id ? { ...k, timestamp } : k))),
    [keyframes, onChange],
  );

  const handleKeyframeDragStart = useCallback(
    (e: ReactPointerEvent, keyframe: AnimationKeyframe<T>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingKeyframeId(keyframe.id);
      setHasDragged(false);
      // 開始拖動時立即選中
      if (selectedKeyframeId !== keyframe.id) handleSelectKeyframe(keyframe);
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        setDragStartPosition({ x: e.clientX - rect.left, timestamp: keyframe.timestamp });
      }
    },
    [selectedKeyframeId, handleSelectKeyframe],
  );

  // 拖動關鍵影格改時間戳
  useEffect(() => {
    if (!draggingKeyframeId || !timelineRef.current || !dragStartPosition) return;

    const handleMove = (e: PointerEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      if (Math.abs(mouseX - dragStartPosition.x) > 3) setHasDragged(true);

      const relativePosition = (mouseX / rect.width) * 100;
      const currentMax = keyframes.length > 0 ? Math.max(...keyframes.map((k) => k.timestamp)) : 1;
      const clamped = Math.max(MIN_PADDING, Math.min(100 - MIN_PADDING, relativePosition));
      const normalized = (clamped - MIN_PADDING) / AVAILABLE_WIDTH;
      handleUpdateKeyframeTimestamp(draggingKeyframeId, Math.max(0, normalized * currentMax));
    };

    const handleUp = () => {
      const keyframe = keyframes.find((k) => k.id === draggingKeyframeId);
      if (keyframe) handleSelectKeyframe(keyframe);
      setDraggingKeyframeId(null);
      setDragStartPosition(null);
      setHasDragged(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [draggingKeyframeId, dragStartPosition, handleUpdateKeyframeTimestamp, keyframes, handleSelectKeyframe]);

  // 新增關鍵影格（擷取目前畫布狀態）
  const handleAddKeyframe = useCallback(() => {
    const newKeyframe: AnimationKeyframe<T> = {
      id: `keyframe-${Date.now()}`,
      name: labels.newKeyframeName(keyframes.length + 1),
      timestamp: keyframes.length > 0 ? Math.max(...keyframes.map((k) => k.timestamp)) + 1 : 0,
      elements: snapshot.elements.map(cloneAnimationElement),
      offset: { ...snapshot.offset },
      scale: snapshot.scale,
    };
    onChange([...keyframes, newKeyframe]);
    setSelectedKeyframeId(newKeyframe.id);
  }, [keyframes, snapshot, labels, onChange, setSelectedKeyframeId]);

  // 複製關鍵影格：時間戳往後 0.1 秒，元素 id 加上 -copy 後綴（原本行為）
  const handleDuplicateKeyframe = useCallback(
    (id: string) => {
      const keyframe = keyframes.find((k) => k.id === id);
      if (!keyframe) return;
      const now = Date.now();
      const newKeyframe: AnimationKeyframe<T> = {
        ...keyframe,
        id: `keyframe-${now}-${Math.random()}`,
        name: `${keyframe.name}${labels.copySuffix}`,
        timestamp: keyframe.timestamp + 0.1,
        elements: keyframe.elements.map((el) => ({ ...cloneAnimationElement(el), id: `${el.id}-copy-${now}` })),
      };
      onChange([...keyframes, newKeyframe]);
      setSelectedKeyframeId(newKeyframe.id);
    },
    [keyframes, labels.copySuffix, onChange, setSelectedKeyframeId],
  );

  const handleDeleteKeyframe = useCallback(
    (id: string) => {
      const filtered = keyframes.filter((k) => k.id !== id);
      onChange(filtered);
      if (selectedKeyframeId === id) setSelectedKeyframeId(filtered.length > 0 ? filtered[0].id : null);
    },
    [keyframes, selectedKeyframeId, onChange, setSelectedKeyframeId],
  );

  // 快捷鍵：Ctrl/Cmd+C 複製、Delete/Backspace 刪除
  const handleShortcut = useCallback(
    (e: KeyboardEvent | ReactKeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (!shortcutsEnabled || e.defaultPrevented) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedKeyframeId) {
        e.preventDefault();
        e.stopPropagation();
        handleDuplicateKeyframe(selectedKeyframeId);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedKeyframeId) {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteKeyframe(selectedKeyframeId);
      }
    },
    [shortcutsEnabled, selectedKeyframeId, handleDuplicateKeyframe, handleDeleteKeyframe],
  );

  useEffect(() => {
    if (shortcutScope !== "window" || isMinimized || !isVisible) return;
    // bubble phase：讓畫布在 capture phase 先處理
    window.addEventListener("keydown", handleShortcut, false);
    return () => window.removeEventListener("keydown", handleShortcut, false);
  }, [shortcutScope, isMinimized, isVisible, handleShortcut]);

  // 儲存目前畫布狀態到選中的關鍵影格
  const handleUpdateCurrentKeyframe = useCallback(() => {
    if (!selectedKeyframeId) return;
    onChange(
      keyframes.map((k) =>
        k.id === selectedKeyframeId
          ? { ...k, elements: snapshot.elements.map(cloneAnimationElement), offset: { ...snapshot.offset }, scale: snapshot.scale }
          : k,
      ),
    );
  }, [selectedKeyframeId, snapshot, keyframes, onChange]);

  const handlePreview = useCallback(() => {
    if (keyframes.length === 0) return;
    onPreview?.(keyframes);
  }, [keyframes, onPreview]);

  const openContextMenu = (clientX: number, clientY: number, keyframe: AnimationKeyframe<T>) => {
    let x = clientX;
    let y = clientY;
    if (!fixed && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      x = Math.max(0, Math.min(clientX - rect.left, rect.width - 160));
      y = clientY - rect.top;
    }
    setContextMenu({ x, y, keyframeId: keyframe.id });
    if (selectedKeyframeId !== keyframe.id) handleSelectKeyframe(keyframe);
  };

  const sortedKeyframes = sortKeyframes(keyframes);
  const maxTimestamp = sortedKeyframes.length > 0 ? Math.max(...sortedKeyframes.map((k) => k.timestamp)) : 1;
  const selectedKeyframe = selectedKeyframeId ? sortedKeyframes.find((k) => k.id === selectedKeyframeId) : undefined;
  const selectedIndex = selectedKeyframe ? sortedKeyframes.indexOf(selectedKeyframe) : -1;

  const tabClass =
    "w-12 h-4 border border-b-0 border-border bg-card text-muted-foreground hover:bg-muted rounded-t-lg flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-accent)]";

  return (
    <div
      ref={rootRef}
      className={cn(fixed ? "contents" : "relative w-full", className)}
      style={accentVars(accent)}
      onKeyDown={shortcutScope === "panel" ? handleShortcut : undefined}
    >
      <div className={cn(!fixed && "relative overflow-hidden pt-4")}>
        {/* 收起狀態：底部的展開把手 */}
        {isMinimized && (
          <button
            type="button"
            onClick={handleToggleMinimize}
            className={cn(tabClass, fixed ? "fixed bottom-0 left-1/2 z-50 -translate-x-1/2" : "mx-auto")}
            aria-label={labels.expand}
            aria-expanded={false}
          >
            <Icon d={ICON.chevronUp} className="h-3 w-3" />
          </button>
        )}

        {!isMinimized && (
          <div
            role="region"
            aria-label={labels.title}
            className={cn(
              "z-50 transition-transform duration-300 ease-out motion-reduce:transition-none",
              fixed ? "fixed bottom-0 left-0 right-0" : "relative",
            )}
            style={{
              ...glassPanelStyle,
              borderLeft: "none",
              borderRight: "none",
              borderBottom: "none",
              transform: isVisible ? "translateY(0)" : "translateY(100%)",
            }}
          >
            {/* 面板上方的收起把手 */}
            <button
              type="button"
              onClick={handleToggleMinimize}
              className={cn(tabClass, "absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-full")}
              aria-label={labels.collapse}
              aria-expanded
            >
              <Icon d={ICON.chevronUp} className="h-3 w-3" style={{ transform: "rotate(180deg)" }} />
            </button>

            <div className="max-w-full px-4 py-3">
              {/* 標題與控制按鈕 */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-sm font-semibold text-foreground">{labels.title}</h3>
                  <button
                    type="button"
                    onClick={handleAddKeyframe}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    title={labels.addKeyframe}
                  >
                    <Icon d={ICON.plus} className="h-3.5 w-3.5" />
                    {labels.addKeyframe}
                  </button>
                  {selectedKeyframeId && (
                    <button
                      type="button"
                      onClick={handleUpdateCurrentKeyframe}
                      className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      title={labels.saveKeyframe}
                      aria-label={labels.saveKeyframe}
                    >
                      <Icon d={ICON.check} className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {keyframes.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePreview}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      title={labels.previewTitle}
                    >
                      <Icon d={ICON.play} className="h-3.5 w-3.5" />
                      {labels.preview}
                    </button>
                  )}
                </div>

                {/* 選中關鍵影格的資訊 */}
                {selectedKeyframe && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                    <span>
                      {labels.name}{labels.colon}<strong>{selectedKeyframe.name}</strong>
                    </span>
                    <span>
                      {labels.time}{labels.colon}<strong>{selectedKeyframe.timestamp.toFixed(1)}s</strong>
                    </span>
                    <span>
                      {labels.elements}{labels.colon}<strong>{selectedKeyframe.elements.length}</strong>
                    </span>
                    <span>
                      {labels.zoom}{labels.colon}<strong>{Math.round(selectedKeyframe.scale * 100)}%</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteKeyframe(selectedKeyframe.id)}
                      className="rounded px-2 py-1 text-destructive transition-colors hover:bg-destructive/10"
                      title={labels.deleteKeyframe}
                      aria-label={labels.deleteKeyframe}
                    >
                      <Icon d={ICON.trash} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 時間軸 */}
              <div className="relative h-20">
                {sortedKeyframes.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-lg bg-muted/50 px-2 text-center text-xs text-muted-foreground">
                    <span>{labels.empty}</span>
                  </div>
                ) : (
                  <div ref={timelineRef} className="relative h-full overflow-hidden rounded-lg bg-muted/50">
                    {/* 秒數刻度 */}
                    <div className="absolute inset-0 z-10 flex items-end px-4" aria-hidden="true">
                      {Array.from({ length: Math.ceil(maxTimestamp) + 1 }).map((_, i) => {
                        const tick = maxTimestamp > 0 ? MIN_PADDING + (i / maxTimestamp) * AVAILABLE_WIDTH : MIN_PADDING;
                        return (
                          <div key={i} className="absolute" style={{ left: `${tick}%`, height: "100%", transform: "translateX(-50%)" }}>
                            <div className="absolute bottom-0 left-1/2 top-0 w-px bg-border" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-muted-foreground">{i}s</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 關鍵影格標記 */}
                    <div className="relative z-20 h-full">
                      {sortedKeyframes.map((keyframe, index) => {
                        const position = timelinePosition(keyframe.timestamp, maxTimestamp, index, sortedKeyframes.length);
                        const isDragging = draggingKeyframeId === keyframe.id;
                        const isSelected = selectedKeyframeId === keyframe.id;

                        return (
                          <div
                            key={keyframe.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            aria-label={`${keyframe.name}, ${keyframe.timestamp.toFixed(1)}s`}
                            className={cn(
                              "group absolute bottom-0 top-0 flex cursor-move touch-none flex-col items-center outline-none",
                              !isDragging && "transition-all motion-reduce:transition-none",
                              isSelected ? "z-20" : "z-10",
                              isDragging && "cursor-grabbing",
                            )}
                            style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                            onClick={() => {
                              // 拖動過就不再觸發選取
                              if (!isDragging && !hasDragged) handleSelectKeyframe(keyframe);
                            }}
                            onPointerDown={(e) => {
                              if (e.button !== 0) return;
                              const target = e.target as HTMLElement;
                              // 點在輸入框或文字上不拖動
                              if (target.closest("input") || target.closest("span")) return;
                              handleKeyframeDragStart(e, keyframe);
                            }}
                            onContextMenu={(e: ReactMouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openContextMenu(e.clientX, e.clientY, keyframe);
                            }}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSelectKeyframe(keyframe);
                              } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                // 鍵盤微調時間戳：0.1 秒，按住 Shift 為 1 秒
                                e.preventDefault();
                                const step = (e.shiftKey ? 1 : 0.1) * (e.key === "ArrowLeft" ? -1 : 1);
                                handleUpdateKeyframeTimestamp(keyframe.id, Math.max(0, +(keyframe.timestamp + step).toFixed(3)));
                              } else if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
                                e.preventDefault();
                                const r = e.currentTarget.getBoundingClientRect();
                                openContextMenu(r.left + r.width / 2, r.top + r.height / 2, keyframe);
                              }
                            }}
                          >
                            {/* 名稱，在圓點上方 */}
                            <div
                              className={cn(
                                "absolute z-30 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium transition-all motion-reduce:transition-none",
                                isSelected
                                  ? "bg-[var(--ae-accent)] text-white"
                                  : "border border-border bg-card text-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                              )}
                              style={{ top: "calc(50% - 2.5rem)", left: "50%", transform: "translateX(-50%)" }}
                            >
                              {keyframe.name}
                            </div>
                            {/* 可編輯的時間標籤，在名稱上方 */}
                            <div
                              className="absolute z-30 flex items-center gap-0.5"
                              style={{ top: "calc(50% - 3.5rem)", left: "50%", transform: "translateX(-50%)" }}
                            >
                              <input
                                type="number"
                                value={keyframe.timestamp}
                                onChange={(e) => handleUpdateKeyframeTimestamp(keyframe.id, parseFloat(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`${keyframe.name}${labels.colon}${labels.timestamp}`}
                                className="w-12 rounded border-none bg-transparent px-1 py-0 text-center text-[9px] tabular-nums text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ae-accent-light)]"
                                min="0"
                                step="0.1"
                              />
                              <span className="text-[9px] text-muted-foreground">s</span>
                            </div>
                            {/* 圓點，垂直置中 */}
                            <div
                              className={cn(
                                "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 transition-all motion-reduce:transition-none",
                                "group-focus-visible:ring-2 group-focus-visible:ring-[var(--ae-accent-light)] group-focus-visible:ring-offset-1 ring-offset-card",
                                isDragging
                                  ? "scale-150 border-[var(--ae-accent-stronger)] bg-[var(--ae-accent-strong)]"
                                  : isSelected
                                    ? "scale-125 border-[var(--ae-accent-strong)] bg-[var(--ae-accent)]"
                                    : "border-[var(--ae-accent-soft)] bg-card hover:scale-110",
                              )}
                              title={keyframe.name}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* 選中位置的指示線 */}
                    {selectedKeyframe && (
                      <div
                        aria-hidden="true"
                        className="absolute bottom-0 top-0 w-0.5 bg-[var(--ae-accent)]"
                        style={{
                          left: `${timelinePosition(selectedKeyframe.timestamp, maxTimestamp, selectedIndex, sortedKeyframes.length)}%`,
                          transform: "translateX(-50%)",
                          zIndex: 15,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 右鍵選單 */}
      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          className={cn("z-50 min-w-[160px] rounded-lg py-1 shadow-md", fixed ? "fixed" : "absolute")}
          style={{ ...glassPanelStyle, left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              handleDuplicateKeyframe(contextMenu.keyframeId);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            <Icon d={ICON.copy} className="h-4 w-4" />
            <span>{labels.copy}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">{labels.copyShortcut}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              handleDeleteKeyframe(contextMenu.keyframeId);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
          >
            <Icon d={ICON.trash} className="h-4 w-4" />
            <span>{labels.delete}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">{labels.deleteShortcut}</span>
          </button>
        </div>
      )}
    </div>
  );
}
