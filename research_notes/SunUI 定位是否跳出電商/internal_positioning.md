# SunUI 內部定位現況，以及型錄實際綁電商的程度

> 研究日期 2026-11-13。全部來自 repo 本機檔案（唯讀）。路徑皆相對於 `/Applications/Projects/nextjs/sunui-design/`。Pro 只依 `registry/pro/registry.json` 的名稱、分類與描述判斷，沒有讀或引用任何 Pro 原始碼。
> 標記：【檔案】是直接從檔案讀到的文字或用腳本數出來的數字；【研究者分類】是我依名稱與描述做的判斷，不是 repo 內既有的欄位，寫報告時請當成估計。

## 1. SunUI 現在對外、對內說自己是什麼

### Takeaway
所有現行入口（AGENTS.md、設計文件、首頁四語文案、llms.txt、MCP 說明、定價頁）口徑一致：SunUI 是「給電商與檔期活動頁用的紙感 React 區塊」。唯一例外是 product、story、motion 三份系列設計文件，它們本身完全不提電商，而且授權文案明寫可用於 SaaS、網站、內部工具。

### Cited Findings
- AGENTS.md 第一句：「SunUI is a shadcn registry of animated React + Tailwind blocks for commerce and campaign pages.」（來源：`AGENTS.md`）
- AGENTS.md 規則：免費型錄自 2026-11-06 凍結到 2027-01-12 Product Hunt；「now 75 free blocks + 28 motion libraries」；新免費項目只能是「an atom pulled out of a Pro scene」；「Put the time into Pro scenes and launch work」。（來源：`AGENTS.md`）
- DESIGN.md「一句話」：「**紙感電商**：優惠券、收據、集點卡、票根，用黑白灰的實體紙品語言（紙、墨、齒孔、撕邊），做出安靜、一眼認得的電商互動。」同檔案開頭寫「所有 block 都要符合這份文件」。（來源：`apps/web/DESIGN.md`）
- DESIGN.md 的色彩規則用電商詞彙定義品牌專色用途：「選中、折扣面額、目前進度、主要按鈕」「主按鈕（尊重買家品牌）」。（來源：`apps/web/DESIGN.md`）
- DESIGN-product.md「一句話」：「**安靜的工具介面**：中性灰底、一個強調色、狀態只上在點上，把『為什麼』直接寫在畫面上。」demo 規則：「demo 放真實情境（後台、工具、課程、內容產品）」。來源專案是 Schedary、usermeld、spliteat-web、ComfyUI、autolens、PostVault、VideoAligner、voxcpm、Synvize，全是工具與 SaaS，不是電商。（來源：`apps/web/DESIGN-product.md`）
- DESIGN-story.md「一句話」：「**墨與燈**：近黑的墨色面、暖白的字、一盞金色的燈；安靜、慢半拍、尊重閱讀。」來源是敘事遊戲與互動小說（山河未歸、DeathsBlessing、方界：破碎祭壇等）。（來源：`apps/web/DESIGN-story.md`）
- apps/web/README.md 只講「型錄網站，同時也是兩個 shadcn registry」，沒有定位句；技術上 block 用 shadcn tokens，「安裝後會吃使用者的主題」。（來源：`apps/web/README.md`）
- 首頁英文文案：`siteTitle` 與 `home.metaTitle` 是「SunUI: paper-feel commerce blocks for React」；`home.eyebrow`「Paper-feel commerce blocks for React」；`home.title`「Less glow, more checkouts.」；`home.lead`「Countdowns, coupons, carts, checkout and loyalty cards. No gradients, no glow: every piece is built to convert. ...」；`proTitle`「Every campaign section, one payment, yours forever.」（來源：`apps/web/lib/messages.ts` 第 10、66 至 69、117 行）
- 首頁繁中文案：`siteTitle`「SunUI：有紙感的 React 電商區塊」；`eyebrow`「有紙感的 React 電商區塊」；`title`「少一點閃爍，多一點下單。」；`lead`「倒數、優惠券、購物車、結帳到集點卡，不靠漸層和光暈，每一塊都為成交而設計。...」；`proTitle`「所有活動區段，一次付費，永久擁有。」（來源：`apps/web/lib/messages.ts` 第 541、581 至 584、633 行）
- FAQ 定義句（英）：「SunUI is a collection of animated React blocks for commerce and campaign pages: countdowns, coupons, carts, checkout, pricing and loyalty.」（繁中）「SunUI 是一套給電商與活動頁使用的 React 動態區塊：倒數計時、優惠券、購物車、結帳、價格方案與集點。」（來源：`apps/web/lib/messages.ts` 第 238、751 行）
- 定價頁：`lead`「Free blocks stay free. Pro unlocks production-ready commerce and campaign sections, with every future block included.」；有 agency 省時計算機「What Pro saves an agency / Count the campaign pages you build in a year」。（來源：`apps/web/lib/messages.ts` 第 324 至 326、374 至 376 行）
- 授權文案反而是通用的：「Use them in SaaS products, websites, internal tools and apps you sell to end users.」繁中「用在 SaaS 產品、網站、內部工具，以及販售給終端使用者的 App。」（來源：`apps/web/lib/messages.ts` 第 420、917 行）
- 系列說明文案：paper「Paper and ink for storefronts and campaigns: coupons, receipts and loyalty cards.」；product「Quiet tool UI: neutral surfaces, one accent, status on dots.」；showcase「Landing-page signature visuals in a quiet editorial dark」；motion「Motion effect libraries: text, entrances, buttons, cards, backgrounds, scroll, cursor, loaders and more」。五個系列裡只有 paper 的說明提到商店。（來源：`apps/web/lib/messages.ts` 第 58 至 62 行）
- 首頁六個「合輯」全部是電商情境：flash-sale、product-page、checkout、launch、loyalty、seasonal。沒有 SaaS、文件站、作品集或 AI 產品合輯。（來源：`apps/web/lib/messages.ts` 第 150 至 157 行）
- 首頁 agent 示範的例子是「Double 11 page / 雙 11 活動頁」，三個步驟最後一步是「Campaign page, assembled」。（來源：`apps/web/lib/messages.ts` 第 112 至 114、627 至 629 行）
- llms.txt 開頭：「Paper-feel React + Tailwind blocks for commerce and campaign pages (coupons, receipts, loyalty stamps, countdowns, carts, checkout, pricing).」（來源：`apps/web/app/llms.txt/route.ts` 第 16 行）
- 給 agent 的設計規則：paper 系列定義為「Paper commerce: coupons, receipts, stamp cards and tickets on neutral gray paper with ink text」。（來源：`apps/web/lib/agent/guidelines.ts` 第 10 行）
- 本機 MCP server 的自我介紹：「SunUI: 194 paper-feel React + Tailwind blocks for commerce and campaign pages」。（來源：本 session 載入的 sunui-local MCP server instructions，對應 `apps/web/app/mcp/route.ts`）
- 2026-11-13 最新的網站報告在開場標題上方新加一行小字，內容仍是「有紙感的 React 電商區塊」。也就是說到今天為止，站上的改動還在強化電商口徑。（來源：`reports/網站UIUX深度分析-2026-11-13.md` 第三節第 5 點）
- 根目錄 `README.md` 還是舊 npm 套件的說法：「A modern React UI component library ... it's perfect for any React project.」AGENTS.md 把 `packages/*`、`src/` 標為 Legacy。（來源：`README.md`、`AGENTS.md`）

### Inferences
- 定位句在至少八個地方重複（AGENTS.md、DESIGN.md、messages.ts 四語的 siteTitle、eyebrow、title、lead、FAQ、pricing、collections、llms.txt、guidelines.ts、MCP instructions）。任何重新定位都是一次跨四語、跨 agent 端點的同步改寫，不是改一句標題。
- 「電商」其實只是 paper 這一個系列的設計語言定義。product、story、showcase、motion 四個系列的設計文件本來就不以電商為前提，站上卻用 paper 的一句話代表整個產品。
- llms.txt 仍寫「one vermilion accent, stamps for results」，但 DESIGN.md 已在 2026-11-06 禁用朱紅與印章樣式。這是一處過期文案，顯示定位文字的同步本來就有漏。

### Gaps
- 沒有讀 `messages.ts` 的 zh-CN 與 ja 段落全文，只確認它們與 en、zh-TW 結構對應（同樣有「雙 11」「agency」等字串）。
- 沒有檢查正式網站 `sunui.synvize.com` 上線版本是否與 repo 一致（本任務限本機檔案）。

## 2. 型錄數量：依 series、tier、分類統計，以及「電商專用」對「任何網站可用」

### Takeaway
免費 104 個項目裡，功能上只能用在購物流程的約 21 個（20%），行銷與主視覺約 23 個（22%），通用介面與動效約 60 個（58%）；Pro 90 個則相反，約 35 個電商專用、46 個檔期與行銷、只有 9 個通用。也就是「免費層早就不是電商庫，Pro 層才是」。

### Cited Findings

**總數與 tier**
- 免費 registry 共 104 個 item：103 個 `registry:block` 加 1 個 `registry:ui`（`stamp`）；`meta.tier` 全部是 `free`。（來源：`apps/web/registry.json`，腳本計數）
- Pro registry 共 90 個 item，`meta.tier` 全部是 `pro`。104 + 90 = 194，與 MCP 說明的「194 blocks」一致。（來源：`apps/web/registry/pro/registry.json`，腳本計數）
- AGENTS.md 寫「75 free blocks + 28 motion libraries」= 103，加上 `stamp` 這個 ui 元件就是 104。（來源：`AGENTS.md`、`apps/web/registry.json`）

**依 meta.series**（沒寫 series 的項目預設為 paper，見 `apps/web/lib/series.ts` 第 20 行 `item.meta.series ?? "paper"`）

| series | 免費 | Pro |
|---|---|---|
| paper（含未標示） | 45（44 未標示 + 1 標示） | 61（58 未標示 + 3 標示） |
| motion | 28 | 0 |
| product | 24 | 3 |
| showcase | 4 | 20 |
| story | 3 | 6 |
| 合計 | 104 | 90 |

（來源：`apps/web/registry.json`、`apps/web/registry/pro/registry.json`，腳本計數）

**依 categories 標籤**（registry 沒有單一 `category` 欄位，只有多值的 `categories` 陣列，所以以下是「帶有該標籤的項目數」，會重疊）
- 免費：帶 `commerce` 標籤 26 個（25%）；帶 `campaign` 0 個；帶 `marketing`、`hero` 或 `landing` 任一個 21 個；帶較寬的購物詞彙（commerce、cart、checkout、coupon、order、product、pricing、inventory、wishlist、loyalty、rewards、receipt、billing 等）任一個 34 個（33%）。（來源：`apps/web/registry.json`，腳本計數）
- Pro：帶 `commerce` 50 個（56%）；帶 `campaign` 43 個（48%）；帶 `commerce` 或 `campaign` 任一個 72 個（80%）；帶 `template` 4 個；帶較寬購物詞彙任一個 63 個（70%）；帶 `marketing`、`hero` 或 `landing` 任一個 31 個。Pro 出現次數最多的標籤依序是 commerce 50、campaign 43、marketing 23、product 17、hero 11、canvas 9、cart 8。（來源：`apps/web/registry/pro/registry.json`，腳本計數）
- 免費層的 `meta.interaction` 分布：press 33、section 19、hover 15、scroll 13、loading 9、drag 9、type 6。（來源：`apps/web/registry.json`）

**免費 104 個的三分類**【研究者分類】。判斷標準：功能或 API 本身離不開購物、付款、庫存、訂單、優惠、會員的算「電商專用」；主視覺、倒數、橫幅、展示用外框、示範播放器算「檔期與行銷」；導覽、表單、回饋、排版、動效庫、主題、圖表算「通用」。

| 類別 | 數量 | 佔比 |
|---|---|---|
| 電商專用 | 21 | 20% |
| 檔期與行銷（主視覺、展示） | 23 | 22% |
| 通用 | 60 | 58% |

- 電商專用 21：add-to-cart-button、addon-checklist、copy-code-button、coupon-wallet、hover-card、low-stock-indicator、order-history、product-media、quantity-stepper、shipping-options、store-header、terms-consent、variant-picker、expanding-search、tier-progress（以上 15 個屬 paper）；checkout-steps、payment-status-banner、reservation-timer、checkin-streak、content-gate、redeem-key-input（以上 6 個屬 product 系列，其實是 SaaS 帳單、數位商品、訂位也用得到的付款流程）。
- 檔期與行銷 23：countdown-banner、announcement-strip（paper）；hero-billboard-carousel、scroll-tilt-stage、testimonial-marquee、spine-shelf（showcase）；depth-hero、orbit-gallery、ribbon-carousel、point-cloud、plush-portrait、brush-reveal、raster-image、infinite-canvas、dial-scrubber（motion 系列裡的主視覺型）；scripted-demo、step-demo、scroll-story、story-player、browser-frame、phone-frame（product）；book-3d、cloth-curtain（story）。這 23 個裡，描述明寫商店或折扣的只有 countdown-banner、announcement-strip、spine-shelf 三個，其餘 20 個任何產業的形象頁都能用。
- 通用 60：
  - 動效庫 19：animate-presets、background-effects、button-effects、card-effects、chart-effects、cursor-effects、gradient-backdrop、image-effects、loading-effects、micro-interactions、scroll-effects、spring-rig、svg-effects、text-effects、scene-transitions、camera-moves、photo-looks、motion-principles、type-motion。
  - product 系列的工具 UI 12：app-shell、capsule-nav、compare-slider、confirm-button、empty-state、error-state、jobs-tray、person-chip、quota-meter、status-dot、theme-picker、morph-menu。
  - story 1：pixel-fx。
  - paper 外觀的通用介面 28：animated-number、avatar-stack、back-to-top、cjk-heading、cookie-consent、dialog-sheet、favorite-button、floating-field、hotspots、hover-motion、lightbox、loading-button、notify-badge、otp-input、pagination、range-slider、scroll-progress、scroll-reveal-text、scroll-timeline、side-panel、skeleton-set、sliding-tabs、stamp、star-rating、toast-stack、toc-scrollspy、typewriter、tiny-chart。
- 通用 60 個之中，約 13 個「功能通用，但描述或示範用電商語言包裝」：animated-number（寫成 prices）、avatar-stack（recent buyers）、favorite-button（wishlist）、hotspots（product picture）、hover-motion（store navigation）、lightbox（product gallery）、pagination（標籤 commerce）、range-slider（price）、skeleton-set（product cards）、stamp（sold out）、toast-stack（product thumbnail）、tiny-chart（標籤 commerce）、morph-menu（標籤 commerce）。（描述文字來源：`apps/web/registry.json` 各 item 的 `description` 與 `categories`）

**Pro 90 個的三分類**【研究者分類，只看名稱、標籤與描述】

| 類別 | 數量 | 佔比 |
|---|---|---|
| 電商專用 | 35 | 39% |
| 檔期與行銷 | 46 | 51% |
| 通用 | 9 | 10% |

- 電商專用 35：cart-drawer、checkout-button、coupon-claim-card、flash-sale-product-card、free-shipping-progress、gift-box-reveal、order-tracker、order-island、product-filter-grid、product-gallery、stamp-card、upsell-drawer、physics-cart-jar、bundle-node-builder、checkout-flow、gift-card-designer、price-history、receipt-printer、store-help-widget、ask-to-shop、product-finder、restock-notify、size-finder、pickup-ticket、holiday-cutoff、subscription-manager、volume-tiers、review-request、shoppable-lookbook、shoppable-story、swipe-shortlist、catalog-flipbook、gift-guide-fan、peel-sticker-coupon、card-dock。
- 檔期與行銷 46：
  - 明確綁特賣、節慶或商品陳列的約 22 個：campaign-landing、black-friday-weekend、lunar-new-year（三個整頁模板）、festival-banner、flash-sale-hero、prize-wheel、scratch-card、tear-pack-reveal、holiday-calendar、collection-accordion、lookbook-expand-hero、showcase-mosaic、lamp-dimmer-scene、cutaway-spec、specimen-scan、recipe-glass、lineup-shelf，以及五個像素遊戲營運場景 pixel-check-in、pixel-preregister、pixel-gacha、pixel-boss-sale、pixel-level-track。
  - 產業中性、SaaS 或 AI 產品發表頁也能直接用的約 24 個：pricing-cards、plan-comparison、upgrade-modal、faq-accordion、newsletter-signup、testimonial-wall、launch-countdown-wall、launch-stage-hero、drop-release-hero、referral-queue、loop-shader-hero、shader-campaign-banner、curve-rail-hero、glass-cube-hero、glass-lens-hero、day-night-hero、self-building-page、redline-reveal、count-chart、sticker-board、vote-terrain、hoop-upload、fold-invite-card、live-activity-wall。
- 通用 9：file-dropzone、ink-filter-bar、scrub-stat-card、pixel-build-progress、sky-time-switch、theme-reveal、kelvin-switch、ask-ai-halo、storage-meter。其中 ask-ai-halo（標籤 ai、input、effects）與 storage-meter（標籤 dashboard、account、settings、data）已經是明顯的非電商題材。
- Pro 的四個整頁模板（標籤 `template`）是 campaign-landing、black-friday-weekend、checkout-flow、lunar-new-year，全部是電商或檔期。（來源：`apps/web/registry/pro/registry.json`）

**數量變化軌跡**
- 2026-11-05 精簡後：免費 54、Pro 24，共 78。（來源：`reports/Block 去留分析-2026-11-05.md` 第 9 節）
- 2026-11-05 稍晚：免費 71（paper 31、product 21、motion 13、story 與 showcase 6）、Pro 26，Pro 全部是 paper。（來源：`reports/免費與付費切分規劃-2026-11-05.md` 第 1 節）
- 2026-11-06：免費 102（motion 28、product 22、paper 47、story 3、showcase 4）、Pro 26「全部 paper，沒有 motion 場景」。（來源：`reports/TA 模擬-2026-11-06.md` 第 1 節）
- 2026-11-07：Pro 從 41 增到 55，一天加 14 個。（來源：`reports/商業模式優化分析-2026-11-07.md` 第 1 節）
- 2026-11-13（今天）：免費 104、Pro 90。（來源：兩份 registry.json 腳本計數）

### Inferences
- 以功能算，免費層約 80% 的項目（23 個行銷 + 60 個通用 = 83 個）不需要電商情境就能用。「元件庫不該只限電商」這句話，對免費層來說是對現況的描述，不是新方向。
- Pro 層約 39% 是離不開購物流程的元件，再加上約 22 個綁特賣或節慶的場景，合計約 57 個（63%）是電商或檔期專屬。付費價值目前確實壓在電商上，重新定位的主要成本在 Pro 與文案，不在免費程式碼。
- Pro 近期新增的方向已經在偏離純電商：showcase 系列從 0 長到 20，出現 dark-mode 主題切換（sky-time-switch、theme-reveal、kelvin-switch、glass-lens-hero、lamp-dimmer-scene）、AI 輸入（ask-ai-halo）、儀表板（storage-meter、scrub-stat-card）、設計展示（redline-reveal、self-building-page）。型錄實際內容比對外定位寬。
- 2026-11-07 報告建議「11/27 前不新增 Pro 單品」，但 Pro 從 55 增到 90，可見該規則沒有被執行（AGENTS.md 也沒有收錄這條）。這是由數字推得，repo 沒有文字承認。
- 約 13 個免費項目只是「描述寫成電商」，改描述與示範資料就能中性化，不必改元件。

### Gaps
- 三分類是我依描述做的判斷，repo 沒有對應欄位；邊界項目（例如 checkin-streak、quantity-stepper、ink-filter-bar）換一個人分可能差正負 5 個。
- 沒有安裝量資料可以佐證「哪一類真的被裝」。`/api/installs` 需要正式環境 token，本任務沒有讀取。
- 沒有逐一打開 demo 檢查示範內容是否用商品資料，只看 registry 的描述。

## 3. 八份報告各自決定了什麼（買家、價格、為什麼是電商、已經出現的懷疑）

### Takeaway
電商檔期定位在 2026-11-04 的主規劃書裡就被明寫成「基於供給空白的假說」，沒有需求量化資料，並且預先寫好了退場條件：Founding 預售到 2027-01-11 未達門檻（原訂 20 筆，11/06 改為 50 筆）就退回「通用轉換區塊」。之後每一份報告都沿用這個定位，但也各自記下了它造成的張力。

### Cited Findings

**3.1 `reports/SunUI 商業化深度規劃.md`（2026-11-04，主規劃書）**
- 定位建議原文：從草案的「可以直接上線的動態互動元件與區塊」收窄為「給電商與行銷活動用的 production-ready 動畫區塊：預設無障礙、reduced-motion 與繁中排版都測過，授權一頁講清楚。」
- 選電商的理由一：市場擁擠，不能拼量。shadcn 官方索引裡描述含 motion 或 anim 的 registry 約 90 個；React Bits 51,230 星、Magic UI 23,080 星；shadcnblocks 2,467+ 個 Pro blocks；shadcn.io 宣稱 6,231 個 blocks。
- 理由二：「沒有任何一家專攻電商檔期」。Magic UI Pro、Cult UI、React Bits 的模板「全部集中在 SaaS、AI、Dev Tool 與作品集」。
- 理由三：路線圖主動移除通用 AI chat UI 與通用圖表，因為 shadcn 官方 2026-10 推出 AI Elements（21 個 agentic UI pattern），shadcn.io 已有 70 個 charts。
- 自己承認的弱點：「研究**沒有找到任何電商動畫區塊需求量的量化資料**，也未檢查日本、中國是否已有地區型競品，這個定位是基於『供給空白』的假說，需要用 Founding member 預售來驗證需求。」
- 風險表明列：「電商檔期需求是假說，沒有量化證據」可能性中、衝擊高；對策「若 2027-01-11 前少於 20 筆，第二季改回通用 SaaS 轉換區塊」。
- 價格：Founding US$79 限 150 名（2026-11-27 至 2027-01-11）、Pro 個人 US$129、Team 5 席 US$349、模板單售 US$49 至 79。市場錨點 US$199（Magic UI Pro、Aceternity Lifetime）。
- 財務預估（全部標為估算）：第一年總營收保守 US$4,000、基準 US$18,400、樂觀 US$56,000。
- 目標買家只有一句：「寫 React 的開發者與接案者」；營收主力是英文市場，台灣是口碑起點。
- 90 天計畫第 13 週（2027-01-27 至 02-02）排了一個決策點：「決定第二季主軸（續攻檔期或轉通用轉換區塊）」，門檻「付費 50 筆、waitlist 1,000」。結論段：「90 天後若 50 筆付費的門檻沒有達到，該修正的是定位，而不是加做更多元件。」
- 第二季路線圖原本就排了非電商模板：「第 2、3 套模板（SaaS 定價頁、App 預購頁）」。
- 決策表第 2 項把「定位收窄」列為作者要決定的事：「電商檔期專精，或維持草案的泛商業區塊」，建議「電商檔期 + CJK + 無障礙，並以預售結果驗證」。

**3.2 `reports/Block 去留分析-2026-11-05.md`**
- 範圍 164 個 block（free 140、pro 24），判斷基準就是主規劃書的電商定位與「少而精」。
- 結果：留 78、合併 14、移出主型錄 12（敘事遊戲 UI）、刪除 60。
- 保留標準三條裡有一條是通用的：「**任何產品都會用到**：導覽、表單、狀態、通知、空狀態」。所以這次精簡並不是「非電商就刪」。
- 刪除原因是「綁死原專案的領域」（螢幕錄影、程式碼掃描、排班、分帳、無限畫布）、純裝飾、紅海（「形象頁 3D 特效是 Aceternity、Magic UI 的主場」），不是「不屬於電商」。
- 12 個敘事遊戲 UI 移出的理由才是定位：「**買家完全不同** ... 放在主型錄會稀釋『電商動畫區塊』的定位」。封存在 git tag `archive/story-ui-kit`。
- 保留的 78 個裡有 15 個「通用介面」、13 個「行銷頁」、4 個「中日文排版」。
- 邊緣案例承認 scripted-demo、capsule-nav、scroll-story 是「SaaS 形象頁用的，屬紅海，但品質高且不是純裝飾」而保留。
- 一句話賣點：「開一家網路商店或辦一檔活動，需要的互動都在這裡」。

**3.3 `reports/免費與付費切分規劃-2026-11-05.md`**
- 定案「方案 C」（2026-11-05 作者已定案）：動效庫全免費，Pro 賣「把動效和電商邏輯組起來的場景」。
- 四問規則：可替代性、工時、商業距離、展示力。前三題兩題以上偏 Pro 就放 Pro。「商業距離」把「離收到錢多近（結帳、加購、優惠、定價、檔期轉換）」定義為 Pro，「裝飾、氛圍、通用 UI」定義為免費。
- 對 product 系列的判決：「通用工具 UI ... 它和 Pro 的電商主軸沒有連結，不帶動 Pro 轉換。**不再投入新的 product block**。」
- 價格維持 79 / 129 / 349 買斷，不走訂閱。
- 買家描述：「SunUI 的買家是寫 React 的開發者與接案者 ... 開發者更常為『省時間』與『能直接上線』付錢。」
- 提出的風險：「系列混亂：paper 禁漸層，motion 全是漸層」。
- 目標：2026-11-27 Pro 30 個、免費凍結 58；2027-01-12 Pro 40 以上、免費最多 62。（實際今天是 Pro 90、免費 104。）

**3.4 `reports/TA 模擬-2026-11-06.md`（第二輪，明寫是模擬不是訪談）**
- 結論第 1 點：「**網站在講兩個不同的產品**」。首頁標題講優惠券與收據，型錄前 24 張卡有 21 張是動效庫。
- 首頁型錄 313 張卡，motion 變體 211 張（67%），Pro 卡 26 張（8%），第一張 Pro 在第 103 位。
- 付費意願最高的人物是 headless 電商接案公司老闆 Ray（6 人工作室，每年 11 月跑 5 到 8 個檔期頁，每頁報價 US$3,000 起）：「會買 Team，而且不看價格」。
- 動效收藏家 Kai 的台詞：「這站到底是賣什麼的？」；設計工程師 Noa：「標題說不發光，型錄第一頁就在發光。」
- agent 實測：使用者說「Black Friday hero」時，agent 會用免費的 gradient-backdrop 加 countdown-banner 自己組，不會轉換成 Pro。
- 實測 SaaS 查詢「SaaS pricing page with plan toggle and usage meter」回 pricing-cards（Pro）、quota-meter、plan-comparison（Pro），判讀「合理」。「explain how our product works, animated walkthrough demo」回 scripted-demo、step-demo、tiny-chart，「三個都是 SunUI 獨有的強項」。也就是非電商查詢已經有不錯的答案。
- 時間點問題：Founding 開賣 11-27 正是黑五當天，「今年要做黑五頁的人，現在就需要，而現在買不到」。
- 中國大陸前端：双 11 會場頁 9 月就做完，付款也走不通，「zh-CN 的價值是口碑與 SEO，不是營收」。
- 第一輪（`reports/TA 模擬-2026-11-05.md`）已記下對定位的直接懷疑：英文市場 indie hacker Maya「『commerce and campaign』的定位對她來說太窄，她會跳過。但 SunUI 實際上覆蓋 SaaS 帳單流程。建議在型錄加一個『SaaS billing』的使用情境入口，用既有 block 組」。同一份也指出台灣能用的接案者「只限於做 headless 或自架 Next.js 的那一群，比『台灣電商』小得多」。

**3.5 `reports/商業模式深度分析-2026-11-06.md`**
- 結論：「計畫本身是對的，執行偏掉了。」定位（電商檔期）、定價、通路、切分都合理。當時離 Founding 開賣剩 21 天。
- 選電商的新理由：回購。「電商檔期天生是**有行事曆的需求**，每一檔都要新頁面」，用季節包（單售 US$49、Pro 會員 US$29）解決買斷沒有回購。
- 單位經濟：扣 8.5% 後 Founding 約 US$72、Pro 約 US$118、Team 約 US$319；基準情境一年 160 筆約 US$1.8 萬，「大約只打平機會成本」。
- 客群四選一表：A 接案者與小型 agency（契合最高、回購高）、B headless 電商開發者、C Indie SaaS（付費意願中、回購低、**規模大**、「要跟 shadcnblocks 拚量」）、D 動效愛好者（只當流量）。建議主攻 A、次攻 B，C「用既有 block 組一個『SaaS billing』情境頁順便收」。
- 結構弱點三：「兩個品牌住在一起」，「免費層的重心已經從『電商原子』移到『動效展示』」；「免費層已經變成另一個產品」。
- 檔期行事曆：農曆新年 2027-02-06，季節包要在 12 月下旬上架；情人節 1 月初；618 在 5 月初；雙 11 與黑五 2027 在 9 月底。
- 凍結決定的來源：動效庫凍結在 28，免費 block 凍結在當時數字，新增只限 Pro 場景拆出的原子。
- 判斷對錯的門檻：11/27 前 waitlist 200；12/31 Founding 30 筆；**2027-01-11 Founding 50 筆，沒達到時「檔期定位退回『通用轉換區塊』」**；2027-01 Team 佔比 10% 以上，否則「代表 agency 客群假設錯，回頭看 C 客群」；2027-02 農曆新年包回購率 15% 以上。
- 當時實況：GitHub 4 星、waitlist 0、Polar 未開戶。

**3.6 `reports/商業模式優化分析-2026-11-07.md`**
- 「水管接通了一半」：`sunui.synvize.com` 已上線，但定價頁仍是 waitlist，沒有 Polar 結帳連結；GitHub 仍 4 星。
- 「偏移從免費層搬到了 Pro 層」：一天新增 14 個 Pro 單品，整頁場景仍只有 2 個。
- 建議把付費單位改成「場景配方」：用當時 55 個 Pro 組 8 套整頁，其中一套是「訂閱定價頁」，對應買家寫「Indie SaaS」。
- 提出**第二垂直：遊戲營運活動頁**（五個像素場景），頻率「每 1 到 2 週一檔」對比電商「一年 6 到 7 檔」，市場在台、日、中、韓。當成假設驗證，門檻是遊戲相關流量或名單 15%。這是 repo 內第一次正式提出電商以外的垂直。
- 價格只動兩處：Team 補 agency 交件條款；定價頁加「7 天檔期頁」接案服務 NT$3 萬起或 US$990 起。
- 到 2027-01-31 的保守收入估算約 US$7,700，接案與季節包合計接近一半。
- 規則建議：11/27 前不新增 Pro 單品；每個新 Pro 單品必須先屬於一個已上架場景；參考分析報告在 PH 前暫停。
- 再次寫入門檻：2027-01-11 Founding 50，否則「檔期定位退回通用轉換區塊」。
- 不建議現在拆子品牌（遊戲線或動效線）。

**3.7 `reports/八家 UI 元件庫競品分析-2026-11-07.md`**
- 八家：libraries.dev、pro.beui.dev、uiarc.dev、bencho.dev、boardui.com、affectui.com、kobra.systems、ui.watermelon.sh。
- 題材分布：8 家有 5 家把 AI agent 介面放首頁最顯眼處；通用與 SaaS 儀表板 3 家；「**電商、檔期、促銷：0 家**」。結論「證實 SunUI 的垂直定位是真空白，也提醒：不要被這波潮流拉去做 agent UI」。
- 「不做」清單第一條：「追 AI agent 介面題材：8 家有 5 家在做，紅海；會稀釋『檔期』定位」。
- 價格帶：單人終身 US$179 到 249（kobra $199、BoardUI €199、beUI $179、Arc $249、affectUI $249 起）。「SunUI 的 $129 剛好落在『別人的年費價』」，對 agency 太便宜反而像內容少。建議改 Pro 一年更新 $129、終身 $199，Team 按席位（3 席 $399、10 席 $899），但等 Founding 第一批賣出後再切。
- 建議首頁主標更往檔期收：「黑五、雙 11、聖誕、過年，每一檔都要的活動頁，裝上就能開賣。」把 agent-ready 退到副標，因為 MCP、llms.txt、registry 已是標配。
- 建議做 Compare 頁，結論句都是「它們不做檔期頁，SunUI 只做這個」。
- PH 前目標：Founding 50 席以上、黑五套件 20 套以上、被第三方清單收錄至少 3 則。
- 這份報告的「0 家做電商」只證明供給空白，沒有提出需求證據；樣本來自一則 X 推文列的 8 個站。

**3.8 `reports/檔期活動頁平庸診斷-2026-11-09.md`**
- 對象是 Pro 整頁模板 `campaign-landing`。使用者看第一版的評語是「好普通」。
- 診斷：「第一版是一份**排得很整齊的模板**，不是一個**有想法的活動**。」六個問題包括沒有中心概念、最常見的「大數字 + 商品照」構圖、顏色只是點綴、動態只有倒數。
- 第二版核心想法「數字即櫥窗」；為此在 DESIGN.md 加「整頁模板的例外」（2026-11-09），隔天（11-10）因使用者回饋「紅色背景不好看，整頁顏色太多」再收緊成只允許一段墨底反白。
- 這份不談買家或價格，但它是品質層面的訊號：招牌的電商整頁模板在開賣前兩週半才第一次被作者本人判定普通，並連動修改設計規則兩次。
- 延伸方向仍掛在季節包：「同一個『數字即窗』骨架，換成農曆新年、黑五、聖誕，就是三個季節版本」。

### Inferences
- 「為什麼是電商」的理由隨時間換了三次：11/04 是供給空白加避開 SaaS 紅海；11/06 是檔期行事曆帶來回購；11/07 是競品清單上 0 家做。三個理由都是供給面或商業模式面，沒有一個是需求證據。主規劃書自己把它叫做假說。
- repo 內已經存在重新定位的「合法觸發條件」：2027-01-11 Founding 未達 50 筆就退回通用轉換區塊。現在（開賣前 14 天）提出跳出電商，等於在驗證實驗開始前就改假設，報告撰寫者應該點出這一點。
- 反過來，支持作者主張的內部證據也不少：C 客群（Indie SaaS）被評為「規模大」；TA 模擬兩輪都說定位對 SaaS 買家太窄、建議加 SaaS billing 入口；agent 對 SaaS 查詢已能回出好答案；免費層被形容為「另一個產品」；11/07 已提出遊戲營運第二垂直。
- 這些報告的買家人物全部是模擬或推論，沒有一筆真實訪談或銷售。截至這些報告撰寫時 GitHub 4 星、waitlist 數字未驗證、沒有任何一筆付款。因此「電商買家願意付錢」與「非電商買家願意付錢」目前都沒有實證。
- 競品分析反對追 AI agent UI 的理由是紅海；而 Pro 之後仍新增了 ask-ai-halo。規劃與實作在這一點上已經不一致。

### Gaps
- 「SaaS billing 情境頁」被建議了兩次（11/05、11/06），首頁六個合輯裡沒有它；我沒有找到說明為何沒做的文件。
- 「手遊活動套件」場景頁與其 15% 門檻是否已上線、有無數據，沒有找到紀錄。
- waitlist 人數、安裝排行、Polar KYC 是否通過，repo 內沒有最新數字。
- 主規劃書引用的五份研究筆記在 `research_notes/SunUI 商業化深度規劃/`（ai_shadcn_trends、animated_competitors、blocks_templates_revenue、gtm_channels、payments_licensing），本次沒有重讀。

## 4. `apps/web/registry/lab`：被移出的 block 與原因

### Takeaway
lab 有 14 個 block，全部在 2026-11-05 移入，README 給的理由是「不符合 SunUI 設計語言或電商定位」，但沒有逐一記錄哪個是哪種原因。依描述判斷，約 7 個是因為屬於通用 app UI（不屬電商），約 7 個是因為發光、漸層類裝飾違反紙感設計語言。

### Cited Findings
- README 全文：「不符合 SunUI 設計語言或電商定位的 block，暫時移出型錄與 registry。原本的 registry item 在 `items.json`。要恢復時移回 `registry/free/` 並把 item 加回 `registry.json`。」（來源：`apps/web/registry/lab/README.md`）
- AGENTS.md 對 lab 的描述：「Blocks moved out of the catalog (off-strategy). Not served」。（來源：`AGENTS.md`）
- 14 個名稱：floating-action-menu、gradient-background、logo-marquee、magnetic-button、social-link-button、spotlight-card、tilt-card、animated-tabs、border-beam、command-palette、loader-set、notification-bell、password-strength-input、toggle-switch。全部 `tier: free`、`addedAt: 2026-11-05`。（來源：`apps/web/registry/lab/items.json`）
- lab 資料夾在 git 歷史裡只有一個 commit：`e973060`，2026-11-05，「backup: auto-commit before adding 8 paper-commerce blocks distilled from projects」。（來源：`git log -- apps/web/registry/lab`，唯讀）
- items.json 裡各自寫的適用情境都不是電商。例：command-palette「Apps with many pages or actions that power users jump between」；notification-bell「App headers that surface mentions, assignments and system alerts」；password-strength-input「Sign-up and change password forms」；toggle-switch「Settings that take effect immediately」；animated-tabs「Filter tabs that show result counts, like All, Open, Closed」；border-beam「Signalling that an AI input or job is actively working」；magnetic-button「Playful portfolio or agency sites」；social-link-button「Footers, profile cards and contact sections / Author bios on blogs」；spotlight-card「Feature grids and pricing tiers / Dark landing pages」。（來源：`apps/web/registry/lab/items.json` 的 `meta.usage.whenToUse`）
- `reports/Block 去留分析-2026-11-05.md` 的刪除、合併、封存清單裡沒有這 14 個名稱；八份指定報告都沒有提到 lab 資料夾。（來源：全文搜尋 reports/ 與 AGENTS.md）

### Inferences
- 【研究者分類】因為「不是電商、是通用 app UI」而移出的 7 個：command-palette、notification-bell、password-strength-input、toggle-switch、animated-tabs、floating-action-menu、social-link-button。這些正是 SaaS、文件站、AI 產品會要的元件。
- 【研究者分類】因為「發光、漸層、裝飾」違反紙感設計語言而移出的 7 個：gradient-background、spotlight-card、border-beam、magnetic-button、tilt-card、logo-marquee、loader-set。其中 tilt-card 的描述其實是「3D product card ... image, title and price」，是商品卡，被移出不是因為不電商。
- 設計語言這個理由後來被動效庫推翻：同樣性質的效果之後以免費動效庫重新進來（background-effects 與 gradient-backdrop 對應 gradient-background；card-effects 含 spotlight 與 3D tilt；button-effects 含 magnetic pull；loading-effects 對應 loader-set；sliding-tabs 對應 animated-tabs；notify-badge 與 theme-picker 的 ThemeSwitch 部分對應 notification-bell 與 toggle-switch）。目前型錄裡沒有對應物的只剩 command-palette、password-strength-input、floating-action-menu、social-link-button、border-beam，以及完整的 notification-bell 彈出清單。
- 如果決定跳出電商，lab 是現成的、零開發成本的補充來源，但受免費凍結規則限制（它們不是 Pro 場景拆出的原子）。

### Gaps
- 沒有任何文件逐一記錄這 14 個的移出原因，上面的 7 對 7 是推論。
- 沒有確認 lab 內的程式碼是否仍能通過現行 typecheck 與設計規則（本任務唯讀，未執行建置）。

## 5. 重新定位會撞到的上市時程

### Takeaway
今天是 2026-11-13，離 Founding 開賣（2026-11-27）剩 14 天，離 Product Hunt 與 Founding 截止（2027-01-12）剩 60 天。現有的每一個里程碑、訊息與驗證門檻都以「檔期」為主詞，其中最硬的是 Founding 的主訊息已綁定「農曆新年套件 12 月底送到」。

### Cited Findings
- 程式裡的 Founding 視窗：`opensAt: 2026-11-27T00:00:00+08:00`、`closesAt: 2027-01-12T00:00:00+08:00`、`seats: 150`；價格 `{ pro: 129, team: 349, founding: 79, teamSeats: 5 }`。（來源：`apps/web/lib/site.ts` 第 8 至 11、23 行）
- 免費型錄凍結到 2027-01-12 Product Hunt；新免費項目只能是 Pro 場景拆出的原子。（來源：`AGENTS.md`）
- Product Hunt 發表日 2027-01-12（週二）；Founding 01-11 截止後切換 US$129。（來源：`reports/SunUI 商業化深度規劃.md` 90 天計畫第 10 週）
- Founding 主訊息建議改為：「現在用 $79 鎖定終身 Pro，第一個農曆新年套件 12 月底送到。」（來源：`reports/商業模式深度分析-2026-11-06.md` 第 4.3 節；`reports/商業模式優化分析-2026-11-07.md` 第 3.4 節沿用）
- 農曆新年 2027-02-06；季節包需在檔期前 6 週上架，也就是 12 月下旬；它被定為「Founding 期間的第一個季節包，PH 發表時可展示」。（來源：`reports/商業模式深度分析-2026-11-06.md` 第 4.2 節）
- Pro registry 已有整頁模板 `lunar-new-year`（標籤 template、campaign、seasonal），以及 holiday-cutoff、gift-guide-fan、holiday-calendar、festival-banner 等節慶項目。（來源：`apps/web/registry/pro/registry.json`）
- 免費圖示頁文案已預告「農曆新年的基本款。更多檔期圖示在 SunUI Pro 的檔期圖示組」，並寫「每個檔期一組 ... 所有圖示組都包含在 Pro 授權裡」。（來源：`apps/web/lib/messages.ts` 第 1002、1007 至 1008 行）
- 已排定的驗證門檻都以檔期定位為對象：2027-01-11 Founding 50 筆；2027-01 Team 佔比 10%；2027-02 農曆新年包回購率 15%；2027-01-31「7 天檔期頁」3 件詢問 1 件成交。（來源：`reports/商業模式深度分析-2026-11-06.md` 第 7 節、`reports/商業模式優化分析-2026-11-07.md` 第 6 節）
- 主規劃書排定的定位複審點是第 13 週 2027-01-27 至 02-02：「決定第二季主軸（續攻檔期或轉通用轉換區塊）」。（來源：`reports/SunUI 商業化深度規劃.md`）
- 上線清單（第 1 週，11-06 至 11-12）仍有外部設定待本人完成：Polar 台灣個人 KYC 與三個產品、Resend、`SUNUI_PRO_TOKEN`。清單把 Polar 標為「最重要，最可能卡關」。（來源：`apps/web/LAUNCH.md`）
- registry 網址一旦公開就不宜更換：「registry URL 會寫進使用者的 `components.json`，公開後就不要再換」。（來源：`apps/web/LAUNCH.md` 第 1 節）
- 競品分析排程：W2 至 W3（11/14 至 11/27）上架第一套「黑五」檔期套件；W7 至 W9（12/19 至 01/12）農曆新年套件與 PH 素材。（來源：`reports/八家 UI 元件庫競品分析-2026-11-07.md` 第 5 節）
- 定位文字改動的同步義務：使用者文案要改四個語系（`apps/web/lib/messages.ts`）；設計文件改動要同步 `apps/web/lib/agent/guidelines.ts`（MCP、skill、llms-full.txt 都讀它）。（來源：`AGENTS.md`）

### Inferences
- 會直接衝突的項目，依硬度排序：
  1. Founding 主訊息與農曆新年套件的承諾（對外已寫進站上圖示頁文案；若 12 月底不交付檔期套件，等於對 Founding 買家失信）。
  2. Product Hunt 素材與一句話定位（2027-01-12）。PH 只有一次首發，定位句在那天之前必須定案。
  3. 2027-01-11 的 50 筆門檻。提前改定位會讓這個「檔期假說驗證」失去對照，之後無法判斷是定位錯還是分發不足。
  4. 免費凍結規則。跳出電商若需要補通用元件（例如從 lab 拿回 command-palette），會違反「只能是 Pro 場景拆出的原子」。
  5. 四語文案加 guidelines.ts、llms.txt、MCP instructions、六個合輯、OG 圖的同步改寫工時，會擠壓原本就落後的收款與場景工作。
- 不衝突、甚至有利的地方：registry 網址與 namespace（`@sunui`、`@sunui-pro`）不含電商字樣；價格與授權條款是通用的；DESIGN-product、DESIGN-story、DESIGN-motion 不需要改；免費層 80% 的項目本來就不限電商。也就是「對外第一句話放寬」與「Pro 內容和季節包照原計畫交付」在技術上可以並存。
- 兩個可行的時間窗：(a) 現在到 11/27 之間只改定位句與合輯（加入 SaaS billing、產品發表等非電商合輯），不動 Pro 交付；(b) 等 2027-01-11 門檻結果出來，在既定的第 13 週複審點正式轉向。這是由時程推得的選項整理，不是 repo 內既有的決定。

### Gaps
- 不知道 Polar KYC、Resend、shadcn 官方索引提交的最新狀態（最後一次紀錄是 11-07，當時都未完成）。這會決定 11/27 能不能真的開賣，也就決定驗證實驗是否成立。
- 沒有找到 Product Hunt 素材草稿或已對外發布的貼文，無法判斷「檔期」定位已經對外曝光到什麼程度。
- 作者主張「元件庫不該只限電商」的原始對話或理由不在 repo 檔案內（今天的報告 `reports/網站UIUX深度分析-2026-11-13.md` 沒有提到），所以不清楚他指的是放寬對外定位句、放寬免費層、還是連 Pro 的投入方向一起改。
