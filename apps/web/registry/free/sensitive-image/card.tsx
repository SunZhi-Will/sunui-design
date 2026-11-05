"use client";

import { useState } from "react";

import { revealImage, SensitiveImage } from "./sensitive-image";

// 示意的生成結果：色塊與簡單形狀，代替真實圖片
const src = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c28b"/><stop offset="1" stop-color="#d9735b"/></linearGradient></defs><rect width="512" height="640" fill="url(#g)"/><circle cx="256" cy="230" r="70" fill="#7a4a3a"/><rect x="176" y="310" width="160" height="240" rx="70" fill="#8a5240"/></svg>',
)}`;

const KEY = "card-g-102";

/** 型錄卡片：一張分級為 Sensitive 的圖先模糊，按「顯示」才看得到，可再遮回去。 */
export default function SensitiveImageCard() {
  const [shown, setShown] = useState(false);

  return (
    <figure className="mx-auto w-60 rounded-xl border border-border bg-card p-2.5 text-card-foreground">
      <SensitiveImage
        src={src}
        alt="Portrait in swimwear, beach, golden hour"
        width={512}
        height={640}
        rating="sensitive"
        revealKey={KEY}
        onReveal={() => setShown(true)}
        className="aspect-[4/3] rounded-lg"
      />
      <figcaption className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate">Beach, golden hour</span>
        {shown && (
          <button
            type="button"
            onClick={() => {
              revealImage(KEY, false);
              setShown(false);
            }}
            className="shrink-0 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Blur again
          </button>
        )}
      </figcaption>
    </figure>
  );
}
