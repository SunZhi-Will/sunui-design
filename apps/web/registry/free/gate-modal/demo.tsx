"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ContentGateModal } from "./gate-modal";

const copy = {
  en: { lesson: "Lesson 3 of 12", heading: "Writing prompts that name the format", watch: "Watch lesson 3", course: "Claude, Not Just Chat", kind: "Hands-on workshop" },
  "zh-TW": { lesson: "第 3 課，共 12 課", heading: "寫出指明格式的提示詞", watch: "觀看第 3 課", course: "Claude 不只是聊天", kind: "實作工作坊" },
  "zh-CN": { lesson: "第 3 课，共 12 课", heading: "写出指明格式的提示词", watch: "观看第 3 课", course: "Claude 不只是聊天", kind: "实操工作坊" },
  ja: { lesson: "全 12 回中 第 3 回", heading: "形式を指定するプロンプトの書き方", watch: "第 3 回を見る", course: "Claude はチャットだけじゃない", kind: "ハンズオン・ワークショップ" },
};

export default function GateModalDemo() {
  const [open, setOpen] = useState(false);
  const locale = useDemoLocale();
  const t = useDemoText(copy);

  return (
    <div className="relative flex min-h-[42rem] w-full max-w-xl min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 text-white/90">
      <p className="text-[12px] font-bold tracking-[0.2em] text-[#da7756] uppercase">
        {t.lesson}
      </p>
      <p className="mt-2 text-lg font-bold">
        {t.heading}
      </p>
      <div className="mt-4 flex aspect-video min-w-0 items-center justify-center rounded-xl bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-[#da7756] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t.watch}
        </button>
      </div>
      <ContentGateModal
        title={t.course}
        subtitle={t.kind}
        locale={locale}
        open={open}
        onClose={() => setOpen(false)}
        fixed={false}
        signInHref="#"
        contactHref="#"
      />
    </div>
  );
}
