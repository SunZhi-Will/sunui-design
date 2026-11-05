"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ClassicFileUpload } from "./classic-file-upload";

const copy = {
  en: { heading: "Project attachments", body: "Add mockups, signed briefs, and any reference documents.", attached: (n: number) => `${n} attached` },
  "zh-TW": { heading: "專案附件", body: "加入設計稿、簽署好的需求單與任何參考文件。", attached: (n: number) => `已附加 ${n} 個` },
  "zh-CN": { heading: "项目附件", body: "添加设计稿、已签署的需求文档和其他参考资料。", attached: (n: number) => `已添加 ${n} 个` },
  ja: { heading: "プロジェクトの添付ファイル", body: "モックアップ、署名済みの依頼書、参考資料を追加してください。", attached: (n: number) => `${n} 件添付済み` },
};

// 模擬上傳：依檔案大小推進進度，約 1.2 到 2.4 秒完成
function fakeUpload(files: File[], onProgress: (p: number) => void) {
  const total = files.reduce((sum, f) => sum + f.size, 0);
  const duration = Math.min(2400, 1200 + total / 4000);
  const start = performance.now();
  return new Promise<void>((resolve) => {
    const tick = () => {
      const p = Math.min(100, ((performance.now() - start) / duration) * 100);
      onProgress(p);
      if (p < 100) setTimeout(tick, 80);
      else resolve();
    };
    tick();
  });
}

export default function ClassicFileUploadDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [attached, setAttached] = useState(0);

  return (
    <section aria-labelledby="attach-heading" className="w-full max-w-2xl min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 text-foreground sm:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 id="attach-heading" className="text-lg font-semibold">
            {t.heading}
          </h2>
          <p className="text-sm text-muted-foreground">{t.body}</p>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">{t.attached(attached)}</span>
      </header>
      <ClassicFileUpload

        locale={locale}
        multiple
        accept="image/*,application/pdf,.doc,.docx"
        maxSize={10 * 1024 * 1024}
        simulateProgress={false}
        onFileSelect={(files) => setAttached((n) => n + files.length)}
        onRemovePreview={() => setAttached((n) => Math.max(0, n - 1))}
        onFileUpload={fakeUpload}
        previewGridClassName="mt-2"
      />
    </section>
  );
}
