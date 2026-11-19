# 網站外殼的動效規範

> 這份管的是 SunUI 網站本身（頁首、型錄、面板、首頁開場、文件頁），不是 block。
> block 的動畫看 `DESIGN.md`、`DESIGN-motion.md`。一個 UI 庫的官網，手感就是產品展示：寧可少動、動得準，也不要多動、動得慢。

## 一句話

**動畫只用來說明因果，不用來表演。** 使用者按了什麼，畫面在 200ms 內回應；沒按的東西不要自己動。首頁的例外寫在 §6。

## 1. 時長與曲線（tokens）

同一組數字寫在兩個地方，改一邊要改另一邊：
CSS 在 `app/globals.css` 的 `@theme`（`ease-site` 曲線，並把預設 transition 設成 150ms + 這條曲線，所以 `transition-colors` 不用另寫時長），JS 在 `lib/motion.ts`（`EASE_SITE`、`DURATION`）。CSS 端其他時長用 `duration-100` / `duration-200` / `duration-300`。

| 用途 | 時長 | 例子 |
|---|---|---|
| `press` 按下回饋 | 100ms | 按鈕 `active:scale-[0.97]` |
| `fast` 狀態變化 | 150ms | hover 底色、文字顏色、圖示切換 |
| `base` 小元件進出 | 200ms | 下拉、提示、遮罩淡入 |
| `panel` 面板開合 | 260ms 開、180ms 關 | 區塊面板、側欄 |
| `reveal` 內容淡入 | 300ms | iframe 預覽載入完成 |

- 曲線只有一條：`cubic-bezier(0.23, 1, 0.32, 1)`（快出慢停）。退場用 `ease-in` 的鏡像也可以，但不另造曲線。
- 不用彈簧做版面變形。彈簧只留給跟著游標或手指的東西（視差、拖曳）。
- 退場比進場短：使用者關掉一個東西時，已經在想下一件事。

## 2. 禁止

- **不做會擋住內容的開場。** 首頁標題與按鈕在第一幀就要看得到、可以點。
- **不對含 iframe、影片、canvas 的容器做縮放變形**（含 framer-motion `layoutId`）。縮放會拉伸內容、強迫重新繪製，看起來就是卡。只做 opacity 與小位移（≤ 12px）。
- **不做整頁截圖式轉場**（View Transitions 全頁 crossfade）。頁面上有大量預覽 iframe，截圖本身就會卡一下。
- 不用 `transition-all`。寫明要動的屬性：`transition-colors`、`transition-opacity`、`transition-[opacity,translate]`。
- 不讓常駐動畫在畫面外或分頁在背景時繼續跑。

## 3. 一定要有

- 每個可點的東西都有 hover（有滑鼠時）與 `focus-visible` 樣式，兩者明顯但不跳動。
- 目前所在的頁面、選中的選項，要有靜態可見的標示，不只靠動畫。
- `prefers-reduced-motion`：保留淡入淡出，拿掉位移、縮放、旋轉與常駐循環。
- 首頁開場的規則在 §6。2026-11-19 拿掉了紙牆，不要再鋪縮圖牆或 3D 傾斜的卡片牆。
- 重複造訪不重播：開場類動畫在同一次瀏覽（sessionStorage）只播一次。

## 4. 載入中的東西

- 佔位與真內容尺寸一致，換上時只淡入，不位移。
- 佔位不閃：骨架的脈動要慢（≥ 2s 一輪）且對比低；載入很快時（< 150ms）不顯示骨架。
- 同一列的卡片不要各自決定什麼時候出現：進入畫面的那一刻一起開始載入，淡入時長一致。

## 5. 外殼材質（2026-11-18 起）

網站外殼是「精密的物件」：黑白灰、不准裝飾性漸層、光暈、彩色陰影、毛玻璃內容層，但物件有厚度。2026-11-19 起 block 也用同一套質感語言（`DESIGN.md`），這一節只列外殼的實際數值。分析見 `reports/網站質感升級深度分析-2026-11-18.md` 與 `reports/拋棄紙感全面改質感深度分析-2026-11-18.md`。

- **邊線**：外殼用 `border-line`（透明度 9% / 深色 10%），比較強的用 `line-strong`。block 用的 `--border` 維持實色，型錄外觀不變。
- **高度**：只用 `globals.css` 的四個陰影，每一層都已含 1px hairline，不要再疊 `border`。
  - `shadow-hair`：只有邊線。
  - `shadow-e1`：卡片、預覽框、次按鈕、指令列、分段控制的選中格。
  - `shadow-e2`：hover 的卡片、強調的定價卡。
  - `shadow-e3`：面板、對話框。
  - 深色模式不靠投影，改成頂邊 1px 白色高光加邊線，tokens 已經處理好。
- **按鈕**：主按鈕 `btn-primary`、次按鈕 `btn-secondary`（含 hover、按下 0.97、內高光）。不要再手寫 `bg-fg text-bg hover:opacity-90`。
- **分段控制**：軌道 `bg-accent-soft p-0.5 rounded-md`，選中格 `bg-card shadow-e1 rounded-[4px]`（同心：6 − 2 = 4），不用整塊黑底。
- **圓角**：控制項 6px（`rounded-md`），卡片與預覽框 12px（`rounded-xl`），面板 16px（`rounded-2xl`）。巢狀時內圓角 = 外圓角 − 內距。
- **字重**：`font-medium` 是 510、`font-semibold` 是 590（Geist 可變字重）。
- **字體**：`body` 直接讀 `--font-geist-sans`。`@theme inline` 不會在 `:root` 產生 `--font-sans`，不要改回 `var(--font-sans)`。
- **焦點環**：全站 `outline-offset: 2px`，和元件之間留間隙。

## 6. 首頁（2026-11-20 從零重做）

由來與參考站的比較見 `reports/首頁從零重做深度分析-2026-11-20.md`。原則只有一條：**不發明，把別的元件庫都做對的事做好，內容用 SunUI 真正的區塊。**

- **一個內容寬度用到底**：首頁用 layout 的 `max-w-6xl`。只有區塊跑馬燈和開場的背景格線衝到螢幕兩邊，其他段落不要再用 `mx-[calc(50%-50vw)]` 鋪滿。
- **格子一律對齊、等間距、不重疊**。不做傾斜、交疊、散落的排法。
- **展示的是真的區塊，而且要挑過**：194 個區塊裡，縮到卡片大小還好看的大約 30 個（裡面有照片、插畫或大塊明暗的）。其餘是黑底上的灰色小控制項，縮圖幾乎一片黑，不要放上首頁。名單在 `page.tsx` 最上面的 `MARQUEE_A`、`MARQUEE_B`、`PLAY`、`PRO`。
- **不用自製的小卡當展示內容**。
- **只有黑白灰**：外殼不用任何彩色，顏色只出現在區塊自己的預覽裡。主要按鈕 `btn-primary`，次要 `btn-secondary`。
- **預設深色**：使用者沒選過主題時是深色（`lib/theme.ts` 的 `defaultDarkScript`）。
- **字級**：首頁標題 `clamp(40px, 5.4vw, 72px)`，置中，不超過 72px。段落標題 `text-3xl sm:text-4xl`，靠左，下面一行 `text-lg text-subtle`，右邊最多一顆按鈕（`page.tsx` 的 `SectionHead`）。同寬度下量到的競品標題是 40 到 72px。
- **段與段之間** `mt-28 sm:mt-40`（`page.tsx` 的 `SECTION`）。每段只講一件事。

段落由上到下：

1. **開場**：置中的小標籤、標題、一句話、兩顆按鈕、安裝指令。背景是 64px 的淡格線，用 radial mask 從上往下淡出。沒有進場動畫。
2. **區塊跑馬燈**（`components/home/scene-marquee.tsx`）：兩排區塊預覽圖（`/og/blocks/<name>.jpg`），等大（手機 280px、sm 以上 380px 寬，5:4）、間距 16px，往相反方向走，90 秒一圈，兩側用 mask 淡出。滑鼠移上去或焦點進來就停。每張連到區塊頁。reduced motion 時不動，改成可以橫向捲。動畫定義在 `globals.css` 的 `--animate-marquee`。
3. **數字**：一排四個（區塊、動效庫、Pro 場景、語言），上下各一條線。
4. **在這裡直接試**：六欄格線，上排一大（四欄）一小（兩欄），下排三張各兩欄。每一格是 `LivePreview` 加下面一行名稱（`page.tsx` 的 `Tile`）。
5. **Pro 場景**：第一個用 `mode="sheet"` 放在整排寬的大框裡，下面三張。Pro 資料夾不在時整段不出現。
6. **差在哪裡**：左邊標題、一句話、三行重點，右邊 `HeroCompare`。
7. **交給 agent**：`components/agent-steps.tsx`，自己帶標題。
8. **價格與創始會員**、**收尾**。

試過而且被否決的，不要再做：

| 做法 | 否決的原因 |
|---|---|
| 置中標題加一整面自製小卡的元件牆 | 普通無趣，構圖和 shadcn 一樣 |
| 標題放大到 160px 以上 | 文字太大 |
| 小標題加一顆可拖的白圓（太陽調光） | 上面一大塊空白，圓不特別 |
| 自製小卡前後交疊、大小不一地散落 | 好亂 |
| 傾斜展示台、自動示範游標、分頁列（2026-11-19） | 像開發工具 |
| 琥珀色重點色（2026-11-19） | 和黑白灰不搭 |

`components/home/` 裡的 `live-wall.tsx`、`scene-opening.tsx`、`full-scenes.tsx` 是前幾版留下的，首頁已經不用。

## 檢查表

- [ ] 時長來自上表，曲線是同一條
- [ ] 沒有 `transition-all`、沒有對 iframe 容器做 scale / layoutId
- [ ] 第一幀就能讀到主要文字
- [ ] reduced motion 下沒有位移與循環
- [ ] hover、focus-visible、active 三種狀態都有
- [ ] 外殼高度只用 `shadow-hair` / `e1` / `e2` / `e3`，按鈕用 `btn-primary` / `btn-secondary`
