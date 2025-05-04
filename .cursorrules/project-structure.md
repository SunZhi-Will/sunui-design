# SunUI Design 專案架構與設計

## 專案概述

SunUI Design 是一個基於 React 的 UI 組件庫，採用 monorepo 架構使用 Lerna 進行管理。專案使用 TypeScript 編寫，使用 TailwindCSS 進行樣式設計，並通過 Next.js 搭建文檔和展示站點。

本組件庫旨在提供現代、可訪問且易於使用的 UI 組件，適用於各種 React 應用，從企業管理系統到電子商務平台。

## 技術棧

- **核心框架**：React 19
  - 基於函數式組件和 React Hooks
  - 利用 React Context 進行跨組件狀態管理
  - 支持 React Server Components 和 Suspense
  
- **類型系統**：TypeScript 5.2+
  - 嚴格模式（strict mode）開啟
  - 完整的類型定義和導出
  - 使用泛型提高組件靈活性

- **樣式解決方案**：TailwindCSS 3.4+
  - 原子化 CSS 設計
  - Just-in-Time 引擎
  - 結合 CSS 變量實現主題化

- **文件展示**：Next.js 15
  - App Router 架構
  - 靜態和伺服器端渲染
  - 自動路由生成

- **Monorepo 管理**：Lerna 8
  - 統一版本管理
  - 多包構建和發布
  - 包依賴關係處理

- **動畫庫**：Framer Motion 12+
  - 聲明式動畫 API
  - 手勢識別和交互
  - 高性能動畫效果

- **測試工具**：
  - Jest：單元測試框架
  - React Testing Library：組件測試
  - Axe：可訪問性測試
  - Storybook 測試：視覺回歸測試

- **文檔工具**：Storybook 8
  - 組件開發和文檔一體化
  - 自動生成 API 文檔
  - 交互式實例和代碼示例

## 系統架構圖

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Storybook (開發)   |     |  Next.js (文檔站點) |
|                     |     |                     |
+---------+-----------+     +---------+-----------+
          |                           |
          |                           |
+---------v---------------------------v-----------+
|                                                 |
|              @sunui-design/all                  |
|      (整合所有組件的統一導出包)                  |
|                                                 |
+-+-------------+-------------+-------------+-----+
  |             |             |             |
  |             |             |             |
+-v-----+   +---v---+   +-----v----+   +----v----+
|       |   |       |   |          |   |         |
| Card  |   | Core  |   | SidePanel|   |  其他組件  |
|       |   |       |   |          |   |         |
+-------+   +-------+   +----------+   +---------+
```

## 目錄結構

```
sunui-design/
│
├── .storybook/       # Storybook 配置
│   ├── main.js       # 主配置文件
│   ├── preview.js    # 預覽配置
│   └── theme.js      # 主題定義
│
├── packages/         # 組件包集合
│   ├── all/          # 整合所有組件的包
│   ├── card/         # 卡片組件
│   ├── core/         # 核心工具和基礎組件
│   │   ├── src/
│   │   │   ├── hooks/         # 通用 hooks
│   │   │   ├── utils/         # 工具函數
│   │   │   ├── constants/     # 常量定義
│   │   │   └── styles/        # 共享樣式
│   │   └── package.json
│   ├── file-upload/  # 文件上傳組件
│   ├── filter-grid/  # 篩選網格組件
│   ├── floating-button/ # 浮動按鈕組件
│   ├── gradient-background/ # 漸層背景組件
│   ├── side-panel/   # 側邊面板組件
│   └── social-button/ # 社交按鈕組件
│
├── public/           # 靜態資源文件
│   ├── images/       # 圖片資源
│   ├── fonts/        # 字體文件
│   └── favicon.ico   # 網站圖標
│
├── scripts/          # 構建和發布腳本
│   ├── build.js      # 構建腳本
│   ├── publish.js    # 發布腳本
│   ├── changelog.js  # 更新日誌生成腳本
│   └── create-package.js # 創建新包腳本
│
├── src/              # 源代碼目錄（文檔網站）
│   ├── app/          # Next.js App Router
│   ├── stories/      # Storybook 故事文件
│   └── styles/       # 全局樣式
│
├── .github/          # GitHub 配置和工作流
│   ├── workflows/    # GitHub Actions 定義
│   └── ISSUE_TEMPLATE/ # Issue 模板
│
├── lerna.json        # Lerna 配置
├── tsconfig.json     # TypeScript 配置
├── package.json      # 項目依賴和腳本
├── jest.config.cjs   # Jest 測試配置
├── eslint.config.mjs # ESLint 配置
└── tailwind.config.ts # TailwindCSS 配置
```

## 技術依賴關係

- **組件庫**
  - 核心庫
    - React + ReactDOM
    - TypeScript
    - TailwindCSS
    - Framer Motion
  - 測試
    - Jest
    - React Testing Library
    - @testing-library/user-event
    - jest-axe
  - 構建工具
    - TypeScript
    - ESBuild
    - Rollup

- **文檔網站**
  - Next.js
  - React
  - TypeScript
  - TailwindCSS

- **開發工具**
  - Storybook
  - ESLint
  - Prettier
  - Husky (Git Hooks)
  - lint-staged

## 組件設計原則

1. **模塊化**：每個組件都是獨立的包，可以單獨安裝和使用
   - 遵循 npm 包發布標準
   - 提供 ESM 和 CommonJS 兩種模塊格式
   - 支持 tree-shaking

2. **可配置性**：組件提供多種變體、尺寸和主題選項
   - 通過 props 控制外觀和行為
   - 默認值合理且實用
   - 支持主題變體和樣式覆蓋

3. **無障礙**：遵循 WCAG 2.1 AA 級標準
   - 支持鍵盤操作
   - 適當的 ARIA 屬性
   - 足夠的色彩對比度
   - 支持讀屏軟件

4. **響應式**：組件自適應不同屏幕尺寸
   - 移動優先設計
   - 流體佈局
   - 適當的斷點設計

5. **高性能**：最小化渲染次數，優化動畫效果
   - 使用 React.memo 和 useMemo 減少重渲染
   - 使用 CSS 處理簡單動畫
   - 使用 Framer Motion 處理複雜動畫
   - 懶加載和代碼分割

6. **類型安全**：完整的 TypeScript 類型定義
   - 準確的 Props 類型定義
   - 導出所有必要的類型定義
   - 完善的泛型支持

## 組件模式

每個組件包通常包含以下文件結構：

```
組件包/
├── src/
│   ├── 組件名.tsx      # 主要組件定義
│   ├── subcomponents/  # 子組件目錄
│   ├── hooks/          # 組件特定的 hooks
│   ├── utils.ts        # 工具函數
│   ├── types.ts        # 類型定義
│   └── index.ts        # 導出文件
│
├── __tests__/          # 測試文件
│   ├── 組件名.test.tsx  # 單元測試
│   └── integration.test.tsx # 集成測試
│
├── stories/            # Storybook 故事
│   └── 組件名.stories.tsx
│
├── package.json        # 包配置
├── tsconfig.json       # TypeScript 配置
├── README.md           # 文檔
└── CHANGELOG.md        # 變更日誌
```

### 組件實現範例

以卡片組件為例，組件設計遵循以下模式：

1. **Props 接口**：明確定義組件的所有屬性和事件
   ```typescript
   export interface CardProps {
     variant?: 'outlined' | 'filled' | 'elevated';
     size?: 'sm' | 'md' | 'lg';
     // 其他屬性...
   }
   ```

2. **變體設計**：支持多種外觀變體（如輪廓、填充、陰影等）
   ```typescript
   const variantStyles = {
     outlined: 'border border-gray-200 bg-white',
     filled: 'bg-gray-50 border-transparent',
     elevated: 'shadow-md border-transparent bg-white',
   };
   ```

3. **主題系統**：可配置不同顏色主題
   ```typescript
   const themeColors = {
     violet: { /* 顏色定義 */ },
     cyan: { /* 顏色定義 */ },
     // 其他主題...
   };
   ```

4. **子組件**：提供子組件（如頭部、內容、頁腳）以增強組合性
   ```jsx
   <Card>
     <CardHeader>標題</CardHeader>
     <CardContent>內容</CardContent>
     <CardFooter>頁腳</CardFooter>
   </Card>
   ```

5. **加載狀態**：支持加載動畫和骨架屏
6. **動畫效果**：使用 Framer Motion 實現流暢的交互動畫
7. **可訪問性**：支持鍵盤導航和屏幕閱讀器

## 構建與發布流程

1. **開發**：使用 Storybook 進行組件開發和測試
   - 運行 `npm run storybook`
   - 在隔離環境中開發和測試組件
   - 使用 Storybook Controls 測試不同 props 組合

2. **測試**：使用 Jest 和 React Testing Library 進行單元測試
   - 運行 `npm test`
   - 確保所有測試通過
   - 維持測試覆蓋率在 80% 以上

3. **構建**：使用 Lerna 構建所有包
   - 運行 `npm run build:packages`
   - 生成 ESM 和 CommonJS 格式的輸出
   - 包含類型定義文件

4. **發布**：通過 npm 或 yarn 發布到 npm 註冊表
   - 運行 `npm run publish`
   - 更新版本號
   - 生成更新日誌
   - 發布到 npm

5. **文檔**：自動生成文檔並部署到 Vercel
   - 基於 Storybook 自動生成 API 文檔
   - 通過 GitHub Actions 部署到 Vercel
   - 維護組件示例和用法指南

## 主題定制

系統使用 TailwindCSS 進行樣式設計，可以通過以下方式進行主題定制：

1. **顏色系統**：定義主色、輔助色和語義色
   - 在 `tailwind.config.ts` 中定義顏色系統
   - 使用 CSS 變量實現動態切換
   - 提供預設的主題變體

2. **間距系統**：一致的間距比例
   - 基於 4px 的間距比例設計
   - 從 0.25rem (4px) 到 24rem (384px) 的標準間距

3. **陰影系統**：多層次的陰影效果
   - 從輕微陰影到強烈陰影的多級陰影系統
   - 結合 Z 軸高度感呈現層次感

4. **圓角系統**：統一的圓角半徑
   - 從輕微圓角到完全圓形的多級圓角
   - 保持一致的設計語言

5. **排版系統**：字體、字重和行高
   - 定義標準字體系列
   - 從輕量到粗體的字重級別
   - 精確的行高比例

## 性能考量

1. **打包優化**
   - Tree-shaking 支持
   - 代碼分割
   - 外部依賴處理

2. **渲染優化**
   - 記憶化組件 (React.memo)
   - 緩存計算結果 (useMemo)
   - 穩定回調函數 (useCallback)

3. **CSS 優化**
   - 使用 TailwindCSS JIT 減少生成的 CSS 體積
   - 避免不必要的嵌套選擇器
   - 使用 CSS 變量減少重複

## 開發指南

1. **安裝依賴**：`npm install`
2. **啟動 Storybook**：`npm run storybook`
3. **構建組件**：`npm run build:packages`
4. **運行測試**：`npm test`
5. **發布包**：`npm run pack`

## 安全與質量保證

1. **Snyk 集成**：檢測和修復依賴漏洞
   - 在 CI 流程中自動檢測
   - 定期更新依賴版本

2. **ESLint 規則**：代碼質量和一致性檢查
   - 使用嚴格的 TypeScript ESLint 規則
   - 強制執行代碼風格一致性

3. **Jest 測試**：單元測試和集成測試
   - 確保組件行為符合預期
   - 測試邊界情況和特殊場景

4. **TypeScript 嚴格模式**：類型安全檢查
   - 啟用所有嚴格檢查選項
   - 減少運行時類型錯誤

5. **預提交檢查**
   - 使用 Husky 自動運行 lint 和測試
   - 防止不符合標準的代碼提交

## 兼容性考量

1. **瀏覽器支持**
   - 支持現代瀏覽器（Chrome、Firefox、Safari、Edge）
   - 不支持 IE 11
   - 使用 autoprefixer 處理瀏覽器前綴

2. **React 版本**
   - 支持 React 18+ 和 React 19
   - 利用 React 的新特性

3. **接入成本**
   - 提供快速入門指南
   - 與常見 React 框架（Next.js、Gatsby、Create React App）的集成指南
   - 提供遷移指南，協助從其他 UI 庫遷移 