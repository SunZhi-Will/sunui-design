# SidePanel 側邊面板組件設計文檔

## 組件概述

側邊面板是一個彈出式容器，通常用於顯示輔助信息、導航選項或操作控制。可以從側邊滑入視圖，具有豐富的配置選項和動畫效果。

## 設計目標

- 提供流暢的側邊入場和退出動畫
- 支持多種面板位置和尺寸
- 實現無障礙設計和鍵盤可訪問性
- 提供豐富的自定義選項
- 確保移動設備和桌面設備的兼容性

## 組件結構

### 主要組件

- `SidePanel`: 主側邊面板容器
- `SidePanelHeader`: 面板頭部區域
- `SidePanelContent`: 面板內容區域
- `SidePanelFooter`: 面板底部區域
- `SidePanelContext`: React Context 提供器

### 組件關係

```
SidePanelProvider
└── SidePanel
    ├── SidePanelHeader
    ├── SidePanelContent
    └── SidePanelFooter
```

## 組件 API

### SidePanel 組件

```typescript
export interface SidePanelProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    position?: 'left' | 'right' | 'top' | 'bottom';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    overlay?: boolean;
    overlayBlur?: boolean;
    closeOnEsc?: boolean;
    closeOnOverlayClick?: boolean;
    className?: string;
    style?: React.CSSProperties;
    animationDuration?: number;
    zIndex?: number;
}
```

#### 屬性說明

- `isOpen`: 控制面板是否顯示
- `onClose`: 關閉面板時的回調函數
- `position`: 面板顯示位置
  - `left`: 從左側滑入（默認）
  - `right`: 從右側滑入
  - `top`: 從頂部滑入
  - `bottom`: 從底部滑入
- `size`: 面板尺寸
  - `sm`: 小尺寸 (25%)
  - `md`: 中等尺寸 (35%)
  - `lg`: 大尺寸 (50%)
  - `xl`: 特大尺寸 (75%)
  - `full`: 全屏幕 (100%)
- `overlay`: 是否顯示遮罩層
- `overlayBlur`: 是否使遮罩層模糊後方內容
- `closeOnEsc`: 是否允許使用 ESC 鍵關閉
- `closeOnOverlayClick`: 是否允許點擊遮罩層關閉
- `animationDuration`: 動畫持續時間（毫秒）
- `zIndex`: 面板的 z-index 層級

### 子組件 API

#### SidePanelHeader 組件

```typescript
export interface SidePanelHeaderProps {
    children?: React.ReactNode;
    showCloseButton?: boolean;
    title?: string;
    onClose?: () => void;
    className?: string;
}
```

#### SidePanelContent 組件

```typescript
export interface SidePanelContentProps {
    children?: React.ReactNode;
    className?: string;
    padding?: boolean;
}
```

#### SidePanelFooter 組件

```typescript
export interface SidePanelFooterProps {
    children?: React.ReactNode;
    className?: string;
    alignItems?: 'start' | 'center' | 'end' | 'between' | 'around';
}
```

### Context API

```typescript
export interface SidePanelContextProps {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const SidePanelProvider: React.FC<{
    children: React.ReactNode;
    defaultOpen?: boolean;
}>;
```

## 設計細節

### 樣式實現

側邊面板組件使用 TailwindCSS 和 Framer Motion 實現樣式和動畫：

1. **基礎樣式**：固定定位、z-index 層級、背景顏色
2. **位置樣式**：基於 position 參數的定位計算
3. **尺寸樣式**：基於 size 參數的寬度/高度計算
4. **遮罩層**：半透明背景層，可選模糊效果

### 動畫效果

使用 Framer Motion 實現側邊面板的動畫：

```typescript
// 入場和離場動畫變體
const variants = {
  left: {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  },
  right: {
    open: { x: 0, opacity: 1 },
    closed: { x: '100%', opacity: 0 },
  },
  top: {
    open: { y: 0, opacity: 1 },
    closed: { y: '-100%', opacity: 0 },
  },
  bottom: {
    open: { y: 0, opacity: 1 },
    closed: { y: '100%', opacity: 0 },
  }
};

// 動畫組件
<motion.div
  initial="closed"
  animate={isOpen ? "open" : "closed"}
  variants={variants[position]}
  transition={{ type: 'spring', stiffness: 400, damping: 40, duration: animationDuration / 1000 }}
  className={panelClasses}
>
  {children}
</motion.div>
```

### 無障礙實現

1. **焦點管理**：當面板打開時，焦點移至面板內，關閉時返回觸發元素
2. **鍵盤導航**：支持 Tab 鍵在面板內的元素間導航
3. **ARIA 屬性**：適當的 aria-modal、aria-hidden 和 role 屬性
4. **焦點陷阱**：防止用戶通過 Tab 鍵導航到面板外的元素

### 響應式設計

1. **移動設備適配**：在小屏幕上自動調整面板尺寸
2. **觸摸操作**：支持滑動手勢關閉面板
3. **安全區域**：考慮移動設備的安全區域，避免內容被系統 UI 遮擋

## 使用指南

### 基本用法

```jsx
import { SidePanel, SidePanelHeader, SidePanelContent, SidePanelFooter } from '@sunui-design/side-panel';

const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(true)}>打開側邊面板</button>

<SidePanel isOpen={isOpen} onClose={() => setIsOpen(false)} position="right" size="md">
  <SidePanelHeader title="側邊面板標題" />
  <SidePanelContent>
    <p>這裡是側邊面板的內容</p>
  </SidePanelContent>
  <SidePanelFooter alignItems="end">
    <button onClick={() => setIsOpen(false)}>關閉</button>
    <button>確認</button>
  </SidePanelFooter>
</SidePanel>
```

### 使用 Context API

```jsx
import { SidePanelProvider, useSidePanel, SidePanel } from '@sunui-design/side-panel';

const App = () => (
  <SidePanelProvider>
    <MyComponent />
    <MySidePanel />
  </SidePanelProvider>
);

const MyComponent = () => {
  const { open } = useSidePanel();
  return <button onClick={open}>打開面板</button>;
};

const MySidePanel = () => {
  const { isOpen, close } = useSidePanel();
  return (
    <SidePanel isOpen={isOpen} onClose={close}>
      {/* 面板內容 */}
    </SidePanel>
  );
};
```

## 最佳實踐

1. 使用子組件結構化面板內容
2. 根據內容選擇合適的面板位置和尺寸
3. 確保面板內的表單和可交互元素易於訪問
4. 提供明確的關閉選項
5. 考慮移動設備上的使用體驗
6. 使用 Context API 管理複雜的面板狀態

## 性能優化

1. **組件懶加載**：使用 React.lazy 延遲加載面板內容
2. **條件渲染**：未打開時不渲染面板內容或使用懶渲染
3. **動畫優化**：使用 GPU 加速的變換屬性（transform, opacity）
4. **防止冗餘渲染**：使用 React.memo 和 useMemo 優化渲染

## 無障礙性

側邊面板組件遵循 WCAG 2.1 標準，實現以下無障礙功能：

1. 完整的鍵盤可訪問性
2. 適當的 ARIA 屬性和角色
3. 焦點管理和焦點陷阱
4. 支持屏幕閱讀器通知 