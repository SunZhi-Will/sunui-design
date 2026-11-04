"use client";

import { useState } from "react";

import { SensitiveImage, type ImageRating } from "./sensitive-image";

// 示意的生成結果：色塊與簡單形狀，代替真實圖片
const art = (from: string, to: string, shape: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="512" height="640" fill="url(#g)"/>${shape}</svg>`,
  )}`;

type Shot = { id: string; prompt: string; rating: ImageRating; src: string };

const shots: Shot[] = [
  { id: "g-101", prompt: "Lighthouse at dusk, oil painting", rating: "general", src: art("#2b2f5c", "#f2b56b", '<rect x="236" y="220" width="40" height="260" fill="#efe6d8"/><circle cx="380" cy="420" r="40" fill="#ffd89a"/>') },
  { id: "g-102", prompt: "Portrait in swimwear, beach, golden hour", rating: "sensitive", src: art("#f6c28b", "#d9735b", '<circle cx="256" cy="230" r="70" fill="#7a4a3a"/><rect x="176" y="310" width="160" height="240" rx="70" fill="#8a5240"/>') },
  { id: "g-103", prompt: "Forest cabin in snow, watercolor", rating: "general", src: art("#cfe0e8", "#5b7a6a", '<path d="M176 420 256 330l80 90z" fill="#6b3b2a"/><rect x="196" y="420" width="120" height="90" fill="#8a5a3a"/>') },
  { id: "g-104", prompt: "Figure study, classical nude", rating: "explicit", src: art("#e8c9b0", "#7a4a3a", '<ellipse cx="256" cy="380" rx="110" ry="200" fill="#c48a6a"/>') },
];

export default function SensitiveImageDemo() {
  const [curtain, setCurtain] = useState(false);
  const [open, setOpen] = useState<Shot | null>(null);

  return (
    <section aria-labelledby="si-heading" className="w-full max-w-2xl min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <header className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="si-heading" className="truncate text-sm font-semibold">
            Recent generations
          </h2>
          <p className="truncate text-xs text-muted-foreground">Sensitive and 18+ results stay blurred until you show them.</p>
        </div>
        <button
          type="button"
          aria-pressed={curtain}
          onClick={() => setCurtain((v) => !v)}
          className="inline-flex h-8 shrink-0 items-center rounded-lg border border-border px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:bg-muted"
        >
          {curtain ? "Lift curtain" : "Hide all"}
        </button>
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {shots.map((s) => (
          <li key={s.id} className="min-w-0">
            <SensitiveImage
              src={s.src}
              alt={s.prompt}
              width={512}
              height={640}
              rating={s.rating}
              revealKey={s.id}
              curtain={curtain}
              onCurtainOff={() => setCurtain(false)}
              onOpen={() => setOpen(s)}
              openLabel={`Open ${s.prompt}`}
              className="aspect-[4/5] rounded-lg"
            />
          </li>
        ))}
      </ul>

      {open && (
        <figure className="mt-4 min-w-0">
          <SensitiveImage
            src={open.src}
            alt={open.prompt}
            width={512}
            height={640}
            rating={open.rating}
            revealKey={open.id}
            curtain={curtain}
            onCurtainOff={() => setCurtain(false)}
            size="full"
            className="mx-auto aspect-[4/5] max-h-[28rem] rounded-lg"
            imgClassName="size-full object-contain"
          />
          <figcaption className="mt-2 flex min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{open.prompt}</span>
            <button type="button" onClick={() => setOpen(null)} className="shrink-0 font-medium text-foreground underline-offset-4 hover:underline">
              Close
            </button>
          </figcaption>
        </figure>
      )}
    </section>
  );
}
