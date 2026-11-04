# 從原始專案移植 block 的規則

> 適用於 `meta.series` 為 product、story、classic、cardflow 的 block。
> 這些 block 是**移植**，不是重新設計：長相與行為以原始碼為準，SunUI 的紙感規則（DESIGN.md）不適用。

## 1. 先讀原始碼

- 動工前完整讀過來源檔案，以及它 import 的 hook、樣式（CSS 檔、globals.css 裡的 keyframes 與 token）。
- 不得只憑描述或記憶重寫。

## 2. 要保留的

| 項目 | 規則 |
|---|---|
| 視覺 | 顏色、漸層、光暈、毛玻璃、陰影、圓角、字重、間距照原樣。原本的 hex 值寫成元件內常數或 CSS 變數預設值 |
| 強調色 | 原本寫死的品牌色改成 `accent` prop 或 CSS 變數，**預設值用原本的顏色** |
| 明暗 | 原本只有暗色就維持暗色（元件自帶底色，不依賴網站主題）；原本兩種都有就兩種都保留 |
| 互動與時序 | 時長、緩動曲線、自動關閉秒數、輪詢間隔、鍵盤操作、狀態流程照原樣 |
| 文案結構 | 文案改成 `labels` prop，預設值用原文（可翻成英文，但語氣與資訊量相同） |
| 無障礙 | 原本有的 aria 全部保留；原本缺的可以補，但不得改變行為 |

## 3. 可以改的

- 從專案資料、API、store、router 解耦，改成 props 與 callback。
- `next/image` 改 `<img>`；`lucide-react`、icon 套件改 inline SVG（形狀照原 icon）；`sonner` 等 toast 套件改成元件內實作，行為相同。
- CSS 檔裡的 keyframes 改成元件內 `<style>` 或 framer-motion，視覺結果相同。
- 原本沒有 reduced motion 的，補上「動畫改為立即切換」。

## 4. 程式

- 每個 block 一個主檔，必要時可拆成同資料夾的第二個檔（registry `files` 一起列出）。行數不設上限，以忠實為先。
- 依賴：`framer-motion`、`cn`（`@/lib/utils`）。其他 npm 套件只有在原始功能非它不可時才用（例如 markdown 渲染用 `react-markdown`），並列在 registry item 的 `dependencies`。
- demo.tsx：用原專案的真實情境與資料形狀（可換成虛構但同型的資料），不放測試按鈕，375px 不破版，不用外部網址圖片。
- 程式與註解不使用破折號「—」「——」。
