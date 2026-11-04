import { codeToHtml } from "shiki";

import { CopyButton } from "@/components/copy-button";

export async function CodeBlock({ code, lang, title }: { code: string; lang: string; title?: string }) {
  const html = await codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-xs text-muted">{title ?? lang}</span>
        <CopyButton value={code} />
      </div>
      <div
        className="max-h-[32rem] overflow-auto p-4 font-mono text-[13px] leading-relaxed [&_pre]:outline-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
