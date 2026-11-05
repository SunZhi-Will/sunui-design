# 從原始專案移植 block 的規則

> 適用於 `meta.series` 為 product、story、showcase、classic、cardflow 的 block。
> **2026-11-05 修訂**：移植保留的是「功能、行為、結構」，不是「長相」。原專案多半用模板式的紫粉漸層、光暈、霓虹色與漸層字，放進同一個型錄會讓整套看起來像 AI 生成。所以視覺一律收斂到第 3 節的「去 AI 感」規則，原本的顏色只能透過 `accent` prop 或 CSS 變數讓買家自己開回來。

## 1. 先讀原始碼

- 動工前完整讀過來源檔案，以及它 import 的 hook、樣式（CSS 檔、globals.css 裡的 keyframes 與 token）。
- 不得只憑描述或記憶重寫。

## 2. 要保留的

| 項目 | 規則 |
|---|---|
| 互動與時序 | 時長、緩動曲線、自動關閉秒數、輪詢間隔、鍵盤操作、狀態流程照原樣 |
| 結構 | 版面骨架、資訊層級、元件拆分、props API 照原樣（新增 prop 可以，刪除或改名不行） |
| 明暗 | 原本只有暗色就維持暗色（元件自帶底色，不依賴網站主題）；原本兩種都有就兩種都保留 |
| 文案結構 | 文案改成 `labels` prop，預設值用原文（可翻成英文，但語氣與資訊量相同） |
| 無障礙 | 原本有的 aria 全部保留；原本缺的可以補，但不得改變行為 |

## 3. 視覺收斂（去 AI 感）

### 3.1 禁止清單

下列都是「一看就是模板／AI 生成」的訊號，移植時一律拿掉：

- 紫、靛、紫紅、粉的漸層或底色（`violet` `purple` `indigo` `fuchsia` `pink` 家族、`#8b5cf6` `#a855f7` `#6366f1` `#7c3aed` 這類）
- 漸層文字（`bg-clip-text text-transparent`）、彩虹或多色漸層按鈕
- 彩色光暈：`box-shadow: 0 0 Npx <彩色>`、`drop-shadow` 發光、`blur-3xl` 光斑、背景模糊光球
- 毛玻璃當裝飾（`backdrop-blur` 只留給真的疊在內容上的浮動 HUD，且底色不透明度 85% 以上）
- 常駐的上下漂浮、呼吸、脈動（`animate-pulse` 只留給「錄影中」「處理中」這種真實狀態的小點）
- 進場的逐個彈出、縮放閃爍；星點、粒子、彩帶
- 裝飾用 emoji（✨🚀🎉🔥）與「sparkle」圖示
- 一個元件裡出現兩種以上強調色

### 3.2 各系列的替代語言

| 系列 | 底與字 | 唯一強調色（預設） | 備註 |
|---|---|---|---|
| product、cardflow、classic | shadcn token：`bg-background` `bg-card` `border-border` `text-muted-foreground`，跟隨網站明暗 | `primary`（買家主題）；需要彩色時用 `accent` prop，預設 `#c8361d` 朱紅只用在一處 | 依 DESIGN-product.md。畫布工具的選取框可用 `#2563eb` 藍，這是工具慣例不是裝飾 |
| showcase | 自帶暗色：底 `#0c0a09`，面 `#161412`，線 `rgb(255 255 255 / 0.08)`，字 `#f5f5f4`，次要 `#a8a29e` | 琥珀金 `#d4a24c`，透過 `accent` prop 可換 | 像雜誌與產品發表會，不像霓虹夜店。大數字用 `tabular-nums`，可以用襯線 |
| story | 依 DESIGN-story.md 的 `--story-*` token | `--story-accent` | 遊戲介面可以保留一層內光與一道深陰影，但不准彩色外發光 |

### 3.3 可以留的漸層

只有「功能性」漸層可以留：

- 圖片或影片上為了讓字讀得到的單色黑色遮罩（`from-black/70 to-transparent`）
- 捲動容器邊緣的淡出遮罩（mask）
- 模擬實體材質的明暗（書脊、布料、紙張的光影），顏色必須是同色相的深淺，不能跨色相

### 3.4 圖示與插圖

- 示意圖用中性色塊與線條（`bg-muted`、1.5px 線），不用紫藍漸層的假截圖。
- 頭像用字首縮寫加依 id 雜湊的低彩度底色，或中性剪影；不用卡通插畫風。

## 4. 可以改的

- 從專案資料、API、store、router 解耦，改成 props 與 callback。
- `next/image` 改 `<img>`；`lucide-react`、icon 套件改 inline SVG（形狀照原 icon）；`sonner` 等 toast 套件改成元件內實作，行為相同。
- CSS 檔裡的 keyframes 改成元件內 `<style>` 或 framer-motion。
- 原本沒有 reduced motion 的，補上「動畫改為立即切換」。

## 5. 程式

- 每個 block 一個主檔，必要時可拆成同資料夾的第二個檔（registry `files` 一起列出）。
- 依賴：`framer-motion`、`cn`（`@/lib/utils`）。其他 npm 套件只有在原始功能非它不可時才用（例如 markdown 渲染用 `react-markdown`），並列在 registry item 的 `dependencies`。
- demo.tsx 與 card.tsx：用原專案的真實情境與資料形狀（可換成虛構但同型的資料），不放測試按鈕，375px 不破版，不用外部網址圖片。示範文案不要每個都寫「Learn to build with AI」，換成多樣的真實產品情境。
- 程式與註解不使用破折號「—」「——」。

## 檢查表

- [ ] 3.1 禁止清單全部清掉（可以用 `grep -E "violet|purple|indigo|fuchsia|pink-|bg-clip-text|0 0 [0-9]+px|blur-3xl|animate-pulse"` 自查）
- [ ] 一個元件只有一種強調色，且可用 `accent` prop 或 CSS 變數換掉
- [ ] 行為、時序、鍵盤操作與修改前完全相同
- [ ] Light 與 Dark（若適用）、375px 都看過
