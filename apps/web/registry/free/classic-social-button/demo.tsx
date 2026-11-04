"use client";

import type { ReactNode } from "react";

import { SocialButton, SocialButtonGroup, type SocialGroupItem, type SocialLayout, type TitlePosition } from "./classic-social-button";

const Svg = ({ children, stroke }: { children: ReactNode; stroke?: boolean }) => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden {...(stroke ? { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const } : { fill: "currentColor" })}>
    {children}
  </svg>
);

const icons = {
  github: (
    <Svg>
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </Svg>
  ),
  linkedin: (
    <Svg>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </Svg>
  ),
  twitter: (
    <Svg>
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </Svg>
  ),
  facebook: (
    <Svg>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Svg>
  ),
  instagram: (
    <Svg stroke>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </Svg>
  ),
  youtube: (
    <Svg>
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </Svg>
  ),
  email: (
    <Svg stroke>
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </Svg>
  ),
};

const links: SocialGroupItem[] = [
  { href: "https://github.com/", icon: icons.github, title: "GitHub", className: "from-purple-600/90 to-indigo-800/90" },
  { href: "https://www.linkedin.com/", icon: icons.linkedin, title: "LinkedIn", className: "from-blue-600/90 to-blue-800/90" },
  { href: "https://x.com/", icon: icons.twitter, title: "Twitter", className: "from-blue-400/90 to-blue-500/90" },
  { href: "https://www.facebook.com/", icon: icons.facebook, title: "Facebook", className: "from-blue-600/90 to-blue-700/90" },
  { href: "https://www.instagram.com/", icon: icons.instagram, title: "Instagram", className: "from-pink-500/90 to-purple-600/90" },
  { href: "https://www.youtube.com/", icon: icons.youtube, title: "YouTube", className: "from-red-500/90 to-red-600/90" },
  { href: "mailto:hello@example.com", icon: icons.email, title: "Email", className: "from-blue-500/90 to-blue-600/90" },
];

const tooltipDemo: { pos: TitlePosition; i: number }[] = [
  { pos: "top", i: 0 },
  { pos: "right", i: 1 },
  { pos: "left", i: 2 },
  { pos: "bottom", i: 3 },
];

const layouts: { layout: SocialLayout; count: number; note: string }[] = [
  { layout: "petal", count: 5, note: "Fans out in 90 degree arcs" },
  { layout: "vertical", count: 4, note: "Stacks upward, 56 px apart" },
  { layout: "grid", count: 6, note: "Fills a square grid" },
];

export default function SocialButtonDemo() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      {/* 個人名片：hover 顯示提示 */}
      <section className="rounded-2xl bg-gray-900 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-linear-to-br from-blue-500 to-purple-600" aria-hidden />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">Sun</h3>
            <p className="truncate text-sm text-gray-400">Frontend engineer, SunUI Design</p>
          </div>
        </div>
        <ul className="mt-6 flex flex-wrap gap-4 pb-8" aria-label="Find me on">
          {links.map((l) => (
            <li key={l.title} className="relative h-10 w-10">
              <SocialButton {...l} titleDisplay="hover" titlePosition="bottom" />
            </li>
          ))}
        </ul>
      </section>

      {/* 四種提示位置 */}
      <section className="rounded-2xl bg-gray-100 p-6">
        <h3 className="mb-6 text-sm font-semibold text-gray-600">Tooltip positions</h3>
        <ul className="mx-auto grid w-max grid-cols-2 gap-x-28 gap-y-16 py-8">
          {tooltipDemo.map(({ pos, i }) => (
            <li key={pos} className="relative h-10 w-10">
              <SocialButton {...links[i]} title={pos[0].toUpperCase() + pos.slice(1)} aria-label={links[i].title} titleDisplay="always" titlePosition={pos} />
            </li>
          ))}
        </ul>
      </section>

      {/* 主按鈕展開：花瓣、垂直、網格 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {layouts.map(({ layout, count, note }) => (
          <section key={layout} className="relative h-80 min-w-0 overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-5 text-white">
            <h3 className="font-semibold capitalize">{layout}</h3>
            <p className="text-sm text-slate-400">{note}</p>
            <SocialButtonGroup buttons={links.slice(0, count)} layout={layout} corner="bottom-right" defaultOpen />
          </section>
        ))}
      </div>
    </div>
  );
}
