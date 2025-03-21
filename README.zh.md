# Sun UI Design

[English](./README.md) | [繁體中文](./README.zh.md)

<div align="center">
  <img src="/public/sunui-title-logo.png" alt="Sun UI Design" width="500" style="margin: 20px 0" />
  <p align="center">
    <b>一個具有精美動畫效果的現代 React UI 組件庫</b>
    <br />
    <i>使用 React、TailwindCSS 和 TypeScript 構建</i>
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/@sunui-design/all">
      <img src="https://img.shields.io/npm/v/@sunui-design/all.svg?style=flat-square" alt="npm 版本" />
    </a>
    <a href="https://www.npmjs.com/package/@sunui-design/all">
      <img src="https://img.shields.io/npm/dm/@sunui-design/all.svg?style=flat-square" alt="npm 下載量" />
    </a>
    <a href="https://github.com/yourusername/sun-ui-design/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="授權" />
    </a>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="歡迎 PR" />
  </p>
  <p align="center">
    <a href="#特點">特點</a> •
    <a href="#組件">組件</a> •
    <a href="#安裝">安裝</a> •
    <a href="#文檔">文檔</a>
  </p>
  <br />
</div>

# Sun UI Design

一個具有精美動畫效果和可自定義組件的現代 React UI 組件庫。使用 React、TailwindCSS 和 TypeScript 構建，完美適配任何 React 項目。

## 特點

- 🎨 現代化且精美的 UI 組件
- 📱 完全響應式設計
- 🌈 基於 TailwindCSS 構建
- 🎯 TypeScript 支持
- ⚡ 輕量且高性能
- 🔧 易於自定義
- 📦 支持 Tree-shaking 導出
- 🎁 提供獨立包或整體打包
- 🔌 適用於任何 React 項目（Next.js、Create React App、Vite 等）

## 組件

Sun UI Design 提供了一系列現代化且可自定義的組件。每個組件都可以作為獨立包使用。

### 可用組件

- [Card](packages/card/README.md) - 簡潔優雅的卡片組件
- [FileUpload](packages/file-upload/README.md) - 支持拖放的現代文件上傳組件
- [FilterGrid](packages/filter/README.md) - 用於顯示分類內容的網格組件
- [FloatingButton](packages/floating/README.md) - 可展開選項的浮動按鈕組件
- [GradientBackground](packages/gradient/README.md) - 動畫漸變背景組件
- [SidePanel](packages/side-panel/README.md) - 側邊面板組件
- [SocialButton](packages/social/README.md) - 社交媒體按鈕組件

## 安裝

### 整體包安裝

```bash
npm install @sunui-design/all
# 或
yarn add @sunui-design/all
# 或
pnpm add @sunui-design/all
```

### 獨立包安裝

```bash
# 核心樣式和工具
npm install @sunui-design/core

# 獨立組件
npm install @sunui-design/card
npm install @sunui-design/file-upload
npm install @sunui-design/filter
npm install @sunui-design/floating
npm install @sunui-design/gradient
npm install @sunui-design/side-panel
npm install @sunui-design/social
```

## 開發設置

### 開發環境設置

1. 克隆項目：
```bash
git clone https://github.com/yourusername/sun-ui-design.git
cd sun-ui-design
```

2. 安裝依賴：
```bash
npm install
# 或
npx lerna bootstrap
```

3. 構建所有包：
```bash
npm run build:packages
```

4. 啟動開發服務器：
```bash
npm run dev
```

5. 啟動 Storybook：
```bash
npm run storybook
```

### 開發工作流程

1. 創建新包：
```bash
cd packages
mkdir your-package-name
cd your-package-name
npm init
```

2. 開發包：
```bash
npm run dev
```

3. 構建包：
```bash
npm run build
```

4. 打包：
```bash
npm run pack
```

5. 發布包：
```bash
npm run publish
```

### 常用命令

- `npm run dev` - 啟動開發服務器
- `npm run build` - 構建項目
- `npm run build:packages` - 構建所有包
- `npm run storybook` - 啟動 Storybook
- `npm run build-storybook` - 構建 Storybook
- `npm run pack:all` - 打包所有包
- `npm run publish` - 發布包
- `npm run clean` - 清理構建文件
- `npm run lint` - 運行代碼檢查

### 故障排除

如果遇到模塊未找到錯誤：

1. 清理並重新安裝依賴：
```bash
npm run clean
npm install
```

2. 重新構建包：
```bash
npm run build:packages
```

3. 如果問題持續，檢查包版本：
```bash
npm ls @sunui-design/core
npm ls @sunui-design/social
```

## 基本用法

```tsx
import '@sunui-design/core/styles/base.css';
import {
  Card,
  FileUpload,
  FilterGrid,
  FloatingButton,
  GradientBackground,
  SidePanel,
  SocialButton
} from '@sunui-design/all';

export default function App() {
  return (
    <div>
      <GradientBackground>
        <Card>
          <FilterGrid>
            {/* 您的內容 */}
          </FilterGrid>
        </Card>
        <FloatingButton />
        <SocialButton href="https://github.com" />
      </GradientBackground>
    </div>
  );
}
```

## 文檔

每個組件都附帶全面的文檔，包括示例和屬性說明。要查看文檔，請查看各個包的 README 或運行 Storybook 以查看實時示例：

```bash
npm run storybook
# 或
yarn storybook
# 或
pnpm storybook
```

## 貢獻

歡迎提交 Issue 和 Pull Request！提交 PR 前請閱讀我們的貢獻指南。

## 授權

MIT 授權

Copyright (c) 2024 Sun UI Design

特此免費授予任何獲得本軟件副本和相關文檔文件（下稱"軟件"）的人不受限制地處理本軟件的權利，
包括不受限制地使用、複製、修改、合併、發布、分發、再授權和/或出售本軟件副本，
以及再授權被配發了本軟件的人如上的權利，須在下列條件下：

上述版權聲明和本許可聲明應包含在本軟件的所有副本或實質成分中。

本軟件是"按原樣"提供的，不做任何明示或暗示的保證，包括但不限於對適銷性、特定用途適用性和非侵權性的保證。
在任何情況下，作者或版權持有人都不對任何索賠、損害或其他責任負責，無論這些追責來自合同、侵權或其它行為中，
還是產生於、源於或有關於本軟件以及本軟件的使用或其它處置。 