"use client";

import { useState } from "react";

import { ExplainPanel, type Decision, type ExplainSuggestion } from "./explain-panel";

const suggestions: ExplainSuggestion[] = [
  {
    id: "rename-mug",
    title: "Rename “mug 350ml sand NEW!!” to “Stoneware Mug, 350 ml, Sand”",
    where: "SKU MUG-350-SND · title",
    reasons: [
      { kind: "ok", text: "Matches the naming pattern used by 42 other products" },
      { kind: "ok", text: "Removes all-caps and repeated punctuation" },
    ],
    confidence: 0.96,
    impact: "Title only. Price, stock and URL stay the same.",
    safe: true,
  },
  {
    id: "rename-tote",
    title: "Rename “tote bag canvas” to “Canvas Tote, Natural”",
    where: "SKU TOTE-NAT · title",
    reasons: [{ kind: "ok", text: "Adds the colour shoppers filter by" }],
    confidence: 0.91,
    impact: "Title only.",
    safe: true,
  },
  {
    id: "merge-napkins",
    title: "Merge NAP-OAT-4 into NAP-OAT-04",
    where: "2 SKUs · inventory and reviews",
    reasons: [
      { kind: "ok", text: "Same supplier code, photos and dimensions" },
      { kind: "warn", text: "NAP-OAT-4 has 3 open orders that will point to the merged SKU" },
    ],
    confidence: 0.84,
    impact: "Stock combines to 58. 11 reviews move over.",
    needsReview: "Merging changes open orders, so it can't be accepted in bulk.",
  },
  {
    id: "category-candle",
    title: "Move “Fig Candle” from Kitchen to Home Fragrance",
    where: "SKU CDL-FIG · category",
    reasons: [
      { kind: "ok", text: "9 of 10 similar products live in Home Fragrance" },
      { kind: "warn", text: "Kitchen page loses its only candle" },
    ],
    confidence: 0.78,
    impact: "Changes two collection pages and the sitemap.",
    safe: true,
  },
  {
    id: "price-plate",
    title: "Change “Speckled Plate” price from $28 to $26",
    where: "SKU PLT-SPK · price",
    reasons: [
      { kind: "conflict", text: "A running promotion already discounts this item by 10%" },
      { kind: "warn", text: "Based on 2 competitor listings only" },
    ],
    confidence: 0.41,
    impact: "Lowers margin by about $2 per sale.",
    needsReview: true,
  },
];

export default function ExplainPanelDemo() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Catalog cleanup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The assistant found 5 changes. Nothing is applied until you accept it.
        </p>
      </div>
      <ExplainPanel suggestions={suggestions} value={decisions} onDecisionsChange={setDecisions} />
    </div>
  );
}
