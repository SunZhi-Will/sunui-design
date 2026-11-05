"use client";

import { useDemoLocale } from "@/lib/demo-locale";

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

/** 型錄卡片：一個拖放上傳區，點擊或拖檔進來，看進度條與縮圖。 */
export default function ClassicFileUploadCard() {
  const locale = useDemoLocale();
  return (
    <div className="mx-auto w-72">
      <ClassicFileUpload locale={locale} multiple maxSize={10 * 1024 * 1024} simulateProgress={false} onFileUpload={fakeUpload} className="p-4" />
    </div>
  );
}
