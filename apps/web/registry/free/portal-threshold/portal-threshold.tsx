"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Threshold 維境入口：三層巢狀方框旋轉校準，對齊後露出中央開口。
 * 純裝飾層：aria-hidden、pointer-events none，只動 transform 與 opacity。
 * 只有一次進場校準（約 0.8 秒），之後靜止停在「已對齊」狀態，沒有常駐的呼吸或漂浮。
 * reduced motion 時直接顯示完成狀態。
 */

export type PortalThresholdProps = {
  /** signature：有一次進場校準，一頁只放一次；still：靜止的品牌幾何 */
  variant?: "signature" | "still";
  /** 唯一強調色（方框與開口的線），優先於 gold；預設琥珀金 #d4a24c */
  accent?: string;
  /** 舊名稱，等同 accent */
  gold?: string;
  /** 開口內圈的淺色，預設由強調色混白算出 */
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
  position: relative; width: 100%; max-width: 520px; margin-inline: auto;
  pointer-events: none; isolation: isolate; overflow: hidden; aspect-ratio: 1 / 1;
}
.sp-portal__svg { position: absolute; inset: 0; width: 100%; height: 100%; }
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
.sp-portal__planes, .sp-portal__plane, .sp-portal__aperture {
  transform-box: view-box; transform-origin: 200px 200px;
}
.sp-portal--still { max-width: 420px; }

@keyframes sp-plane-in {
  from { opacity: 0; transform: rotate(-16deg) scale(0.82); }
  to { opacity: 1; transform: rotate(0deg) scale(1); }
}
@keyframes sp-aperture-in {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes sp-portal-collapse {
  from { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
  to { transform: translate3d(0, -4%, 0) scale(0.88); opacity: 0.55; }
}

@media (prefers-reduced-motion: no-preference) {
  /* 三層平面依序轉正對齊，之後靜止 */
  .sp-portal[data-motion='on'] .sp-portal__plane { animation: sp-plane-in var(--sp-d-scene) var(--sp-e-out) both; }
  .sp-portal[data-motion='on'] .sp-portal__plane--2 { animation-delay: 80ms; }
  .sp-portal[data-motion='on'] .sp-portal__plane--3 { animation-delay: 160ms; }
  .sp-portal[data-motion='on'] .sp-portal__aperture {
    animation: sp-aperture-in var(--sp-d-scene) var(--sp-e-out) both;
    animation-delay: 240ms;
  }
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
  .sp-portal, .sp-portal__plane, .sp-portal__aperture {
    animation: none !important; transform: none !important; opacity: 1 !important;
  }
}
`;

export function PortalThreshold({
  variant = "signature",
  accent,
  gold,
  goldBright,
  line = "rgb(255 255 255 / 0.08)",
  collapseOnScroll = false,
  className,
  style,
}: PortalThresholdProps) {
  const animated = variant === "signature";
  const main = accent ?? gold ?? "#d4a24c";
  const light = goldBright ?? `color-mix(in srgb, ${main} 70%, #ffffff)`;

  return (
    <div
      className={cn("sp-portal", !animated && "sp-portal--still", className)}
      data-motion={animated ? "on" : "off"}
      data-collapse={collapseOnScroll ? "on" : "off"}
      aria-hidden="true"
      style={{ "--sp-gold": main, "--sp-line": line, ...style } as CSSProperties}
    >
      <style>{PORTAL_CSS}</style>

      {/* 透視格線地面 */}
      <div className="sp-portal__floor" />

      <svg className="sp-portal__svg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 三層巢狀方框：外層用細白線，內層才用強調色，對齊後讀起來像一道門框 */}
        <g className="sp-portal__planes">
          <rect className="sp-portal__plane sp-portal__plane--1" x="60" y="60" width="280" height="280" rx="28" stroke="rgb(255 255 255 / 0.16)" strokeWidth="1" />
          <rect className="sp-portal__plane sp-portal__plane--2" x="86" y="86" width="228" height="228" rx="24" stroke="rgb(255 255 255 / 0.26)" strokeWidth="1" />
          <rect className="sp-portal__plane sp-portal__plane--3" x="112" y="112" width="176" height="176" rx="20" stroke={main} strokeOpacity="0.7" strokeWidth="1.25" />
        </g>

        {/* 中央開口：實心暗面加一圈強調色細線，不發光 */}
        <g className="sp-portal__aperture">
          <circle cx="200" cy="200" r="54" fill="#0c0a09" />
          <circle cx="200" cy="200" r="54" stroke={light} strokeWidth="1.5" />
          <circle cx="200" cy="200" r="40" stroke={main} strokeOpacity="0.35" strokeWidth="1" />
        </g>

        {/* 軌道細線 */}
        <g>
          <circle cx="200" cy="200" r="118" stroke={line} strokeWidth="1" strokeDasharray="2 10" />
          <circle cx="200" cy="200" r="150" stroke={line} strokeWidth="1" strokeDasharray="2 14" />
        </g>
      </svg>
    </div>
  );
}
