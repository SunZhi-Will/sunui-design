"use client";

import { LogoMenu, menuGlyphs } from "./logo-menu";

export default function LogoMenuDemo() {
  return (
    <div
      className="relative h-64 w-full min-w-0 max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <LogoMenu
        label="CardFlow pages"
        items={[
          { label: "Profile card editor", icon: menuGlyphs.profile, href: "#profile" },
          { label: "Grid page", icon: menuGlyphs.grid, href: "#grid" },
        ]}
      />
      <div className="absolute left-24 top-8 right-4 min-w-0 max-w-[12rem] rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
        <p className="truncate text-sm font-semibold text-gray-800">Hello, I&apos;m Sun</p>
      </div>
    </div>
  );
}
