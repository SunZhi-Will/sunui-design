# Card 卡片組件設計文檔

## 組件概述

卡片組件是一個用於展示信息集合的容器，提供了豐富的配置選項，包括多種變體、尺寸和主題。支持加載狀態、動畫效果和多種子組件。

## 設計目標

- 提供視覺上吸引人的信息容器
- 支持多種外觀變體和主題
- 提供流暢的動畫效果
- 實現無障礙設計
- 支持加載狀態顯示

## 組件結構

### 主要組件

- `Card`: 主卡片容器
- `CardHeader`: 卡片頭部區域
- `CardContent`: 卡片內容區域
- `CardFooter`: 卡片底部區域
- `CardImage`: 卡片圖片元素

### 組件關係

```
Card
├── CardHeader
├── CardImage
├── CardContent
└── CardFooter
```

### 組件內部結構

卡片組件的內部實現結構如下：

```jsx
// 簡化版內部結構
const Card = ({
  children,
  variant = 'outlined',
  size = 'md',
  theme = 'violet',
  loading = false,
  loadingMode = 'skeleton',
  className,
  style,
  ...rest
}) => {
  // 主題和變體樣式計算
  const themeColors = useThemeColors(theme);
  const variantClasses = getVariantClasses(variant, themeColors);
  const sizeClasses = getSizeClasses(size);
  
  return (
    <motion.div
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      style={style}
      {...animationProps}
      {...rest}
    >
      {loading && <LoadingOverlay mode={loadingMode} />}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
```

## 組件 API

### Card 組件

```typescript
export interface CardProps {
    children?: React.ReactNode;
    variant?: 'outlined' | 'filled' | 'elevated';
    size?: 'sm' | 'md' | 'lg';
    theme?: 'violet' | 'cyan' | 'orange';
    loading?: boolean;
    loadingMode?: 'overlay' | 'skeleton';
    className?: string;
    style?: React.CSSProperties;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
    id?: string;
    'data-testid'?: string;
    role?: string;
    tabIndex?: number;
}
```

#### 屬性說明

- `variant`: 卡片變體樣式
  - `outlined`: 帶邊框的簡單樣式
  - `filled`: 帶背景填充的樣式
  - `elevated`: 帶陰影的浮起效果

- `size`: 卡片尺寸
  - `sm`: 小尺寸 (內邊距 p-3)
  - `md`: 中等尺寸 (內邊距 p-5，默認)
  - `lg`: 大尺寸 (內邊距 p-7)

- `theme`: 卡片主題
  - `violet`: 紫色主題
  - `cyan`: 青色主題
  - `orange`: 橙色主題

- `loading`: 是否顯示加載狀態
- `loadingMode`: 加載狀態顯示模式
  - `overlay`: 顯示加載圖標覆蓋
  - `skeleton`: 顯示骨架加載效果

### 子組件 API

#### CardHeader 組件

```typescript
export interface CardHeaderProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
    title?: string;
    subtitle?: string;
    avatar?: React.ReactNode;
    action?: React.ReactNode;
}
```

#### CardContent 組件

```typescript
export interface CardContentProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
    padding?: boolean;
}
```

#### CardFooter 組件

```typescript
export interface CardFooterProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
    alignItems?: 'start' | 'center' | 'end' | 'between' | 'around';
}
```

#### CardImage 組件

```typescript
export interface CardImageProps {
    src: string;
    alt: string;
    loading?: 'lazy' | 'eager';
    fallback?: string;
    className?: string;
    width?: number | string;
    height?: number | string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
}
```

## 設計細節

### 樣式實現

卡片組件使用 TailwindCSS 實現樣式，主要樣式特點包括：

1. **基礎樣式**：圓角、邊框、背景和文字顏色
2. **過渡效果**：平滑的過渡動畫
3. **專注樣式**：清晰的輪廓和環形強調
4. **懸停效果**：陰影和背景色變化

### 主題和顏色系統

使用 React.useMemo 優化主題色計算：

```typescript
const themeColors = React.useMemo(() => ({
    violet: {
        primary: 'primary',
        text: 'primary-700',
        bg: 'primary-50/30',
        border: 'primary-200',
        shadow: 'shadow-primary-100/50',
        gradient: 'from-primary-100/20 to-primary-50/20',
        hoverGradient: 'from-primary-100/30 to-primary-50/30',
        ring: 'ring-primary-200',
    },
    cyan: {
        // 類似的色彩定義...
    },
    orange: {
        // 類似的色彩定義...
    },
}), []);
```

### 加載狀態

組件提供兩種加載狀態顯示模式：

1. **覆蓋模式**：透明背景層上顯示旋轉圖標
2. **骨架模式**：使用脈動動畫顯示內容占位符

### 動畫效果

使用 Framer Motion 實現以下動畫效果：

1. **進入動畫**：卡片淡入和上移
2. **懸停動畫**：輕微放大效果
3. **點擊動畫**：輕微縮小效果
4. **加載動畫**：淡入淡出和脈動效果

```typescript
<motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    whileHover={{ scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
    whileTap={{ scale: 0.99, transition: { duration: 0.1, ease: "easeIn" } }}
>
    {/* 卡片內容 */}
</motion.div>
```

## 組件性能優化

Card 組件已經實施了以下性能優化：

1. **記憶化計算**：使用 `useMemo` 緩存主題顏色計算結果，避免重複計算
   ```typescript
   const themeColors = React.useMemo(() => ({ /* ... */ }), []);
   ```

2. **條件渲染**：只在需要時渲染加載狀態
   ```typescript
   {loading && <LoadingOverlay mode={loadingMode} />}
   ```

3. **可選的懶加載圖片**：CardImage 組件支持懶加載，減少初始加載時間
   ```typescript
   <img loading={loading} src={src} alt={alt} />
   ```

4. **自動清理**：使用 React 的清理機制防止內存洩漏

## 測試方法

### 單元測試範例

```typescript
// Card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardContent, CardFooter } from '../src/Card';

describe('Card Component', () => {
  test('renders card with content', () => {
    render(
      <Card>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('applies the correct variant class', () => {
    const { container } = render(
      <Card variant="elevated" data-testid="test-card">
        <CardContent>Test Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('test-card');
    expect(card).toHaveClass('shadow-lg');
  });

  test('shows loading overlay when loading prop is true', () => {
    render(
      <Card loading={true} loadingMode="overlay">
        <CardContent>Test Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles click events', async () => {
    const handleClick = jest.fn();
    render(
      <Card onClick={handleClick}>
        <CardContent>Click Me</CardContent>
      </Card>
    );
    await userEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies the correct size class', () => {
    const { container } = render(
      <Card size="lg" data-testid="test-card">
        <CardContent>Test Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('test-card');
    expect(card).toHaveClass('p-7');
  });
});
```

### 可訪問性測試範例

```typescript
// Card.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card, CardHeader, CardContent, CardFooter } from '../src/Card';

expect.extend(toHaveNoViolations);

describe('Card Accessibility', () => {
  test('has no accessibility violations', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <h2>Card Title</h2>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('has no accessibility violations with loading state', async () => {
    const { container } = render(
      <Card loading={true} loadingMode="skeleton">
        <CardContent>Content</CardContent>
      </Card>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 使用指南

### 基本用法

```jsx
import { Card, CardHeader, CardContent, CardFooter, CardImage } from '@sunui-design/card';

<Card variant="elevated" theme="violet">
    <CardHeader>
        <h3>卡片標題</h3>
    </CardHeader>
    <CardImage src="/path/to/image.jpg" alt="卡片圖片" />
    <CardContent>
        <p>卡片內容區域</p>
    </CardContent>
    <CardFooter>
        <button>操作按鈕</button>
    </CardFooter>
</Card>
```

### 加載狀態示例

```jsx
<Card loading={true} loadingMode="skeleton">
    {/* 卡片內容 */}
</Card>
```

### 自定義主題

```jsx
<Card
  style={{
    '--card-primary-color': '#6366f1',
    '--card-background': '#f8fafc',
    '--card-border-color': '#cbd5e1',
  }}
>
  <CardContent>自定義主題顏色的卡片</CardContent>
</Card>
```

### 組合使用示例

```jsx
import { Card, CardHeader, CardContent, CardFooter, CardImage } from '@sunui-design/card';
import { Button } from '@sunui-design/button';
import { Badge } from '@sunui-design/badge';

<Card variant="outlined" theme="cyan">
  <CardHeader>
    <div className="flex justify-between">
      <h3 className="text-xl font-semibold">產品卡片</h3>
      <Badge color="info">新品</Badge>
    </div>
  </CardHeader>
  <CardImage
    src="/products/example.jpg"
    alt="產品示例"
    loading="lazy"
    objectFit="cover"
  />
  <CardContent>
    <p className="text-gray-600">這是一個產品描述示例，展示了卡片組件的使用方法。</p>
    <div className="mt-2 text-lg font-bold">$99.00</div>
  </CardContent>
  <CardFooter alignItems="between">
    <Button variant="outline" size="sm">加入收藏</Button>
    <Button variant="solid" size="sm">加入購物車</Button>
  </CardFooter>
</Card>
```

## 最佳實踐

1. 使用子組件結構化卡片內容
2. 根據內容選擇合適的尺寸
3. 根據上下文選擇合適的主題
4. 在數據加載過程中使用加載狀態
5. 保持卡片內容簡潔，避免過度填充
6. 使用語義化 HTML 元素（如 `<h2>`, `<h3>` 等）提高可訪問性
7. 確保卡片內所有交互元素都可通過鍵盤訪問
8. 為圖片提供有意義的 alt 文本

## 無障礙性

卡片組件遵循 WCAG 2.1 AA 級標準，實現以下無障礙功能：

1. **鍵盤焦點樣式**：清晰可見的焦點指示器
   ```css
   .focus:outline-none .focus:ring-2 .focus:ring-primary-200
   ```

2. **適當的色彩對比度**：文本和背景的對比度符合 WCAG 要求
   - 正常文本：4.5:1
   - 大文本：3:1

3. **語義化的 HTML 結構**：使用適當的 HTML 元素和標記
   ```jsx
   <article role="region" aria-labelledby="card-title">
     <header>
       <h2 id="card-title">標題</h2>
     </header>
     <div>內容</div>
   </article>
   ```

4. **加載狀態的輔助技術通知**：使用 aria-busy 和 aria-live
   ```jsx
   <div aria-busy={loading} aria-live="polite">
     {loading ? "正在加載..." : children}
   </div>
   ```

## 版本兼容性

### 框架兼容性

| 框架    | 支持版本 | 說明                              |
| ------- | -------- | --------------------------------- |
| React   | 18.0+    | 完全支持                          |
| React   | 17.0+    | 基本功能支持，但動畫可能不完整    |
| React   | 16.8+    | 僅基本功能，不支持某些 Hooks 功能 |
| Next.js | 13+      | 完全支持，包括 App Router         |
| Next.js | 12+      | 支持，但需要特定配置              |
| Remix   | 1.0+     | 支持                              |
| Gatsby  | 4.0+     | 支持                              |

### 瀏覽器兼容性

| 瀏覽器         | 支持版本 |
| -------------- | -------- |
| Chrome         | 88+      |
| Firefox        | 85+      |
| Safari         | 14+      |
| Edge           | 88+      |
| Opera          | 74+      |
| iOS Safari     | 14.4+    |
| Android Chrome | 88+      |

### 包大小信息

| 文件類型           | 大小  |
| ------------------ | ----- |
| ESM (gzipped)      | ~12KB |
| CommonJS (gzipped) | ~14KB |
| CSS (gzipped)      | ~1KB  |
| 總大小 (gzipped)   | ~13KB |

## 變更歷史

### v1.1.0
- 添加更多自定義樣式選項
- 改進加載動畫效果
- 添加圖片對象適配選項

### v1.0.0
- 初始版本發布
- 支持三種變體和主題
- 實現加載狀態和動畫效果 