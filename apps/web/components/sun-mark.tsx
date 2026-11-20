import { cn } from "@/lib/utils";

/** SunUI 的標誌：太陽。和 app/icon.svg 是同一個圖形，顏色跟著文字色。網站頁首與後台共用。 */
export function SunMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5 text-fg", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
      </g>
    </svg>
  );
}
