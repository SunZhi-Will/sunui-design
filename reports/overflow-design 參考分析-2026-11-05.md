# overflow.design 參考分析：彈簧線稿（spring-rig）

日期：2026-11-05
參考：https://www.overflow.design/ 與 /isometric 頁
產出：`apps/web/registry/free/spring-rig/`（motion 系列，免費）

## 1. 這個站在做什麼

Overflow Design 是一人繪製的圖示與插畫商店（1,120 icons、457 illustrations、259 isometric drawings），商業結構和 SunUI 很像：免費包導流、Pro 一次買斷、Figma plugin，以及一個讓 coding agent 搜尋素材的 MCP server（`search_drawings`、`get_drawings`）。首頁兩側的等角圖是靜態的；真正的「彈性」在 Isometric 頁：網格上的每張圖，游標指上去就會動，文案寫的是 point at one to move it。

## 2. 互動拆解（實測 + 讀前端 bundle）

不是 CSS transform，也不是 Lottie。游標移到一張圖上時，一個 SVG 在幾百毫秒內產生上千次 DOM 變動：**每一幀用 JS 重新計算 `path d`，再整段寫回 `innerHTML`**。架構分成四層：

| 層 | 做法 |
|---|---|
| 通道（channel） | 每張圖有 N 個數值通道，各自有 `at`、`speed`、`goal`，以及一個 feel |
| feel（彈簧手感） | react-spring 式的 tension 與 friction 預設：default、gentle、wobbly、stiff、slow、molasses、snappy；另有 `fall`：等加速度落向目標，碰到後以 0.3 倍速度反彈 |
| rig（骨架函式） | 每一幀拿到游標情境：是否在圖上、進入了幾毫秒、離開了幾毫秒、座標、平滑後的速度、`near(錨點, 半徑)`、smoothstep，回傳每個通道的目標值，必要時改寫某通道的 feel（例如按下時切成 snappy，放開後切成 fall） |
| draw（繪製） | 用目前的通道值重新產生幾何 |

細節：

- **積分器**：彈簧以固定 1 ms 子步做半隱式 Euler，dt 上限 1/30 秒，因此 tension 420 的硬彈簧在任何幀率下都穩定。
- **游標速度**：以 `k = min(1, 12·dt)` 做指數平滑，避免抖動；離開時歸零。
- **迴圈會停**：游標不在、沒有自動播放、所有通道都落定時，不再請求 `requestAnimationFrame`。
- **座標**：用 `svg.getScreenCTM().inverse()` 轉進 viewBox，圖怎麼縮放都對。
- **自動播放（Autoplay）**：一個「幽靈游標」沿固定路徑走：從左下滑入（ease-out cubic）、在圖上畫 8 字形（李薩如曲線）、往右上加速離開、休息，再重來。真的游標進來就接手，離開後先等一段 away 時間才恢復。
- **減少動態**：輸出的 SVG 片段附 `@media (prefers-reduced-motion)` 停掉動畫。

這套設計的價值在於：**動畫是由「意圖」而非「關鍵影格」描述的**。rig 只說「蓋子要往上、要偏向游標」，手感交給 feel，時間感交給彈簧，所以同一張圖對快速掃過、慢慢靠近、按住、離開都有不同反應，而不需要做任何時間軸。

## 3. SunUI 的實作取捨

| 參考站 | spring-rig |
|---|---|
| 等角線稿，素材本身是商品 | 原創的平面電商線稿（購物袋、吊牌、禮物盒、檯燈、卡片堆），不複製任何一張圖 |
| 每幀寫 `innerHTML` | React state 每幀重繪，`draw` 回傳 JSX；圖很小，成本可忽略，也保留 React 的組合性 |
| 幾何全部程序化重算 | 以 `<g transform>` 為主，檯燈與卡片用三角函數算關節位置；作者寫 rig 更容易 |
| 私有引擎 | 公開 `defineRig`、`springFeels`、`ramp`，使用者能替自己的 SVG 裝骨架 |
| 僅滑鼠 | pointer events 一套處理：觸控點一下等於進入，長按等於 pressed |

保留了參考站的核心機制：每通道獨立 feel、rig 可在每幀切換 feel、`fall` 落下回彈、1 ms 子步、速度平滑、落定即停、幽靈游標自動播放（路徑與時間常數另訂），以及畫面外與分頁隱藏時暫停。

五張圖各自示範一種 rig 手法：

- **bag**：傾向游標（位置）、提把隨速度擺（速度）、進入時跳一下再以 `fall` 落回（feel 切換）、按住壓扁。
- **tag**：鐘擺，被游標速度推動，wobbly 的低摩擦造成多次回擺；按住往下拉。
- **box**：進入時蓋子彈開，之後依 `near()` 保持半開，離開時以 `fall` 掉回並彈兩下。
- **lamp**：rig 讀目前姿勢（`p.at`）算出燈頭位置，再用 atan2 對準游標；燈光以 snappy 亮起。
- **cards**：三張卡依 70 ms 間隔依序展開（以 `t` 做錯開），游標下方那張以 `near()` 抬起。

## 4. 規範對照

- 屬於 motion 系列，紙感規則不適用；顏色只用 `currentColor`、`fill-background` 與 `stroke-primary`，可用 `accent` 換色。
- 動態只回應游標或觸控；自動播放預設關閉，只在畫面內且分頁可見時跑。
- 減少動態時畫靜止姿勢、不掛迴圈。
- `meta.usage` 已寫 whenToUse、watchOut、aliases（含 elastic、jelly、rigged svg、isometric animation 等搜尋詞）。

## 5. 驗證

- `tsc --noEmit`：新檔無錯誤（唯一的錯誤來自另一個工作階段產生的 `.next-prod` 型別檔，與本次無關）。
- eslint：無警告。
- 瀏覽器（localhost:3102 `/preview/spring-rig`）：五張圖都能被游標帶動，自動播放正常，閒置時 1 秒內 0 次 DOM 變動，無 console 錯誤。
- 未驗證：375px 手機寬與淺色模式只做了程式碼層面的檢查，觸控長按尚未在實機上測。

## 6. 可延伸方向

1. **等角線稿版本**：參考站的賣點是等角圖。SunUI 可以另做 `iso` 一組 rig（箱子、伺服器、購物車），延用同一個引擎。適合當 Pro。
2. **狀態（states）**：參考站的引擎有 `setState`，可以讓圖在「空 / 有貨 / 已送達」之間以彈簧切換。對電商的空狀態、訂單狀態很有用。
3. **MCP 素材搜尋**：參考站已經讓 agent 依「畫的內容」搜尋素材。SunUI 的 `search_blocks` 可以加上 spring-rig 的 preset 名稱與別名，讓 agent 直接挑圖。
