"use client";

import { useInView, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

export type OrbitImage = { src: string; alt: string };

export type OrbitGalleryProps = {
  images: OrbitImage[];
  /** Sphere radius in px (before fitting to the container width). */
  radius?: number;
  /** Tile edge in px. */
  tileSize?: number;
  /** How many tiles cover the sphere. Images repeat to fill it. */
  count?: number;
  /** Slow spin while nobody touches it. Stops on interaction, off with reduced motion. */
  autoRotate?: boolean;
  /** Called with the image index when a tile is brought to the front. */
  onSelect?: (image: OrbitImage, index: number) => void;
  /** Accessible name for the gallery. */
  label?: string;
  className?: string;
};

type Tile = { lon: number; lat: number; image: number };

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const DEG = 180 / Math.PI;

function fibonacciSphere(count: number, images: number): Tile[] {
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - ((i + 0.5) / count) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * GOLDEN;
    return { lon: Math.atan2(Math.cos(phi) * r, Math.sin(phi) * r) * DEG, lat: Math.asin(y) * DEG, image: i % images };
  });
}

const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
const clampLat = (a: number) => Math.max(-70, Math.min(70, a));

/**
 * Images on a sphere. Drag to spin it (it keeps going and slows down), click a
 * tile to turn it to the front. Tiles facing away fade out.
 */
export function OrbitGallery({
  images,
  radius = 220,
  tileSize = 92,
  count = 34,
  autoRotate = true,
  onSelect,
  label = "Image sphere",
  className,
}: OrbitGalleryProps) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const sphere = useRef<HTMLDivElement>(null);
  const tileEls = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(root, { amount: 0.1 });
  const tiles = useMemo(() => fibonacciSphere(Math.max(count, images.length), images.length), [count, images.length]);
  const [scale, setScale] = useState(1);
  const [announce, setAnnounce] = useState("");

  // Mutable motion state, written to the DOM directly each frame.
  const state = useRef({
    rx: -12,
    ry: 0,
    vx: 0,
    vy: 0,
    spin: autoRotate,
    tween: null as null | { fx: number; fy: number; tx: number; ty: number; start: number },
    drag: null as null | { id: number; x: number; y: number; lastX: number; lastY: number; lastT: number; moved: boolean },
    kick: () => {},
  });

  // Fit the sphere to narrow containers.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / (radius * 2 + tileSize + 24)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [radius, tileSize]);

  useEffect(() => {
    state.current.spin = autoRotate && !reduce;
  }, [autoRotate, reduce]);

  useEffect(() => {
    if (reduce) return;
    const s = state.current;
    let raf = 0;
    let last = performance.now();
    let hidden = document.visibilityState === "hidden";

    const paint = () => {
      if (sphere.current) sphere.current.style.transform = `translateZ(${-radius}px) rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
      const rx = s.rx / DEG;
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      tiles.forEach((tile, i) => {
        const el = tileEls.current[i];
        if (!el) return;
        const lon = (tile.lon + s.ry) / DEG;
        const lat = tile.lat / DEG;
        const y = Math.sin(lat);
        const z = Math.cos(lon) * Math.cos(lat);
        const facing = z * cx - y * sx; // -1 back, 1 front
        el.style.opacity = String(Math.max(0, Math.min(1, 0.15 + facing * 1.1)));
        el.style.pointerEvents = facing > 0.15 ? "auto" : "none";
      });
    };

    const frame = (now: number) => {
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      let busy = false;
      if (s.tween) {
        const k = Math.min(1, (now - s.tween.start) / 700);
        const e = 1 - Math.pow(1 - k, 3);
        s.rx = s.tween.fx + (s.tween.tx - s.tween.fx) * e;
        s.ry = s.tween.fy + (s.tween.ty - s.tween.fy) * e;
        if (k >= 1) s.tween = null;
        busy = true;
      } else if (!s.drag) {
        if (Math.abs(s.vx) > 0.01 || Math.abs(s.vy) > 0.01) {
          s.ry += s.vy * dt;
          s.rx = clampLat(s.rx + s.vx * dt);
          const decay = Math.pow(0.94, dt);
          s.vx *= decay;
          s.vy *= decay;
          busy = true;
        }
        if (s.spin) {
          s.ry += 0.12 * dt;
          busy = true;
        }
      }
      paint();
      raf = busy && !hidden ? requestAnimationFrame(frame) : 0;
    };

    s.kick = () => {
      if (!raf && !hidden && inView) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onVisibility = () => {
      hidden = document.visibilityState === "hidden";
      if (hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else s.kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    paint();
    if (inView) s.kick();
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      s.kick = () => {};
    };
  }, [reduce, inView, radius, tiles]);

  const bringToFront = (i: number) => {
    const s = state.current;
    const tile = tiles[i];
    s.spin = false;
    s.vx = s.vy = 0;
    const ty = s.ry + wrap180(-tile.lon - s.ry);
    s.tween = { fx: s.rx, fy: s.ry, tx: clampLat(-tile.lat), ty, start: performance.now() };
    s.kick();
    const image = images[tile.image];
    setAnnounce(image.alt);
    onSelect?.(image, tile.image);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const s = state.current;
    s.spin = false;
    s.tween = null;
    s.vx = s.vy = 0;
    s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, lastT: performance.now(), moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = state.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    const k = 0.3 / scale;
    s.ry += dx * k;
    s.rx = clampLat(s.rx - dy * k);
    const frames = Math.max(1, (now - d.lastT) / 16.67);
    s.vy = (dx * k) / frames;
    s.vx = (-dy * k) / frames;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.lastT = now;
    if (sphere.current) sphere.current.style.transform = `translateZ(${-radius}px) rotateX(${s.rx}deg) rotateY(${s.ry}deg)`;
    s.kick();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = state.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    s.drag = null;
    if (performance.now() - d.lastT > 80) s.vx = s.vy = 0;
    if (d.moved) {
      // swallow the click that follows a drag
      const stop = (ev: MouseEvent) => ev.stopPropagation();
      window.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);
    }
    s.kick();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, [number, number]> = { ArrowLeft: [0, -24], ArrowRight: [0, 24], ArrowUp: [16, 0], ArrowDown: [-16, 0] };
    const move = step[e.key];
    if (!move) return;
    e.preventDefault();
    const s = state.current;
    s.spin = false;
    s.tween = { fx: s.rx, fy: s.ry, tx: clampLat(s.rx + move[0]), ty: s.ry + move[1], start: performance.now() };
    s.kick();
  };

  if (reduce) {
    return (
      <ul aria-label={label} className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6", className)}>
        {images.map((image, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect?.(image, i)}
              className="block aspect-square w-full overflow-hidden rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const box = radius * 2 + tileSize;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={root}
      role="group"
      aria-roledescription="3D gallery"
      aria-label={label}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "relative mx-auto w-full cursor-grab touch-pan-y select-none overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        className,
      )}
      style={{ height: box * scale + 24 }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: box, height: box, marginLeft: -box / 2, marginTop: -box / 2, transform: `scale(${scale})`, perspective: radius * 4 }}
      >
        <div ref={sphere} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {tiles.map((tile, i) => {
            const image = images[tile.image];
            return (
              <button
                key={i}
                ref={(node) => {
                  tileEls.current[i] = node;
                }}
                type="button"
                aria-label={image.alt}
                onClick={() => bringToFront(i)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && bringToFront(i)}
                className="absolute left-1/2 top-1/2 overflow-hidden rounded-md border border-border bg-muted outline-none [backface-visibility:hidden] focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  width: tileSize,
                  height: tileSize * 0.75,
                  marginLeft: -tileSize / 2,
                  marginTop: (-tileSize * 0.75) / 2,
                  transform: `rotateY(${tile.lon}deg) rotateX(${tile.lat}deg) translateZ(${radius}px)`,
                }}
              >
                <img src={image.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
