# SunUI 圖示規範

> 靜態：`registry/icons/sunui-icons.tsx`（`<site>/r/icons/sunui-icons.json`，無依賴）
> 動態：`registry/icons/sunui-animated-icons.tsx`（`<site>/r/icons/sunui-animated-icons.json`，依賴 framer-motion 與靜態版）
> 像素：`registry/icons/sunui-pixel-icons.tsx`（`<site>/r/icons/sunui-pixel-icons.json`，無依賴）
> 展示頁：`/icons`，可切換 Static / Animated / Pixel。

## 為什麼要做

2026-11-05 盤點 registry 內所有 inline SVG（97 個檔案）的結果：

| 問題 | 現況 |
|---|---|
| 網格不一致 | 同時存在 16（55 處）、20（21 處）、24（49 處）三種 viewBox |
| 同一圖示重畫 | `CheckIcon` 12 份、`CopyIcon` 5 份、`LockIcon` 與 `AlertIcon` 各 3 份，路徑都略有不同 |
| 線寬漂移 | 規範寫 1.5，實際出現 1、1.2、1.6、1.8、2、2.5、3 |
| 缺少招牌圖形 | 優惠券、收據、印章、集點卡這些 SunUI 最有辨識度的物件沒有共用圖示 |

結論：用一套 24 網格的圖示統一外觀，並把紙品物件做成招牌圖示。

## 規格

1. **網格**：`viewBox="0 0 24 24"`，內容落在 3 到 21 之間（2px 安全邊）。圓形半徑上限 8.5，方形距中心 7。
2. **線條**：`strokeWidth` 1.5、`strokeLinecap="round"`、`strokeLinejoin="round"`，顏色 `currentColor`。32px 以上可降到 1.25。
3. **填色**：只有點（`more` 的三點、`info` 的 i 點、集點卡已蓋的格子）用實心，其餘全部是線條。
4. **朱紅點**：每個圖示最多標一個 accent 部位。預設跟著 `currentColor`，設定 `--sunui-icon-accent` 才上色。一個畫面只開一處，對應 DESIGN.md「朱紅每個 block 最多一處」。
5. **紙品細節**：票券要有半圓缺口與打孔虛線、收據底部是鋸齒、印章內文字傾斜約 -10°。不加陰影、漸層。
6. **無障礙**：預設 `aria-hidden`；單獨出現、沒有文字標籤時傳 `title`。

## 分組

| 組別 | 用途 | 例子 |
|---|---|---|
| Paper | SunUI 招牌 | coupon、receipt、ticket、stamp、stamp-check、stamp-tool、punch-card、scissors、envelope |
| Commerce | 購物流程 | cart、bag、tag、percent、gift、truck、package、store、card、wallet、scan、flash、timer |
| Interface | 通用控制 | check、close、chevron-*、search、copy、retry、alert、lock、eye、bell、star、heart… |
| Product UI | 工具型介面 | status、loader、activity、gauge、terminal、inbox、shield、caption… |
| Story | 敘事遊戲 | play、pause、skip、book、dialogue、lantern、scroll、quill、map、gem、trophy |

2026-11-05 補上：home、filter、mail、phone、globe、map-pin、sparkle（Interface），coin（Commerce），gem、trophy（Story）。

## 動態圖示

動態版與靜態版共用同一份幾何（`icons`），只在 `recipes` 裡描述「哪個部位、怎麼動」。需要拆開的形狀（優惠券的票根、下載的箭頭）或兩種狀態互換（選單與叉、播放與暫停、太陽與月亮）才自帶 `nodes`。

| 類型 | 觸發 | 例子 | 規則 |
|---|---|---|---|
| hover | 滑過或聚焦**父元素**（整顆按鈕） | bell 擺動、coupon 沿打孔線撕開、stamp 壓下彈起、cart 傾斜、retry 轉一圈 | 陣列值是一次性關鍵影格，離開時立即歸位不倒放；單一值是滑過期間維持的狀態 |
| toggle | `active` prop | menu 變叉、heart 與 star 像印章一樣填滿、punch-card 蓋下一格、chevron-down 翻轉、theme 太陽換月亮 | 雙向都用 gentle 彈簧，填滿類用 stamp 彈簧 |
| loop | `active` 為真期間 | loader、status | 只給載入與即時狀態，對應 DESIGN.md「常駐循環只限倒數與載入」 |

動作原則：

1. 動作要有實體意義：撕票根是以打孔線頂端為軸張開、蓋章是先壓下再彈回、垃圾桶蓋以左端為軸掀起。不做沒有意義的縮放閃爍。
2. 單次 400ms 以內（`ONCE` 預設 0.4 秒）。
3. 旋轉中心一律用 24 網格座標（`origin: [x, y]`），內部轉成 `transform-box: view-box`，不同形狀才能共用同一個軸心。
4. `useReducedMotion()` 為真：所有轉場改為 0 秒，直接顯示結果；loop 不播放。
5. 朱紅只出現在 accent 部位（例如填滿後的愛心、集點卡新蓋的一格）。

## 像素圖示

線條版之外的第二種風格，給復古、遊戲化、集點活動這類想要「點陣感」的畫面用。兩套不混用：同一個畫面選一種。

1. **網格**：16 × 16 點陣，`viewBox="0 0 16 16"`，內容落在 1 到 14 之間（1 格安全邊）。游標這類需要滿版的例外。
2. **線條**：物件用 1 格外框；勾、叉、加減、箭頭、選單這些控制符號用 2 格粗線，16px 下才不會斷。
3. **資料格式**：每個圖示是 16 列字串，`#` 墨色、`+` 朱紅點、`.` 留白。渲染時把同列相鄰格合併成一段矩形，墨色與朱紅各一條 path。
4. **銳利度**：`shape-rendering="crispEdges"`，尺寸用 16 的整數倍（16、32、48、64）。24px 這類非整數倍會糊，展示頁因此只提供 16、32、48。
5. **朱紅點**：沿用 `--sunui-icon-accent`，規則同線條版：每個圖示最多一個部位（印章、藥水、旗面這類整體就是主角的例外）。
6. **分組**：Interface、Paper、Commerce，加上像素版獨有的三組遊戲圖示：
   - Gear（裝備）：sword、dagger、axe、hammer、bow、wand、shield、helmet、armor、boots、ring、amulet
   - Items（道具）：potion、key、gem、crown、chest、trophy、bomb、orb、scroll、map、apple、meat、fish、dice、hourglass、book、torch
   - World & HUD（世界與 HUD）：skull、ghost、slime、fire、snowflake、door、flag、heart-half、sparkle、battery、flash、gamepad、cursor
   - 遊戲圖示只畫通用物件，不仿任何現有遊戲的角色或造型。
7. **不做動態版**：像素圖示的動態應該是逐格換圖，與 framer-motion 的補間不同，等真的有需要再設計。

新增像素圖示：在 `sunui-pixel-icons.tsx` 的 `pixelIcons` 加一筆 16 × 16 字串，放進 `lib/icon-groups.ts` 的 `pixelIconGroups`，再到 `/icons` 的 Pixel 分頁用 16 與 48 檢查。

## 新增圖示

1. 在 `sunui-icons.tsx` 的 `icons` 加一筆，名稱用 kebab-case 名詞。
2. 在 `lib/icon-groups.ts` 放進對應分組，必要時補中英關鍵字。
3. 到 `/icons` 用 16 與 24 兩個尺寸、Light 與 Dark 各看一次，確認在 16px 下還認得出來。
4. 若要動態版，在 `sunui-animated-icons.tsx` 的 `recipes` 加一筆，選 hover、toggle 或 loop，並在 Animated 模式下用 72px 預覽確認軸心方向。

## 與 block 的關係

Block 仍維持「單一檔案、只依賴 framer-motion 與 cn」。新 block 需要圖示時，從 `/icons` 按 Copy SVG 貼成 inline SVG，形狀就會和整套一致。既有 block 逐步替換即可，不必一次改完。

替換範圍（2026-11-05 決定）：

| 系列 | 圖示 |
|---|---|
| pro、free 的 paper 系列 | 已換成 24 網格的 SunUI 圖示 |
| product、story、classic | **保留來源專案的原圖示**，因為這些是忠實移植，圖示屬於原作外觀的一部分，不要換成 SunUI 圖示 |
| 評分與收藏（star-rating、favorite-button）、animated-number 的箭頭 | 刻意保留，屬於元件本身的造型 |
