"use client";

import { useState } from "react";

import { ClassicFileUpload } from "./classic-file-upload";

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
  const [attached, setAttached] = useState(0);

  return (
    <section aria-labelledby="attach-heading" className="w-full max-w-2xl min-w-0 space-y-4 rounded-2xl bg-white p-4 text-gray-900 sm:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 id="attach-heading" className="text-lg font-semibold">
            Project attachments
          </h2>
          <p className="text-sm text-gray-500">Add mockups, the signed brief and any reference docs.</p>
        </div>
        <span className="text-sm text-gray-500 tabular-nums">{attached} attached</span>
      </header>
      <ClassicFileUpload
        theme="orange"
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
