# SunUI 動效系列（motion）

> `meta.series: "motion"` 的 block 遵守這份文件，不套用 DESIGN.md 的紙感限制（漸層、光暈、進場動畫、常駐循環在這個系列都允許）。
> 概念參考：Motion Library（kittenjam-motion-library.vercel.app）與 ShowMotion（showmotion.bohehub.com）。兩站沒有開放授權，所以**只參考效果名稱與概念，程式碼、CSS、提示詞、文案全部自己寫**，不得開對方原始碼照抄。

## 一句話

**動效庫**：每個 block 是一組同類效果（文字、進出場、按鈕…），用一個 `effect` 或 `preset` prop 切換，買家裝一個就拿到十幾種。

## 1. 結構

- 一個 block = 一個主檔 `<name>.tsx`，匯出一個主元件（例如 `TextEffect`），用 `effect` prop 選效果；也可以額外匯出個別元件。
- 效果清單以 `as const` 陣列匯出（例如 `textEffects`），型別由它推出，demo 與文件都從這裡讀。
- 主檔可以超過 250 行，但每個效果的實作要短而獨立，不共用難懂的全域狀態。
- 只依賴 `framer-motion` 與 `cn`（`@/lib/utils`）。不得引入 GSAP 或其他動畫套件。Canvas 效果用原生 Canvas 2D。
- `"use client";` 開頭；variants 標 `Variants` 型別。

## 2. 顏色

- 預設跟隨 shadcn token（`text-foreground`、`bg-primary`、`border-border`），買家主題換了效果就跟著換。
- 漸層、光暈、發光可以用，但顏色從 `currentColor`、`var(--primary)` 或 `colors` prop 來，不要寫死紫粉漸層。
- Light 與 Dark 都要看得清楚。

## 3. 動畫

- 觸發方式統一用 `trigger` prop：`"mount"`（預設）、`"inView"`、`"hover"`、`"click"`、`"loop"`，視效果支援的部分提供。
- `useReducedMotion()` 為真時：進場直接顯示最終狀態，循環停止，互動效果只保留顏色變化。資訊不能遺失。
- 循環效果在離開畫面或分頁隱藏時暫停（`useInView` 或 `document.visibilityState`）。
- Canvas 效果處理 devicePixelRatio 與 resize，卸載時取消 requestAnimationFrame。
- 文字效果拆字時，原文放進 `aria-label` 或 `sr-only`，拆開的字加 `aria-hidden`。

## 4. 示範（demo.tsx）

- demo 是效果圖鑑：每個效果一格，格內標示效果名稱，格子排成響應式網格（375px 單欄）。
- 每格右上角放一個小「重播」按鈕（重新掛載該格），讓進場效果可以再看一次。循環與互動效果不需要。
- 文案支援 en、zh-TW、zh-CN、ja（用 `useDemoText`）。

## 檢查表

- [ ] 只依賴 framer-motion 與 cn
- [ ] 程式碼與文案全部自寫
- [ ] 每個效果都能用 `effect` / `preset` 切換
- [ ] reduced motion 下資訊完整、循環停止
- [ ] 循環效果離開畫面時暫停
- [ ] Light、Dark、375px 都看過
