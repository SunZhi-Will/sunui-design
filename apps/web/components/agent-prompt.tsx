"use client";

import { useRef, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

type Level = "verified" | "untested" | "manual" | "web-only";

export type AgentPromptPort = {
  id: string;
  label: string;
  level: Level;
  /** 選到這個平台時的區塊標題，例如「帶到 SwiftUI」 */
  title: string;
  /** 這個平台的說明文字（伺服器端先組好：函式不能從伺服器元件傳進來） */
  body: string;
  /** 免費 block：移植指南的網址，選到這個平台才去抓。Pro 沒有（公開頁面不放 Pro 原始碼）。 */
  url?: string;
  /** Pro：帶授權碼取得指南的指令。 */
  command?: string;
};

export type AgentPromptLabels = {
  title: string;
  body: string;
  copy: string;
  copied: string;
  /** 指令列旁的小顆複製鈕 */
  copyCommand: string;
  platform: string;
  portCopy: string;
  portLoading: string;
  portRetry: string;
  portDisclaimer: string;
  portLevels: Record<Level, string>;
  portLevelNotes: Record<Level, string>;
};

// 墨色主按鈕：淺色是黑底白字，深色反過來
const primary = "bg-fg px-4 py-2.5 text-sm text-bg shadow-btn hover:bg-fg hover:text-bg hover:opacity-90";

/**
 * 區塊頁的「交給 agent」：React 是安裝用的 prompt；其他平台是移植指南。
 * 免費 block 的指南選到才抓（每份 20 KB 以上，不塞進每一頁）；Pro 只給帶授權碼的取得指令。
 */
export function AgentPrompt({ prompt, ports, t }: { prompt: string; ports: AgentPromptPort[]; t: AgentPromptLabels }) {
  const [tab, setTab] = useState("react");
  const [guides, setGuides] = useState<Record<string, string | "loading" | "failed">>({});
  const requested = useRef(new Set<string>());
  const port = ports.find((p) => p.id === tab);

  function load(target: AgentPromptPort) {
    if (!target.url) return;
    requested.current.add(target.id);
    setGuides((g) => ({ ...g, [target.id]: "loading" }));
    fetch(target.url)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => setGuides((g) => ({ ...g, [target.id]: text })))
      .catch(() => setGuides((g) => ({ ...g, [target.id]: "failed" })));
  }

  function select(id: string) {
    setTab(id);
    const target = ports.find((p) => p.id === id);
    if (target && !requested.current.has(id)) load(target);
  }

  const guide = port ? guides[port.id] : undefined;

  return (
    <section className="mt-8 rounded-lg border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="text-sm font-semibold">{port ? port.title : t.title}</h2>
        {ports.length > 0 && (
          <div role="tablist" aria-label={t.platform} className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-md bg-stage p-0.5 text-[13px]">
            {[{ id: "react", label: "React" }, ...ports].map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={tab === p.id}
                onClick={() => select(p.id)}
                className={cn(
                  "shrink-0 rounded-[4px] px-2.5 py-1 whitespace-nowrap transition-colors",
                  tab === p.id ? "bg-card font-medium text-fg shadow-e1" : "text-subtle hover:text-fg",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!port ? (
        <div role="tabpanel" className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm text-pretty text-subtle">{t.body}</p>
          <CopyButton value={prompt} labels={{ copy: t.copy, copied: t.copied }} className={primary} />
        </div>
      ) : (
        <div role="tabpanel" className="mt-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm text-pretty text-subtle">{port.body}</p>
            {port.url &&
              (typeof guide === "string" && guide !== "loading" && guide !== "failed" ? (
                <CopyButton value={guide} labels={{ copy: t.portCopy, copied: t.copied }} className={primary} />
              ) : guide === "failed" ? (
                <button type="button" onClick={() => load(port)} className={cn("shrink-0 rounded-[5px] font-medium whitespace-nowrap", primary)}>
                  {t.portRetry}
                </button>
              ) : (
                <span aria-live="polite" className="shrink-0 px-4 py-2.5 text-sm text-subtle">
                  {t.portLoading}
                </span>
              ))}
          </div>
          {port.command && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-stage py-1.5 pr-1.5 pl-4 [contain:inline-size]">
              <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap">
                <span className="text-subtle select-none">$ </span>
                {port.command}
              </code>
              <CopyButton value={port.command} labels={{ copy: t.copyCommand, copied: t.copied }} />
            </div>
          )}
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-pretty text-subtle">
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
                port.level === "verified" ? "border-fg/25 text-fg" : "border-line",
              )}
            >
              {t.portLevels[port.level]}
            </span>
            <span>
              {t.portLevelNotes[port.level]} {t.portDisclaimer}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
