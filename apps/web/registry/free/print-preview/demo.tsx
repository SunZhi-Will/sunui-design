"use client";

import { useState } from "react";

import { PrintPreview } from "./print-preview";

const roles = [
  ["Senior Frontend Engineer, Northwind Labs", "2023 to present", "Rebuilt checkout in Next.js, cutting time to interactive from 4.1s to 1.6s.", "Designed a component library used by 6 product teams.", "Introduced visual regression tests that caught 120+ regressions.", "Mentored 4 engineers through promotion."],
  ["Frontend Engineer, Harbor Analytics", "2020 to 2023", "Built a real-time dashboard rendering 50k points with canvas and workers.", "Brought the product to WCAG 2.1 AA across 30 screens.", "Reduced bundle size by 38% with route-level code splitting."],
  ["Web Developer, Kiln & Co. Studio", "2018 to 2020", "Shipped 25+ marketing and e-commerce sites for small businesses.", "Set up a headless CMS so clients publish without developer help.", "Automated image optimisation, saving 1.2 MB per page."],
  ["Frontend Intern, Brightline Media", "2017 to 2018", "Built interactive story pages for the newsroom.", "Wrote the first internal style guide for front-end code."],
];

export default function PrintPreviewDemo() {
  const [pages, setPages] = useState(1);

  return (
    <section aria-label="Resume A4 preview" className="w-full min-w-0 space-y-3 rounded-xl bg-[#f3f4f6] p-3 sm:p-6">
      <p className="text-right text-xs text-gray-500 tabular-nums">{pages} pages</p>
      <PrintPreview onPagesChange={setPages} fontFamily="ui-sans-serif, system-ui, sans-serif">
        <header>
          <h1 className="mt-0 mb-3 border-b-2 border-[#2563eb99] pb-3 text-[18pt] font-semibold tracking-tight text-gray-900">Mia Chen</h1>
          <p className="mb-2.5 text-gray-700">Frontend engineer, Taipei. mia.chen@example.com, github.com/miachen</p>
        </header>
        <p className="mb-2.5 text-gray-700">
          Frontend engineer with 8 years of experience building fast, accessible product interfaces, from design systems to performance work.
        </p>
        {roles.map(([title, period, ...points]) => (
          <div key={title}>
            <h3 className="mt-4 mb-2 border-l-[3px] border-[#2563eb] pl-3 leading-snug font-semibold text-gray-800">{title}</h3>
            <p className="mb-1 text-[0.72rem] font-semibold tracking-wide text-gray-500 uppercase">{period}</p>
            <ul className="mb-3 list-disc space-y-1.5 pl-5 text-gray-700">
              {points.map((p) => (
                <li key={p} className="leading-relaxed">{p}</li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mb-2.5 text-gray-700">
          <strong className="font-semibold text-gray-900">B.S. Computer Science</strong>, National Taiwan University, 2014 to 2018
        </p>
      </PrintPreview>
    </section>
  );
}
