"use client";

import { SensitiveImage } from "./sensitive-image";

// 中性實物插圖，代替買家上傳的照片
const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="#ece6d8"/><g fill="none" stroke="#1c1917" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`,
  )}`;

const photos = {
  mug: svg('<path d="M58 40h36v44a6 6 0 0 1-6 6H64a6 6 0 0 1-6-6z"/><path d="M94 50h6a8 8 0 0 1 0 16h-6"/><path d="M66 30c0-4 4-4 4-8M78 30c0-4 4-4 4-8"/>'),
  gift: svg('<rect x="50" y="52" width="60" height="40" rx="2"/><path d="M46 42h68v10H46zM80 42v50"/><path d="M80 42c-6-12-22-12-18-2 2 4 18 2 18 2zM80 42c6-12 22-12 18-2-2 4-18 2-18 2z"/>'),
  hand: svg('<path d="M60 96V58a6 6 0 0 1 12 0v-8a6 6 0 0 1 12 0v6a6 6 0 0 1 12 0v10a6 6 0 0 1 12 0v18c0 8-6 12-14 12H60z"/><path d="M66 70h40M66 78h40" stroke-dasharray="3 3"/>'),
  tote: svg('<path d="M52 50h56l-4 44H56z"/><path d="M68 50c0-14 24-14 24 0"/>'),
};

const reviews = [
  { id: "r1", name: "Mia T.", product: "Stoneware Mug", text: "Heavier than it looks, keeps tea warm.", photo: photos.mug, alt: "Sand colored mug on a table" },
  {
    id: "r2",
    name: "Leo K.",
    product: "Holiday Gift Box",
    text: "My partner loved it. Photo shows what's inside, so I flagged it.",
    photo: photos.gift,
    alt: "Opened gift box with ribbon",
    rating: "Spoiler",
    reason: "Shows the gift inside the box.",
  },
  {
    id: "r3",
    name: "Ana R.",
    product: "Chef Knife 20 cm",
    text: "Very sharp out of the box. Be careful, I learned the hard way.",
    photo: photos.hand,
    alt: "Hand with a bandaged finger",
    rating: "Graphic",
    reason: "Injury photo. A small cut on a finger.",
  },
  { id: "r4", name: "Sam W.", product: "Canvas Tote", text: "Fits a laptop and groceries.", photo: photos.tote, alt: "Natural canvas tote bag" },
];

export default function SensitiveImageDemo() {
  return (
    <section aria-labelledby="reviews-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="reviews-heading" className="text-xl font-semibold tracking-tight">
          Photo reviews
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Photos marked by the reviewer stay covered until you choose to see them.</p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id} className="flex gap-3 rounded-md border border-border bg-card p-3 text-card-foreground">
            <SensitiveImage
              className="w-36 shrink-0 sm:w-40"
              src={r.photo}
              alt={r.alt}
              flagged={Boolean(r.rating)}
              rating={r.rating}
              reason={r.reason}
              aspect="1 / 1"
            />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.product}</p>
              <p className="mt-1.5">{r.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
