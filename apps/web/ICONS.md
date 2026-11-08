# SunUI 圖示規範

> 靜態：`registry/icons/sunui-icons.tsx`（`<site>/r/icons/sunui-icons.json`，無依賴）
> 動態：`registry/icons/sunui-animated-icons.tsx`（`<site>/r/icons/sunui-animated-icons.json`，依賴 framer-motion 與靜態版）
> 像素：`registry/icons/sunui-pixel-icons.tsx`（`<site>/r/icons/sunui-pixel-icons.json`，無依賴）
> 像素動態：`registry/icons/sunui-animated-pixel-icons.tsx`（`<site>/r/icons/sunui-animated-pixel-icons.json`，依賴像素靜態版）
> 展示頁：`/icons`，兩組切換：線條 / 像素 × 靜態 / 動態。
> Pro 檔期圖示組：`registry/pro/icons/`（私有 repo），索引在 `lib/pro-icons.ts`，憑授權從 `<site>/r/pro/<name>.json` 安裝。見文末「Pro 檔期圖示組」。

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

2026-11-09 補上 Festive 組：red-envelope、firework。像素版原本就有，Pro 農曆新年場景也要用，屬於免費型錄凍結規則裡「從 Pro 場景抽出的原子」。

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
3. **字元**：`#` 外框（墨色）、`=` 填色（墨色 30%）、`:` 陰影（墨色 58%）、`+` accent、`~` accent 陰影（62%）、`-` 第二材質填色、`_` 第二材質陰影（墨色時同 `=` `:`）、`*` 亮點（`--sunui-pixel-shine`，預設白色）、`.` 留白。每種字元合併成一條 path。
4. **控制符號例外**：勾、叉、加減、箭頭、chevron、選單、上傳下載維持 2 格粗的實心線，不加填色。`pigment` 時整條線換成本色（`strokeTones`：亮色紙用陰影那一階，暗色紙用基準色），例如勾綠、叉紅、箭頭藍。
5. **銳利度**：`shape-rendering="crispEdges"`，尺寸用 16 的整數倍（16、32、48、64）。
6. **accent**：沿用 `--sunui-icon-accent`。藥水、蘋果、旗面這類整體就是主角的，`+` 可以畫整塊。
7. **物件本色（`tone="pigment"`）**：2026-11-07 加入，背景見 `reports/顏色系統分析-黑白灰之外-2026-11-07.md`。
   - 預設仍是 `ink`。`pigment` 時外框與亮點不變，填色、陰影、accent 改成**不透明、色相偏移**的本色色階：`+` 是基準色，`=` 略亮，`:` 與 `~` 變暗並往冷色偏（見 `ramps`）。不透明才不會吃到底色，亮暗紙上顏色一致。
   - 每個圖示都有對照（`pixelPigments`：藥水紅、金幣金、寶石藍、史萊姆綠，介面、紙品、電商也各有本色，例如印章紅、優惠券金、購物車藍）。2026-11-08 起介面、紙品、電商不再固定墨色。
   - **多材質**（2026-11-08 加入）：一個物件最多三種顏色，在 `pixelPalettes` 設定。`= :` 是主體、`+ ~` 是 accent、`- _` 是第二材質。例如劍是鋼刃、金護手、木柄，肉是紅肉加骨頭，蘋果的葉子是綠色。墨色版不受影響。
   - 10 種本色（`pigments`）：red、orange、gold、green、blue、violet、brown、steel（鋼）、bone（骨與羊皮紙）、pink（粉紅，給甜點與腮紅），OKLCH 低彩度；金色偏亮偏綠、橙色偏暗偏紅，暗色紙上才分得開。steel 與 bone 幾乎無彩，陰影靠明度拉開。覆寫 `--sunui-pigment-<name>` 時整條色階用 `oklch(from …)` 跟著推算。
   - `pigment` prop 可指定顏色，覆蓋對照，例如寶石依稀有度換成 blue、violet、gold。
   - 一個畫面選一種：全墨或全 pigment，不混。
8. **線的份量**（2026-11-07 起，11-08 修正）：16 格裡外框已是 1 格，不能再細，所以分三種份量畫「#」。
   - **邊**（碰到空格，含外框與中間的孔）：墨色 85%。
   - **內線**（被填色包圍、只有 1 格粗）：墨色 50%。內線比邊還黑時，圖示中間像多了一道裂縫，所以一定要比邊淡。
   - **記號**（至少 2 × 2 的墨色塊：驚嘆號、骰子點、眼珠）：全墨，這是符號本身。
   - 只有外框的控制符號不拆，維持全墨。
   - `pigment` 時，亮色紙上的邊用本色最深一階混 35% 墨，暗色紙（`color-scheme: dark`）上回到墨色；內線用本色最深一階。
   - **畫新圖示時，分層用色塊（`=` `:` `*`），不要用墨線分割**：寶石的切面是亮面與陰影面，火是外焰深、內焰淺、焰心白。比較樣張：`/preview/outline-study`。
9. **分組**：Interface、Paper、Commerce，加上像素版獨有的三組遊戲圖示、可愛與節慶兩組：
   - Gear（裝備）：sword、dagger、axe、hammer、bow、wand、shield、helmet、armor、boots、ring、amulet
   - Items（道具）：potion、key、gem、crown、chest、trophy、bomb、orb、scroll、map、apple、meat、fish、dice、hourglass、book、torch
   - World & HUD（世界與 HUD）：skull、ghost、slime、fire、snowflake、door、flag、heart-half、sparkle、battery、flash、gamepad、cursor
   - Cute（可愛，2026-11-08 加入）：cake、cupcake、donut、candy、lollipop、ice-cream、cookie、boba、strawberry、cherry、cat、chick、paw、flower、mushroom、cloud、sun、moon、rainbow、balloon、music
   - Seasonal（節慶，2026-11-08 加入）：pumpkin、bat、xmas-tree、snowman、candy-cane、red-envelope、lantern、firework、party-popper、chocolate、love-letter、egg、bunny、clover、medal
   - 遊戲圖示只畫通用物件，不仿任何現有遊戲的角色或造型。
10. **可愛的畫法**：輪廓切掉直角變圓、亮點放大；有臉的（貓、小雞、史萊姆、幽靈、雲、太陽、月亮）眼睛用 2 × 2 全墨塊或單格，嘴巴是小小的弧線。腮紅、貓耳內側這類裝飾用 `-` 第二材質（粉紅）而不是 `+`，墨色版才會是淡灰而不是黑塊。

### 像素動態

不用補間，像遊戲精靈一樣逐格換圖，不依賴 framer-motion。全部 125 個圖示都有動態版（2026-11-08 補齊）。

| 類型 | 觸發 | 例子 |
|---|---|---|
| hover | 滑過或聚焦父元素，播一次 | 寶石與皇冠閃光掃過、硬幣翻面、鈴鐺搖、藥水冒泡、骰子滾動、旗子飄 |
| toggle | `active` | 愛心與星星由下往上填滿、寶箱與鎖打開、門推開、選單變叉、集點卡蓋下一格 |
| loop | `active` 為真期間 | 沙漏、電池充電、火焰、火把 |

hover 動作要跟物件本身有關，不要整張圖一起彈跳或左右晃（整張平移只留給箭頭與 chevron，因為它們本來就代表方向）。2026-11-08 的做法：鈴鐺、燈籠、櫻桃、標籤以頂端或孔為軸擺動；斧頭、鎚子先往後舉再揮下；史萊姆、包裹、蘑菇先壓扁再拉長；蘋果、肉、餅乾、巧克力一口一口被咬掉；貓、兔子、幽靈、雲會眨眼，兔子耳朵會垂下；信封打開、信紙升起；紅包與錢包冒出金幣；時鐘指針轉一圈；珍珠沿吸管往上跑；半顆心由下往上填滿；腳印先蓋肉墊再一根根腳趾；彩虹從左畫到右；拐杖糖條紋像理髮廳燈柱一樣流動。

注意：16 格的圖示旋轉超過 15 度會破圖（齒輪、叉叉），這類改用別的動作，例如齒輪中心有一道光繞圈。所有影格都要留在 20 × 20 之內，產生後檢查有沒有像素被推出邊界（被截斷）。

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

Block 仍維持「單一檔案、只依賴 framer-motion 與 cn」。新 block 需要圖示時，從 `/icons` 按 Copy SVG 貼成 inline SVG（agent 用 MCP 的 `get_icon`，見下節），形狀就會和整套一致。既有 block 逐步替換即可，不必一次改完。

替換範圍（2026-11-05 決定）：

| 系列 | 圖示 |
|---|---|
| pro、free 的 paper 系列 | 已換成 24 網格的 SunUI 圖示 |
| product、story、classic | **保留來源專案的原圖示**，因為這些是忠實移植，圖示屬於原作外觀的一部分，不要換成 SunUI 圖示 |
| 評分與收藏（star-rating、favorite-button）、animated-number 的箭頭 | 刻意保留，屬於元件本身的造型 |

## 給 agent：MCP 與網址

2026-11-07 參考 iconmcp.com 加入，分析見 `reports/iconmcp 參考分析-2026-11-07.md`。

| 入口 | 作用 |
|---|---|
| MCP `search_icons` | 用意思找圖示（英、中、日），容忍複數與一個錯字，原型排在變體前（stamp 先於 stamp-check）。不帶 query 列出分組，帶 `group` 列出一組。同名的線條與像素版合併成一筆 |
| MCP `get_icon` | 回傳獨立 SVG 或 TSX 元件，可調 size、stroke、color、accent、像素版的 tone；附上整套安裝指令 |
| `/icons?icon=<name>&style=pixel` | 直接打開某個圖示，選取時網址會跟著更新，可以分享 |

規則：

1. 搜尋只讀 `lib/icon-groups.ts` 的分組與 `iconKeywords`，新增圖示時補上關鍵字，agent 才找得到。
2. 輸出直接讀 `registry/icons` 的幾何（`lib/agent/icons.ts`），不另存一份，改圖示不必同步。
3. 伺服器維持唯讀：不做 iconmcp 的 request、report、fix（需要佇列與審核，和 SunUI 的人工設計流程不合）。

展示頁的選取面板另有：網格線（線條版 24 格、3 到 21 虛線框、圓 8.5、方 7；像素版 16 格與 1 到 14 框）、下載 SVG、關鍵字標籤（按下即搜尋）、同組相關圖示。

## Pro 檔期圖示組

2026-11-08 決定、11-09 實作，規劃與理由見 `reports/Pro 圖示包規劃-2026-11-08.md`。

1. **分層**：上面四套永遠免費（已用 MIT 推出，收不回來）。Pro 只收**檔期限定**的物件，一個檔期一組，跟著季節包與 Pro 場景上架。**所有 Pro 授權都包含所有圖示組**，季節包賣的是整頁與素材組裝，不是圖示。
2. **規格不另開**：線條、像素、本色、動態規則全部沿用本文件。免費庫已有的物件（紅包、燈籠、煙火、禮物、鈴鐺）不重畫；某個物件只有一種風格在免費庫時，把另一種補進免費庫，不放 Pro（`tests/pro-icons.test.ts` 會擋同名）。
3. **每組四個 registry 項目**：線條、線條動態、像素、像素動態，例如 `sunui-lunar-icons`、`sunui-animated-lunar-icons`、`sunui-lunar-pixel-icons`、`sunui-animated-lunar-pixel-icons`。不寫進 Pro 的 `registry.json`（那份是 block 型錄），而是寫在公開的 `lib/pro-icons.ts`，`/r/pro/[name]` 找不到 block 時改找這裡，原始碼仍從私有 repo 讀、要授權。
4. **共用免費的渲染元件**：免費庫匯出 `Glyph`、`AnimatedGlyph`、`AnimatedPixelSprite` 與 `PixelPathsGroup`，Pro 檔只放幾何、動作配方與一層薄元件（`LunarIcon` 等），從 `@/components/ui/sunui-*` 匯入（repo 內由 `components/ui/sunui-*.tsx` 轉接）。像素動態的影格由靜態點陣推出（位移、翻轉、壓扁），不手畫。
5. **公開索引**：`lib/pro-icons.ts` 只有名稱、關鍵字、動作類型與安裝資訊，沒有幾何。公開 clone 沒有 Pro 目錄也能建置。新增或改名時同步改這裡，`npm test` 會比對索引與 Pro 原始碼。
6. **展示**：`/icons` 頁下方的 Pro 區塊由 `components/pro-icon-showcase.tsx` 畫；圖示本身由 `registry/pro/icons/showcase.tsx` 渲染，經 `generate-previews.mjs` 產生的 `loadProIconRenderers` 動態載入，沒有 Pro 目錄時改畫鎖頭。只給 JSX 與安裝指令，**不給複製或下載 SVG**。
7. **Pro 場景的 preview 可以 import `@/registry/pro/icons/sunui-*`**：這是 `generate-previews.mjs` 對「preview 不可 import Pro 原始碼」的唯一例外。圖示一畫到畫面上幾何就看得到，不必在每個 preview 抄一份。完整場景元件仍不能 import。
8. **MCP**：`search_icons` 會列出 Pro 圖示並標 `[Pro]`，同分時免費排前面，`tier: "free"` 可只看免費。`get_icon` 對 Pro 圖示只回安裝步驟，不回 SVG 或 TSX。

| 檔期 | 圖示組 | 圖示 | 用在 |
|---|---|---|---|
| 農曆新年（2027 羊年） | lunar-new-year | fu（倒福 toggle）、firecracker、gold-ingot、mandarin、koi、dumpling、plum-blossom、couplet、goat、coin-string、tea、knot | `lunar-new-year` 各區塊標題、`festival-banner` 農曆新年的小尺寸裝飾 |

生肖每年換：2028 年只補一隻猴，其他物件沿用。
