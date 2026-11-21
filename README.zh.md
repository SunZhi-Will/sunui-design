<div align="center">

# SunUI

**有質感的 React 動態區塊，一行指令安裝。**

[網站](https://sunui.synvize.com) · [瀏覽區塊](https://sunui.synvize.com/blocks) · [文件](https://sunui.synvize.com/docs/installation) · [Pro](https://sunui.synvize.com/pricing) · [English](README.md)

</div>

SunUI 是一個 [shadcn](https://ui.shadcn.com) registry，收錄精緻、帶動效的 React 與 Tailwind 區塊。不需要安裝套件：用 shadcn CLI 把原始碼複製進你的專案，之後就是你自己的程式碼，想怎麼改都可以。

- **質感優先。** 用彈簧取代線性淡入，每個可按的東西都有按下狀態，分層陰影，節制的用色。
- **吃你的主題。** 區塊使用 shadcn tokens（`bg-card`、`text-muted-foreground`、`bg-primary`），會自動套用你的顏色與深色模式。
- **免費區塊與動效庫。** 超過 100 個 MIT 授權項目：商品頁元件、回饋、導覽、背景、文字、圖表、捲動與 SVG 效果。
- **Pro 場景。** 已經組好的整個畫面（主視覺、結帳、購物車、檔期活動頁），用授權碼以同樣方式安裝。
- **給 AI agent 用。** 提供 MCP server、`llms.txt` 與 SunUI skill，讓寫程式的 agent 能搜尋型錄並擬好安裝計畫。

## 安裝區塊

先在專案裡初始化 shadcn（只需一次）：

```bash
npx shadcn@latest init
```

再用網址加入任一區塊：

```bash
npx shadcn@latest add https://sunui.synvize.com/r/countdown-banner.json
```

或在 `components.json` 註冊 SunUI 命名空間：

```json
{
  "registries": {
    "@sunui": "https://sunui.synvize.com/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @sunui/countdown-banner
```

網站上每個區塊頁都有即時示範、props 說明與完整指令。

## 搭配 AI agent

| 端點 | 用途 |
|---|---|
| `https://sunui.synvize.com/mcp` | MCP server（Streamable HTTP，唯讀）：搜尋區塊、讀取使用說明、取得安裝指令 |
| `https://sunui.synvize.com/llms.txt` | 型錄的精簡純文字索引 |
| `https://sunui.synvize.com/llms-full.txt` | 完整型錄與設計規則 |

Claude Code、Cursor 等工具的設定方式：[AI agents 文件](https://sunui.synvize.com/docs/ai-agents)。

## Pro

Pro 場景由 `@sunui-pro` 提供，需要授權碼。請見[定價](https://sunui.synvize.com/pricing)與 [Pro 文件](https://sunui.synvize.com/docs/pro)。

## Repo 結構

| 路徑 | 內容 |
|---|---|
| `apps/web` | 網站與 registry 端點（Next.js） |
| `apps/web/registry/free` | 免費區塊原始碼 |
| `packages/*` | 舊版 npm 套件，已停止開發（見下方） |

本機執行網站：

```bash
npm install
npm run web:dev   # http://localhost:3100
```

新增或修改區塊的步驟：[`apps/web/README.md`](apps/web/README.md)。

## 舊版 npm 套件

SunUI 早期以 npm 套件發佈（`@sunui-design/react` 與 8 個元件套件，最後版本 0.0.55）。這些套件已停止開發，也不符合現在的設計。每一個在 registry 都有接班人：

| 舊套件 | 改用 |
|---|---|
| `@sunui-design/card` | `card-effects`、`skeleton-set` |
| `@sunui-design/countdown-banner` | `countdown-banner` |
| `@sunui-design/side-panel` | `side-panel` |
| `@sunui-design/floating` | `morph-menu`（放射狀排法） |
| `@sunui-design/social` | `social-links` |
| `@sunui-design/gradient` | `gradient-backdrop` |
| `@sunui-design/file-upload` | `file-dropzone`（Pro） |
| `@sunui-design/filter` | 沒有直接對應 |

原始碼保留在 `packages/`，供現有使用者參考。

## 授權

免費區塊與本 repo 採 [MIT](LICENSE) 授權。Pro 場景適用 SunUI Pro 授權條款。
