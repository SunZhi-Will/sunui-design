# SunUI 設計語言

> 所有 block 都要符合這份文件。新增或重做 block 前先讀完，完成後用最後的檢查表逐項自評。

## 一句話

**紙感電商**：優惠券、收據、集點卡、票根，用實體紙品與朱紅印章的材質語言，做出 AI 生不出來、一眼認得的電商互動。

## 1. 顏色

只准用下面這幾組。**不准**為了好看加漸層、光暈、模糊、彩色陰影。

| 角色 | Light | Dark | Tailwind 寫法 | 用途 |
|---|---|---|---|---|
| 介面中性色 | shadcn tokens | shadcn tokens | `bg-card` `text-muted-foreground` `border-border` | 一般 UI |
| 主要動作 | 使用者主題的 primary | 同左 | `bg-primary text-primary-foreground` | 主按鈕（尊重買家品牌） |
| 紙 | `#faf7f0` | `#1f1c18` | `bg-[#faf7f0] dark:bg-[#1f1c18]` | 票券、收據、集點卡的紙面 |
| 紙邊 | `#e7e0d0` | `#38332b` | `border-[#e7e0d0] dark:border-[#38332b]` | 紙的邊線、虛線 |
| 墨 | `#1c1917` | `#ece7dc` | `text-[#1c1917] dark:text-[#ece7dc]` | 紙上的印刷字 |
| 朱紅（招牌色） | `#c8361d` | `#ec6a4f` | `text-[#c8361d] dark:text-[#ec6a4f]` | 折扣面額、印章、促銷強調。**每個 block 最多一處主要用途** |

- 成功、錯誤這類狀態色只在小面積文字或圖示上用（`text-emerald-700`、`text-destructive`），不鋪滿底色。
- 不准每個 block 自己挑強調色。多張券的差異用**文字與版面**區分，不用換顏色。

## 2. 材質與形狀

- **紙**：平面、1px 紙邊、無陰影或僅 `shadow-[0_1px_0_rgb(0_0_0/0.04)]`。不准毛玻璃。
- **打孔線**：`border-dashed` 加左右半圓缺口（mask），表示可撕的票根。
- **印章**：結果一律用共用元件 `Stamp`（`registry/free/stamp`，block 內 `import { Stamp } from "@/components/ui/stamp"`，registry item 加 `"@sunui/stamp"`）。**不要自己手刻印章**。依「這是什麼結果」選形狀，不是每個結果都蓋同一個章：

  | 形狀 | 用在 | 例子 |
  |---|---|---|
  | `tick` | 小確認，不值得蓋章 | 已複製、已儲存、已驗證、已加入、已登記通知 |
  | `box` | 交易狀態 | 已領取、已套用、已售完、已結束、已達免運 |
  | `seal` | 中獎與成就 | 中獎、最高等級、集點完成、贈品解鎖 |
  | `date` | 有時間的紀錄，印上實際日期 | 已付款、郵戳、訂單節點、升級 |
  | `chop` | 個人或中日文情境的落款 | 受邀、會員名 |

  - 正面結果用朱紅（`tone="vermilion"`）；過期、售完、結束、未中獎用淡墨（`tone="ink"`），作廢加 `void`。
  - 一律傳 `seed`（訂單、券或步驟的 id）。角度、位移和墨色紋理由 seed 決定，同一頁的章不會長得一模一樣，重新渲染也不會跳。
  - 角度：`box`、`date` 在 -8° 至 -12°；`seal` 在 -6° 至 -16°；`chop` 幾乎是正的（-1° 至 -4°），落款章是直直按下去的。
  - 「推薦」「熱門」這類**不是結果的標籤不准用印章**，改用不旋轉的墨色小標籤。
  - 一個畫面同時最多一個朱紅印章；小確認一律用 `tick`，把章留給真正的結果。
- 圓角：紙品 `rounded-md`（6px）以下；介面按鈕跟隨主題。不用 `rounded-3xl` 大圓角。

## 3. 字體

- 數字一律 `tabular-nums`，價格與面額用緊字距 `tracking-tight`。
- 優惠碼、訂單編號用 `font-mono` 加 `tracking-[0.12em]`，像印出來的序號。
- 每個 block 最多一個小字大寫標籤（eyebrow）。
- 中文文案要能直接替換：不靠英文字寬撐版面，標點與中英混排要正常。

## 4. 動畫

只有三種彈簧，直接複製使用：

```ts
const springs = {
  // 按壓回饋、小元件位移
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  // 狀態切換、展開收合
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  // 蓋章、落下這類「有重量」的瞬間
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;
```

規則：

1. **只在回應使用者動作或資料狀態改變時動**。不做進場淡入上浮，不做常駐循環（倒數與載入中除外）。
2. **整套只有一種慶祝**：蓋印章（`Stamp`，形狀依第 2 節的表選）。不放煙火、粒子、彩帶。
3. 單次動畫 400ms 以內；`useReducedMotion()` 為真時改為立即切換，資訊不能遺失。
4. 動畫要模擬實體：撕票根是沿打孔線撕開、蓋章是先壓下再彈起，不做沒有物理意義的縮放閃爍。

常見動效名稱（Fade Up、Odometer、Headroom、Confetti…）各自的立場與替代做法見 `/docs/motion`，資料在 `content/motion-dictionary.ts`。彈簧與允許的動態已做成 `registry/lib/sunui-motion/motion.ts`（`/r/sunui-motion.json`），新 block 優先從這裡匯入，數值不要另抄一份。

## 5. 示範（demo.tsx）

- 預覽區只放元件本身，排成**真實商店會出現的樣子**（例如活動頁的領券區）。
- 不准在預覽裡放「模擬」「重設」「切換狀態」這類測試按鈕；重播交給網站工具列的 Replay。
- 要展示多種狀態時，直接並排放出不同狀態的實例。
- 文案用真實電商語氣，不編造品牌故事；商品圖用中性實物插圖或留白，不用卡通漸層。

## 6. 程式

- 單一檔案，目標 250 行以內；只暴露真正會調的 props。
- 只依賴 `framer-motion` 與 `cn`；圖示用 inline SVG，線寬 1.5，跟隨 `currentColor`。

## 檢查表

- [ ] 沒有漸層、光暈、模糊、彩色陰影、粒子
- [ ] 強調色只有朱紅一處主要用途，其餘是中性色與主題 primary
- [ ] 沒有進場動畫與常駐循環（倒數、載入除外）
- [ ] 結果用 `Stamp`，形狀符合第 2 節的表，有傳 seed；沒有手刻的印章，也沒有把標籤做成印章
- [ ] 數字 tabular-nums，代碼 font-mono
- [ ] Light 與 Dark 都截圖看過，375px 不破版
- [ ] reduced motion 下資訊完整
- [ ] 預覽區沒有測試按鈕
- [ ] 換成中文文案版面仍正常
