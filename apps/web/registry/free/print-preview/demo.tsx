"use client";

import { useState } from "react";

import { PrintPreview } from "./print-preview";

const accent = "#2563eb";

type Role = { title: string; org: string; period: string; points: string[] };

const roles: Role[] = [
  {
    title: "Senior Frontend Engineer",
    org: "Northwind Labs",
    period: "2023 to present",
    points: [
      "Led the rebuild of the checkout flow in Next.js, cutting time to interactive from 4.1s to 1.6s.",
      "Designed a shared component library used by 6 product teams and 40+ engineers.",
      "Introduced visual regression testing that caught 120+ UI regressions before release.",
      "Mentored 4 engineers through promotion to mid and senior levels.",
    ],
  },
  {
    title: "Frontend Engineer",
    org: "Harbor Analytics",
    period: "2020 to 2023",
    points: [
      "Built a real-time dashboard rendering 50k data points with canvas and web workers.",
      "Owned accessibility: brought the product to WCAG 2.1 AA across 30 screens.",
      "Reduced bundle size by 38% through route-level code splitting and dependency audits.",
    ],
  },
  {
    title: "Web Developer",
    org: "Kiln & Co. Studio",
    period: "2018 to 2020",
    points: [
      "Shipped 25+ marketing and e-commerce sites for small businesses.",
      "Set up a headless CMS workflow that let clients publish without developer help.",
      "Automated image optimisation, saving an average of 1.2 MB per page.",
    ],
  },
  {
    title: "Frontend Intern",
    org: "Brightline Media",
    period: "2017 to 2018",
    points: ["Built interactive story pages for the newsroom.", "Wrote the first internal style guide for front-end code."],
  },
];

const projects = [
  { name: "ResumeAI", desc: "AI resume builder with Markdown templates, live A4 preview and PDF export." },
  { name: "Threado", desc: "Analytics and yearly recap stories for Threads creators, 12k monthly users." },
  { name: "Toolnest", desc: "A set of small browser tools, including a speed reader and text utilities." },
];

function H2({ children }: { children: string }) {
  return (
    <h2 className="mt-7 mb-2 border-b border-[#e5e7eb] pb-[2pt] text-[13pt] font-semibold tracking-[0.2em] uppercase">
      <span style={{ color: accent }}>{children}</span>
    </h2>
  );
}

export default function PrintPreviewDemo() {
  const [pages, setPages] = useState(1);

  return (
    <section aria-labelledby="resume-preview-heading" className="w-full min-w-0 space-y-3 rounded-xl bg-[#f3f4f6] p-3 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="resume-preview-heading" className="text-sm font-semibold text-gray-900">
          A4 preview
        </h2>
        <span className="text-xs text-gray-500 tabular-nums">{pages} pages</span>
      </div>

      <PrintPreview onPagesChange={setPages} fontFamily="ui-sans-serif, system-ui, sans-serif">
        <header>
          <h1 className="mt-0 mb-3 border-b-2 pb-3 text-[18pt] font-semibold tracking-tight text-gray-900" style={{ borderColor: `${accent}99` }}>
            Mia Chen
          </h1>
          <p className="mb-2.5 text-gray-700">Frontend engineer, Taipei. mia.chen@example.com, github.com/miachen</p>
        </header>

        <H2>Summary</H2>
        <p className="mb-2.5 text-gray-700">
          Frontend engineer with 8 years of experience building fast, accessible product interfaces. Comfortable across design systems, performance work and
          the occasional backend API.
        </p>

        <H2>Experience</H2>
        {roles.map((r) => (
          <div key={r.title}>
            <h3 className="mt-4 mb-2 border-l-[3px] pl-3 leading-snug font-semibold text-gray-800" style={{ borderLeftColor: accent }}>
              {r.title}, {r.org}
            </h3>
            <p className="mb-1 text-[0.72rem] font-semibold tracking-wide text-gray-500 uppercase">{r.period}</p>
            <ul className="mb-3 list-disc space-y-1.5 pl-5 text-gray-700">
              {r.points.map((p) => (
                <li key={p} className="leading-relaxed">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <H2>Projects</H2>
        {projects.map((p) => (
          <p key={p.name} className="mb-2.5 text-gray-700">
            <strong className="font-semibold text-gray-900">{p.name}</strong>: {p.desc}
          </p>
        ))}

        <H2>Skills</H2>
        <table className="mb-3 w-full border-collapse">
          <tbody>
            {[
              ["Languages", "TypeScript, JavaScript, Python, SQL"],
              ["Frameworks", "React, Next.js, Vue, Node.js"],
              ["Tooling", "Vite, Playwright, Storybook, GitHub Actions"],
              ["Design", "Figma, design tokens, motion design"],
            ].map(([k, v]) => (
              <tr key={k}>
                <th className="border-[0.5pt] border-[#e5e7eb] px-[6pt] py-[4pt] text-left font-semibold">{k}</th>
                <td className="border-[0.5pt] border-[#e5e7eb] px-[6pt] py-[4pt] text-gray-700">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <H2>Talks and writing</H2>
        <ul className="mb-3 list-disc space-y-1.5 pl-5 text-gray-700">
          {[
            "Designing for slow networks, JSConf Asia 2025",
            "What we learned shipping a design system to six teams, company engineering blog",
            "Accessible charts without the pain, React Taiwan meetup",
            "Measuring real-user performance with web-vitals, Frontend Weekly guest post",
          ].map((x) => (
            <li key={x} className="leading-relaxed">
              {x}
            </li>
          ))}
        </ul>

        <H2>Education</H2>
        <p className="mb-2.5 text-gray-700">
          <strong className="font-semibold text-gray-900">B.S. Computer Science</strong>, National Taiwan University, 2014 to 2018
        </p>
      </PrintPreview>
    </section>
  );
}
