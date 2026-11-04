"use client";

import { useState, type CSSProperties } from "react";

import { DialogueBox, storyThemes, type DialogueChoice } from "./dialogue-box";

type Line = { speaker?: string; text: string; choices?: DialogueChoice[] };

const scene: Line[] = [
  { text: "Dusk settles on the river. The last ferry bell has not rung yet." },
  { speaker: "Wen", text: "You came after all. I thought the fog would keep you home." },
  { speaker: "Ilse", text: "The fog keeps nobody. It only makes us walk slower." },
  { speaker: "Wen", text: "船夫說，過了這班渡船，就再也回不來了。" },
  {
    text: "The ferryman lifts his oar and waits for an answer.",
    choices: [
      { id: "board", label: "Step onto the ferry" },
      { id: "ask", label: "Ask the ferryman his name" },
      { id: "signal", label: "Light the signal on the far bank", requirement: "Lantern", locked: true },
    ],
  },
];

const outcomes: Record<string, string> = {
  board: "The boards creak under your weight. Wen follows without a word.",
  ask: "He smiles, as if no one has asked in a very long time.",
};

const stage = (theme: keyof typeof storyThemes): CSSProperties => ({
  ...(storyThemes[theme] as unknown as CSSProperties),
  background: "var(--story-bg)",
  borderColor: "var(--story-line)",
  color: "var(--story-text)",
});

export default function DialogueBoxDemo() {
  const [index, setIndex] = useState(0);
  const [outcome, setOutcome] = useState<string | null>(null);

  const line: Line = outcome ? { text: outcome } : scene[index];

  function advance() {
    if (outcome) {
      setOutcome(null);
      setIndex(0);
      return;
    }
    setIndex((i) => Math.min(i + 1, scene.length - 1));
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="relative flex min-h-[20rem] flex-col justify-end overflow-hidden rounded-[4px] border p-4 pt-14 sm:p-6 sm:pt-16" style={stage("ink")}>
        <svg aria-hidden="true" viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-x-0 top-10 h-12 w-full">
          <path d="M0 40 C 80 30, 160 46, 240 38 S 360 30, 400 36" fill="none" stroke="var(--story-line)" strokeWidth="1.5" />
          <path d="M0 50 C 90 44, 170 56, 250 48 S 360 42, 400 46" fill="none" stroke="var(--story-line)" strokeWidth="1.5" />
        </svg>
        <p className="absolute top-4 left-4 text-[11px] tracking-[0.18em] uppercase sm:left-6" style={{ color: "var(--story-muted)" }}>
          The ferry crossing · {outcome ? "After" : `${index + 1} / ${scene.length}`}
        </p>

        <DialogueBox
          speaker={line.speaker}
          text={line.text}
          choices={line.choices}
          onAdvance={advance}
          onChoose={(id) => setOutcome(outcomes[id] ?? null)}
          controls={<span>Click, Enter or Space to continue</span>}
        />
      </div>

      <div className="rounded-[4px] border p-4 pt-8" style={stage("rice")}>
        <DialogueBox
          theme="rice"
          speaker="Ilse"
          text="Keep the lantern dry. We may need it on the other side."
          autoPlay
          autoDelayMs={4000}
          onAdvance={() => {}}
        />
      </div>
    </div>
  );
}
