"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { EmptyState, UsersIcon } from "./empty-state";

type Share = { name: string; amount: number };

const copy = {
  en: {
    heading: "This bill",
    title: "No bill yet",
    description: "Start by adding people, or load a filled-in example to see how it works.",
    addPeople: "Add people",
    people: ["Ava", "Ben", "Chloe"],
  },
  "zh-TW": {
    heading: "這筆帳單",
    title: "還沒有帳單",
    description: "先新增成員，或載入一份填好的範例，看看實際怎麼運作。",
    addPeople: "新增成員",
    people: ["小安", "阿傑", "佳琪"],
  },
  "zh-CN": {
    heading: "这笔账单",
    title: "还没有账单",
    description: "先添加成员，或加载一份填好的示例，看看实际怎么用。",
    addPeople: "添加成员",
    people: ["小安", "阿杰", "佳琪"],
  },
  ja: {
    heading: "この会計",
    title: "まだ会計がありません",
    description: "まずメンバーを追加するか、入力済みのサンプルを読み込んで使い方を確かめましょう。",
    addPeople: "メンバーを追加",
    people: ["さくら", "けんた", "ゆい"],
  },
};

const amounts = [210, 180, 170];

export default function EmptyStateDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [loaded, setLoaded] = useState(false);
  const bill: Share[] = loaded ? t.people.map((name, i) => ({ name, amount: amounts[i] })) : [];

  return (
    <section aria-labelledby="es-bill" className="w-full max-w-md min-w-0 space-y-3">
      <h2 id="es-bill" className="text-sm font-semibold">
        {t.heading}
      </h2>
      {bill.length ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
          {bill.map((s) => (
            <li key={s.name} className="flex min-w-0 items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
              <span className="shrink-0 font-medium tabular-nums">${s.amount}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          locale={locale}
          icon={<UsersIcon />}
          title={t.title}
          description={t.description}
          onLoadExample={() => setLoaded(true)}
          secondary={{ label: t.addPeople, href: "#members" }}
        />
      )}
    </section>
  );
}
