# SunUI 敘事遊戲系列（story）

> `meta.series: "story"` 的 block 遵守這份文件。
> 來源：山河未歸（WTMA）、DeathsBlessing、互動小說平台、方界：破碎祭壇、Vozmira 字幕（見 reports/UIUX 蒸餾報告-2026-11-05.md）。
> WTMA 與 DeathsBlessing 用同一套結構只換 token（金墨 ↔ 月光藍），所以本系列**一律用 CSS 變數上色**，讓買家換皮。

## 一句話

**墨與燈**：近黑的墨色面、暖白的字、一盞金色的燈；安靜、慢半拍、尊重閱讀。

## 1. Token

每個 block 的根元素用 inline style 設定下列變數（可由 `theme` prop 覆寫），內部只用 `var(--story-*)`：

| 變數 | ink（預設，暗） | rice（亮，宣紙） | 用途 |
|---|---|---|---|
| `--story-bg` | `#0b0e14` | `#f4efe3` | 面板底 |
| `--story-panel` | `rgb(14 18 28 / 0.86)` | `rgb(250 246 236 / 0.94)` | 浮在畫面上的面板 |
| `--story-line` | `rgb(234 228 214 / 0.14)` | `rgb(60 48 32 / 0.18)` | 細線、邊框 |
| `--story-text` | `#eae4d6` | `#2a2219` | 正文 |
| `--story-muted` | `rgb(234 228 214 / 0.6)` | `rgb(42 34 25 / 0.6)` | 次要文字 |
| `--story-accent` | `#c9a063` | `#9a6b2a` | 唯一強調：名牌、選中、提示符號 |
| `--story-danger` | `#c4553f` | `#a33a26` | 代價、危險 |

匯出 `storyThemes = { ink, rice, moon }`（moon：DeathsBlessing 月光藍 `--story-accent: #a3b8d9`）。

## 2. 形狀與字

- 圓角 2 到 4px，或 0；圓只給點與環。
- 故事文字用襯線：`font-family: "Noto Serif TC", "Songti TC", serif`；介面字用 sans。
- 標題與 eyebrow 字距寬：`tracking-[0.18em]`；正文行寬上限 `34em`，行高 1.8。
- 面板：1px `--story-line` 邊框，上緣內光 `inset 0 1px 0 rgb(255 255 255 / 0.06)`，可有一道深陰影 `0 24px 64px rgb(0 0 0 / 0.45)`（只在 ink 主題）。

## 3. 動態

```ts
const ease = [0.22, 0.72, 0.2, 1] as const; // 柔和 ease-out
```

- hover 120ms、面板 220 到 240ms、通知生命週期約 4.2s。
- 擦入：光條或筆刷從左往右；轉場：淡入淡出經過黑。
- 「下一句」提示符號可以緩慢呼吸（這是本系列唯一允許的常駐循環），reduced motion 時靜止。
- 打字機：點一下補完整句，再點一下前進；螢幕閱讀器一次收到整句，不逐字播報。

## 4. 互動規則

- 鍵盤、手把對等：數字鍵選選項、Enter / Space 前進、Esc 開關選單。
- 計時器（通知、自動播放）在 hover、focus、選單開啟、分頁隱藏時暫停。
- 破壞性操作（離開、讀檔覆蓋）要說清楚**會失去什麼**，並提供「先存檔再離開」這類第三條路。

## 5. 程式與示範

- 單一檔案，目標 250 行、上限 300；只依賴 `framer-motion` 與 `cn`。
- demo 用原創的短篇情境與名字，不重製任何既有作品；不放測試按鈕；375px 不破版。

## 檢查表

- [ ] 所有顏色經過 `--story-*` 變數，換 `theme` 能整套換皮
- [ ] 強調色只有 `--story-accent`
- [ ] 唯一的常駐循環是「下一句」提示，且 reduced motion 會停
- [ ] 鍵盤可以完整操作
- [ ] ink 與 rice 主題、375px 都看過
