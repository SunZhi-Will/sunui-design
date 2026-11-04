"use client";

import { CompareSlider } from "./compare-slider";

// 原圖：使用者上傳的方形草稿（比例和成品不同，會以 contain 置中）
function Sketch() {
  return (
    <svg viewBox="0 0 300 300" className="size-full" role="img" aria-label="Uploaded pencil sketch of a lighthouse">
      <rect width="300" height="300" fill="#f4f1ea" />
      <g fill="none" stroke="#57534e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 220c40-8 80-6 120 0s80 8 120 0" />
        <path d="M130 220 140 110h20l10 110" />
        <path d="M136 160h28M133 190h34" />
        <rect x="138" y="92" width="24" height="18" />
        <path d="M134 92h32l-16-14Z" />
        <path d="M60 80c10-6 22-6 30 0M200 60c12-6 26-6 36 2" opacity="0.6" />
        <path d="M40 250c30 6 60 6 90 0M170 254c30 4 60 4 90-2" opacity="0.5" />
      </g>
    </svg>
  );
}

// 成品：16:9 的上色結果
function Render() {
  return (
    <svg viewBox="0 0 320 180" className="size-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Rendered painting of a lighthouse at dusk">
      <defs>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2f5c" />
          <stop offset="0.6" stopColor="#c76b5a" />
          <stop offset="1" stopColor="#f2b56b" />
        </linearGradient>
        <linearGradient id="cs-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4a7a" />
          <stop offset="1" stopColor="#1b2140" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#cs-sky)" />
      <circle cx="246" cy="112" r="16" fill="#ffd89a" opacity="0.9" />
      <rect y="124" width="320" height="56" fill="url(#cs-sea)" />
      <path d="M0 132c40-4 80-4 120 0s80 4 120 0 60-4 80-2" stroke="#ffd89a" strokeOpacity="0.35" fill="none" />
      <path d="M150 124 156 58h12l6 66Z" fill="#efe6d8" />
      <path d="M153 86h18M152 104h20" stroke="#b33a2e" strokeWidth="6" />
      <rect x="154" y="46" width="16" height="12" fill="#ffe7a8" />
      <path d="M151 46h22l-11-9Z" fill="#3a2a2a" />
      <path d="M170 52 260 30v34Z" fill="#ffe7a8" opacity="0.25" />
    </svg>
  );
}

export default function CompareSliderDemo() {
  return (
    <figure className="w-full max-w-2xl min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <CompareSlider before={<Sketch />} after={<Render />} width={16} height={9} beforeLabel="Original" afterLabel="Result" demoSweep />
      <figcaption className="mt-3 flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="truncate font-medium text-foreground">Lighthouse at dusk</span>
        <span className="tabular-nums">1920 x 1080</span>
      </figcaption>
    </figure>
  );
}
