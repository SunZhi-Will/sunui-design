"use client";

import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 首頁開場：真實的 SunUI 區塊鋪成一面 3D 紙牆。
 * 鏡頭先貼近正中央一張（featured），接著拉遠、整面牆倒成斜躺的桌面，四周的紙片由近到遠亮起來；
 * 停好之後每一欄上下交錯慢慢流動，滑鼠移動時整面牆跟著微微轉向。
 * 文字只留一句標題和安裝指令（children），壓在牆下緣淡出的地方。
 *
 * 這是網站的主視覺，不是 block：DESIGN.md「不做進場與常駐循環」管的是區塊本身，
 * 這裡展示的是整個型錄的份量。reduced motion 直接停在完成的角度、不流動。
 */
const COLS = 7;
const TILE_W = 280;
const TILE_H = Math.round(TILE_W * 0.858);
const GAP = 20;
const STRIDE = TILE_H + GAP;
const CENTER_COL = 3;
const CENTER_ROW = 3;
const OPEN = { delay: 0.35, duration: 2.4 };
const POSE = { rotateX: 52, rotateZ: -36, scale: 1 };

export function HeroOpening({ tiles, featured, children }: { tiles: string[]; featured: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [settled, setSettled] = useState(false);

  // 鏡頭：從正面特寫拉到斜躺的牆
  const rx = useMotionValue(0);
  const rz = useMotionValue(0);
  const scale = useMotionValue(2.3);
  // 滑鼠視差，用彈簧跟上
  const px = useSpring(0, { stiffness: 120, damping: 20 });
  const py = useSpring(0, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(() => rx.get() + py.get() * -6);
  const rotateZ = useTransform(() => rz.get() + px.get() * 5);

  useEffect(() => {
    if (reduce === null) return;
    // 手機上整面牆縮小，才看得出是一整片而不是幾張大卡
    const end = window.innerWidth < 640 ? 0.62 : POSE.scale;
    if (reduce) {
      rx.set(POSE.rotateX);
      rz.set(POSE.rotateZ);
      scale.set(end);
      setSettled(true);
      return;
    }
    const opts = { ...OPEN, ease: [0.65, 0, 0.2, 1] as const };
    const runs = [animate(rx, POSE.rotateX, opts), animate(rz, POSE.rotateZ, opts), animate(scale, end, opts)];
    const id = setTimeout(() => setSettled(true), (OPEN.delay + OPEN.duration - 0.6) * 1000);
    return () => {
      runs.forEach((r) => r.stop());
      clearTimeout(id);
    };
  }, [reduce, rx, rz, scale]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width - 0.5);
      py.set((e.clientY - r.top) / r.height - 0.5);
    };
    const onLeave = () => {
      px.set(0);
      py.set(0);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, px, py]);

  // 每欄一串；正中央那格放 featured，鏡頭從它開始拉遠
  const pool = tiles.filter((t) => t !== featured);
  const rows = Math.max(CENTER_ROW + 2, Math.ceil(pool.length / COLS));
  const columns = Array.from({ length: COLS }, (_, c) => {
    const list = Array.from({ length: rows }, (_, r) => pool[(r * COLS + c) % pool.length]);
    if (c === CENTER_COL) list[CENTER_ROW] = featured;
    return list;
  });
  // 一串的高度；每欄放三份，從 -H 流到 -2H，任何時刻都蓋滿牆面上下
  const H = rows * STRIDE;

  return (
    <section ref={ref} className="relative mx-[calc(50%-50vw)] h-[min(860px,calc(100svh-6rem))] min-h-[560px] overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 [perspective:1600px] [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_42%,transparent_74%),linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
      >
        <motion.div
          style={{ rotateX, rotateZ, scale, width: COLS * TILE_W + (COLS - 1) * GAP, height: H, x: "-50%", y: "-50%" }}
          className="absolute top-[42%] left-1/2 flex gap-5 [transform-style:preserve-3d]"
        >
          {columns.map((list, c) => {
            // 中央那欄位移到讓 featured 正好在牆中心；其他欄錯開半格，像砌磚
            const offset = c === CENTER_COL ? H / 2 - (CENTER_ROW + 0.5) * STRIDE : c % 2 ? -STRIDE / 2 : 0;
            return (
              <div key={c} className="relative shrink-0 [transform-style:preserve-3d]" style={{ width: TILE_W, transform: `translateY(${offset}px)` }}>
                <div
                  className="flex flex-col gap-5 [transform-style:preserve-3d]"
                  style={{
                    transform: `translateY(${-H}px)`,
                    animation: reduce ? undefined : `sunui-wall ${64 + ((c * 13) % 30)}s linear infinite ${c % 2 ? "reverse" : "normal"}`,
                    animationPlayState: settled ? "running" : "paused",
                  }}
                >
                  {[...list, ...list, ...list].map((name, i) => {
                    const row = i % rows;
                    const isFeatured = c === CENTER_COL && row === CENTER_ROW;
                    const dist = Math.hypot(c - CENTER_COL, row - CENTER_ROW);
                    return (
                      <Link
                        key={i}
                        href={`/blocks/${name}`}
                        tabIndex={-1}
                        className="relative block shrink-0 overflow-hidden rounded-lg border border-line bg-[#f7f7f7] transition-transform duration-300 ease-out hover:[transform:translateZ(36px)]"
                        style={{
                          width: TILE_W,
                          height: TILE_H,
                          animation: reduce || isFeatured ? undefined : "sunui-tile-in 0.9s ease-out both",
                          animationDelay: `${OPEN.delay + 0.45 + dist * 0.12}s`,
                        }}
                      >
                        <Image
                          src={`/og/blocks/${name}.jpg`}
                          alt=""
                          width={1000}
                          height={858}
                          sizes={`${TILE_W * 2}px`}
                          priority={isFeatured && i < rows * 2}
                          loading={isFeatured && i < rows * 2 ? undefined : "eager"}
                          className="size-full object-cover dark:opacity-85"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-10 sm:px-6 sm:pb-14">
        <motion.div
          className="pointer-events-auto mx-auto max-w-3xl"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: OPEN.delay + OPEN.duration - 0.8, duration: 0.6, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>

      <style>{`
        @keyframes sunui-wall { from { transform: translateY(${-H}px) } to { transform: translateY(${-2 * H}px) } }
        @keyframes sunui-tile-in { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </section>
  );
}
