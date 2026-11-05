"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TiltedMarqueeCover {
  /** 唯一鍵 */
  key: string;
  /** 封面圖片網址，以 object-cover 填滿 16:9 磚 */
  image?: string;
  /** 沒有圖片時改畫自訂內容（中性色塊、標題等） */
  content?: ReactNode;
}

export interface TiltedMarqueeBackgroundProps {
  covers: TiltedMarqueeCover[];
  /** 整面牆的不透明度，原站會員頁 0.95、活動頁首屏 0.32 */
  opacity?: number;
  /** 傾斜角度（度） */
  tiltAngle?: number;
  /** 第一列跑完一圈的秒數，之後每列多 8 秒 */
  baseDuration?: number;
  /** 單張封面寬度（px） */
  tileWidth?: number;
  className?: string;
}

/**
 * 傾斜的三列封面跑馬燈，放在 hero 背後當背景。
 * 父層需要 relative + overflow-hidden；本身 aria-hidden 且不吃滑鼠事件。
 */
export function TiltedMarqueeBackground({
  covers,
  opacity = 0.95,
  tiltAngle = -8,
  baseDuration = 48,
  tileWidth = 340,
  className,
}: TiltedMarqueeBackgroundProps) {
  if (covers.length === 0) return null;

  // 每列錯開兩張起點，再重複一份供 -50% 無縫循環
  const rows = [0, 1, 2].map((i) => {
    const list = [...covers, ...covers];
    const off = (i * 2) % list.length;
    const arr = [...list.slice(off), ...list.slice(0, off)];
    return [...arr, ...arr];
  });

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-0 select-none overflow-hidden",
        className,
      )}
      style={{
        inset: "-30% -20%",
        transform: `rotate(${tiltAngle}deg)`,
      }}
    >
      <style>{`
        @keyframes mbship-marq {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mbship-row { animation: none !important; }
        }
      `}</style>
      <div
        className="flex h-full flex-col justify-center gap-5"
        style={{ opacity }}
      >
        {rows.map((items, r) => (
          <div
            key={r}
            className="mbship-row flex w-max gap-5"
            style={{
              animation: `mbship-marq ${baseDuration + r * 8}s linear infinite`,
              animationDirection: r % 2 ? "reverse" : "normal",
              willChange: "transform",
            }}
          >
            {items.map((c, i) => (
              <div
                key={`${r}-${i}-${c.key}`}
                className="relative shrink-0 overflow-hidden rounded-2xl"
                style={{
                  width: tileWidth,
                  aspectRatio: "16/9",
                  background: "#161412",
                  border: "1px solid rgb(255 255 255 / 0.08)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
                }}
              >
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  c.content
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TiltedMarqueeBackground;
