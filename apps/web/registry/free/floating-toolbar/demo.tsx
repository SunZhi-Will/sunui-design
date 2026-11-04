"use client";

import { useState } from "react";

import { FloatingMenu, FloatingToolbar, aiTools, menuGlyphs, toolbarIcons, type ToolbarEntry } from "./floating-toolbar";

type Card = { id: string; kind: "text" | "image" | "link" | "ai"; title: string; x: number; y: number };

const mainTools: ToolbarEntry[] = [
  { id: "select", label: "Select", shortcut: "V", icon: toolbarIcons.select },
  "divider",
  { id: "text", label: "Text", shortcut: "T", icon: toolbarIcons.text },
  { id: "image", label: "Image", shortcut: "I", icon: toolbarIcons.image },
  { id: "link", label: "Link", shortcut: "L", icon: toolbarIcons.link },
  "divider",
  { id: "ai", label: "AI tools", icon: toolbarIcons.generate, accent: { soft: "rgba(139, 92, 246, 0.3)", strong: "#7c3aed" } },
  "divider",
  { id: "reset", label: "Reset view", shortcut: "Home", icon: toolbarIcons.reset },
];

const hints: Record<string, string> = {
  enhance: "Enhance: pick a card to polish its copy.",
  analyze: "Analyze: pick a card to summarise it.",
  transform: "Transform: pick a card to turn it into another type.",
};

const start: Card[] = [
  { id: "a", kind: "text", title: "Hello, I'm Sun", x: 76, y: 72 },
  { id: "b", kind: "image", title: "Studio desk", x: 92, y: 176 },
];

const titles = { text: "New note", image: "New image", link: "example.com", ai: "AI draft: a short bio" };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FloatingToolbarDemo() {
  const [mode, setMode] = useState<"main" | "ai">("main");
  const [selecting, setSelecting] = useState(false);
  const [aiTool, setAiTool] = useState<string | null>(null);
  const [cards, setCards] = useState(start);

  const add = (kind: Card["kind"]) =>
    setCards((cs) => [...cs, { id: `${kind}-${Date.now()}`, kind, title: titles[kind], x: 76 + ((cs.length * 28) % 100), y: 72 + ((cs.length * 52) % 240) }]);

  return (
    <div className="w-full max-w-2xl min-w-0">
      <div
        className="relative h-[28rem] w-full overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <FloatingMenu
          direction="right"
          label="CardFlow pages"
          items={[
            { label: "Profile card editor", icon: menuGlyphs.profile, href: "#profile" },
            { label: "Grid page", icon: menuGlyphs.grid, href: "#grid" },
          ]}
        />

        {cards.map((c) => (
          <div
            key={c.id}
            className="absolute w-36 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm"
            style={{ left: c.x, top: c.y }}
          >
            {c.kind === "image" ? (
              <div aria-hidden="true" className="mb-1.5 h-12 rounded-md bg-gradient-to-br from-sky-200 via-indigo-200 to-violet-300" />
            ) : c.kind === "ai" ? (
              <p className="text-[10px] font-medium uppercase tracking-wide text-violet-500">Generated</p>
            ) : null}
            <p className={c.kind === "link" ? "truncate text-xs font-medium text-blue-600" : "truncate text-sm font-semibold text-gray-800"}>
              {c.title}
            </p>
          </div>
        ))}

        <FloatingToolbar
          fixed={false}
          open={mode === "main"}
          tools={mainTools}
          labels={{ toolbar: "Canvas tools" }}
          selectedTool={selecting ? "select" : null}
          onSelectTool={(id) => {
            if (id === "select") setSelecting((s) => !s);
            else if (id === "ai") {
              setMode("ai");
              setSelecting(false);
            } else if (id === "reset") setCards(start);
            else if (id === "text" || id === "image" || id === "link") add(id);
          }}
        />

        <FloatingToolbar
          fixed={false}
          open={mode === "ai"}
          tools={aiTools}
          labels={{ toolbar: "AI tools", busy: "generating" }}
          selectedTool={aiTool}
          onSelectTool={setAiTool}
          onClose={() => {
            setMode("main");
            setAiTool(null);
          }}
          onAction={async () => {
            // 這裡換成真正的 AI 呼叫
            await wait(1400);
            add("ai");
          }}
        />

        <p
          aria-live="polite"
          className="absolute bottom-3 left-1/2 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-center text-xs text-gray-600 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl"
        >
          {mode === "ai" ? (aiTool ? hints[aiTool] : "Generate adds a card. Press Esc to go back.") : "Open AI tools from the toolbar."}
        </p>
      </div>
    </div>
  );
}
