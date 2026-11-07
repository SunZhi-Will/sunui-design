# Scroll Shaders 參考分析（2026-11-07）

來源：https://scrollshaders.com/ （11-07 用 Chrome 實際開站，讀 DOM、WebGL context 與 uniform，未讀取或複製其著色器原始碼）。

參考製作：Pro 場景 `loop-shader-hero`（`apps/web/registry/pro/loop-shader-hero/`），見第 6 節。

## 一句話結論

Scroll Shaders 賣的不是「著色器很美」，而是**三個工程承諾包裝成文案**：每一圈都無縫（Every loop closes）、不會拖慢網站（Polite on the GPU）、不用裝任何套件（WebGL2 and nothing else）。首頁本身就是證明：整頁只有一張即時 WebGL 畫布，其餘 25 格全是海報圖加 MP4，而且只播看得到的那幾支。我們值得學的是這套「承諾寫成可驗證的規格」的做法，不是再做一個著色器圖庫。

## 1. 產品與定價

| 項目 | 內容 |
|---|---|
| 規模 | 117 支著色器、11 個分類（站上另寫 164 項含元件）、77 張 6K 靜態圖 |
| 分類 | Mesh Gradients、Grain Gradients、Dither、Liquid Metal、Light & Rays、Fluted Glass、Halftone、Waves & Lines、3D & Depth、Retro & ASCII、Patterns & Grids |
| 交付 | React 單檔元件、vanilla JS、MP4（1080 / 720 / 480）、2560px PNG 海報 |
| 月費 | $29，每週最多開 10 個新項目，不含 Logo 與圖片特效、不含自訂匯出 |
| 年費 | $129（約 $10.75 / 月），無上限 |
| 終身 | $239 一次付清，含未來新品 |
| 金流 | Dodo Payments（merchant of record），支援 UPI 等在地付款 |
| 頂部橫條 | 「Launch offer」倒數計時，推終身方案 |

觀察：

- **每週 10 個的開啟額度**是月費方案的關鍵限制。它讓月費用戶不能一個月下載完就取消，逼人往年費或終身走。這是訂閱制圖庫防「訂一個月全抓走」的標準手法。
- 免費層幾乎沒有：預覽影片都壓了 `scrollshaders.com` 浮水印。對照我們的 option C（效果庫免費、場景付費），他們走的是完全相反的路。
- 終身 $239 與我們的 $129 / $349 區間重疊，買家會拿來比。

## 2. 技術拆解（實測）

### 2.1 首頁只有一張即時畫布

| 項目 | 實測 |
|---|---|
| `canvas` 數量 | 1（主視覺 Ember Bloom） |
| `video` 數量 | 25，`preload="none"`、`muted`、`loop`，沒有 `autoplay` |
| 播放中的影片 | 5 支（只有在畫面內的），其餘 20 支暫停 |
| 影片來源 | Cloudflare R2，每支有同名 `.jpg` 海報 |
| 框架 | Next.js（Turbopack 產物）、Tailwind |

**型錄格用影片，不用即時著色器**。一頁同時跑 25 個 WebGL context 會撞到瀏覽器上限（Chrome 約 16 個），也會讓筆電風扇起飛。他們把「即時渲染」留給唯一的主視覺，其餘全部是 IntersectionObserver 控制的影片。

### 2.2 主視覺的渲染設定

| 項目 | 實測 | 意義 |
|---|---|---|
| Context | WebGL2 | 不支援 WebGL1 退路 |
| 畫布尺寸 | 732 × 379，CSS 尺寸 1463 × 758，DPR 2 | **每個 CSS px 只畫 0.5 個像素**，等於 Retina 上只畫 1/16 的像素量 |
| `alpha` | false | 不需要跟頁面合成透明度，省一次混色 |
| `antialias` | false | 全螢幕三角形不需要 MSAA |
| `depth` / `stencil` | false | 2D 片段著色器用不到 |
| `powerPreference` | high-performance | 這點我們反過來，背景用 low-power 比較對 |
| Uniform | `u_resolution`、`u_progress`、`u_seed` | 沒有 `time`，也沒有 `mouse` |

最重要的發現是 **uniform 叫 `u_progress` 不叫 `u_time`**。著色器只知道「現在是這一圈的第幾 %」，不知道經過幾秒。這是他們能同時輸出即時版與 MP4 的原因：同一支著色器，`progress` 從 0 掃到 1 錄 300 格就是影片，交給 `requestAnimationFrame` 就是即時版。

### 2.3 無縫循環怎麼做

站上原話是 motion 沿著 4D 噪聲中的一個圓走（closed circle through 4D noise）。原理：

- 一般動態寫成 `noise(x, y, t)`，`t` 一直增加，所以第 300 格和第 0 格不同。
- 改成 `noise(x, y, cos(2πp)·r, sin(2πp)·r)`，`p` 是 0 到 1 的進度。`p = 1` 時 cos / sin 回到原點，畫面就和 `p = 0` 一模一樣。
- 4D 噪聲比較貴。等價的便宜寫法：所有動態都寫成 `cos/sin(2π·k·p)` 的函數，`k` 一律取整數。我們的實作用這個，2D 噪聲加上整數倍頻的圓形位移，效果相同，片段著色器成本低很多。
- 顆粒（grain）這種每格要換的東西，用 `floor(p · 120)` 當種子，進度繞回 0 時種子也繞回去。

他們把這件事做成首頁的一個卡片：格數計數器從 F000 跑到 F300，顯示「F300 = F000」。**把技術承諾變成肉眼可驗證的 UI**，這招我們直接借用在狀態列上。

### 2.4 「Polite on the GPU」四條規則

| 狀況 | 行為 |
|---|---|
| 捲出畫面 | 暫停 |
| 分頁在背景 | 暫停 |
| Retina | 上限 2× |
| 減少動態 | 停在一張靜止畫面 |

我們的 `shader-campaign-banner` 已經做了前兩條和減少動態，但 DPR 上限設 1.5，沒有「半解析度」概念。

## 3. 資訊架構與文案

首頁段落順序：

1. 主視覺：即時著色器 + 標題「Shaders that make your site move.」+ 「LIVE · RENDERING IN YOUR BROWSER」小字，點了可看全螢幕
2. 11 個分類格（每格是影片）
3. 「The lead loops」九支精選，每格標「10.0s loop」
4. 「Rendered, not filmed / Every loop closes」：一句話講技術差異
5. 6K 靜態圖（新產品線，交叉銷售）
6. 圖庫與元件兩條產品線
7. 「Built to ship, not to tinker with」：五張規格卡（程式碼、影片、循環、效能、授權）
8. 三步驟：Pick、Copy、Ship
9. 定價、FAQ、電子報

文案手法：

- **每張規格卡都是一個可驗證的承諾**，而且配一個小互動證明它（程式碼卡旁邊放 localhost 預覽、循環卡放計數器、效能卡列四個狀態）。
- 「No three.js, no npm install」直接打競品（React Three Fiber 生態）的痛點。
- 授權寫成打勾清單，連「Inside templates you sell」都允許，只禁止轉售著色器本身。接案者最在意這一條。

## 4. 視覺語言

- 近黑底 + 單一橘色強調（`#b8300c` 系），標題用無襯線，關鍵字（move、grain、not）換成義大利襯線體並上橘色。
- 導覽列是浮動膠囊，捲動後變半透明。
- 卡片圓角大、邊框極淡，影片滿版。
- 整體很「Framer 模板」，跟我們的紙感與雜誌感方向不同。可以借的是**一個字換成襯線斜體**這種強調法，CJK 不適用，英文版可以考慮。

## 5. 對 SunUI 的意義

### 5.1 不該做的

- **不做著色器圖庫**。他們 117 支、每週上新，我們拼不過也不該拼。這類東西在我們的分法裡屬於效果庫，照 option C 應該免費，而免費目錄已凍結到 2027-01-12。
- **不學每週開啟額度與月費**。我們是一次買斷，月費加額度會讓定價頁變複雜，也違背已定的商業模式。

### 5.2 值得學的

| 學什麼 | 怎麼套到 SunUI |
|---|---|
| `progress` 取代 `time` | 所有循環型 Pro 場景（主視覺、橫幅）改用進度驅動。好處一：天生無縫。好處二：可以直接改成「捲動驅動」或匯出成影片 |
| 半解析度渲染 | 背景型著色器預設 `renderScale = 0.5`，不看 DPR |
| 型錄格不用即時 WebGL | 我們的型錄頁每張 Pro 卡都是即時元件。著色器類的卡片應改成海報圖，滑過或進入畫面才換成即時版，避免撞 WebGL context 上限 |
| 承諾寫成可驗證 UI | 狀態列的格數計數器（F299 繞回 F000）、Live / Paused 狀態，已用在 `loop-shader-hero` |
| 規格卡（程式碼、效能、授權） | 首頁或 Pro 頁可以加一段「每個 Pro 場景都保證：減少動態、暫停、四語系、單檔」的規格卡，每張配一個小證明 |
| 授權清單 | 定價頁把授權寫成打勾清單，特別標「可用在你賣的模板裡」與否 |

### 5.3 名字裡的機會

站名叫 Scroll Shaders，但**實際上沒有任何一支跟捲動連動**，全部是時間循環。因為進度驅動天生無縫，把進度綁到捲動位置是零成本的延伸。`loop-shader-hero` 的 `drive="scroll"` 就是這個差異點：區塊從進入畫面到離開畫面剛好走完 `loops` 圈，停止捲動畫面就停，也不耗 GPU。

## 6. 參考製作：`loop-shader-hero`（Pro）

為什麼是 Pro：它是「活動主視覺」場景（標題、說明、CTA、品牌配色），和既有的 Pro `shader-campaign-banner` 同一系列；免費目錄凍結中，不新增免費效果。

| 功能 | 做法 |
|---|---|
| 四種外觀 | `grain`（下緣偏右的顆粒光暈）、`mesh`（三團色塊沿圓繞行）、`dither`（8×8 Bayer 兩層抖色）、`fluted`（直紋玻璃折射色塊） |
| 無縫循環 | 著色器只吃 `u_progress`，所有動態是整數倍頻的 cos / sin |
| 驅動 | `drive="time"`（`duration` 秒一圈）或 `drive="scroll"`（`loops` 圈） |
| 效能 | `renderScale` 預設 0.5、不看 DPR；離開畫面、分頁在背景都停；`powerPreference: low-power`；處理 `webglcontextlost` |
| 減少動態 | 預設關閉，停在 `stillAt`（預設 0.18）那一格，使用者可手動打開 |
| 首次繪製 | 畫布第一格畫好才淡入；可傳 `poster` 圖當首格與 WebGL 退路 |
| 配色 | 內建 ember、lunar、cobalt、paper，也接受自訂 `{ bg, a, b, ink }`；照 PORTING.md showcase「像雜誌不像霓虹」收斂飽和度 |
| 狀態列 | 動態開關（WCAG 2.2.2）、狀態文字、會繞回的格數 `F054 / F300` |
| 語系 | en、zh-TW、zh-CN、ja |

檔案：`loop-shader-hero.tsx`（元件）、`looks.ts`（四支著色器與配色）、`demo.tsx`、`card.tsx`、`i18n/loop-shader-hero.json`，並登記在 Pro `registry.json`。

已驗證（dev server，11-07）：四種外觀與四組配色都能渲染、無 console 錯誤；畫布尺寸為 CSS 的一半；暫停時停在 F054（0.18 × 300）；捲動模式只在捲動時前進。

## 7. 後續可做

1. **型錄卡改海報圖**：著色器類 Pro 卡在型錄格先顯示靜態圖，進入畫面再掛即時版（可能需要一個共用的 `useLazyLive` 或在 `generate-previews` 產海報）。
2. **`shader-campaign-banner` 改用進度驅動**：兩個區塊的引擎合一，自訂 twigl 著色器也能拿到無縫循環與捲動驅動。
3. **匯出 MP4 / 海報**：進度驅動後，用 headless 瀏覽器把 `progress` 從 0 掃到 1 錄成影片，給不想放 WebGL 的客戶（對應他們的 MP4 交付）。
4. **定價頁授權清單**：參考第 3 節的打勾格式。
