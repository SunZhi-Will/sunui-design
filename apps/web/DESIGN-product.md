# SunUI 產品介面系列（product）

> `meta.series: "product"` 的 block 遵守這份文件，不套用 DESIGN.md 的紙與朱紅。
> 來源：從 Schedary、usermeld、spliteat-web、ComfyUI、autolens、PostVault、VideoAligner、voxcpm、Synvize 蒸餾（見 reports/UIUX 蒸餾報告-2026-11-05.md 第 1 節）。

## 一句話

**安靜的工具介面**：中性灰底、一個強調色、狀態只上在點上，把「為什麼」直接寫在畫面上。

## 1. 顏色

| 角色 | Tailwind 寫法 | 規則 |
|---|---|---|
| 介面 | `bg-background` `bg-card` `border-border` `text-muted-foreground` | 全部用 shadcn token，Light 與 Dark 自動跟隨 |
| 強調 | `bg-primary` `text-primary` `ring-ring` | **整個 block 只有一種強調色**，只給：今天、焦點、目前狀態、主要動作、資料強調 |
| 強調淡底 | `bg-primary/10` | 選取狀態的淡底，取代整塊上色 |
| 狀態 | `bg-emerald-500` `bg-amber-500` `bg-destructive` `bg-sky-500` | **只上在 6px 以下的點**，文字維持 `text-foreground` 或 muted |
| 身分色 | 依 id 雜湊出 hue | 只上在點、頭像或 2px 色條 |

不准：漸層、光暈、彩色陰影、毛玻璃（浮動 HUD 例外，最多 `backdrop-blur-sm` 加 88% 不透明底）。

## 2. 形狀

- 控制項 `rounded-md`，卡片與面板 `rounded-xl`，選單 `rounded-lg`，膠囊 `rounded-full`。
- 邊線 1px `border-border`；浮動層最多 `shadow-sm`。
- 區段標籤：`text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground`，每個 block 最多一種。

## 3. 字體

- 數字、時間、百分比一律 `tabular-nums`；計時器與 ID 用 `font-mono`。
- CJK 字距不低於 `-0.01em`；標題 `font-semibold`，不用 bold。
- 文案以結果命名按鈕（「刪除地址」而不是「確定」）。

## 4. 動態

```ts
const ease = [0.23, 1, 0.32, 1] as const; // expo-out，全系列唯一緩動
const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;
```

1. 時長階梯 120 / 180 / 240 / 360ms；阻擋操作的動畫不超過 360ms。
2. 只動 transform、opacity；高頻更新（拖曳、播放頭、音量）直接寫 style 或 CSS 變數，不走 React state。
3. 自動播放的展示（demo、故事、bento）**只在可視範圍內播**，離開畫面或分頁隱藏就暫停，並提供暫停／重播。
4. `useReducedMotion()` 為真：直接顯示最終畫面，資訊不能遺失。
5. 指標效果只在 `(pointer: fine)` 啟用。

## 5. UX 規則

- **把為什麼寫出來**：建議附理由與信心度、降速附原因、檢查結果放在主要按鈕旁邊而不是對話框。
- **一個主要動作**：其餘收進次要按鈕或選單。
- **誠實**：不假稀缺、不顯示 0、背景工作失敗要留在畫面上。
- 完整鍵盤與螢幕閱讀器支援；只在狀態改變時 `aria-live`，不要逐秒播報。

## 6. 程式與示範

- 單一檔案，目標 250 行、上限 300；只依賴 `framer-motion` 與 `cn`；inline SVG 圖示，線寬 1.5。
- demo 放真實情境（後台、工具、課程、內容產品），不放測試按鈕；375px 不破版。

## 檢查表

- [ ] 只有一個強調色，狀態色只在點上
- [ ] 沒有漸層、光暈、彩色陰影
- [ ] 自動播放的東西離開畫面會停，且可暫停
- [ ] reduced motion 下資訊完整
- [ ] 數字 tabular-nums
- [ ] Light 與 Dark、375px 都看過
