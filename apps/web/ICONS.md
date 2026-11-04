# SunUI 圖示規範

> 圖示庫：`registry/icons/sunui-icons.tsx`；展示頁：`/icons`；安裝：`npx shadcn@latest add <site>/r/icons/sunui-icons.json`。

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
4. **朱紅點**：每個圖示最多標一個 accent 部位。預設跟著 `currentColor`，設定 `--sunui-icon-accent` 才上色。一個畫面只開一處，對應 DESIGN.md「朱紅每個 block 最多一處」。
5. **紙品細節**：票券要有半圓缺口與打孔虛線、收據底部是鋸齒、印章內文字傾斜約 -10°。不加陰影、漸層。
6. **無障礙**：預設 `aria-hidden`；單獨出現、沒有文字標籤時傳 `title`。

## 分組

| 組別 | 用途 | 例子 |
|---|---|---|
| Paper | SunUI 招牌 | coupon、receipt、ticket、stamp、stamp-check、stamp-tool、punch-card、scissors、envelope |
| Commerce | 購物流程 | cart、bag、tag、percent、gift、truck、package、store、card、wallet、scan、flash、timer |
| Interface | 通用控制 | check、close、chevron-*、search、copy、retry、alert、lock、eye、bell、star、heart… |
| Product UI | 工具型介面 | status、loader、activity、gauge、terminal、inbox、shield、caption… |
| Story | 敘事遊戲 | play、pause、skip、book、dialogue、lantern、scroll、quill、map |

## 新增圖示

1. 在 `sunui-icons.tsx` 的 `icons` 加一筆，名稱用 kebab-case 名詞。
2. 在 `lib/icon-groups.ts` 放進對應分組，必要時補中英關鍵字。
3. 到 `/icons` 用 16 與 24 兩個尺寸、Light 與 Dark 各看一次，確認在 16px 下還認得出來。

## 與 block 的關係

Block 仍維持「單一檔案、只依賴 framer-motion 與 cn」。新 block 需要圖示時，從 `/icons` 按 Copy SVG 貼成 inline SVG，形狀就會和整套一致。既有 block 逐步替換即可，不必一次改完。
