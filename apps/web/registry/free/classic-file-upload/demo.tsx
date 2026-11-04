"use client";

import { useState } from "react";

import { ClassicFileUpload, type ClassicFileUploadProps, type FileUploadTheme } from "./classic-file-upload";

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

const variants: { theme: FileUploadTheme; title: string; note: string; props: Partial<ClassicFileUploadProps> }[] = [
  { theme: "violet", title: "Violet", note: "Thumbnails", props: { multiple: true, accept: "image/*,application/pdf" } },
  { theme: "cyan", title: "Cyan", note: "Compact list", props: { multiple: true, showPreview: false } },
  { theme: "orange", title: "Orange", note: "Single image, 2 MB", props: { accept: "image/*", maxSize: 2 * 1024 * 1024 } },
];

export default function ClassicFileUploadDemo() {
  const [attached, setAttached] = useState(0);

  return (
    <div className="w-full max-w-4xl space-y-8 rounded-2xl bg-white p-4 text-gray-900 sm:p-8">
      <section aria-labelledby="attach-heading" className="space-y-4">
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

      <section aria-labelledby="themes-heading" className="space-y-4">
        <h2 id="themes-heading" className="text-lg font-semibold">
          Themes
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {variants.map((v) => (
            <div key={v.theme} className="min-w-0 space-y-2">
              <p className="text-sm font-medium">
                {v.title} <span className="font-normal text-gray-500">{v.note}</span>
              </p>
              <ClassicFileUpload
                theme={v.theme}
                className="p-4"
                placeholder="Drop or click"
                onFileUpload={() => new Promise<void>((r) => setTimeout(r, 1000))}
                {...v.props}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
