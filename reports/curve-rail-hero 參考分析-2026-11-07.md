# curve-rail-hero 參考分析

> 2026-11-07。來源是 Amena（@AmenaiSabuwala，musais.com 創辦人）在 X 的貼文「Best landing page design of the year award goes to me」，一支 13 秒的捲動錄影，展示一個叫 Fold 的 AI 設計工具官網。這份回答三件事：整頁怎麼拆、哪一塊值得做、拆成哪些可以自由畫的元件。【已驗證】表示這次在 repo 或瀏覽器實測；【建議】【估算】是推論。

## 0. 結論先講

1. **整頁只有一個真正的招牌：首屏的弧面卡片軌道。** 其餘區段（功能卡、評價牆、步驟、定價、FAQ、漸層 CTA）都是常見版型，SunUI 已有對應的 Pro block。
2. **做成 Pro 場景 `curve-rail-hero`（showcase 系列），已完成。** 元件、demo、型錄卡片、三語系翻譯、registry 條目、型錄排序、分享圖都已就位，MCP 搜尋排第一。【已驗證】
3. **拆成四個可以單獨使用的元件**，卡片內容完全由使用者自己畫：`CurveRail`（引擎）、`RailCard`（現成外框）、`GlyphTile`（標題裡的小方塊）、`CurveRailHero`（組好的首屏）。
4. **視覺不照抄。** 原作是紫粉漸層、模糊光球，正好是 PORTING.md 3.1 的禁止清單。保留的是行為與結構，顏色收斂到 showcase 的深色加琥珀金，另附淺色。

## 1. 逐格拆解（13 秒）

| 時間 | 畫面 | 判斷 |
|---|---|---|
| 0:00 至 0:02 | 置中大標題與按鈕，下方一排卡片排在**向內凹的弧面**上；中間清楚，兩側的卡變大、往上長到標題旁、糊開並帶紅藍色差。卡片持續往左漂，捲動時跟著轉 | **招牌**，值得做 |
| 0:03 | 手持手機照片 + 右側六顆功能膠囊 | 一般功能區，照片素材驅動 |
| 0:05 | 三張深色漸層功能卡，卡內是迷你 UI（進度清單、品牌色票、6/6 計數） | 常見 bento，近親：`showcase-mosaic` |
| 0:06 至 0:07 | 標題中間嵌一顆「Aa」小方塊；評價牆，中間一張大的強調卡（3×） | 小方塊值得拆成原子；評價牆已有 `testimonial-wall` |
| 0:08 | How it works：左側步驟清單，右側對話框示意 | 近親：`scroll-story`、`step-demo` |
| 0:09 | 兩張定價卡，標題「~~start~~ ship」刪除線 | 已有 `pricing-cards` |
| 0:11 | FAQ 手風琴，標題嵌「?」小方塊 | 已有 `faq-accordion` |
| 0:13 | 漸層 CTA 橫幅 + 頁尾 | 已有 `loop-shader-hero`、`shader-campaign-banner` |

招牌為什麼有效：一個畫面同時展示好幾面（簡報、品牌、成品），弧面加景深讓它看起來像透過鏡頭看實物，而不是一排平面截圖。這是「首屏 10 秒內看得懂」的影片素材，和 `self-building-page` 同類。

## 2. 和現有 block 的差別

| 現有 | 差在哪 |
|---|---|
| `ribbon-carousel`（免費） | 也有凹弧面，但只吃圖片、一次跳一張、沒有景深與色差、沒有首屏組合 |
| `hero-billboard-carousel`（免費） | 平面輪播，一張主圖 |
| `orbit-gallery`（免費） | 球面圖片牆，沒有標題結構 |

所以 `curve-rail-hero` 的價值在：任意內容卡片 + 連續漂移與捲動驅動 + 景深 + 組好的首屏。四個問題（`免費與付費切分規劃-2026-11-05.md`）：可替代性低（別家免費層沒有景深弧面首屏）、工時中高（3D 排列、迴圈、慣性、無障礙約 1.5 至 2 天【估算】）、商業距離中（新品開賣與品牌頁可直接用）、展示價值高。放 Pro，符合凍結規則（不新增免費項目）。

## 3. 拆成四個元件

```
CurveRailHero  標題、說明、按鈕 + 一條 CurveRail（dark / light、accent）
 └ CurveRail   引擎：children 是任意節點
    └ RailCard 現成外框（可不用，直接放自己的卡）
GlyphTile      標題字裡的小方塊，大小跟字級走
```

### 3.1 CurveRail（引擎）的旋鈕

| prop | 作用 | 預設 |
|---|---|---|
| `curve` | concave 弧面包著你（原作）/ convex 向後彎 | concave |
| `radius`、`arc` | 彎曲程度、每側畫到幾度 | 640、52° |
| `focus` | 中間多大範圍保持清楚 | 0.14 |
| `edgeBlur`、`chroma` | 最外側的模糊與色差，0 關閉 | 14、4 |
| `speed` | 自動漂移 px/秒，0 關閉 | 26 |
| `scrollDrive` | 捲一個視窗高度轉幾張，0 關閉 | 0.8 |
| `cardWidth`、`cardHeight`、`gap` | 卡片尺寸 | 300、400、28 |
| `topInset`、`height` | 上方留給兩側卡往上長的空間、舞台高度（下緣裁掉淡出） | 自動 |
| `designWidth` | 等比縮放的基準；不給時窄螢幕讓中間那張至少佔六成寬 | 卡寬 × 3.4 |

實作重點【已驗證】：

- 卡片位置每格直接寫 DOM（transform、filter），不經 React render；只在畫面內且分頁可見時跑 requestAnimationFrame。
- 色差用兩層低透明度 `drop-shadow`（一暖一冷），只在外框與高反差處看得到，GPU 合成，不用 SVG filter。
- 卡片太少時自動重複幾輪填滿弧面，重複的卡 `aria-hidden` 加 `inert`。
- 拖曳帶慣性（上限每秒三張），放手後不觸發卡內點擊；方向鍵轉一張；Tab 進卡片裡的連結會把那張轉到中間。
- 滑鼠移入、聚焦、離開畫面、分頁隱藏都暫停漂移；有暫停按鈕（WCAG 2.2.2）。減少動態時漂移、捲動驅動、慣性全關。

### 3.2 RailCard

`kicker`（左上等寬小字）、`meta`（右上）、`footer`（底部一行）、`surface`（ink / paper / accent / photo）、`streak`（一道斜向細光）。demo 的六張卡（故事、釉色 Aa、馬克杯線稿、開賣日期、評價、免運進度）都用它，但每張內容完全不同，示範「卡片裡畫什麼都可以」。

### 3.3 GlyphTile

原作在「starting from [Aa] zero」「questions [?]」裡嵌小方塊。做成一個 inline 元件：大小用 em 跟著標題字級，強調色底，可傾斜，給 `label` 才讀出來，否則當裝飾。可以用在任何標題，不限這個 hero。

## 4. 驗證紀錄【已驗證】

| 項目 | 結果 |
|---|---|
| 型別檢查 | 本 block 無錯誤（其他 session 的 `.next*` 舊檔有無關錯誤） |
| 漂移、方向鍵、捲動驅動、拖曳 | Chrome 實測 transform 都有正確變化，console 無錯誤 |
| 1280 寬 | 中間清楚、兩側糊開與色差可見，兩側卡往上長到按鈕旁 |
| 375 寬 | 修正後中間卡佔約六成寬，兩側露出糊的邊 |
| `/r/pro/curve-rail-hero.json` | 無授權 401 |
| llms-full.txt | 有條目，沒有任何原始碼片段 |
| MCP `search_blocks` | 查「bent card carousel hero with depth of field」排第一 |
| 分享圖 | `public/og/blocks/curve-rail-hero.jpg` 已截 |
| 禁止清單 grep | 0 筆 |

## 5. 接下來【建議】

1. **檔期包**：把 `CurveRailHero` 放進 Double 11 或黑五場景，卡片換成「優惠券、倒數、爆品、免運門檻」，就是一個 agency 可直接賣給客戶的開賣首屏。卡片內容可以直接放現有 Pro block 的縮小版（`coupon-claim-card`、`flash-sale-product-card`）。
2. **PH 發表素材**：SunUI 自己的首頁或 PH 頁可以用它，每張卡是一個招牌 block 的縮圖，正好說明「一個 registry、很多面」。
3. **效能**：同一頁放兩條以上軌道時，建議第二條起 `edgeBlur={0} chroma={0}`（demo 的淺色段就是這樣）。
