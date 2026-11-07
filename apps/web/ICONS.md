# SunUI 圖示規範

> 靜態：`registry/icons/sunui-icons.tsx`（`<site>/r/icons/sunui-icons.json`，無依賴）
> 動態：`registry/icons/sunui-animated-icons.tsx`（`<site>/r/icons/sunui-animated-icons.json`，依賴 framer-motion 與靜態版）
> 像素：`registry/icons/sunui-pixel-icons.tsx`（`<site>/r/icons/sunui-pixel-icons.json`，無依賴）
> 像素動態：`registry/icons/sunui-animated-pixel-icons.tsx`（`<site>/r/icons/sunui-animated-pixel-icons.json`，依賴像素靜態版）
> 展示頁：`/icons`，兩組切換：線條 / 像素 × 靜態 / 動態。

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
4. **accent 部位**：每個圖示最多標一個 accent 部位。預設跟著 `currentColor`，設定 `--sunui-icon-accent` 才上色，建議指向買家的品牌色（`var(--primary)`）或狀態色。一個畫面只開一處。
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
5. 顏色只出現在 accent 部位（例如填滿後的愛心、集點卡新蓋的一格），沒設 `--sunui-icon-accent` 時就是墨色。

## 像素圖示

線條版之外的第二種風格，給復古、遊戲化、集點活動這類想要「點陣感」的畫面用。兩套不混用：同一個畫面選一種。

2026-11-05 改版：第一版是單色細線點陣，被評為「好醜」。比較過「12 格粗線」與「16 格精靈圖」兩個方向後，選定精靈圖。

1. **網格**：16 × 16，`viewBox="0 0 16 16"`，內容落在 1 到 14 之間。
2. **精靈圖畫法**：1 格墨色外框、半透明填色、右側與下方 1 格陰影、左上角內側白色亮點。光一律從左上來。
3. **字元**：`#` 外框（墨色）、`=` 填色（墨色 30%）、`:` 陰影（墨色 58%）、`+` accent、`~` accent 陰影（62%）、`*` 亮點（`--sunui-pixel-shine`，預設白色）、`.` 留白。每種字元合併成一條 path。
4. **控制符號例外**：勾、叉、加減、箭頭、chevron、選單、上傳下載維持 2 格粗的實心線，不加填色。
5. **銳利度**：`shape-rendering="crispEdges"`，尺寸用 16 的整數倍（16、32、48、64）。
6. **accent**：沿用 `--sunui-icon-accent`。藥水、蘋果、旗面這類整體就是主角的，`+` 可以畫整塊。
7. **物件本色（`tone="pigment"`）**：2026-11-07 加入，背景見 `reports/顏色系統分析-黑白灰之外-2026-11-07.md`。
   - 預設仍是 `ink`。`pigment` 時外框與亮點不變，`=` 改本色 45%、`:` 本色混 22% 黑、`+` 本色、`~` 本色混 34% 黑。
   - 只有本身就有顏色的物件有對照（`pixelPigments`：藥水紅、金幣金、寶石藍、史萊姆綠…），控制符號、紙品、介面永遠是墨色。
   - 7 種本色（`pigments`）：red、orange、gold、green、blue、violet、brown，OKLCH 低彩度，一個值同時用在亮暗紙上；可用 `--sunui-pigment-<name>` 覆寫。
   - `pigment` prop 可指定顏色，覆蓋對照，例如寶石依稀有度換成 blue、violet、gold。
   - 一個畫面選一種：全墨或全 pigment，不混。
8. **分組**：Interface、Paper、Commerce，加上像素版獨有的三組遊戲圖示：
   - Gear（裝備）：sword、dagger、axe、hammer、bow、wand、shield、helmet、armor、boots、ring、amulet
   - Items（道具）：potion、key、gem、crown、chest、trophy、bomb、orb、scroll、map、apple、meat、fish、dice、hourglass、book、torch
   - World & HUD（世界與 HUD）：skull、ghost、slime、fire、snowflake、door、flag、heart-half、sparkle、battery、flash、gamepad、cursor
   - 遊戲圖示只畫通用物件，不仿任何現有遊戲的角色或造型。

### 像素動態

不用補間，像遊戲精靈一樣逐格換圖，不依賴 framer-motion。68 個圖示有動態版。

| 類型 | 觸發 | 例子 |
|---|---|---|
| hover | 滑過或聚焦父元素，播一次 | 寶石與皇冠閃光掃過、硬幣翻面、鈴鐺搖、藥水冒泡、骰子滾動、旗子飄 |
| toggle | `active` | 愛心與星星由下往上填滿、寶箱與鎖打開、門推開、選單變叉、集點卡蓋下一格 |
| loop | `active` 為真期間 | 沙漏、電池充電、火焰、火把 |

每格存成 16 列字串用 `/` 接起來，並做連續字元壓縮（`6.4#6.`）。`prefers-reduced-motion` 時 toggle 直接跳到結果，hover 與 loop 不播。

新增像素圖示：在 `sunui-pixel-icons.tsx` 加一筆 16 × 16 字串（照上面的字元與光源），放進 `lib/icon-groups.ts` 的 `pixelIconGroups`；要動態版就在 `sunui-animated-pixel-icons.tsx` 的 `pixelRecipes` 加 kind、fps 與各格。

## 新增圖示

1. 在 `sunui-icons.tsx` 的 `icons` 加一筆，名稱用 kebab-case 名詞。
2. 在 `lib/icon-groups.ts` 放進對應分組，必要時補中英關鍵字。
3. 若要動態版，在 `sunui-animated-icons.tsx` 的 `recipes` 加一筆，選 hover、toggle 或 loop。
4. 跑自檢（見下節），新圖示旁邊放幾個既有圖示，確認 16px 下還認得出來、線寬與大小和旁邊一致、動態版的軸心方向正確。

## 自檢

`scripts/check-icons.mjs` 用無頭 Chrome 截下自檢頁 `/preview/icons`，人或 agent 都能跑。需要 `npm run web:dev` 正在跑，不需要任何 npm 套件。

```bash
node apps/web/scripts/check-icons.mjs --only coupon,receipt --with cart,stamp,check
```

| 選項 | 作用 |
|---|---|
| `--set line\|pixel\|all` | 只檢查一套，預設兩套都跑 |
| `--only a,b` | 只看這些圖示；不加就是整套 |
| `--with c,d` | 把既有圖示放在前面一起比較，標成 ref |
| `--theme light\|dark\|both` | 預設兩種都截 |
| `--no-accent` | 關掉 accent 顏色，確認 accent 部位在單色下還分得出來 |
| `--scale 3` | 放大找細縫，預設 2 |
| `--base`、`--out` | 網站網址（預設 `http://localhost:3100`）與輸出目錄（預設 `apps/web/check-out/icons/`） |

輸出：

- `<set>-sizes-<theme>.png`：線條版 16、24、48px，像素版 16、32、48px。
- `<set>-frames-<theme>.png`：動態版。線條版是 rest 加上 active 的 0%、25%、50%、75%、100%；像素版是靜止格加每一格影格。
- 圖示多時自動分頁（sizes 每頁 48 個、frames 每頁 24 個），檔名加 `-1`、`-2`。
- 參考框：線條版虛線是 3 到 21 的內容區，像素版實線是 16 格邊界。動作途中超出框可以接受，靜止與結束狀態都要在框內。
- 頁面的腳本錯誤和不存在的圖示名稱會印在終端，有任何一項就以非零結束。

自檢頁不播動畫，每個時間點都直接算成靜態的一格：線條版的關鍵影格陣列平均分配時間、單一值從 rest 線性插到 active（彈簧的過衝不會出現），像素版直接解出每一格。所以截圖不會停在半路，但看不出彈簧手感，手感仍要到 `/icons` 的 Animated 模式看。

瀏覽器優先找 Playwright 的 `chrome-headless-shell`，其次是 Chrome、Chromium。日常用的瀏覽器（例如 Brave）在無頭模式下可能卡住，所以排在最後，單次呼叫超過 90 秒就中止。要指定時用環境變數 `CHROME`。

## 與 block 的關係

Block 仍維持「單一檔案、只依賴 framer-motion 與 cn」。新 block 需要圖示時，從 `/icons` 按 Copy SVG 貼成 inline SVG，形狀就會和整套一致。既有 block 逐步替換即可，不必一次改完。

替換範圍（2026-11-05 決定）：

| 系列 | 圖示 |
|---|---|
| pro、free 的 paper 系列 | 已換成 24 網格的 SunUI 圖示 |
| product、story、classic | **保留來源專案的原圖示**，因為這些是忠實移植，圖示屬於原作外觀的一部分，不要換成 SunUI 圖示 |
| 評分與收藏（star-rating、favorite-button）、animated-number 的箭頭 | 刻意保留，屬於元件本身的造型 |
