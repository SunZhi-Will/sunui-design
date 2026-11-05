"use client";

import { useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 原站舞台在 lg 半欄約 37rem 寬、36rem 高；容器較窄時整個舞台等比縮小，不裁切也不換版
const STAGE_W = 592;
const STAGE_H = 576;

export interface TiltedPhonePairProps {
  /** 後方較大的手機（左上）畫面內容 */
  backScreen: ReactNode;
  /** 前方較小的手機（右下）畫面內容 */
  frontScreen: ReactNode;
  /** 左上角的對話泡泡，例如使用者下的提示詞；不給就不顯示 */
  callout?: ReactNode;
  /** 後方手機螢幕的細邊框色，預設原站的 emerald-500/20 */
  backAccent?: string;
  /** 前方手機螢幕的細邊框色，預設原站的 indigo-500/20 */
  frontAccent?: string;
  /** 游標視差傾斜，預設開啟；偏好減少動態時一律關閉 */
  parallax?: boolean;
  /** 整組手機的無障礙說明；不給時整組視為裝飾 */
  label?: string;
  className?: string;
}

/**
 * 兩支交疊的傾斜手機：後方 rotateY -18 / rotateX 12 / rotateZ 6（perspective 1500），
 * 前方 rotateY -22 / rotateX 10 / rotateZ 9（perspective 1400），滑鼠移動時一起視差傾斜，
 * 前方手機只跟 0.7 倍，做出前後景深。
 */
export function TiltedPhonePair({
  backScreen,
  frontScreen,
  callout,
  backAccent = "rgba(16,185,129,0.2)",
  frontAccent = "rgba(99,102,241,0.2)",
  parallax = true,
  label,
  className,
}: TiltedPhonePairProps) {
  const reduce = useReducedMotion() ?? false;
  const [phoneTilt, setPhoneTilt] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const phoneStageRef = useRef<HTMLDivElement>(null);
  const tiltOn = parallax && !reduce;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / STAGE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPhoneStageMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!tiltOn) return;
    const el = phoneStageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 10;
    setPhoneTilt({ x: rotateX, y: rotateY });
  };

  const onPhoneStageLeave = () => {
    setPhoneTilt({ x: 0, y: 0 });
  };

  const tilt = tiltOn ? phoneTilt : { x: 0, y: 0 };

  return (
    <div
      ref={wrapRef}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative w-full min-w-0", className)}
      style={{ height: STAGE_H * scale }}
    >
      <div
        ref={phoneStageRef}
        onMouseMove={onPhoneStageMove}
        onMouseLeave={onPhoneStageLeave}
        className="absolute left-1/2 top-0 origin-top"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translateX(-50%) scale(${scale})` }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[78%] h-24 w-72 -translate-x-1/2 rounded-full bg-black/40 blur-2xl"
          aria-hidden
        />

        {callout != null && (
          <div className="absolute left-0 top-8 z-30 w-[17rem] rounded-2xl border border-white/10 bg-zinc-950/90 px-4 py-3 shadow-[0_18px_42px_-18px_rgba(0,0,0,0.8)]">
            <div className="text-sm leading-relaxed text-zinc-200">{callout}</div>
          </div>
        )}

        {/* 後方手機 */}
        <div className="absolute left-[3.5rem] top-[4.8rem] z-10 [perspective:1500px]">
          <div
            className={cn("ease-out", !reduce && "transition-transform duration-150")}
            style={{
              transform: `rotateY(${-18 + tilt.y}deg) rotateX(${12 + tilt.x}deg) rotateZ(6deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div className="relative h-[27.5rem] w-[22rem] rounded-[2.2rem] border border-white/20 bg-gradient-to-br from-zinc-300/25 via-zinc-700/25 to-zinc-400/25 p-[2px] shadow-[0_28px_84px_-24px_rgba(0,0,0,0.92)]">
              <span className="absolute -right-[3px] top-28 h-10 w-[3px] rounded-r bg-zinc-400/50" />
              <span className="absolute -right-[3px] top-[11.5rem] h-16 w-[3px] rounded-r bg-zinc-400/40" />
              <span className="absolute -left-[3px] top-[7.5rem] h-14 w-[3px] rounded-l bg-zinc-400/35" />

              <div className="flex h-full rounded-[2rem] border border-white/10 bg-zinc-950 p-2">
                <div
                  className="relative h-full w-full overflow-hidden rounded-[1.55rem] border bg-zinc-900 p-2"
                  style={{ borderColor: backAccent }}
                >
                  <div className="pointer-events-none absolute left-1/2 top-[7px] z-20 h-[18px] w-[86px] -translate-x-1/2 rounded-b-2xl rounded-t-xl bg-zinc-900/95" />
                  {backScreen}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 前方手機：視差只跟 0.7 倍 */}
        <div className="absolute right-[1.5rem] top-[11rem] z-20 [perspective:1400px]">
          <div
            className={cn("ease-out", !reduce && "transition-transform duration-150")}
            style={{
              transform: `rotateY(${-22 + tilt.y * 0.7}deg) rotateX(${10 + tilt.x * 0.7}deg) rotateZ(9deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div className="relative h-[22rem] w-[17rem] rounded-[2.05rem] border border-white/20 bg-gradient-to-br from-zinc-300/25 via-zinc-700/20 to-zinc-500/20 p-[2px] shadow-[0_22px_70px_-24px_rgba(0,0,0,0.88)]">
              <span className="absolute -left-[3px] top-24 h-12 w-[3px] rounded-l bg-zinc-400/45" />

              <div className="flex h-full rounded-[1.9rem] border border-white/10 bg-zinc-950 p-2">
                <div
                  className="relative h-full w-full overflow-hidden rounded-[1.45rem] border bg-zinc-900 p-2"
                  style={{ borderColor: frontAccent }}
                >
                  <div className="pointer-events-none absolute left-1/2 top-[7px] z-20 h-[15px] w-[72px] -translate-x-1/2 rounded-b-xl rounded-t-lg bg-zinc-900/95" />
                  {frontScreen}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
