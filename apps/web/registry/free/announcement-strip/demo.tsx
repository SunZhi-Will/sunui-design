"use client";

import { AnnouncementStrip } from "./announcement-strip";

export default function AnnouncementStripDemo() {
  return (
    <div className="w-full max-w-[52rem] overflow-hidden rounded-lg border bg-background">
      <AnnouncementStrip
        messages={[
          {
            id: "shipping",
            content: "Free shipping on orders over $60 until Sunday.",
            href: "#shipping",
            linkLabel: "Details",
          },
          { id: "returns", content: "Holiday returns: anything bought from Nov 1 can be returned until Jan 15." },
          { id: "store", content: "Our Taipei store opens late on Fridays, until 10 PM.", href: "#stores", linkLabel: "Find a store" },
        ]}
      />
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <span className="text-base font-semibold tracking-tight">Field Supply</span>
        <nav aria-label="Main" className="flex gap-4 text-sm text-muted-foreground">
          <a href="#new" className="hover:text-foreground">New</a>
          <a href="#knitwear" className="hover:text-foreground">Knitwear</a>
          <a href="#home" className="hidden hover:text-foreground sm:inline">Home</a>
          <a href="#sale" className="hover:text-foreground">Sale</a>
        </nav>
      </header>
      <div className="border-t px-5 py-8">
        <p className="text-xs text-muted-foreground">New this week</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">Wool overshirts, back in four colours</p>
      </div>
    </div>
  );
}
