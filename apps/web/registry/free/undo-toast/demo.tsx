"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { UndoToaster, useToaster, useUndoable } from "./undo-toast";

type Member = { id: string; dishes: number };

const sample: Member[] = [
  { id: "m1", dishes: 2 },
  { id: "m2", dishes: 1 },
  { id: "m3", dishes: 3 },
];

const copy = {
  en: {
    names: { m1: "Amy", m2: "Ben", m3: "Chloe" } as Record<string, string>,
    title: "Who's eating",
    people: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
    members: "Members",
    ate: (n: number) => `ate ${n} ${n === 1 ? "dish" : "dishes"}`,
    remove: (name: string) => `Remove ${name}`,
    removed: (name: string) => `Removed ${name}`,
    empty: "No one here yet. Press Undo on the notice.",
  },
  "zh-TW": {
    names: { m1: "小美", m2: "阿斌", m3: "可欣" } as Record<string, string>,
    title: "誰要吃",
    people: (n: number) => `${n} 人`,
    members: "成員",
    ate: (n: number) => `吃了 ${n} 道菜`,
    remove: (name: string) => `移除 ${name}`,
    removed: (name: string) => `已移除 ${name}`,
    empty: "目前沒有人。按通知上的「復原」。",
  },
  "zh-CN": {
    names: { m1: "小美", m2: "阿斌", m3: "可欣" } as Record<string, string>,
    title: "谁要吃",
    people: (n: number) => `${n} 人`,
    members: "成员",
    ate: (n: number) => `吃了 ${n} 道菜`,
    remove: (name: string) => `移除 ${name}`,
    removed: (name: string) => `已移除 ${name}`,
    empty: "目前没有人。点通知上的“撤销”。",
  },
  ja: {
    names: { m1: "あみ", m2: "ベン", m3: "ちひろ" } as Record<string, string>,
    title: "食べる人",
    people: (n: number) => `${n} 人`,
    members: "メンバー",
    ate: (n: number) => `${n} 品食べた`,
    remove: (name: string) => `${name}を削除`,
    removed: (name: string) => `${name}を削除しました`,
    empty: "まだ誰もいません。通知の「元に戻す」を押してください。",
  },
};

export default function UndoToastDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [members, setMembers] = useState(sample);
  const toaster = useToaster();
  const undoable = useUndoable(members, setMembers, toaster, { locale });

  return (
    <div className="relative w-full max-w-2xl min-w-0 pt-20">
      <section aria-labelledby="members-title" className="overflow-hidden rounded-xl border border-border bg-card text-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h3 id="members-title" className="text-sm font-semibold">{t.title}</h3>
          <span className="text-xs text-muted-foreground tabular-nums">{t.people(members.length)}</span>
        </div>
        <ol className="divide-y divide-border" aria-label={t.members}>
          {members.map((m) => {
            const name = t.names[m.id];
            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-xs font-medium text-[#16A34A]">{name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{t.ate(m.dishes)}</p>
                </div>
                <button
                  type="button"
                  aria-label={t.remove(name)}
                  onClick={() => undoable((list) => list.filter((x) => x.id !== m.id), t.removed(name))}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:size-8"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ol>
        {!members.length && <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t.empty}</p>}
      </section>
      <UndoToaster toaster={toaster} fixed={false} locale={locale} />
    </div>
  );
}
