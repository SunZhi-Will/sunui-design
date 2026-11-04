"use client";

import { cn } from "@/lib/utils";

import { Typewriter } from "./typewriter";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

export default function TypewriterDemo() {
  return (
    <section className={cn("w-full max-w-2xl rounded-md border p-6 sm:p-10", paper, edge, ink)}>
      <p className={cn("text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>Autumn edit</p>
      <Typewriter
        as="h2"
        prefix={<span className={inkMuted}>Linen made for</span>}
        srText="Linen made for slow mornings, long commutes and the first cold week."
        phrases={["slow mornings.", "long commutes.", "the first cold week."]}
        className="mt-3 text-[1.75rem] leading-tight sm:text-4xl"
      />
      <p className={cn("mt-4 max-w-md text-sm leading-relaxed", inkMuted)}>
        Washed linen shirts, trousers and overshirts in five undyed colors. Free shipping on orders over $80.
      </p>

      <div className={cn("mt-8 flex items-center gap-3 border-t pt-5 text-sm", edge)}>
        <svg viewBox="0 0 16 16" className={cn("size-4 shrink-0", inkMuted)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" strokeLinecap="round" />
        </svg>
        <Typewriter
          prefix={<span className={inkMuted}>Popular now:</span>}
          srText="Popular searches: overshirt, wide-leg trousers, linen bedding."
          phrases={["overshirt", "wide-leg trousers", "linen bedding"]}
          typeSpeed={55}
          pause={1100}
          className="text-sm font-normal tracking-normal"
        />
      </div>
    </section>
  );
}
