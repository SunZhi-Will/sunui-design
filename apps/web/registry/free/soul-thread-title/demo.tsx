"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SoulThreadTitle } from "./soul-thread-title";

// 字標是遊戲的中文標誌，英文版沿用原標誌並在下方印英文片名
const copy = {
  en: { title: "死神的祝福", subtitle: "Death's Blessing", start: "Press any key or click to begin" },
  "zh-TW": { title: "死神的祝福", subtitle: "A Reaper's Blessing", start: "Press any key or click to begin" },
  "zh-CN": { title: "死神的祝福", subtitle: "Death's Blessing", start: "按任意键或点击开始" },
  ja: { title: "死神の祝福", subtitle: "Death's Blessing", start: "いずれかのキーを押すか、クリックして開始" },
};

/** 開頭動畫長度，和原作主選單的 INTRO_REVEAL_MS 相同。 */
const INTRO_MS = 4000;

export default function SoulThreadTitleDemo() {
  const reduce = useReducedMotion() ?? false;
  const [done, setDone] = useState(false);
  const locale = useDemoLocale();
  const t = useDemoText(copy);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), INTRO_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative w-full max-w-3xl overflow-hidden rounded-md px-6 py-14 sm:px-12 sm:py-20"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 75% 10%, rgba(163,184,217,0.18), transparent 70%), linear-gradient(180deg, #0b1020 0%, #050608 100%)",
      }}
      onPointerDown={() => setDone(true)}
      onKeyDown={() => setDone(true)}
    >
      <div className="min-w-0 max-w-xl">
        <h1>
          <SoulThreadTitle title={t.title} locale={locale} skipped={done} />
        </h1>
        <motion.p
          className="mt-3 text-[0.8rem] uppercase tracking-[0.34em] text-[#a3b8d9] sm:text-[0.95rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: done || reduce ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.7 }}
        >
          {t.subtitle}
        </motion.p>
        <button
          type="button"
          onClick={() => setDone(true)}
          className="mt-10 py-1.5 text-sm tracking-[0.14em] text-[#e8ecf4] outline-none focus-visible:underline focus-visible:underline-offset-4 transition-opacity duration-700"
          style={{ opacity: done || reduce ? 1 : 0 }}
        >
          {t.start}
        </button>
      </div>
    </section>
  );
}
