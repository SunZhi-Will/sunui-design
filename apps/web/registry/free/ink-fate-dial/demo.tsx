"use client";

import { useState } from "react";

import { InkFateDial, type InkFateModifier } from "./ink-fate-dial";

const modifiers: InkFateModifier[] = [
  { label: "白骨渡符", value: 8 },
  { label: "河霧太濃", value: -5 },
  { label: "亡者記得你", value: 6 },
];

const verdicts: Record<string, string> = {
  adverse: "▽ 逆：船身一斜，你失去了一段記憶。",
  mixed: "◇ 變：渡過了，但船夫多要了一枚銅錢。",
  success: "○ 成：霧散開，對岸的燈亮著。",
  wonder: "◎ 奇：河底有人替你推了一把。",
};

export default function InkFateDialDemo() {
  const [roll, setRoll] = useState({ raw: 55, key: 0 });
  const [rolling, setRolling] = useState(false);
  const [status, setStatus] = useState("");
  const [verdict, setVerdict] = useState(verdicts.success);

  function cast() {
    setRoll((previous) => ({ raw: 1 + Math.floor(Math.random() * 100), key: previous.key + 1 }));
    setStatus("");
    setRolling(true);
  }

  return (
    <section className="flex w-full max-w-sm min-w-0 flex-col items-center gap-3 rounded-[2px] border border-[rgba(143,157,182,0.42)] bg-[linear-gradient(180deg,#151b28,#0c1019)] px-5 py-5 text-[#d7deeb] shadow-[0_1.2rem_2.5rem_rgba(0,0,0,0.6)]">
      <header className="text-center">
        <div className="text-xs tracking-[0.16em] text-[#8fa3c6]">命運判定</div>
        <h2 className="mt-1 font-serif text-lg tracking-[0.1em]">渡過忘川</h2>
      </header>

      <div aria-live="polite" className="flex min-w-0 flex-col items-center gap-2">
        <InkFateDial
          rawRoll={roll.raw}
          modifiers={modifiers}
          rolling={rolling}
          rollKey={roll.key}
          size={230}
          onFrame={(frame) => setStatus(frame.currentStep ? `${frame.currentStep.label} ${frame.currentStep.value >= 0 ? "+" : "－"}${Math.abs(frame.currentStep.value)}` : "")}
          onSettle={({ segment }) => {
            setRolling(false);
            setVerdict(verdicts[segment]);
          }}
        />
        <p className="min-h-6 text-center text-sm tracking-[0.06em] text-[#b9c8e2]">{rolling ? status : verdict}</p>
      </div>

      <button
        type="button"
        onClick={cast}
        disabled={rolling}
        className="min-h-10 rounded-[2px] border border-[rgba(163,184,217,0.38)] px-6 tracking-[0.14em] text-[#d5e1f5] transition-colors hover:bg-[rgba(163,184,217,0.12)] disabled:opacity-40"
      >
        {rolling ? "擲命中…" : "擲命"}
      </button>
    </section>
  );
}
