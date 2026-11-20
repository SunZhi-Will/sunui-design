"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

// 會員卡：一張有厚度的深色卡片，滑鼠移上去會跟著傾斜，表面的反光跟著光源角度走。
// 固定深色（淺色主題也是），字與線用卡片自己的色，不讀主題。
// 反光是模擬光的同色相漸層（DESIGN.md 第 2 節允許），不是光暈。reduced motion 時不傾斜、不反光。

type Props = {
  plan: string;
  keyText: string;
  metaLabel?: string;
  metaValue?: string;
  /** 登入前的空白卡：字比較淡 */
  blank?: boolean;
};

const SPRING = { stiffness: 260, damping: 26, mass: 0.6 };

export function MemberCard({ plan, keyText, metaLabel, metaValue, blank }: Props) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);
  const rotateY = useTransform(sx, [0, 1], [-9, 9]);
  const rotateX = useTransform(sy, [0, 1], [7, -7]);
  const sheenX = useTransform(sx, [0, 1], [20, 80]);
  const sheenY = useTransform(sy, [0, 1], [0, 100]);
  const sheenOpacity = useMotionValue(0);
  const sheenFade = useSpring(sheenOpacity, { stiffness: 200, damping: 30 });
  const sheen = useMotionTemplate`linear-gradient(115deg, transparent calc(${sheenX}% - 30%), rgb(255 255 255 / 0.09) ${sheenX}%, transparent calc(${sheenX}% + 30%))`;
  const glint = useMotionTemplate`radial-gradient(120% 80% at ${sheenX}% ${sheenY}%, rgb(255 255 255 / 0.05), transparent 60%)`;

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    sheenOpacity.set(1);
  }
  function leave() {
    px.set(0.5);
    py.set(0.5);
    sheenOpacity.set(0);
  }

  return (
    <div className="w-full [perspective:1000px]" onPointerMove={move} onPointerLeave={leave}>
      <motion.div
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative aspect-[1.586] w-full overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#191919,#111111)] text-[#ededed] shadow-[inset_0_1px_0_rgb(255_255_255/0.1),inset_0_0_0_1px_rgb(255_255_255/0.07),0_0_0_1px_rgb(0_0_0/0.08),0_16px_32px_-8px_rgb(0_0_0/0.1),0_32px_64px_-16px_rgb(0_0_0/0.1)] dark:bg-[linear-gradient(180deg,#262626,#1c1c1c)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),inset_0_0_0_1px_rgb(255_255_255/0.1),0_24px_48px_-12px_rgb(0_0_0/0.7)]"
      >
        {/* 浮雕的大太陽：品牌標誌當底紋，極淡 */}
        <svg viewBox="0 0 24 24" aria-hidden className="pointer-events-none absolute -right-[16%] -bottom-[48%] size-[88%] text-white/[0.035]">
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="0.35" />
          <g stroke="currentColor" strokeWidth="0.35" strokeLinecap="round">
            <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
          </g>
        </svg>
        {!reduce && (
          <>
            <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: glint, opacity: sheenFade }} />
            <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: sheen, opacity: sheenFade }} />
          </>
        )}

        <div className="relative flex h-full flex-col justify-between p-[7%]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
                <circle cx="12" cy="12" r="5" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
                </g>
              </svg>
              SunUI
            </span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.24em] text-white/70 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]">
              PRO
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <p className={`text-xl font-semibold tracking-tight sm:text-2xl ${blank ? "text-white/40" : ""}`}>{plan}</p>
            <div className="flex items-end justify-between gap-4">
              <span className={`font-mono text-[13px] tracking-[0.12em] sm:text-sm ${blank ? "text-white/30" : "text-white/80"}`}>{keyText}</span>
              {metaLabel && (
                <span className="text-right leading-tight">
                  <span className="block text-[10px] tracking-[0.08em] text-white/45 uppercase">{metaLabel}</span>
                  <span className="text-xs tabular-nums text-white/85 sm:text-[13px]">{metaValue}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
