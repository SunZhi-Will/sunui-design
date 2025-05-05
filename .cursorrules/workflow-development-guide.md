# SunUI Design 工作流程與開發指南

## 開發環境設置

### 系統需求

- Node.js v18+
- npm v8+ 或 yarn v1.22+
- Git

### 初始設置

1. 克隆代碼庫
```bash
git clone https://github.com/your-org/sunui-design.git
cd sunui-design
```

2. 安裝依賴
```bash
npm install
```

3. 啟動開發環境
```bash
# 啟動 Storybook 開發環境
npm run storybook

# 啟動 Next.js 文檔網站
npm run dev
```

## 專案結構與工作流程

### Monorepo 結構

SunUI Design 採用 Lerna 管理的 monorepo 結構，所有組件包位於 `packages/` 目錄下：

```
packages/
├── all/          # 匯總所有組件的整合包
├── card/         # 卡片組件
├── core/         # 核心工具和配置
└── ... 其他組件包
```

### 工作流程

1. **功能規劃**：在 GitHub Issues 中創建並討論新功能
2. **分支管理**：
   - `main`: 穩定發布分支
   - `dev`: 開發分支
   - `feature/*`: 功能分支
   - `bugfix/*`: 錯誤修復分支

3. **開發流程**：
   - 從 `dev` 分支創建功能分支
   - 在功能分支中開發和測試
   - 提交 Pull Request 到 `dev` 分支
   - 代碼審核和測試
   - 合併到 `dev` 分支

4. **發布流程**：
   - 從 `dev` 分支合併到 `main`
   - 使用 Lerna 更新版本號和 changesets
   - 構建和發布到 npm

## 開發新組件

### 組件開發步驟

1. **創建新組件包**

```bash
# 創建新組件包模板
npm run create-package ComponentName
```

2. **定義組件 API**
   - 明確定義 Props 接口
   - 使用 TypeScript 類型
   - 遵循現有風格和命名慣例

3. **開發組件**
   - 遵循可訪問性標準
   - 實現響應式設計
   - 支持主題定制
   - 添加必要的動畫效果

4. **編寫測試**
   - 單元測試：基本功能和邊界情況
   - 集成測試：與其他組件的交互
   - 可訪問性測試：確保符合 WCAG 標準

5. **編寫文檔**
   - 用法示例
   - Props 說明
   - 變體和主題選項
   - 最佳實踐和限制

### 組件架構約定

1. **文件組織**

```
packages/component-name/
├── src/
│   ├── ComponentName.tsx    # 主組件
│   ├── subcomponents/       # 子組件
│   ├── utils.ts             # 工具函數
│   └── index.ts             # 公共 API 導出
├── __tests__/
│   └── ComponentName.test.tsx
├── tsconfig.json
└── package.json
```

2. **代碼風格**
   - 使用函數式組件
   - 使用 React Hooks 管理狀態
   - 使用 TailwindCSS 實現樣式
   - 使用 Framer Motion 實現動畫

3. **命名約定**
   - 組件使用 PascalCase
   - 函數和變量使用 camelCase
   - 常量使用 UPPER_SNAKE_CASE
   - 文件名與導出的主要組件名稱一致

## 測試實踐

### 測試類型

1. **單元測試**
   - 使用 Jest 和 React Testing Library
   - 測試組件渲染和基礎功能
   - 測試不同 props 組合的行為

2. **整合測試**
   - 測試組件與其子組件的交互
   - 測試組件與上下文的交互

3. **可訪問性測試**
   - 使用 jest-axe 測試 WCAG 合規性
   - 測試鍵盤導航和屏幕閱讀器支持

### 測試示例

```typescript
// 基本渲染測試
test('renders card component with title', () => {
  render(<Card><CardHeader>Title</CardHeader></Card>);
  const titleElement = screen.getByText(/title/i);
  expect(titleElement).toBeInTheDocument();
});

// 交互測試
test('calls onClick when button is clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText(/click me/i));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

// 可訪問性測試
test('has no accessibility violations', async () => {
  const { container } = render(<Card>Content</Card>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Storybook 使用指南

### 創建 Story 文件

每個組件都應該有對應的 Storybook story：

```typescript
// Card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  args: {
    children: <CardContent>Basic Card</CardContent>,
    theme: 'violet',
  },
};

export const WithHeader: Story = {
  args: {
    children: (
      <>
        <CardHeader>Card Title</CardHeader>
        <CardContent>Card with header</CardContent>
      </>
    ),
    theme: 'cyan',
  },
};

// 其他變體...
```

### 使用 Controls

使用 Storybook 的 Controls 功能展示組件的不同屬性：

```typescript
export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select', options: ['solid', 'outline', 'ghost'] },
      defaultValue: 'solid',
    },
    size: {
      control: { type: 'radio', options: ['sm', 'md', 'lg'] },
      defaultValue: 'md',
    },
    // 其他可控屬性...
  },
} as Meta;
```

## 發布流程

### 版本管理

使用 Lerna 進行版本管理：

```bash
# 更新版本號
npm run version

# 構建所有包
npm run build:packages

# 發布到 npm
npm run publish
```

### 更新日誌

更新日誌自動生成：

```bash
# 生成更新日誌
npm run changelog
```

### 持續集成

項目使用 GitHub Actions 進行持續集成：

- 代碼格式檢查
- 單元測試
- 構建測試
- 自動發布 Storybook 到 Chromatic
- 自動發布文檔到 Vercel

## 代碼審核準則

### 審核清單

- 代碼是否遵循風格指南？
- 是否有完整的類型定義？
- 是否有足夠的測試覆蓋率？
- 是否遵循可訪問性標準？
- 是否有良好的性能表現？
- 是否有清晰的文檔？
- 是否考慮了不同設備和瀏覽器的兼容性？

### Pull Request 模板

```markdown
## 描述

[描述這個 PR 做了什麼]

## 更改類型

- [ ] 錯誤修復
- [ ] 新功能
- [ ] 重構
- [ ] 文檔更新
- [ ] 樣式更新
- [ ] 其他: [描述]

## 測試

- [ ] 添加了單元測試
- [ ] 添加了 Storybook 示例
- [ ] 手動測試通過

## 截圖

[如適用，添加截圖]

## 備註

[任何其他信息]
```

## 性能優化指南

### 組件優化

1. **使用記憶化技術**
   - 使用 React.memo 避免不必要的重渲染
   - 使用 useMemo 緩存計算結果
   - 使用 useCallback 穩定事件處理器

2. **批量更新**
   - 使用 useState 函數更新器
   - 使用 useReducer 管理複雜狀態

3. **懶加載**
   - 使用 React.lazy 和 Suspense 延遲加載組件
   - 使用 import() 動態導入大型模塊

### 渲染優化

1. **避免不必要的渲染**
   - 使用條件渲染限制子樹大小
   - 將狀態下移到需要的組件

2. **虛擬列表**
   - 對長列表使用虛擬滾動
   - 僅渲染可見部分的內容

### 動畫優化

1. **使用硬件加速屬性**
   - 優先使用 transform 和 opacity
   - 避免觸發佈局重新計算

2. **防止動畫阻塞**
   - 使用 requestAnimationFrame
   - 使用 Web Workers 進行複雜計算

## 可訪問性指南

### 基本原則

1. **語義化 HTML**
   - 使用適當的 HTML 元素
   - 正確使用標題層級
   - 使用有意義的元素標籤

2. **鍵盤可訪問性**
   - 所有交互元素可通過鍵盤訪問
   - 使用正確的鍵盤事件處理
   - 提供可見的焦點指示器

3. **色彩對比**
   - 確保文本與背景有足夠對比度
   - 不僅依賴顏色傳達信息
   - 提供高對比度模式

4. **ARIA 屬性**
   - 正確使用 aria-* 屬性
   - 提供適當的角色和狀態
   - 動態更新 ARIA 屬性

### 測試可訪問性

- 使用 axe-core 檢測常見問題
- 使用屏幕閱讀器測試
- 使用鍵盤測試交互
- 檢查色彩對比度

## 問題解決與支持

- GitHub Issues: 報告錯誤和請求功能
- Slack 頻道: 討論和實時幫助
- 文檔網站: 參考和指南
- 社區論壇: 用戶交流與支持 