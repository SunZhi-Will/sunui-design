"use client";

/** 公告條的關閉按鈕：記住選擇，並用跟首次繪製同一個屬性把公告條藏起來 */
export function FoundingBarDismiss({ storageKey, label }: { storageKey: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {
          // 無痕模式等不能寫入時，這次照樣關掉
        }
        document.documentElement.dataset.foundingBar = "hidden";
      }}
      className="grid size-7 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}
