# 網站外殼的動效規範

> 這份管的是 SunUI 網站本身（頁首、型錄、面板、首頁開場、文件頁），不是 block。
> block 的動畫看 `DESIGN.md`、`DESIGN-motion.md`。一個 UI 庫的官網，手感就是產品展示：寧可少動、動得準，也不要多動、動得慢。

## 一句話

**動畫只用來說明因果，不用來表演。** 使用者按了什麼，畫面在 200ms 內回應；沒按的東西不要自己動（首頁背景的緩慢流動是唯一例外，而且不擋內容）。

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

- **不做會擋住內容的開場。** 首頁標題與安裝指令在第一幀就要看得到、可以點。背景可以動，但不能讓人等。
- **不對含 iframe、影片、canvas 的容器做縮放變形**（含 framer-motion `layoutId`）。縮放會拉伸內容、強迫重新繪製，看起來就是卡。只做 opacity 與小位移（≤ 12px）。
- **不做整頁截圖式轉場**（View Transitions 全頁 crossfade）。頁面上有大量預覽 iframe，截圖本身就會卡一下。
- 不用 `transition-all`。寫明要動的屬性：`transition-colors`、`transition-opacity`、`transition-[opacity,translate]`。
- 不讓常駐動畫在畫面外或分頁在背景時繼續跑。

## 3. 一定要有

- 每個可點的東西都有 hover（有滑鼠時）與 `focus-visible` 樣式，兩者明顯但不跳動。
- 目前所在的頁面、選中的選項，要有靜態可見的標示，不只靠動畫。
- `prefers-reduced-motion`：保留淡入淡出，拿掉位移、縮放、旋轉與常駐循環。
- 重複造訪不重播：開場類動畫在同一次瀏覽（sessionStorage）只播一次。

## 4. 載入中的東西

- 佔位與真內容尺寸一致，換上時只淡入，不位移。
- 佔位不閃：骨架的脈動要慢（≥ 2s 一輪）且對比低；載入很快時（< 150ms）不顯示骨架。
- 同一列的卡片不要各自決定什麼時候出現：進入畫面的那一刻一起開始載入，淡入時長一致。

## 檢查表

- [ ] 時長來自上表，曲線是同一條
- [ ] 沒有 `transition-all`、沒有對 iframe 容器做 scale / layoutId
- [ ] 第一幀就能讀到主要文字
- [ ] reduced motion 下沒有位移與循環
- [ ] hover、focus-visible、active 三種狀態都有
