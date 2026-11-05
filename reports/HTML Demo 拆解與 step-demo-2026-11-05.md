# fil.design「HTML Demo」拆解，以及 SunUI `step-demo` 的取捨

> 參考來源：https://fil.design/skills/html-demo （Fil 下載頁抽出的 agent skill，2026 年 10 月）
> 產出：`apps/web/registry/free/step-demo/`（免費，product 系列，定位為 Pro「上市 Hero」場景的原子）

## 1. 它在解決什麼

用 HTML 畫出「看起來像螢幕錄影」的 App 操作視窗：沒有影片、canvas、截圖，文字是真的、任何尺寸都清晰，而且同一份程式可以循環、跳步、拖曳、凍結截圖、在減少動態效果時靜止。

和其他做法的分界很清楚：要真實瀏覽器的 MP4 就錄影；要固定長度的影片就做動態設計；要「活的、可操作的展示視窗」才用它。

## 2. 核心機制：每一格畫面都是一個數字的純函式

```
畫面 = View({ t })   // t = 這一步的第幾秒
```

- 每一步在固定設計尺寸 **1200 × 750（16:10）** 上畫出整個 App，只依 `t`。
- 外框量寬度，`--k = 寬 / 1200`，舞台 `transform: scale(var(--k))`，`transform-origin: 0 0`。
- 時間點寫成具名常數（`TYPE_FROM = 1.9`），狀態用 `t` 比較、`ease`、`typed`、`cue` 推出來。

它點名的失敗模式，正好是 SunUI 現有 `scripted-demo` 的做法：

| 狀態放在哪 | 後果 |
|---|---|
| `setTimeout` 串接、動畫 callback、effect | 不能跳到某一步；背景分頁回來後播放漂移；每次截圖不同；減少動態效果壞掉 |
| 視窗內用 RWD 排版 | 文字重排、游標點不到目標、手機上看到的是另一個 App |

## 3. 規則與數字（摘要）

| 項目 | 規定 |
|---|---|
| 步驟 | 每個視窗 3 到 5 步，每步 4 到 8 秒，總長 18 到 30 秒；每步有 0.3 到 1 秒的前導、動作、結果，結果至少停 1 秒；步驟名 1 到 3 個字 |
| 打字 | 約每秒 50 字 |
| 游標 | 點擊前 0.3 到 0.6 秒抵達；按壓 0.15 到 0.2 秒，箭頭 1.15 縮到 0.98；兩點之間滑行 0.5 到 0.9 秒，`cubic-bezier(0.55, 0, 0.25, 1)`；動作之間移開，該看結果時淡出 |
| 轉場 | 新步驟 0.45 秒淡入 `cubic-bezier(0.2, 0.7, 0.1, 1)`；舊畫面延遲 300ms 淡出 |
| 時鐘 | 40ms 一拍（hero 50ms），`dt` 上限 0.25 秒；`document.hidden` 時不走 |
| 可見才播 | IntersectionObserver，視窗 0.3、hero 0.15 |
| 減少動態效果 | 每步顯示 `t = dur` 的完成畫面，步驟列仍可點；每個完成畫面都要能獨立成圖 |
| 結果呈現 | 先有工作中狀態（spinner、掃光、Making…），再出結果，再回穩。範例：`clip-path` 由上往下畫出，2px 暖色掃描線，底下是模糊變暗的副本，最後亮度由 1.35 回到 1 |
| 誠實 | 用 App 真的產出的結果與真的字；時間可以壓縮但數字要真（例如「2:14 做了 5 個」） |
| 目標位置 | 用 `data-aim` 從 DOM 量測再除以 `--k`，不寫死座標 |
| 隔離 | 每個視窗一個 class 與 keyframe 前綴 |
| 無障礙 | 舞台 `role="img"`，`aria-label` 列出步驟；`pointer-events: none`、`user-select: none`；步驟是真按鈕，`aria-current="step"`；`<figure>` 要 `margin: 0` |
| 驗證 | 同一個 t 每次凍結都一樣；390 與 340px 沒有橫向捲動且維持 16:10；console 乾淨；至少三輪「截圖、比對、修正」 |

工作流程上還有兩點值得學：**一律用自己擁有的範例主角**（他們用自創的騎士與網站，不放客戶內容），以及**介面文字從原始碼 grep，不憑記憶寫**。

## 4. 和現有 `scripted-demo` 的比較

| | `scripted-demo`（現有） | `step-demo`（新） |
|---|---|---|
| 時間來源 | 每幕 `setTimeout`，進場靠 CSS keyframes | 單一數字 t，畫面是純函式 |
| 跳步 | 只能跳到章節開頭，動畫重播 | 任一秒，含拖曳時間軸 |
| 凍結截圖 | 不行 | `time` 受控 prop，同一 t 輸出相同 DOM（已驗證） |
| 背景分頁 | 暫停，但 keyframes 照跑 | 不走，回來不快轉 |
| 縮放 | 視窗內 RWD，手機重排 | 固定舞台整張縮放，手機看到同一個畫面 |
| 減少動態效果 | 場景瞬切 | 每步的完成畫面 |
| 游標 | 依場景量一次，CSS transition 滑過去 | 每一格由 t 算位置與按壓，目標從 DOM 量 |

`scripted-demo` 已經公開，不改它的 API。【建議】之後在它的 `meta.usage.watchOut` 指向 `step-demo`，下一個大版本再考慮退場。

## 5. `step-demo` 採用、調整與省略的部分

**採用**：t 純函式、固定舞台單一縮放、具名時間點、`ease` / `typed` / `cue` / `held`、游標時序與按壓數字、300ms 舊畫面淡出加 0.45 秒新畫面淡入（同樣由 t 推出，所以拖曳時也正確）、40ms 時鐘與 0.25 秒上限、可見才播、減少動態效果顯示完成畫面、`data-aim` 量測、`role="img"` 舞台、`figure` 歸零邊距。

**調整**：

- 緩動改用產品系列的 expo-out 當預設，另外保留 `glide`、`fade` 兩條原版曲線。
- `typed` 以 `Intl.Segmenter` 切字形，CJK 與 emoji 不會打出半個字；另給 `typingTime()` 讓下一個時間點直接算出來。
- 游標直接寫 DOM style，不經 React state，符合 DESIGN-product「高頻更新不走 state」。
- 不需要任何 keyframes 或 `<style>`，前綴問題自然消失；`data-stp-layer` 是唯一的命名空間。
- 顏色全用 shadcn token，進度條用前景色，強調色留給使用者的 App 畫面。

**省略（之後可補）**：

- 「畫面簽章不變就不重繪」：目前每拍都 render，40ms 一拍在一般區塊足夠。
- 下一步圖片預載、hero 版的流程圖排程與攝影機：屬於 Pro 場景的範圍。
- Playwright 截圖腳本與單窗預覽外掛：SunUI 已有 `/preview/<name>`，凍結可用 `time` prop。

## 6. API 速覽

```tsx
const TYPE_FROM = 1.5;

function Describe({ t }: StepViewProps) {
  return <Prompt text={typed(PROMPT, t, TYPE_FROM)} busy={cue(t, CLICK)} />;
}

<StepDemo
  size={[960, 600]}
  url="studio.example.com"
  controls="scrubber"          // steps | scrubber | none
  steps={[
    { id: "describe", name: "Describe", dur: 6, View: Describe,
      cursor: [{ at: 0.8, to: "prompt", click: 1.2 }, { at: 3.6, to: "generate", click: 4.0 }] },
    ...
  ]}
/>
```

- 只要讓舞台裡的元素有 `data-aim="名稱"`，游標就會量測並滑過去；也可以給 `[x, y]` 舞台座標。
- `time` / `onTimeChange` 讓外部控制或凍結；`useStepDemo()` 讓深層元件拿到 t。
- `chrome` 有 `browser`、`window`、`none`，外框在舞台外，以原生尺寸繪製保持清晰。

## 7. 驗證紀錄（2026-11-05）

- 開發預覽 `/preview/step-demo`：三步都正常播放，console 無錯誤。
- 拖到 8.7 秒：模糊底、掃描線、由上往下畫出都正確；11.5 秒：三個版本與游標點選；18.5 秒：發布、計數 1,284 與 96、提示框。
- 同一個 t（11.5 秒）來回拖曳兩次，舞台 innerHTML 完全相同。
- 375px：無橫向捲動，比例 1.6。淺色與深色都看過；發現 `bg-primary` 與 `bg-foreground` 在中性主題下幾乎同色，版本色改成 primary、muted、card 三層。
- 未實測：系統層的減少動態效果（瀏覽器工具無法模擬該媒體查詢），邏輯上是把 t 固定為 `dur` 並移除游標。
- 檔案 440 行，超過 DESIGN-product 的 300 行上限（`scripted-demo` 為 445 行）；引擎與時間工具拆不開，暫時接受。

## 8. 下一步建議

1. Pro「上市 Hero」場景以 `step-demo` 為原子：產品圖、預購登記與剩餘名額做成一支 18 秒的 demo。
2. `scripted-demo` 的 `watchOut` 加一句指向 `step-demo`。
3. 若做官網首頁 demo，照原版流程用自己的範例主角，文字從原始碼取。
