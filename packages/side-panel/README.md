# @sunui-design/side-panel

一個現代化的側邊面板 React 組件，提供流暢的動畫效果和豐富的自定義選項。

## 特點

- 🎯 支持左側和右側顯示
- 🎨 完全可自定義的樣式
- 🔄 流暢的過渡動畫
- 📱 響應式設計
- 🎮 可控制的開關按鈕
- 🔧 TypeScript 支持
- 🎁 零依賴（除了 React）

## 安裝

使用 npm：
```bash
npm install @sunui-design/side-panel
```

使用 yarn：
```bash
yarn add @sunui-design/side-panel
```

使用 pnpm：
```bash
pnpm add @sunui-design/side-panel
```

## 使用方法

```tsx
import { SidePanel } from '@sunui-design/side-panel';
import { useState } from 'react';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidePanel
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      title="側邊面板"
      position="left"
    >
      <div>您的內容在這裡</div>
    </SidePanel>
  );
}
```

## Props

| 屬性名 | 類型 | 默認值 | 描述 |
|--------|------|--------|------|
| isOpen | boolean | - | 控制面板是否打開 |
| onToggle | () => void | - | 切換面板狀態的回調函數 |
| title | string | - | 面板標題 |
| position | 'left' \| 'right' | 'left' | 面板顯示位置 |
| children | ReactNode | - | 面板內容 |
| className | string | '' | 自定義面板類名 |
| toggleButtonClassName | string | '' | 自定義切換按鈕類名 |
| closeButtonClassName | string | '' | 自定義關閉按鈕類名 |
| headerClassName | string | '' | 自定義標題欄類名 |
| contentClassName | string | '' | 自定義內容區類名 |
| showToggleButton | boolean | true | 是否顯示切換按鈕 |
| showCloseButton | boolean | true | 是否顯示關閉按鈕 |
| width | string | '270px' | 面板寬度 |

## 樣式自定義

組件使用 TailwindCSS 進行樣式設計，您可以通過以下方式自定義樣式：

1. 使用提供的 className props 覆蓋默認樣式
2. 在您的 CSS 中使用更高優先級的選擇器

例如：

```tsx
<SidePanel
  className="bg-gray-100"
  headerClassName="bg-primary-700 text-white"
  contentClassName="p-6"
  toggleButtonClassName="bg-secondary-500"
  closeButtonClassName="text-white"
  // ...其他 props
>
  {/* 您的內容 */}
</SidePanel>
```

## 許可證

Apache License 2.0 