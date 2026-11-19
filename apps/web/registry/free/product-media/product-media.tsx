"use client";

import { motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ProductMediaImage {
  src: string;
  alt: string;
}

export interface ProductMediaLabels {
  region?: string;
  zoomIn?: string;
  zoomOut?: string;
  show?: (n: number, total: number) => string;
}

export interface ProductMediaProps {
  /** The first is the main image, the second is the angle shown on hover */
  images: ProductMediaImage[];
  /** Swap in a component such as next/image. Defaults to <img> */
  renderImage?: (image: ProductMediaImage, props: { className: string; loading: "eager" | "lazy" }) => ReactNode;
  /** On desktop, click to zoom and follow the cursor */
  zoom?: boolean;
  zoomScale?: number;
  /** Aspect ratio, for example "4/5", "1/1" */
  aspect?: string;
  /** Overlaid at the top left, for example a sold-out stamp or a "New" badge */
  badge?: ReactNode;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as ja-JP are also accepted */
  locale?: string;
  labels?: ProductMediaLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<ProductMediaLabels>> = {
  en: { region: "Product images", zoomIn: "Zoom in", zoomOut: "Zoom out", show: (n, total) => `Show image ${n} of ${total}` },
  "zh-TW": { region: "商品圖片", zoomIn: "放大", zoomOut: "縮小", show: (n, total) => `顯示第 ${n} 張，共 ${total} 張` },
  "zh-CN": { region: "商品图片", zoomIn: "放大", zoomOut: "缩小", show: (n, total) => `显示第 ${n} 张，共 ${total} 张` },
  ja: { region: "商品画像", zoomIn: "拡大", zoomOut: "縮小", show: (n, total) => `${total}枚中${n}枚目を表示` },
};

const edge = "border-foreground/10";
/** Brand accent color: follows the theme's --primary by default, and buyers can set --sunui-spot to use their own brand color. Used only for selected, deal and current-progress states */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";

const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;

/** Swap images and zoom only on devices that can truly hover and have a precise pointer; touch uses left and right swipes instead */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

export function ProductMedia({
  images,
  renderImage,
  zoom = true,
  zoomScale = 2,
  aspect = "4/5",
  badge,
  locale = "en",
  labels,
  className,
}: ProductMediaProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const fine = useFinePointer();
  const total = images.length;
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const originX = useMotionValue(0.5);
  const originY = useMotionValue(0.5);

  // On hover, swap to the next angle image. While zoomed, keep the original
  const shown = fine && hovering && !zoomed && total > 1 ? (index + 1) % total : index;
  const canZoom = zoom && fine;

  function go(next: number) {
    setZoomed(false);
    setIndex((next + total) % total);
  }

  function track(e: MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    originX.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    originY.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  }

  function onPanEnd(_: unknown, info: PanInfo) {
    if (fine || Math.abs(info.offset.x) < 40) return;
    go(index + (info.offset.x < 0 ? 1 : -1));
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
    else if (e.key === "Escape") setZoomed(false);
    else return;
    e.preventDefault();
  }

  const fade = reduce ? { duration: 0 } : { duration: 0.2 };
  const Surface = canZoom ? motion.button : motion.div;

  return (
    <div role="group" aria-roledescription="carousel" aria-label={t.region} className={cn("flex w-full flex-col gap-3", className)}>
      <Surface
        type={canZoom ? "button" : undefined}
        aria-label={canZoom ? (zoomed ? t.zoomOut : t.zoomIn) : undefined}
        aria-pressed={canZoom ? zoomed : undefined}
        tabIndex={canZoom ? undefined : total > 1 ? 0 : -1}
        onClick={canZoom ? (e: MouseEvent<HTMLElement>) => (track(e), setZoomed((z) => !z)) : undefined}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => (setHovering(false), setZoomed(false))}
        onPointerMove={zoomed ? track : undefined}
        onPanEnd={onPanEnd}
        onKeyDown={onKeyDown}
        style={{ aspectRatio: aspect, touchAction: "pan-y" }}
        className={cn(
          "relative block w-full overflow-hidden rounded-md border bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          edge,
          canZoom && (zoomed ? "cursor-zoom-out" : "cursor-zoom-in"),
        )}
      >
        {images.map((image, i) => (
          <motion.div
            key={image.src}
            aria-hidden={i !== shown}
            initial={false}
            animate={{ opacity: i === shown ? 1 : 0, scale: i === shown && zoomed ? zoomScale : 1 }}
            transition={{ opacity: fade, scale: reduce ? { duration: 0 } : gentle }}
            style={{ originX, originY }}
            className="absolute inset-0"
          >
            {renderImage ? (
              renderImage(image, { className: "size-full object-cover", loading: i === 0 ? "eager" : "lazy" })
            ) : (
              <img src={image.src} alt={image.alt} loading={i === 0 ? "eager" : "lazy"} draggable={false} className="size-full object-cover select-none" />
            )}
          </motion.div>
        ))}
        {badge && <div className="pointer-events-none absolute top-3 left-3">{badge}</div>}
      </Surface>

      {total > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                aria-label={t.show(i + 1, total)}
                aria-current={i === index ? "true" : undefined}
                onClick={() => go(i)}
                className="grid size-6 place-items-center rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]"
              >
                <span className={cn("block h-1 rounded-full transition-all duration-200", i === index ? cn("w-4", spotBg) : "w-1.5 bg-muted-foreground/40")} />
              </button>
            ))}
          </div>
          <span aria-hidden="true" className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground tabular-nums">
            {index + 1}/{total}
          </span>
        </div>
      )}
    </div>
  );
}
