"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 首頁開場：真實的 SunUI 區塊鋪成一面斜躺的 3D 紙牆，每一欄上下交錯慢慢流動，滑鼠移動時整面牆跟著微微轉向。
 * 文字只留一句標題和安裝指令（children），壓在牆下緣淡出的地方。
 *
 * 動效照 SITE-MOTION.md：標題與安裝指令第一幀就在，不等動畫。牆一開始就是完成的角度，
 * 只做一次很短的「落定」（微縮放 + 紙片由中心向外淡入，約 0.8 秒），同一次瀏覽回到首頁不再重播。
 * 整個開場用 CSS 動畫，伺服器渲染的第一幀就是正確姿勢，hydration 不會跳。reduced motion 不動。
 */
const COLS = 7;
const TILE_W = 280;
const TILE_H = Math.round(TILE_W * 0.858);
const GAP = 20;
const STRIDE = TILE_H + GAP;
const CENTER_COL = 3;
const CENTER_ROW = 3;
const POSE = { rotateX: 52, rotateZ: -36 };
// 落定的長度（秒）；之後各欄才開始流動
const SETTLE = 0.8;
const SEEN_KEY = "sunui-hero-seen";
// 在 hydration 前就決定要不要播開場，避免第一幀先藏起紙片再跳出來
const seenScript = `try{if(sessionStorage.getItem(${JSON.stringify(SEEN_KEY)}))document.documentElement.dataset.heroSeen=""}catch(e){}`;

export function HeroOpening({ tiles, featured, children }: { tiles: string[]; featured: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [settled, setSettled] = useState(false);

  // 滑鼠視差，用彈簧跟上（跟著游標的東西才用彈簧）
  const px = useSpring(0, { stiffness: 120, damping: 20 });
  const py = useSpring(0, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(() => POSE.rotateX + py.get() * -6);
  const rotateZ = useTransform(() => POSE.rotateZ + px.get() * 5);

  useEffect(() => {
    if (reduce === null) return;
    const seen = "heroSeen" in document.documentElement.dataset;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: 每次都播，也只有 0.8 秒 */
    }
    // 播完才標記：之後在站內切回首頁（不會重跑內嵌腳本）也不重播
    const done = () => {
      document.documentElement.dataset.heroSeen = "";
      setSettled(true);
    };
    if (reduce || seen) {
      done();
      return;
    }
    const id = setTimeout(done, SETTLE * 1000);
    return () => clearTimeout(id);
  }, [reduce]);

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
    <section ref={ref} className="hero-opening relative mx-[calc(50%-50vw)] h-[min(860px,calc(100svh-6rem))] min-h-[560px] overflow-hidden">
      {/* 放在紙牆之前，瀏覽器畫第一幀前就跑完 */}
      <script dangerouslySetInnerHTML={{ __html: seenScript }} />
      <div
        aria-hidden="true"
        className="absolute inset-0 [perspective:1600px] [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_42%,transparent_74%),linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
      >
        <motion.div
          style={{ rotateX, rotateZ, width: COLS * TILE_W + (COLS - 1) * GAP, height: H, x: "-50%", y: "-50%" }}
          className="hero-wall absolute top-[42%] left-1/2 flex gap-5 [transform-style:preserve-3d]"
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
                        className={`relative block shrink-0 overflow-hidden rounded-lg border border-line bg-[#f7f7f7] transition-transform duration-200 hover:[transform:translateZ(36px)] ${isFeatured ? "" : "hero-tile"}`}
                        style={{ width: TILE_W, height: TILE_H, animationDelay: `${Math.min(dist, 6) * 0.05}s` }}
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
        <div className="pointer-events-auto mx-auto max-w-3xl">{children}</div>
      </div>

      <style>{`
        @keyframes sunui-wall { from { transform: translateY(${-H}px) } to { transform: translateY(${-2 * H}px) } }
        @keyframes sunui-wall-settle { from { scale: calc(var(--wall-scale) * 1.06) } to { scale: var(--wall-scale) } }
        @keyframes sunui-tile-in { from { opacity: 0 } to { opacity: 1 } }
        /* 手機上整面牆縮小，才看得出是一整片而不是幾張大卡 */
        .hero-wall { --wall-scale: 0.62; scale: var(--wall-scale); }
        @media (min-width: 640px) { .hero-wall { --wall-scale: 1; } }
        @media (prefers-reduced-motion: no-preference) {
          :root:not([data-hero-seen]) .hero-wall { animation: sunui-wall-settle ${SETTLE}s cubic-bezier(0.23, 1, 0.32, 1) both; }
          :root:not([data-hero-seen]) .hero-tile { animation: sunui-tile-in 0.4s cubic-bezier(0.23, 1, 0.32, 1) both; }
        }
      `}</style>
    </section>
  );
}
