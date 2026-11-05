"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { InkFateDial, type InkFateModifier } from "./ink-fate-dial";

type Verdict = "adverse" | "mixed" | "success" | "wonder";

// 範例取自《死神的祝福》渡過忘川的命運判定
const copy: {
  en: DemoCopy;
  "zh-TW": DemoCopy;
  "zh-CN": DemoCopy;
  ja: DemoCopy;
} = {
  en: {
    kicker: "Fate check",
    title: "Crossing the River of Oblivion",
    modifiers: [
      { label: "Bone ferry charm", value: 8 },
      { label: "The river fog is too thick", value: -5 },
      { label: "The dead remember you", value: 6 },
    ],
    verdicts: {
      adverse: "▽ Woe: the boat lists, and you lose a piece of your memory.",
      mixed: "◇ Twist: you make it across, but the ferryman asks for one more coin.",
      success: "○ Pass: the fog parts, and the lamps on the far shore are lit.",
      wonder: "◎ Boon: someone at the bottom of the river gives you a push.",
    },
    minus: "−",
    cast: "Roll fate",
    casting: "Rolling…",
  },
  "zh-TW": {
    kicker: "命運判定",
    title: "渡過忘川",
    modifiers: [
      { label: "白骨渡符", value: 8 },
      { label: "河霧太濃", value: -5 },
      { label: "亡者記得你", value: 6 },
    ],
    verdicts: {
      adverse: "▽ 逆：船身一斜，你失去了一段記憶。",
      mixed: "◇ 變：渡過了，但船夫多要了一枚銅錢。",
      success: "○ 成：霧散開，對岸的燈亮著。",
      wonder: "◎ 奇：河底有人替你推了一把。",
    },
    minus: "－",
    cast: "擲命",
    casting: "擲命中…",
  },
  "zh-CN": {
    kicker: "命运判定",
    title: "渡过忘川",
    modifiers: [
      { label: "白骨渡符", value: 8 },
      { label: "河雾太浓", value: -5 },
      { label: "亡者记得你", value: 6 },
    ],
    verdicts: {
      adverse: "▽ 逆：船身一斜，你失去了一段记忆。",
      mixed: "◇ 变：渡过了，但船夫多要了一枚铜钱。",
      success: "○ 成：雾散开，对岸的灯亮着。",
      wonder: "◎ 奇：河底有人替你推了一把。",
    },
    minus: "－",
    cast: "掷命",
    casting: "掷命中…",
  },
  ja: {
    kicker: "運命判定",
    title: "忘川を渡る",
    modifiers: [
      { label: "白骨の渡し札", value: 8 },
      { label: "川霧が濃すぎる", value: -5 },
      { label: "亡者があなたを覚えている", value: 6 },
    ],
    verdicts: {
      adverse: "▽ 逆：舟が傾き、記憶をひとつ失った。",
      mixed: "◇ 変：渡りきったが、船頭に銅銭を一枚多く取られた。",
      success: "○ 成：霧が晴れ、対岸の灯がともっている。",
      wonder: "◎ 奇：川底の誰かが、背中を押してくれた。",
    },
    minus: "－",
    cast: "運命を擲つ",
    casting: "擲っています…",
  },
};

type DemoCopy = {
  kicker: string;
  title: string;
  modifiers: InkFateModifier[];
  verdicts: Record<Verdict, string>;
  minus: string;
  cast: string;
  casting: string;
};

export default function InkFateDialDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [roll, setRoll] = useState({ raw: 55, key: 0 });
  const [rolling, setRolling] = useState(false);
  const [status, setStatus] = useState("");
  const [verdict, setVerdict] = useState<Verdict>("success");

  function cast() {
    setRoll((previous) => ({ raw: 1 + Math.floor(Math.random() * 100), key: previous.key + 1 }));
    setStatus("");
    setRolling(true);
  }

  return (
    <section className="flex w-full max-w-sm min-w-0 flex-col items-center gap-3 rounded-[2px] border border-[rgba(143,157,182,0.42)] bg-[linear-gradient(180deg,#151b28,#0c1019)] px-5 py-5 text-[#d7deeb] shadow-[0_1.2rem_2.5rem_rgba(0,0,0,0.6)]">
      <header className="text-center">
        <div className="text-xs tracking-[0.16em] text-[#8fa3c6]">{t.kicker}</div>
        <h2 className="mt-1 font-serif text-lg tracking-[0.1em]">{t.title}</h2>
      </header>

      <div aria-live="polite" className="flex min-w-0 flex-col items-center gap-2">
        <InkFateDial
          locale={locale}
          rawRoll={roll.raw}
          modifiers={t.modifiers}
          rolling={rolling}
          rollKey={roll.key}
          size={230}
          onFrame={(frame) => setStatus(frame.currentStep ? `${frame.currentStep.label} ${frame.currentStep.value >= 0 ? "+" : t.minus}${Math.abs(frame.currentStep.value)}` : "")}
          onSettle={({ segment }) => {
            setRolling(false);
            setVerdict(segment as Verdict);
          }}
        />
        <p className="min-h-6 text-center text-sm tracking-[0.06em] text-[#b9c8e2]">{rolling ? status : t.verdicts[verdict]}</p>
      </div>

      <button
        type="button"
        onClick={cast}
        disabled={rolling}
        className="min-h-10 rounded-[2px] border border-[rgba(163,184,217,0.38)] px-6 tracking-[0.14em] text-[#d5e1f5] transition-colors hover:bg-[rgba(163,184,217,0.12)] disabled:opacity-40"
      >
        {rolling ? t.casting : t.cast}
      </button>
    </section>
  );
}
