# UI Moments 微互動合集：深度分析與實作紀錄（2026-11-26）

來源：X 貼文 `guanmo_ai/status/2125440590984925588`（2026-11-25），一支 12 秒、1080×1350 的影片，標題「UI Moments · 36 Animations · 6 × 6」，黑白配色。影片頁尾寫的 GitHub repo（`guanmo-ai/ui-moments`）查不到公開版本，頁尾另註明部分載入圖示參考 Utkarsh Verma 的 SVG Spinners。所以本次全部依影片畫面重新設計與撰寫，沒有複製任何原始碼。

## 1. 這支影片在示範什麼

36 格分成兩種性質：

| 類型 | 數量 | 特徵 |
|---|---|---|
| 載入與等待（自己循環） | 12 | 點陣環繞、雙環、聲波條、菱形分合、描線、軌道 |
| 回應操作的微互動 | 24 | 開關、按讚、存檔、篩選、底部面板、清除、單選、Toast、上傳、資料夾、靜音、反應、鎖、釘選、版面切換、權限、臉部掃描、裁切、排序、縮放 |

貼文賣點是「阻尼回彈加明暗交替」。觀察影片逐格：

- 幾乎每個狀態切換都是**同一個外框變形**（開關旋鈕帶圖示移動、版面切換的項目各自滑到新位置），不是硬切。
- 結果都有**落定的一下**（勾線描出、鎖扣落下回彈），但沒有粒子或彩帶。
- 單色、低對比的鋼灰表面，靠亮暗和高光分層。

這三點跟 SunUI 的 DESIGN.md 第 5、6 節本來就一致，所以適合吸收進現有庫，不需要改設計語言。

## 2. 與 SunUI 的差異：影片會自己循環，SunUI 不准

影片為了展示，把 36 格全部做成自動播放。DESIGN.md 第 5 節第 2 條規定「只在回應使用者動作或資料狀態改變時動」，載入中是唯一例外。所以：

- 12 個載入類照影片做成循環，放進 `loading-effects` 的 `Loader`，遵守既有的 `useActive`：離開畫面或減少動態時停在靜止畫面。
- 24 個互動類**全部改成真的控制項**：按下、輸入或拖曳才動，有 hover、focus-visible、按下三種狀態，可用鍵盤操作。

## 3. 36 格對照與處理方式

決策（使用者 2026-11-26 選定）：免費型錄凍結中，不新增 block id，改擴充既有的 `micro-interactions` 與 `loading-effects`。

### 已有，不重做（10）

| 影片 | SunUI 既有 |
|---|---|
| Theme Switch | `theme-picker` 的 ThemeSwitch |
| Like Button | `micro-interactions` 的 like-burst、`favorite-button` |
| Live Search | `expanding-search`、`command-palette` |
| Save Status | `loading-button` |
| Filter Tags | `sliding-tabs` 的 chips |
| Bottom Sheet | `dialog-sheet` |
| Play / Pause | `svg-effects` 的 icon-morph play-pause |
| Undo Toast | `toast-stack` 的 useUndoable |
| Upload Queue | `jobs-tray` |
| Link Preview | `link-preview-card` |

### 新增到 loading-effects 的 Loader variant（12）

`eight-dot-orbit`、`center-dots`、`six-dot-scale`、`half-ring`、`twin-pulse`、`wave-scanner`、`split-diamond`、`type-sweep`（讀 label 文字，最多 10 字）、`step-relay`、`scale-fade`、`signal-trace`、`loop-track`。

顏色全部走既有的 `ink`（palette 與 color prop），所以 spot、status 與四種漸層都適用。

### 新增到 micro-interactions 的元件（14）

| id | 元件 | 動態重點 | 無障礙 |
|---|---|---|---|
| clear-input | `ClearInput` | 有字才彈出清除鍵；清除時舊字往左滑出，焦點回到輸入框 | 清除鍵有 aria-controls |
| radio-select | `RadioSelect` | 只有一顆圓點在環之間移動（layoutId），不是兩顆淡入淡出 | 原生 radio，方向鍵可用 |
| folder-drop | `FolderDrop` | 文件掉進資料夾後方，前蓋輕點一下再描出勾 | 狀態文字 aria-live |
| quick-reply | `QuickReply` | 建議詞從列中飛進輸入框，送出鍵變亮 | 一開始打字就轉成可編輯文字 |
| mute-switch | `MuteSwitch` | 旋鈕帶著麥克風移動，到位後才畫斜線 | role switch |
| reaction-tray | `ReactionTray` | 按鈕展開成一排反應，選定後收回並在按鈕上落定 | aria-expanded，Esc 關閉，圖示是 SVG 不是 emoji |
| focus-lock | `FocusLock` | 鎖扣以右腳為軸轉開；上鎖時落下回彈，鎖身換成品牌色 | aria-pressed |
| pin-toggle | `PinToggle` | 圖釘由斜轉正並往下壓一下；釘選後是品牌色烤漆鍵 | aria-pressed |
| list-to-grid | `ListToGrid` | 同一批項目各自滑到新位置，略微錯開 | radiogroup，方向鍵切換 |
| permission-gate | `PermissionGate` | 盾牌裡的鎖縮小消失，勾描出，盾牌換品牌色 | 按鈕文字 aria-live |
| face-scan | `FaceScan` | 掃描線上下一趟，臉部線條畫出，四角收攏 | 減少動態時跳過掃描線 |
| crop-frame | `CropFrame` | 切換比例時裁切框用 gentle 彈簧變形，框外變暗，有三分線 | 比例是 radiogroup，方向鍵可用 |
| sort-handle | `SortHandle` | 只能從握把拖曳（Reorder），拿起時微放大加陰影 | 握把聚焦後上下鍵移動，位置用 aria-live 念出 |
| resize-frame | `ResizeFrame` | 拖右下角即時顯示尺寸，放開對齊 8px 格線 | 握把聚焦後方向鍵每次 8px |

## 4. 為什麼不做成新 block 或 Pro

- AGENTS.md：免費型錄凍結到 2027-01-12，不新增免費 block 或動效庫。擴充既有庫的 variant 不增加 block 數，符合凍結的字面意思。
- 這些元件單獨都太小，不符合 Pro「組合場景」的四個測試（見 memory 的 Free/Pro option C），放進 Pro 會稀釋 Pro 的定位。
- 之後如果要做 Pro，比較合理的是把其中幾個組成場景，例如「上傳與權限流程」（permission-gate + face-scan + folder-drop），而不是賣單顆。

## 5. 驗證

- `npm run typecheck -w @sunui-design/web` 通過；預覽數從 329 變 343 個 variant。
- 在 `/preview/micro-interactions` 實際操作 14 個新元件（深色、zh-TW）。修了三個問題：反應選單展開後按鈕圖示被 layout 動畫放大卡住（改成只對選單寬度做動畫）、鎖扣轉軸算錯（SVG 的 fill-box 原點改用比例）、文件掉進資料夾不夠深。
- `/preview/loading-effects` 12 個新 loader 都在動。

## 6. 還沒做

- 淺色模式與 375px 寬度還沒截圖檢查。
- OG 分享圖沒有重截（`node apps/web/scripts/capture-og.mjs --only micro-interactions`）。
- 兩個 block 都不在 `content/port-verified.json`，移植驗證不受影響。
