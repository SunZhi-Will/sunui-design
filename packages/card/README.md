# @sunui-design/card

A modern, beautifully designed card component for SunUI Design with rich visual effects and smooth animations.

## Features

- 🎨 **5種變體樣式** - Outlined, Filled, Elevated, Glass, Gradient
- 🌈 **6種主題配色** - Violet, Cyan, Orange, Gradient, Dark, Light
- 🌓 **深淺色模式** - 完美支援 Light 和 Dark 模式
- ✨ **豐富視覺效果** - 毛玻璃、漸變、光暈、陰影效果
- 🎬 **流暢動畫** - 使用 Framer Motion 打造的精緻動畫
- 📦 **模組化子元件** - Header, Content, Footer, Image
- ⏳ **3種載入狀態** - Skeleton, Shimmer, Overlay
- 📱 **響應式設計** - 4種尺寸選項（SM, MD, LG, XL）
- 🎯 **TypeScript 支援** - 完整的型別定義
- ⚡ **輕量高效** - 優化的效能和體積

## Installation

```bash
npm install @sunui-design/card
# or
yarn add @sunui-design/card
# or
pnpm add @sunui-design/card
```

## Basic Usage

### 基本卡片

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@sunui-design/card';

export default function BasicCard() {
  return (
    <Card variant="outlined" theme="violet" size="md">
      <CardHeader>
        <h3 className="text-xl font-bold">卡片標題</h3>
        <p className="text-sm opacity-70">副標題</p>
      </CardHeader>
      <CardContent>
        <p>這是卡片內容...</p>
      </CardContent>
      <CardFooter justify="between">
        <button>取消</button>
        <button>確認</button>
      </CardFooter>
    </Card>
  );
}
```

### 帶圖片的產品卡片

```tsx
import { Card, CardHeader, CardContent, CardFooter, CardImage } from '@sunui-design/card';

export default function ProductCard() {
  return (
    <Card 
      variant="elevated" 
      theme="violet" 
      hoverable 
      clickable 
      shadow 
      glow
      onClick={() => console.log('卡片被點擊')}
    >
      <CardImage
        src="/product.jpg"
        alt="產品圖片"
        aspectRatio="16/9"
        overlay
        overlayGradient="bottom"
      />
      <CardHeader showDivider>
        <h3 className="text-2xl font-bold">產品名稱</h3>
        <p className="text-sm opacity-70">產品描述</p>
      </CardHeader>
      <CardContent>
        <p className="mb-4">產品詳細說明...</p>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold">NT$ 1,299</span>
          <span className="text-lg line-through opacity-50">NT$ 1,999</span>
        </div>
      </CardContent>
      <CardFooter justify="between">
        <button className="px-6 py-3 bg-violet-500 text-white rounded-lg">
          立即購買
        </button>
      </CardFooter>
    </Card>
  );
}
```

### 深色模式卡片

```tsx
<Card 
  variant="glass" 
  theme="gradient" 
  mode="dark" 
  hoverable 
  shadow 
  glow
>
  <CardHeader mode="dark">
    <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
      深色模式標題
    </h3>
  </CardHeader>
  <CardContent mode="dark">
    <p>深色模式內容...</p>
  </CardContent>
</Card>
```

### 載入狀態

```tsx
// 骨架屏載入
<Card loading loadingMode="skeleton" theme="violet">
  <CardHeader><h3>標題</h3></CardHeader>
  <CardContent><p>內容...</p></CardContent>
</Card>

// 閃爍載入
<Card loading loadingMode="shimmer" theme="cyan">
  <CardHeader><h3>標題</h3></CardHeader>
  <CardContent><p>內容...</p></CardContent>
</Card>

// 覆蓋式載入
<Card loading loadingMode="overlay" theme="orange">
  <CardHeader><h3>標題</h3></CardHeader>
  <CardContent><p>內容...</p></CardContent>
</Card>
```

### 可拖拉的卡片

```tsx
import { useState } from 'react';

export default function DraggableCardExample() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleDragEnd = (event: any, info: any) => {
    setPosition({
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    });
  };

  return (
    <Card
      variant="elevated"
      theme="violet"
      draggable                      // 啟用拖拉功能
      dragConstraints={{             // 拖拉範圍限制
        top: -200,
        left: -200,
        right: 200,
        bottom: 200,
      }}
      dragElastic={0.1}              // 彈性係數 (0-1)
      onDragStart={() => console.log('開始拖拉')}
      onDragEnd={handleDragEnd}      // 拖拉結束事件
      hoverable
      shadow
      glow
    >
      <CardHeader>
        <h3 className="text-xl font-bold">可拖拉卡片</h3>
        <p className="text-sm opacity-70">拖動我試試！</p>
      </CardHeader>
      <CardContent>
        <p>這是一個可以自由拖動的卡片元件。</p>
      </CardContent>
    </Card>
  );
}
```

## Props

### Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'outlined' \| 'filled' \| 'elevated' \| 'glass' \| 'gradient'` | `'outlined'` | 卡片變體樣式 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 卡片尺寸 |
| `theme` | `'violet' \| 'cyan' \| 'orange' \| 'gradient' \| 'dark' \| 'light'` | `'violet'` | 主題配色 |
| `mode` | `'light' \| 'dark'` | `'light'` | 深淺色模式 |
| `loading` | `boolean` | `false` | 是否顯示載入狀態 |
| `loadingMode` | `'overlay' \| 'skeleton' \| 'shimmer'` | `'skeleton'` | 載入動畫類型 |
| `hoverable` | `boolean` | `true` | 是否啟用懸停效果 |
| `clickable` | `boolean` | `false` | 是否為可點擊卡片 |
| `bordered` | `boolean` | `true` | 是否顯示邊框 |
| `shadow` | `boolean` | `true` | 是否顯示陰影 |
| `glow` | `boolean` | `false` | 是否顯示光暈效果 |
| `draggable` | `boolean` | `false` | 是否啟用拖拉功能 |
| `dragConstraints` | `object` | - | 拖拉範圍限制 `{ top, left, right, bottom }` |
| `dragElastic` | `number` | `0.1` | 拖拉彈性係數 (0-1) |
| `onDragStart` | `() => void` | - | 拖拉開始事件 |
| `onDragEnd` | `(event, info) => void` | - | 拖拉結束事件 |
| `onClick` | `() => void` | - | 點擊事件處理 |
| `className` | `string` | - | 自訂 CSS 類別 |

### CardHeader Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showDivider` | `boolean` | `false` | 是否顯示分隔線 |
| `mode` | `'light' \| 'dark'` | `'light'` | 深淺色模式 |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 對齊方式 |
| `className` | `string` | - | 自訂 CSS 類別 |

### CardContent Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showDivider` | `boolean` | `false` | 是否顯示分隔線 |
| `mode` | `'light' \| 'dark'` | `'light'` | 深淺色模式 |
| `noPadding` | `boolean` | `false` | 是否移除內距 |
| `className` | `string` | - | 自訂 CSS 類別 |

### CardFooter Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showDivider` | `boolean` | `false` | 是否顯示分隔線 |
| `mode` | `'light' \| 'dark'` | `'light'` | 深淺色模式 |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around'` | `'start'` | 內容對齊方式 |
| `className` | `string` | - | 自訂 CSS 類別 |

### CardImage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | - | 圖片來源 |
| `alt` | `string` | - | 替代文字 |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | 載入策略 |
| `fallback` | `string` | - | 載入失敗的備用圖片 |
| `aspectRatio` | `'16/9' \| '4/3' \| '1/1' \| 'auto'` | `'16/9'` | 長寬比 |
| `objectFit` | `'cover' \| 'contain' \| 'fill' \| 'none'` | `'cover'` | 圖片適配方式 |
| `overlay` | `boolean` | `false` | 是否顯示覆蓋層 |
| `overlayGradient` | `'top' \| 'bottom' \| 'both' \| 'none'` | `'bottom'` | 覆蓋層漸變方向 |
| `className` | `string` | - | 自訂 CSS 類別 |

## Variants (變體)

### Outlined
簡約邊框樣式，適合需要明確界限的內容。

### Filled
使用漸變背景填充，提供更豐富的視覺效果。

### Elevated
帶有深度陰影效果，創造層次感和立體感。

### Glass
現代化的毛玻璃效果，提供半透明的精緻質感。

### Gradient
使用多色漸變背景，創造動感和活力。

## Themes (主題)

- **Violet** - 優雅的紫色主題
- **Cyan** - 清新的青色主題
- **Orange** - 溫暖的橙色主題
- **Gradient** - 多彩漸變主題
- **Dark** - 深色系主題
- **Light** - 淺色系主題

## Examples

更多範例請參考 [Storybook 文檔](https://your-storybook-url.com)。

## License

MIT License

Copyright (c) 2024 SunUI Design

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 