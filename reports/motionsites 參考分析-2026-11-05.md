# MotionSites 參考分析

日期：2026-11-05
來源：https://motionsites.ai/ （付費 AI 網站提示詞市集，作者 Viktor Oddy）

## 1. 這個站是什麼

一個賣「AI 網站設計提示詞」的市集。每件作品是一段影片預覽加一份付費提示詞，買家複製提示詞貼到 Lovable、Bolt、AI Studio、Manus 之類的工具，生出一頁著陸頁。

| 項目 | 內容（2026-11-05 讀取） |
|---|---|
| 作品數 | 首頁列出 547 件，宣稱 500+ |
| 分類（前幾名） | Landing Page 60、Hero 58、SaaS 46、Hero Section 34、3D 27、Portfolio 23、Creative 22、AI 19、Agency 16、Travel 13、Interactive 12、Fintech 10 |
| 交付物 | 提示詞文字（不是程式碼），少數附素材與 GitHub 連結 |
| 定價 | 3 個月 US$129（每日 3 次複製）、年費 US$279、終身 US$399（劃線 US$759，倒數促銷）、單次包 2 到 10 份 US$49 起 |
| MCP | `claude mcp add motionsites --transport http …`，OAuth 登入，免費帳號可開 3 份，付費解鎖全部 |
| 其他入口 | Backgrounds（動態背景影片）、3D Websites、Academy（課程）、Affiliate、Submit（投稿） |

### 視覺共通點

1. **深色、電影感**：大多是黑底加一張 AI 生成的主圖或影片（Mux 串流），字很大。
2. **主體壓字**：巨大標題放在人物或物件後面（ELEPHANT、Kinova、HELLO I'M KIN、Pink Rider），游標移動時前後層有視差。
3. **3D 圖庫**：圖片排成球體（Orbit Sphere）、曲面緞帶（Video Ribbon）、可無限拖曳的畫布（Infinite Gallery）。
4. **書背陳列**：書或錄影帶排成一列書背，選中的一本抽出來轉正面（Shelf Hero、VHS Archive）。
5. **影像點陣化**：半色調網點（Halftone FAQ）、ASCII 字元畫（ASCII Studio）、點雲（Particle Brain、Velaris、Particle Self）。
6. **游標揭露**：游標畫過的地方露出另一層圖（Ink Reveal、Hover Ink、Good Fox Hover）。
7. **刻度時間軸**：底部一條帶刻度的尺，拖曳換場景或年代（Sun Timeline、Halden Stories）。
8. **電商場景**：Virtual Fitting（模特兒兩側浮著衣服卡，分類頁籤切換）、Runway Lookbook、Backpack Hero、Loops Virtual Store。

## 2. 跟 SunUI 的關係

### 競品面

MotionSites 和 SunUI 都在做「給 AI 代理人用的設計素材 + MCP」，但交付物不同：

| | MotionSites | SunUI |
|---|---|---|
| 交付物 | 提示詞，AI 每次生出來都不一樣 | 原始碼，裝了就是這個樣子 |
| 可驗證性 | 低：效果取決於買家用的 AI 工具 | 高：有 a11y、reduced motion、CJK、Light/Dark |
| 主題 | 視覺衝擊（3D、影片、AI 圖） | 電商檔期與紙感互動 |
| 定價 | 訂閱與終身並存，終身 US$399 | 買斷 US$79 / 129 / 349 |
| MCP 授權 | OAuth 帳號 | 免費不需授權，Pro 用 license key |

**可借的**：
- MCP 頁面「選工具 → 一行指令 → 登入 → 完成」四步驟的寫法很清楚，SunUI 的 `/docs/ai-agents` 可以照這個順序重排【建議】。
- 「Keep the web free of AI slop」這句定位：SunUI 的紙感路線本來就是反 AI 感，可以用更直接的話講出來【建議】。
- 首頁卡片用**影片預覽**（滑過即播），SunUI 型錄目前是 iframe 即時預覽，大量卡片時影片比較省效能，可考慮為熱門 block 錄 5 秒預覽【建議】。

**不借的**：倒數劃線促銷（DESIGN-product.md 第 5 節「誠實，不假稀缺」）、每日複製次數限制、訂閱。

### 素材面：只取互動手法，不取畫面

提示詞是付費內容，本次**沒有讀取或複製任何提示詞**，只看公開的卡片預覽，把反覆出現的「互動機制」抽出來，用 SunUI 自己的寫法重做。作品名稱、圖片、品牌都不沿用。

## 3. 互動手法逐一對照

標記：✅ 已有　🆕 本次新增　⛔ 違反設計規範不做　➖ 不適合做成 block　💰 建議做成 Pro 場景

| 手法 | 代表作品 | 判斷 | 對應 |
|---|---|---|---|
| 影片背景主視覺 | 多數 Hero | ➖ | 只是 `<video>`；背景用 `gradient-backdrop` |
| 主體壓字＋視差 | ELEPHANT、Kinova | 🆕 | `depth-hero` |
| 圖片球體 | Orbit Sphere | 🆕 | `orbit-gallery` |
| 曲面緞帶輪播 | Video Ribbon | 🆕 | `ribbon-carousel` |
| 無限拖曳畫布 | Infinite Gallery | 🆕 | `infinite-canvas` |
| 書背陳列 | Shelf Hero、VHS Archive | 🆕 | `spine-shelf` |
| 半色調、ASCII、點陣 | Halftone FAQ、ASCII Studio | 🆕 | `raster-image` |
| 點雲形狀 | Particle Brain、Velaris | 🆕 | `point-cloud` |
| 游標揭露 | Ink Reveal、Hover Ink | 🆕 | `brush-reveal` |
| 刻度時間軸 | Sun Timeline、Halden Stories | 🆕 | `dial-scrubber` |
| 掃描線比較 | Scanner Comparison | ✅ | `compare-slider` |
| 會跟游標的 3D 頭像 | Living Portrait | ✅ | `plush-portrait` |
| 動態漸層、光束、星空 | Backgrounds 系列 | ✅ | `gradient-backdrop`、`background-effects` |
| 卡片傾斜、聚光 | 多數 SaaS | ✅ | `card-effects` |
| 字元捲動、打字 | 多數 Hero | ✅ | `text-effects` |
| 捲動驅動放大、橫向捲動 | Freight Scroll Hero | ✅ | `scroll-effects` |
| 毛玻璃碎片 | Facet Glass | ⛔ | 所有系列都禁止毛玻璃 |
| WebGL 3D 模型 | Robot Jellyfish、Halo Prism | ➖ | 需要模型檔與 three.js，超出單檔 block |
| 虛擬試衣 | Virtual Fitting | 💰 | `look-builder`：分類頁籤＋衣物卡＋加入購物車，商業距離近 |
| 走秀型錄 | Runway Lookbook | 💰 | `lookbook-rail`：大圖＋編號＋可購買單品 |
| 定價、頁尾、候補名單 | Pricing、Footer、Waitlist | ✅ | Pro 已有 `pricing-cards`、`newsletter-signup` |

## 4. 本次新增的九個 block

全部歸在 `motion` 系列（動效庫，依 2026-11-05 的切分決議維持免費）。`spine-shelf` 因為跟商品陳列直接相關，放 `showcase`。

| Block | 做什麼 | 技術 | 跟現有元件的界線 |
|---|---|---|---|
| `spine-shelf` | 一排書背／盒側，滑過微傾，點選抽出並轉到正面，下方顯示資訊 | CSS 3D | 跟 `book-3d` 不同：那個是讀一本書，這個是從一排裡挑 |
| `orbit-gallery` | 圖片貼在球面上，拖曳旋轉帶慣性，點一張轉到正前方 | CSS 3D | 新的 |
| `ribbon-carousel` | 卡片排在圓柱曲面上，拖曳或方向鍵轉動 | CSS 3D | `hero-billboard-carousel` 是平面大圖 |
| `infinite-canvas` | 圖片鋪在可無限拖曳的格子上，四邊循環，帶慣性 | transform | 新的 |
| `dial-scrubber` | 帶刻度的尺，拖曳或滾輪換值，吸附刻度，可當年份或尺寸選擇 | Pointer + spring | `range-slider` 是表單滑桿，這個是大型展示用 |
| `depth-hero` | 背景、大標、前景主體分層，游標移動有視差 | framer-motion | `scroll-effects` 的 parallax 是捲動驅動 |
| `raster-image` | 把圖片畫成半色調、ASCII、點陣或抖動，游標附近變形 | Canvas 2D | `pixel-fx` 是粒子特效，不處理圖片 |
| `point-cloud` | 點雲排成球、環、螺旋或文字，可拖曳旋轉、游標推開、形狀間變形 | Canvas 2D | `background-effects` 的 particles 是 2D 漂浮 |
| `brush-reveal` | 游標畫過露出底層，痕跡會慢慢收回 | Canvas mask | `cursor-effects` 的 image hover 是跟隨預覽圖 |

共通要求：單檔、只依賴 `framer-motion` 與 `cn`、離開畫面或分頁隱藏時暫停、`useReducedMotion` 時顯示靜止的完整畫面、指標效果只在 `(pointer: fine)` 啟用但觸控仍可拖曳、鍵盤可操作、demo 圖片用 SVG data URI，不讀外部圖片。

## 5. 後續建議

1. 💰 **Pro 場景**：用 `spine-shelf` + `depth-hero` 組「新品上市 Hero」，用 `ribbon-carousel` 組「檔期商品輪播」，再做 `look-builder`（虛擬試衣）與 `lookbook-rail`。這四個符合四問原則的「工時一天以上、商業距離近」。
2. **MCP 文件**：照 MotionSites 的四步驟重排 `/docs/ai-agents`。
3. **型錄影片預覽**：熱門 block 錄 5 秒 webm，卡片滑過才播。
