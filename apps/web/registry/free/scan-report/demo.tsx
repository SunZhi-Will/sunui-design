"use client";

import { ScanReport, type ScanIssue } from "./scan-report";

const issues: ScanIssue[] = [
  {
    id: "alt",
    severity: "critical",
    title: "Product photos have no alt text",
    location: "app/products/[slug]/gallery.tsx:24",
    excerpt: {
      startLine: 22,
      lines: ["{images.map((src) => (", '  <img src={src} className="aspect-square" />', "))}"],
      highlight: [23, 23],
    },
    fix: {
      steps: ["Describe what the photo shows, not the file name", "Use an empty alt only for purely decorative images"],
      before: '<img src={src} className="aspect-square" />',
      after: '<img src={src} alt={`${product.name}, ${view}`} className="aspect-square" />',
      difficulty: "easy",
      eta: "About 10 min",
      autoFixable: true,
    },
  },
  {
    id: "contrast",
    severity: "high",
    title: "Sale price fails contrast (2.9:1, needs 4.5:1)",
    location: "components/price.tsx:12",
    excerpt: { startLine: 11, lines: ["<span", '  className="text-rose-300">', "  {formatPrice(sale)}", "</span>"], highlight: [12, 12] },
    fix: { before: 'className="text-rose-300"', after: 'className="text-rose-700 dark:text-rose-300"', difficulty: "easy", eta: "About 5 min", autoFixable: true },
  },
  {
    id: "icon-button",
    severity: "high",
    title: "Wishlist button has no accessible name",
    location: "components/product-card.tsx:48",
    fix: {
      before: "<button onClick={toggle}><HeartIcon /></button>",
      after: '<button onClick={toggle} aria-label="Save to wishlist" aria-pressed={saved}>\n  <HeartIcon aria-hidden="true" />\n</button>',
      difficulty: "easy",
      eta: "About 5 min",
    },
  },
  {
    id: "focus",
    severity: "medium",
    title: "Size picker removes the focus outline",
    location: "components/size-picker.tsx:31",
    fix: { steps: ["Replace outline-none with a visible focus-visible ring"], difficulty: "easy", eta: "About 5 min", autoFixable: true },
  },
  {
    id: "heading",
    severity: "low",
    title: "Checkout skips from h1 to h4",
    location: "app/checkout/page.tsx:9",
    fix: { steps: ["Use h2 for each checkout section"], difficulty: "medium", eta: "About 20 min" },
  },
  { id: "lang", severity: "info", title: "Chinese product names have no lang attribute", location: "components/product-title.tsx:7" },
];

export default function ScanReportDemo() {
  return (
    <div className="w-full max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Store accessibility scan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Scanned 214 pages on Nov 5. Fixing the two high issues raises the score to about 81.</p>
      </div>
      <ScanReport score={64} scoreReason="One critical and two high issues on product pages, which get most of your traffic." issues={issues} />
    </div>
  );
}
