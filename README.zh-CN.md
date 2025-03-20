<div align="center">
  <img src="/public/sunui-title-logo.png" alt="Sun UI Design" width="500" style="margin: 20px 0" />
  <p align="center">
    <b>一個具有優美動畫效果的現代化 React UI 組件庫</b>
    <br />
    <i>使用 React、TailwindCSS 和 TypeScript 構建</i>
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/@sunui-design/all">
      <img src="https://img.shields.io/npm/v/@sunui-design/all.svg?style=flat-square" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/@sunui-design/all">
      <img src="https://img.shields.io/npm/dm/@sunui-design/all.svg?style=flat-square" alt="npm downloads" />
    </a>
    <a href="https://github.com/yourusername/sun-ui-design/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square" alt="license" />
    </a>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
  </p>
  <p align="center">
    <a href="#features">特性</a> •
    <a href="#components">組件</a> •
    <a href="#installation">安裝</a> •
    <a href="#documentation">文檔</a>
  </p>
  <br />
</div>

# Sun UI Design

一個具有優美動畫效果和可自定義組件的現代化 React UI 組件庫。使用 React、TailwindCSS 和 TypeScript 構建，適用於任何 React 專案。

## 特性

- 🎨 現代化且優美的 UI 組件
- 📱 完全響應式設計
- 🌈 使用 TailwindCSS 構建
- 🎯 TypeScript 支援
- ⚡ 輕量級且高效能
- 🔧 易於自定義
- 📦 支援 Tree-shaking
- 🎁 提供單獨套件或全功能套件
- 🔌 適用於任何 React 專案（Next.js、Create React App、Vite 等）

## 組件

Sun UI Design 提供了一系列現代化且可自定義的組件。每個組件都可以作為獨立套件使用。

### 可用組件

- [Card](packages/card/README.md) - 簡潔優雅的卡片組件
- [FileUpload](packages/file-upload/README.md) - 支援拖放上傳的現代化檔案上傳組件
- [FilterGrid](packages/filter/README.md) - 用於顯示分類內容的網格組件
- [FloatingButton](packages/floating/README.md) - 具有可展開選項的浮動按鈕組件
- [GradientBackground](packages/gradient/README.md) - 動畫漸層背景組件
- [SidePanel](packages/side-panel/README.md) - 用於顯示側邊內容的面板組件
- [SocialButton](packages/social/README.md) - 社交媒體連結按鈕組件

## 安裝

### 全功能套件

```bash
npm install @sunui-design/all
# 或
yarn add @sunui-design/all
# 或
pnpm add @sunui-design/all
```

### 單獨套件

```bash
# 核心樣式和工具
npm install @sunui-design/core

# 單獨組件
npm install @sunui-design/card
npm install @sunui-design/file-upload
npm install @sunui-design/filter
npm install @sunui-design/floating
npm install @sunui-design/gradient
npm install @sunui-design/side-panel
npm install @sunui-design/social
```

## 開發環境設置

### 開發環境設置

1. 克隆專案：
```bash
git clone https://github.com/yourusername/sun-ui-design.git
cd sun-ui-design
```

2. 安裝所有依賴：
```bash
npm install
# 或
npx lerna bootstrap
```

3. 建立所有套件：
```bash
npm run build:packages
```

4. 啟動開發伺服器：
```bash
npm run dev
```

5. 啟動 Storybook：
```bash
npm run storybook
```

### 開發流程

1. 建立新套件：
```bash
cd packages
mkdir your-package-name
cd your-package-name
npm init
```

2. 開發套件：
```bash
npm run dev
```

3. 建立套件：
```bash
npm run build
```

4. 打包套件：
```bash
npm run pack
```

5. 發布套件：
```bash
npm run publish
```

### 常用指令

- `npm run dev` - 啟動開發伺服器
- `npm run build` - 建立專案
- `npm run build:packages` - 建立所有套件
- `npm run storybook` - 啟動 Storybook
- `npm run build-storybook` - 建立 Storybook
- `npm run pack:all` - 打包所有套件
- `npm run publish` - 發布套件
- `npm run clean` - 清理建置檔案
- `npm run lint` - 執行程式碼檢查

### 故障排除

如果遇到模組找不到的問題：

1. 清理並重新安裝依賴：
```bash
npm run clean
npm install
```

2. 重新建立套件：
```bash
npm run build:packages
```

3. 如果問題持續，檢查套件版本是否一致：
```bash
npm ls @sunui-design/core
npm ls @sunui-design/social
```

## 基本使用

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

每個組件都附帶完整的文檔，包括範例和屬性說明。要查看文檔，請查看各個套件的 README 或運行 Storybook 查看即時範例：

```bash
npm run storybook
# 或
yarn storybook
# 或
pnpm storybook
```

## 貢獻

歡迎提交 Issue 和 Pull Request！請在提交 PR 前閱讀我們的貢獻指南。

## 授權

根據 Apache License, Version 2.0（「授權」）授權；
除非符合授權，否則不得使用此檔案。
您可以在以下位置獲取授權副本：

    http://www.apache.org/licenses/LICENSE-2.0

除非適用法律要求或書面同意，否則根據授權分發的軟體是基於
「按原樣」提供的，不附帶任何明示或暗示的擔保或條件。
有關授權下的特定語言管理權限和限制，請參閱授權。 