"use client";

import { useId, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Threshold 維境入口：三層巢狀方框以不同速度校準、呼吸，對齊後露出中央光圈。
 * 純裝飾層：aria-hidden、pointer-events none，只動 transform 與 opacity。
 * 所有 idle 動態都是有限次數，約 12 秒收束並停在「已對齊」狀態（WCAG 2.2.2）。
 * reduced motion 時直接顯示完成狀態，不放光點、掃光與脈衝。
 */

export type PortalThresholdProps = {
  /** signature：完整進場與呼吸，一頁只放一次；still：靜止的品牌幾何 */
  variant?: "signature" | "still";
  /** 主金色（填色、邊線） */
  gold?: string;
  /** 亮金色（高光） */
  goldBright?: string;
  /** 格線與軌道的細線顏色 */
  line?: string;
  /** 寬螢幕捲動 0 到 22vh 時收束縮小（scroll-driven，只適合放在頁首） */
  collapseOnScroll?: boolean;
  className?: string;
  style?: CSSProperties;
};

const PORTAL_CSS = `
.sp-portal {
  --sp-d-scene: 560ms;
  --sp-e-out: cubic-bezier(0.16, 1, 0.3, 1);
  --sp-e-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  position: relative; width: 100%; max-width: 520px; margin-inline: auto;
  pointer-events: none; isolation: isolate; overflow: hidden; aspect-ratio: 1 / 1;
}
.sp-portal__svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.sp-portal__halo {
  position: absolute; inset: 18%; border-radius: 9999px;
  background: radial-gradient(circle at 50% 50%,
    color-mix(in srgb, var(--sp-gold) 7%, transparent),
    color-mix(in srgb, var(--sp-gold) 3.5%, transparent) 45%,
    transparent 72%);
  filter: blur(18px);
}
.sp-portal__floor {
  position: absolute; left: 0; right: 0; bottom: 2%; height: 52%; opacity: 0.7;
  background-image:
    linear-gradient(to right, var(--sp-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--sp-line) 1px, transparent 1px);
  background-size: 40px 40px;
  transform: perspective(340px) rotateX(64deg);
  transform-origin: 50% 100%;
  mask-image: linear-gradient(to bottom, transparent, #000 45%, transparent 92%);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 45%, transparent 92%);
}
.sp-portal__planes, .sp-portal__plane, .sp-portal__aperture, .sp-portal__spark {
  transform-box: view-box; transform-origin: 200px 200px;
}
.sp-portal__orbit { opacity: 0.75; }
.sp-portal__sweep {
  position: absolute; left: 8%; right: 8%; top: 14%; height: 1px; opacity: 0;
  background: linear-gradient(90deg, transparent,
    color-mix(in srgb, var(--sp-gold) 50%, transparent) 20%,
    color-mix(in srgb, var(--sp-gold-bright) 90%, transparent) 50%,
    color-mix(in srgb, var(--sp-gold) 50%, transparent) 80%,
    transparent);
}
.sp-portal--still { max-width: 420px; }
.sp-portal--still .sp-portal__sweep,
.sp-portal--still .sp-portal__spark,
.sp-portal--still .sp-portal__aperture-pulse { display: none; }

@keyframes sp-plane-in {
  from { opacity: 0; transform: rotate(-16deg) scale(0.82); }
  to { opacity: 1; transform: rotate(0deg) scale(1); }
}
@keyframes sp-plane-drift-cw {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(2.4deg) scale(1.012); }
}
@keyframes sp-plane-drift-ccw {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(-2deg) scale(1.008); }
}
@keyframes sp-orbit-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes sp-orbit-ccw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes sp-aperture-in {
  from { opacity: 0; transform: scale(0.4); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes sp-aperture-pulse {
  0% { transform: scale(1); opacity: 0.7; }
  70% { transform: scale(1.9); opacity: 0; }
  100% { transform: scale(1.9); opacity: 0; }
}
@keyframes sp-halo-breathe {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}
@keyframes sp-sweep {
  0% { opacity: 0; transform: translateY(0); }
  10%, 70% { opacity: 1; }
  100% { opacity: 0; transform: translateY(320px); }
}
@keyframes sp-portal-collapse {
  from { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
  to { transform: translate3d(0, -4%, 0) scale(0.88); opacity: 0.55; }
}

@media (prefers-reduced-motion: no-preference) {
  /* 三層平面：先校準進場，再進入各自速度的有限次漂移 */
  .sp-portal[data-motion='on'] .sp-portal__plane {
    animation:
      sp-plane-in var(--sp-d-scene) var(--sp-e-out) both,
      sp-plane-drift-cw 5.5s var(--sp-e-in-out) 2 both;
  }
  .sp-portal[data-motion='on'] .sp-portal__plane--1 { animation-delay: 0ms, var(--sp-d-scene); }
  .sp-portal[data-motion='on'] .sp-portal__plane--2 {
    animation-name: sp-plane-in, sp-plane-drift-ccw;
    animation-duration: var(--sp-d-scene), 4.5s;
    animation-delay: 80ms, var(--sp-d-scene);
  }
  .sp-portal[data-motion='on'] .sp-portal__plane--3 {
    animation-duration: var(--sp-d-scene), 3.6s;
    animation-delay: 160ms, var(--sp-d-scene);
  }
  .sp-portal[data-motion='on'] .sp-portal__aperture {
    animation: sp-aperture-in var(--sp-d-scene) var(--sp-e-out) both;
    animation-delay: 240ms;
  }
  .sp-portal[data-motion='on'] .sp-portal__aperture-pulse {
    transform-origin: 200px 200px; transform-box: view-box;
    animation: sp-aperture-pulse 3.2s var(--sp-e-out) 3 both;
    animation-delay: 800ms;
  }
  .sp-portal[data-motion='on'] .sp-portal__halo { animation: sp-halo-breathe 5s var(--sp-e-in-out) 2 both; }
  .sp-portal[data-motion='on'] .sp-portal__sweep {
    animation: sp-sweep 6s var(--sp-e-in-out) 1 both;
    animation-delay: 1.2s;
  }
  /* 軌道光點：各繞行一圈後停下 */
  .sp-portal[data-motion='on'] .sp-portal__spark--1 { animation: sp-orbit-cw 11s linear 1 both; }
  .sp-portal[data-motion='on'] .sp-portal__spark--2 { animation: sp-orbit-ccw 9s linear 1 both; }
}

@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) and (min-width: 768px) {
    .sp-portal[data-motion='on'][data-collapse='on'] {
      animation: sp-portal-collapse 1s linear both;
      animation-timeline: scroll(root block);
      animation-range: 0 22vh;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  /* 位移效果取消，停在已對齊的完成狀態 */
  .sp-portal, .sp-portal__plane, .sp-portal__aperture, .sp-portal__halo {
    animation: none !important; transform: none !important; opacity: 1 !important;
  }
  .sp-portal__aperture-pulse, .sp-portal__sweep, .sp-portal__spark { display: none; }
}
`;

export function PortalThreshold({
  variant = "signature",
  gold = "#d4af37",
  goldBright = "#e8c874",
  line = "rgba(212, 175, 55, 0.14)",
  collapseOnScroll = false,
  className,
  style,
}: PortalThresholdProps) {
  const animated = variant === "signature";
  // 同頁多個實例時，漸層 id 不能撞名
  const uid = useId().replace(/:/g, "");
  const ringA = `sp-ring-a-${uid}`;
  const ringB = `sp-ring-b-${uid}`;
  const core = `sp-core-${uid}`;

  return (
    <div
      className={cn("sp-portal", !animated && "sp-portal--still", className)}
      data-motion={animated ? "on" : "off"}
      data-collapse={collapseOnScroll ? "on" : "off"}
      aria-hidden="true"
      style={{ "--sp-gold": gold, "--sp-gold-bright": goldBright, "--sp-line": line, ...style } as CSSProperties}
    >
      <style>{PORTAL_CSS}</style>

      {/* 背景光暈：中央光源 */}
      <div className="sp-portal__halo" />

      {/* 透視格線地面 */}
      <div className="sp-portal__floor" />

      <svg className="sp-portal__svg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={ringA} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={goldBright} stopOpacity="0.9" />
            <stop offset="50%" stopColor={gold} stopOpacity="0.35" />
            <stop offset="100%" stopColor={gold} stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id={ringB} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gold} stopOpacity="0.05" />
            <stop offset="50%" stopColor={gold} stopOpacity="0.4" />
            <stop offset="100%" stopColor={goldBright} stopOpacity="0.85" />
          </linearGradient>
          {/* 光從邊緣往內收，中央保留一點暗度：讀起來是開口而不是一顆球 */}
          <radialGradient id={core} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={goldBright} stopOpacity="0.10" />
            <stop offset="38%" stopColor={goldBright} stopOpacity="0.26" />
            <stop offset="62%" stopColor={gold} stopOpacity="0.16" />
            <stop offset="100%" stopColor={gold} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 三層巢狀方框：不同速度旋轉，象徵維度位移 */}
        <g className="sp-portal__planes">
          <rect className="sp-portal__plane sp-portal__plane--1" x="60" y="60" width="280" height="280" rx="28" stroke={`url(#${ringA})`} strokeWidth="1.25" />
          <rect className="sp-portal__plane sp-portal__plane--2" x="86" y="86" width="228" height="228" rx="24" stroke={`url(#${ringB})`} strokeWidth="1.25" />
          <rect className="sp-portal__plane sp-portal__plane--3" x="112" y="112" width="176" height="176" rx="20" stroke={`url(#${ringA})`} strokeWidth="1" />
        </g>

        {/* 中央光圈：入口 */}
        <g className="sp-portal__aperture">
          <circle cx="200" cy="200" r="86" fill={`url(#${core})`} />
          <circle className="sp-portal__aperture-ring" cx="200" cy="200" r="54" stroke={goldBright} strokeWidth="1.5" strokeOpacity="0.9" />
          <circle className="sp-portal__aperture-pulse" cx="200" cy="200" r="54" stroke={gold} strokeWidth="1" />
        </g>

        {/* 沿著軌道運行的光點 */}
        <g className="sp-portal__orbits">
          <circle className="sp-portal__orbit" cx="200" cy="200" r="118" stroke={line} strokeWidth="1" strokeDasharray="2 10" />
          <circle className="sp-portal__orbit" cx="200" cy="200" r="150" stroke={line} strokeWidth="1" strokeDasharray="2 14" />
          <g className="sp-portal__spark sp-portal__spark--1">
            <circle cx="200" cy="82" r="3" fill={goldBright} />
          </g>
          <g className="sp-portal__spark sp-portal__spark--2">
            <circle cx="200" cy="50" r="2" fill={gold} />
          </g>
        </g>
      </svg>

      {/* 掃過的高光邊 */}
      <div className="sp-portal__sweep" />
    </div>
  );
}
