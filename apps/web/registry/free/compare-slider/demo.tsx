"use client";

import { CompareSlider } from "./compare-slider";

function Wallet({ aged }: { aged?: boolean }) {
  const body = aged ? "#7a4a2a" : "#b8784a";
  const flap = aged ? "#6a3f23" : "#a5683d";
  const stitch = aged ? "#c9a27f" : "#efd7bd";
  return (
    <svg viewBox="0 0 400 300" className="size-full" role="img" aria-label={aged ? "Wallet after six months of use" : "New wallet"}>
      <rect width="400" height="300" fill={aged ? "#ece4d6" : "#f3eee4"} />
      <rect x="70" y="70" width="260" height="170" rx="14" fill={body} />
      <path d="M70 120h260v-36a14 14 0 0 0-14-14H84a14 14 0 0 0-14 14Z" fill={flap} />
      <rect x="82" y="82" width="236" height="146" rx="9" fill="none" stroke={stitch} strokeWidth="2" strokeDasharray="6 5" />
      {aged && (
        <g fill="none" stroke="#5a341c" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <path d="M130 150c30 8 60 6 90-4" />
          <path d="M150 190c40 6 80 2 120-10" />
          <path d="M200 120v116" opacity="0.5" />
        </g>
      )}
      {aged && <path d="M70 200v26a14 14 0 0 0 14 14h30" fill="none" stroke="#a87a55" strokeWidth="5" strokeLinecap="round" opacity="0.6" />}
    </svg>
  );
}

function Proof({ printed }: { printed?: boolean }) {
  return (
    <svg viewBox="0 0 300 400" className="size-full" role="img" aria-label={printed ? "Printed thank-you card" : "Digital proof of the thank-you card"}>
      <rect width="300" height="400" fill={printed ? "#efe7d6" : "#ffffff"} />
      <rect x="40" y="40" width="220" height="320" fill="none" stroke={printed ? "#1c1917" : "#9ca3af"} strokeWidth="1.5" strokeDasharray={printed ? undefined : "4 4"} />
      <text x="150" y="150" textAnchor="middle" fontSize="26" fontWeight="600" fill="#1c1917">Thank you</text>
      <text x="150" y="180" textAnchor="middle" fontSize="12" fill="#57534e">for shopping small</text>
      <rect x="110" y="230" width="80" height="80" rx="4" fill="none" stroke="#c8361d" strokeWidth={printed ? 3 : 1.5} transform="rotate(-8 150 270)" />
      <text x="150" y="276" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2" fill="#c8361d" transform="rotate(-8 150 270)">
        SUN
      </text>
    </svg>
  );
}

export default function CompareSliderDemo() {
  return (
    <section className="grid w-full max-w-[52rem] gap-6 md:grid-cols-[3fr_2fr]">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Full-grain leather wallet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Drag to see how it looks new and after six months in a back pocket.</p>
        </div>
        <CompareSlider before={<Wallet />} after={<Wallet aged />} beforeLabel="New" afterLabel="6 months" initial={55} demoSweep />
        <p className="text-xs text-muted-foreground">Vegetable-tanned leather darkens and softens with use. Creases are expected.</p>
      </div>
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Insert card proof</h2>
          <p className="mt-1 text-sm text-muted-foreground">Screen proof against the printed sample.</p>
        </div>
        <CompareSlider before={<Proof />} after={<Proof printed />} beforeLabel="Proof" afterLabel="Printed" aspect="3 / 4" fit="contain" />
      </div>
    </section>
  );
}
