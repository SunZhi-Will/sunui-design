# self-building-page 場景分析

> 2026-11-07。來源是 Joel Califa 在 X 的貼文「what if your website built itself」（2026-10-15，6.7 萬次觀看、1,020 讚、634 書籤）。這份回答四件事：效果怎麼拆、做成 Pro 是否合理、它在 agent 通路（MCP、skill、llms）的狀態、接下來怎麼用。【已驗證】表示這次在 repo 或瀏覽器實測；【建議】【估算】是推論。

## 0. 結論先講

1. **效果已完成，放 Pro。** 元件、demo、型錄卡片、四語系、registry 條目都已就位，授權安裝用 shadcn CLI 實裝成功。【已驗證】
2. **它是「發表與展示」素材，不是檔期營收主力。** 用四個問題檢查：可替代性低、工時高、展示價值極高，但**商業距離遠**（它不是電商頁）。所以它的價值在 2027-01-12 Product Hunt 發表與社群曝光，不在接案者的日常案子。
3. **要讓它接上主力客群，需要一座橋：讓 Pro 檔期場景可以被「蓋出來」。** 接案者真正會用的情境是「客戶活動頁上線當天的開場」，不是 AI 產品官網。
4. **agent 通路不用另外接。** MCP、SKILL.md、llms-full.txt 都讀同一份 registry metadata，新增條目後自動出現，搜尋排名第一。【已驗證】

## 1. 效果拆解（看影片逐格）

| 時間 | 畫面 | 對應實作 |
|---|---|---|
| 0:00 至 0:04 | 二十多個彩色游標在 logo 周圍排成圓圈旋轉 | 開場：游標在可見區中央排成一圈轉半圈再散開 |
| 0:04 至 0:12 | 游標拉出選取框、出現尺寸標籤（如 580 × 48）、紅色參考線、I 字游標打字 | 每個 `data-build` 元素：拖框、W × H 標籤、十字參考線，文字用 clip-path 逐格露出 |
| 0:12 至 0:45 | 隨捲動，往下的區段一段段被蓋出來 | IntersectionObserver 進入畫面才排入工作佇列，依文件順序分派給空閒游標 |
| 0:50 | 頁尾寫「這頁是你捲動時由 39 個 agent 蓋出來的」，游標聚成一群 | demo 最後一行文案；蓋完後游標在最後施工處附近慢慢晃 |

與原作的差異【已驗證】：

- 原作是單一網站，這裡做成**包裝元件**：任何頁面在元素上加 `data-build` 就能套用，不綁內容。
- 原作的參考線是紅色、選取框是藍色；這裡依 DESIGN-product.md 只用一個強調色（`primary`），游標用身分色（黃金角分散色相）。
- 補上原作沒有的：reduced motion 直接顯示完整頁面、離開畫面或分頁隱藏就停、可重新蓋一次、四語系 HUD。
- 品牌名與文案全部重寫（Loomwork），不沿用原作的 Swarm。

## 2. 做成 Pro 是否合理

用 `免費與付費切分規劃-2026-11-05.md` 的四個問題：

| 問題 | 結果 | 判斷 |
|---|---|---|
| 可替代性：別家免費層有沒有？ | Magic UI、React Bits 沒有同類；多人游標元件有，但沒有「施工」語意 | 偏 Pro |
| 工時：使用者自己做要多久？ | 排程、佇列、游標動畫、打字、選取框、重播、無障礙，約 2 至 3 天【估算】 | 偏 Pro |
| 商業距離：離營收多近？ | 不是電商頁，主力客群（接案者做檔期頁）用不到原樣 | **偏遠** |
| 展示價值 | 原貼文的互動數證明它會被轉發 | 極高 |

結論：放 Pro 沒問題，也符合凍結規則（凍結的是免費層，Pro 場景正是該投入的方向）。但要誠實看待第三項：**它單獨存在時，賣的是「酷」，不是「省時間」。**

## 3. 三個用法，依優先順序

### 3.1 Product Hunt 發表頁與首頁（最優先）【建議】

把 SunUI 自己的 PH 落地頁或首頁 hero 用 self-building-page 包起來，頁尾寫「這頁是你捲動時由 N 個 agent 蓋出來的」。理由：

- SunUI 的故事本來就是「agent 透過 MCP 幫你裝區塊」，這個效果把這件事視覺化。
- PH 與 X 上的分享，靠的是一段 10 秒內看得懂的影片；這個效果正好是。
- 成本最低：元件已完成，只要在首頁元素上加 `data-build`。

注意：首頁的 hero 標題通常是 LCP 元素，標了 `data-build` 會延後 LCP。做法是 hero 標題不標、其餘標，或先量 Lighthouse 再決定。

### 3.2 搭橋到檔期場景（讓主力客群用得到）【建議】

接案者的真實情境：客戶活動頁上線當天想要一個開場。目前 Pro 場景（campaign-landing、flash-sale-hero、launch-stage-hero）的內部元素沒有 `data-build`，包起來也只會整塊出現。

建議在這幾個場景加一個 `buildable` prop，打開時在標題、說明、按鈕、卡片上輸出 `data-build`。這樣「self-building-page 包 campaign-landing」就是一個可以賣給 agency 的組合，也能在定價頁拍成影片。工時約半天【估算】。

### 3.3 AI 與 agent 產品官網（客群 C 的順手收）

元件原樣就適合 AI、agent、設計工具、no code 產品的官網。這是 C 類客群（Indie SaaS），不主攻，但 registry 搜尋會自然帶到。

## 4. agent 通路的狀態【已驗證】

| 通路 | 狀態 | 怎麼驗證 |
|---|---|---|
| MCP `search_blocks` | 查「multiplayer cursors that build the page」排第一 | curl `/mcp` 的 tools/call |
| 搜尋評估 `eval-agent-search.mjs` | 新增 3 個案例全過（multiplayer cursors、self building website、build on scroll），總計 27/29，兩個失敗是既有的免費 block 案例 | 執行腳本 |
| llms-full.txt | 有條目與使用建議，**沒有**任何原始碼片段 | grep 內部函式名為 0 |
| `/r/pro/self-building-page.json` | 無授權 401；測試授權回傳附授權 ID 檔頭的原始碼 | curl |
| shadcn CLI 實裝 | 在乾淨的 Next 15 專案安裝成功、型別檢查通過 | scratchpad 實測 |
| 設計文件與 guidelines.ts | 沒有改 DESIGN 文件，不需同步 | 不適用 |

給 agent 的提示已寫在 `meta.usage`：whenToUse（AI 產品官網、想要令人印象深刻的第一次捲動）、watchOut（`data-build` 不可巢狀、首屏必要資訊不要標）、aliases 八個。

## 5. 這次順便發現的問題

**shadcn 官方的 `utils` 項目現在依賴 npm 套件 `cn`。**【已驗證，`npx shadcn view utils` 回傳 dependencies: ["cn"]】SunUI 所有 block（免費與 Pro）都宣告 `registryDependencies: ["utils"]`，所以使用者安裝任何一個 block，`package.json` 都會多一個 `cn`。功能不受影響（使用者已有的 `lib/utils.ts` 會被保留），但這是一個多餘的依賴，而且上游改動可能再變。建議另開一個任務評估：改成自帶 `cn` 的 registry item，或在文件說明。

## 6. 規格與限制

- 元件 300 行（DESIGN-product.md 上限），只依賴 `framer-motion` 與 `cn`。
- 游標位置直接寫 style，不走 React state；只有選取框清單與完成數走 state。
- `data-build` 元素在 DOM 裡一直存在，搜尋引擎與螢幕閱讀器讀得到；看不見的只是視覺。
- 已在瀏覽器確認：桌面暗色、375px 亮色、捲到底 26/26、重新蓋一次、型錄卡片循環播放。
- 沒有做的：Lighthouse 量測、Safari 實機測試。

## 7. 需要你決定的事

1. 要不要把 SunUI 首頁或 PH 落地頁改用這個效果（3.1）？
2. 要不要在三個檔期場景加 `buildable`（3.2）？
3. `cn` 依賴問題要不要另開任務處理（第 5 節）？

## Conclusion

self-building-page 已經是一個完整、可安裝、agent 搜得到的 Pro 場景。它最強的用途不是單獨賣，而是兩件事：替 SunUI 自己的發表拍出會被轉發的畫面，以及透過 `buildable` 把它接到檔期場景上，讓接案者有理由用它。前者幾乎不花工時，建議在 PH 前做完。
