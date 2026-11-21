# shadcn 綁定與非 shadcn 用戶：深度分析與最佳方案

日期：2026-11-22。使用者的兩個疑慮：

1. 會不會被 shadcn 綁死？
2. 用戶如果不想裝 shadcn、用的是其他東西，怎麼辦？

這份查了網路資料、量了程式碼、做了兩個實測，最後給一個方案。

## 1. 結論

**最佳方案：shadcn 繼續當主要安裝通路，但把「不用 shadcn 也能完整使用」這條路補齊，並把「薄耦合」寫成規則。** 不換 CLI，不做 npm 套件，也不做純 CSS 版本。

要做的只有三件小事（第 6 節），其中最重要的是一份 79 行的 `sunui-theme.css`。實測證實：沒有它，不用 shadcn 的 Tailwind 專案裝了 SunUI 會**完全沒有底色與文字色**；有它就正常。

## 2. 疑慮一：會不會被綁死？

**不會。** 綁死的意思是「離不開」，SunUI 隨時離得開：

| 層 | 誰控制 | shadcn 消失或改規則時 |
|---|---|---|
| 元件原始碼 | 我們 | 不受影響。只依賴 React、Tailwind、framer-motion（101 個免費區塊，0 個用到 shadcn 元件、Radix 或 Base UI） |
| 安裝資料 `/r/*.json` | 我們（自己的網站） | 不受影響，網址、內容都在我們手上 |
| Pro 授權驗證 | 我們（自己的伺服器） | 不受影響 |
| 安裝工具 `npx shadcn add` | shadcn | 要換工具。備案見第 5 節，約 150 行就能做一個讀同一份資料的 `npx sunui add` |
| 官方名單 | shadcn | 失去一個曝光位置，其他照常 |

值得注意的趨勢：**shadcn 自己的耦合在加深**。2026-05 起 `init` 會在使用者的 CSS 加 `@import "shadcn/tailwind.css"`（後來補了 `eject` 讓人拿掉）；2026-09 起元件改從 `cn` 套件匯入，不再用 `lib/utils.ts`。SunUI 不需要跟進：舊的 `@/lib/utils` 仍然有效，官方保證「Nothing breaks」。**我們跟得越少，被綁得越少。**

## 3. 疑慮二：不用 shadcn 的用戶

先把人分清楚：

| 用戶 | 佔比參考 | 能不能用 SunUI | 卡在哪 |
|---|---|---|---|
| 用 shadcn | State of React 2025：shadcn/ui 使用率兩年內從 20% 升到約 56%，成長最快 | 能 | 無 |
| 用 React + Tailwind，但不用 shadcn | 不少，常見於自己刻 UI 或用 Headless UI 的團隊 | **能，但目前會壞** | 缺顏色變數（見第 4 節） |
| 用 React + MUI、Chakra、Ant Design，不用 Tailwind | 大群，MUI 仍是最多人用的 React UI 庫之一 | 不能 | 卡在 Tailwind，不是 shadcn |
| 用 Vue、Svelte、Angular | 大群 | 不能 | 卡在 React，不是 shadcn |

**關鍵：會因為 shadcn 而流失的，只有第二種人。** 第三、四種人卡的是 React 與 Tailwind，換掉 shadcn 也救不回來。

第二種人為什麼不想跑 `shadcn init`：它會改寫專案的 `globals.css`（加入一整套顏色變數與 `shadcn/tailwind.css`），有些情況還會覆蓋設定，教學文章普遍建議「先備份再跑」。對已經有自己設計系統的專案，這是合理的顧慮。

## 4. 實測

### 4.1 不用 shadcn，直接複製 SunUI 元件

在乾淨的 Tailwind v4 專案放入 `countdown-banner.tsx`，用 Tailwind 官方 CLI 編譯：

| class | 產生的規則數 |
|---|---:|
| `bg-card` | 0 |
| `text-muted-foreground` | 0 |
| `bg-muted` | 0 |
| `text-foreground` | 0 |
| `border-foreground` | 0 |

**全部沒有產生**，因為這些顏色名稱要在 `@theme` 裡定義才存在。元件會變成透明底、沒有文字色。網站上的「手動安裝」說明目前只寫了裝 `framer-motion clsx tailwind-merge` 與 `cn`，沒提到這件事，照著做的人會得到壞掉的元件。

### 4.2 加上 `sunui-theme.css` 之後

同一個專案多 import 一份 79 行的 CSS（淺色、深色兩組變數，加上 `@theme inline` 對照），再編譯一次：上面五個 class 全部正常產生（例如 `.bg-card { background-color: var(--card) }`）。

### 4.3 SunUI 實際用到哪些顏色

量了 114 個免費區塊的 127 個檔案：用到的就是 shadcn 標準那一組（`background`、`foreground`、`card`、`muted`、`primary`、`border`、`ring`、`destructive`，少量 `secondary`、`accent`、`input`、`popover`、`chart-1` 到 `chart-5`、`radius`），加上 SunUI 自己的 `--sunui-spot`（41 個檔案，有回退到 `--primary`）。所以一份標準變數表就涵蓋全部。

## 5. 比較過的其他做法

| 做法 | 參考案例 | 判斷 |
|---|---|---|
| **每個元件做 Tailwind 與純 CSS 兩版**（再乘 JS、TS 變成四版） | React Bits（JS-CSS、JS-TW、TS-CSS、TS-TW） | 不做。SunUI 有 209 個區塊，維護量翻倍到四倍；而且純 CSS 版救的是「不用 Tailwind」的人，那群人也多半不用 React 動效庫 |
| **改用 jsrepo 當安裝工具** | React Bits 同時支援 shadcn 與 jsrepo | 不做。jsrepo 用自己的格式，文件明寫不支援跨 registry 的依賴，而 SunUI 的 Pro 場景依賴免費元件。能做的事比 shadcn 少 |
| **改回 npm 套件** | 舊 SunUI `@sunui-design/react` | 不做。客製只能靠 props、主題對不上，已經走過一次 |
| **現在就做自己的 `npx sunui add`** | 無 | 現在不做，列為備案。shadcn 仍是生態標準，自己做只會讓 AI 工具不認得。等 shadcn 真的改到我們不能接受時，再用約 150 行做一個讀同一份 `/r/*.json` 的小工具 |
| **完整的「不用 shadcn」手動安裝** | Aceternity UI（「Or add the utilities without shadcn」）、Magic UI（手動安裝頁列出需要的 CSS 變數） | **採用**，這就是第 6 節 |

## 6. 最佳方案

| # | 做什麼 | 解決哪個疑慮 | 工作量 |
|---|---|---|---|
| 1 | **提供 `sunui-theme.css`**：放在網站上可直接下載，安裝文件的「手動安裝」改成三步：裝套件、加 `cn`、貼這份 CSS，然後複製元件。區塊頁的手動安裝段落也提示一次。四種語言都改 | 疑慮二 | 小，CSS 已經寫好並測過（附錄） |
| 2 | **把薄耦合寫進 AGENTS.md 與 DESIGN.md**：區塊不依賴 shadcn 元件、Radix、Base UI、`shadcn/tailwind.css`；`cn` 繼續從 `@/lib/utils` 匯入；registry 依賴只能是 `utils` 與 SunUI 自己的項目 | 疑慮一 | 很小 |
| 3 | **寫好退場備案，但不實作**：記錄「若 shadcn 改協定，用讀 `/r/*.json` 的 `npx sunui add` 取代」的設計與觸發條件 | 疑慮一 | 很小 |
| 4 | 上 shadcn 官方名單照原計畫進行（網域已定） | 讓用 shadcn 的人更好裝 | 已準備好 |

**注意事項**：`sunui-theme.css` 會在 `:root` 定義 `--primary`、`--border` 這類常見名稱。只給沒用 shadcn 的專案用，已經跑過 `shadcn init` 的人不要再貼；文件裡要寫清楚，也提醒使用者檢查是否和自己的變數撞名。

## 附錄：`sunui-theme.css`（已實測）

數值採用 shadcn 預設的中性色（MIT），所以裝了 SunUI 的專案日後改用 shadcn 也不會衝突。

```css
/* SunUI theme variables for projects without shadcn/ui. Skip this file if you already ran `npx shadcn init`. */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  /* your brand colour for selected states, progress and results; falls back to --primary */
  /* --sunui-spot: oklch(0.55 0.2 260); --sunui-spot-foreground: oklch(0.985 0 0); */
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}
@custom-variant dark (&:is(.dark *));
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
}
```

## 來源

- shadcn 官方：[MCP](https://ui.shadcn.com/docs/mcp)、[CLI](https://ui.shadcn.com/docs/cli)、[命名空間](https://ui.shadcn.com/docs/registry/namespace)、[2026-05 shadcn eject](https://ui.shadcn.com/docs/changelog/2026-05-shadcn-eject)、[2026-09 cn](https://ui.shadcn.com/docs/changelog/2026-09-cn)
- React Bits 四種版本與 jsrepo：[reactbits.dev llms.txt](https://reactbits.dev/llms.txt)、[React Bits Pro 安裝](https://pro.reactbits.dev/docs/installation)
- jsrepo：[文件](https://jsrepo.dev/docs)、[http provider](https://jsrepo.dev/docs/providers/http)
- 不用 shadcn 的手動安裝：[Aceternity UI 安裝](https://ui.aceternity.com/installation)、[Magic UI 手動安裝](https://v3.magicui.design/docs/installation/manual)
- `shadcn init` 改寫 CSS 的經驗：[shadcn/studio：加到既有專案](https://shadcnstudio.com/blog/how-to-add-shadcn-to-an-existing-project/)、[shadcn 疑難排解](https://eastondev.com/blog/en/posts/dev/20260402-shadcn-ui-troubleshooting/)
- 使用率：[iThome：State of React 2025](https://www.ithome.com.tw/news/174034)、[Telerik：2026 React UI 庫](https://www.telerik.com/blogs/top-10-best-react-ui-libraries-2026-ai-dx-edition)
