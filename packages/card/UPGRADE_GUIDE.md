# 升級指南 - Card 元件 v2.0.0

## 概述

Card 元件 v2.0.0 是一次重大升級，帶來了全新的設計和豐富的功能。本指南將幫助您順利從 v1.x 升級到 v2.0.0。

## 主要變更

### 1. 新增變體 (Variants)

v2.0.0 新增了兩種新的變體：`glass` 和 `gradient`。

**舊版本 (v1.x):**
```tsx
<Card variant="outlined"> {/* 只有 outlined, filled, elevated */}
  <CardContent>內容</CardContent>
</Card>
```

**新版本 (v2.0.0):**
```tsx
<Card variant="glass"> {/* 新增 glass 和 gradient */}
  <CardContent>內容</CardContent>
</Card>

<Card variant="gradient">
  <CardContent>內容</CardContent>
</Card>
```

**遷移建議:**
- 現有的 `outlined`、`filled`、`elevated` 變體完全相容，無需修改
- 可以嘗試新的 `glass` 和 `gradient` 變體以獲得更現代的視覺效果

### 2. 新增主題 (Themes)

v2.0.0 新增了三種新主題：`gradient`、`dark`、`light`。

**舊版本 (v1.x):**
```tsx
<Card theme="violet"> {/* 只有 violet, cyan, orange */}
  <CardContent>內容</CardContent>
</Card>
```

**新版本 (v2.0.0):**
```tsx
<Card theme="gradient"> {/* 新增 gradient, dark, light */}
  <CardContent>內容</CardContent>
</Card>

<Card theme="dark">
  <CardContent>內容</CardContent>
</Card>
```

**遷移建議:**
- 現有主題完全相容
- `gradient` 主題提供多彩漸變效果
- `dark` 和 `light` 主題提供更好的淺深色系統整合

### 3. 深色模式支援 (Mode)

v2.0.0 新增了 `mode` 屬性，用於明確控制深淺色模式。

**新功能:**
```tsx
{/* 淺色模式（預設） */}
<Card mode="light" theme="violet">
  <CardHeader mode="light">標題</CardHeader>
  <CardContent mode="light">內容</CardContent>
</Card>

{/* 深色模式 */}
<Card mode="dark" theme="violet">
  <CardHeader mode="dark">標題</CardHeader>
  <CardContent mode="dark">內容</CardContent>
</Card>
```

**遷移建議:**
- 預設值為 `light`，現有代碼無需修改
- 如果您的應用支援深色模式，建議根據應用主題設定 `mode` 屬性
- 子元件（CardHeader、CardContent、CardFooter）也需要設定對應的 `mode`

### 4. 新增尺寸選項

v2.0.0 新增了 `xl` 超大尺寸。

**舊版本 (v1.x):**
```tsx
<Card size="lg"> {/* sm, md, lg */}
  <CardContent>內容</CardContent>
</Card>
```

**新版本 (v2.0.0):**
```tsx
<Card size="xl"> {/* 新增 xl */}
  <CardContent>內容</CardContent>
</Card>
```

**遷移建議:**
- 現有尺寸完全相容
- `xl` 適合需要更大空間的內容展示

### 5. 載入狀態增強

v2.0.0 新增了 `shimmer` 載入動畫。

**舊版本 (v1.x):**
```tsx
<Card loading loadingMode="skeleton"> {/* skeleton, overlay */}
  <CardContent>內容</CardContent>
</Card>
```

**新版本 (v2.0.0):**
```tsx
<Card loading loadingMode="shimmer"> {/* 新增 shimmer */}
  <CardContent>內容</CardContent>
</Card>
```

**遷移建議:**
- 現有載入模式完全相容
- `shimmer` 提供更現代的閃爍光澤效果

### 6. 視覺效果控制

v2.0.0 新增了多個視覺效果控制屬性。

**新功能:**
```tsx
<Card
  hoverable={true}    // 控制懸停效果（預設 true）
  clickable={true}    // 明確的點擊狀態
  bordered={true}     // 控制邊框顯示（預設 true）
  shadow={true}       // 控制陰影顯示（預設 true）
  glow={true}         // 光暈效果（預設 false）
  onClick={() => {}}  // 點擊事件處理
>
  <CardContent>內容</CardContent>
</Card>
```

**遷移建議:**
- 這些都是新屬性，預設值保持向下相容
- 可以根據需求啟用或禁用特定效果

### 7. CardHeader 增強

**新功能:**
```tsx
<CardHeader
  showDivider={true}    // 顯示分隔線
  mode="dark"           // 深色模式
  align="center"        // 對齊方式: left, center, right
>
  <h3>標題</h3>
</CardHeader>
```

**遷移建議:**
- 新增 `align` 屬性用於控制對齊
- 新增 `mode` 屬性支援深色模式
- 分隔線樣式已優化

### 8. CardContent 增強

**新功能:**
```tsx
<CardContent
  showDivider={true}    // 顯示分隔線
  mode="dark"           // 深色模式
  noPadding={false}     // 移除內距
>
  <p>內容</p>
</CardContent>
```

**遷移建議:**
- 新增 `noPadding` 屬性用於特殊佈局需求
- 新增 `mode` 屬性支援深色模式

### 9. CardFooter 增強

**新功能:**
```tsx
<CardFooter
  showDivider={true}    // 顯示分隔線
  mode="dark"           // 深色模式
  justify="between"     // 對齊方式: start, center, end, between, around
>
  <button>按鈕</button>
</CardFooter>
```

**遷移建議:**
- 新增 `justify` 屬性用於控制內容對齊
- 新增 `mode` 屬性支援深色模式

### 10. CardImage 大幅增強

**舊版本 (v1.x):**
```tsx
<CardImage
  src="image.jpg"
  alt="圖片"
  loading="lazy"
  fallback="fallback.jpg"
/>
```

**新版本 (v2.0.0):**
```tsx
<CardImage
  src="image.jpg"
  alt="圖片"
  loading="lazy"
  fallback="fallback.jpg"
  aspectRatio="16/9"          // 新增: 長寬比控制
  objectFit="cover"           // 新增: 圖片適配方式
  overlay={true}              // 新增: 覆蓋層效果
  overlayGradient="bottom"    // 新增: 漸變方向
/>
```

**遷移建議:**
- 所有新屬性都是可選的，預設值保持向下相容
- `aspectRatio` 預設為 `16/9`
- `objectFit` 預設為 `cover`
- `overlay` 預設為 `false`

## 完整遷移範例

### 範例 1: 基本卡片

**舊版本 (v1.x):**
```tsx
<Card variant="outlined" theme="violet" size="md">
  <CardHeader>
    <h3>標題</h3>
  </CardHeader>
  <CardContent>
    <p>內容</p>
  </CardContent>
  <CardFooter>
    <button>按鈕</button>
  </CardFooter>
</Card>
```

**新版本 (v2.0.0) - 最小變更:**
```tsx
{/* 完全相容，無需修改 */}
<Card variant="outlined" theme="violet" size="md">
  <CardHeader>
    <h3>標題</h3>
  </CardHeader>
  <CardContent>
    <p>內容</p>
  </CardContent>
  <CardFooter>
    <button>按鈕</button>
  </CardFooter>
</Card>
```

**新版本 (v2.0.0) - 使用新功能:**
```tsx
<Card 
  variant="glass"           // 使用新的毛玻璃效果
  theme="gradient"          // 使用新的漸變主題
  size="lg"
  mode="light"              // 明確設定模式
  hoverable
  shadow
  glow                      // 啟用光暈效果
>
  <CardHeader mode="light" align="center">
    <h3>標題</h3>
  </CardHeader>
  <CardContent mode="light">
    <p>內容</p>
  </CardContent>
  <CardFooter mode="light" justify="between">
    <button>取消</button>
    <button>確認</button>
  </CardFooter>
</Card>
```

### 範例 2: 帶圖片的卡片

**舊版本 (v1.x):**
```tsx
<Card variant="elevated" theme="violet">
  <CardImage src="product.jpg" alt="產品" />
  <CardHeader>
    <h3>產品名稱</h3>
  </CardHeader>
  <CardContent>
    <p>產品描述</p>
  </CardContent>
</Card>
```

**新版本 (v2.0.0) - 使用新功能:**
```tsx
<Card 
  variant="elevated" 
  theme="violet"
  hoverable
  clickable              // 新增: 點擊狀態
  shadow
  glow                   // 新增: 光暈效果
  onClick={handleClick}  // 新增: 點擊處理
>
  <CardImage 
    src="product.jpg" 
    alt="產品"
    aspectRatio="16/9"           // 新增: 控制長寬比
    overlay                      // 新增: 覆蓋層
    overlayGradient="bottom"     // 新增: 底部漸變
  />
  <CardHeader showDivider>       {/* 優化: 分隔線樣式 */}
    <h3>產品名稱</h3>
  </CardHeader>
  <CardContent>
    <p>產品描述</p>
  </CardContent>
</Card>
```

### 範例 3: 深色模式卡片

**新版本 (v2.0.0) - 新功能:**
```tsx
<Card 
  variant="glass"
  theme="gradient"
  mode="dark"              // 深色模式
  size="lg"
  hoverable
  shadow
  glow
>
  <CardImage 
    src="hero.jpg" 
    alt="封面"
    overlay
    overlayGradient="both"
  />
  <CardHeader mode="dark" showDivider>
    <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
      深色模式標題
    </h3>
  </CardHeader>
  <CardContent mode="dark">
    <p className="opacity-80">深色模式下的內容...</p>
  </CardContent>
  <CardFooter mode="dark" showDivider justify="between">
    <button>取消</button>
    <button>確認</button>
  </CardFooter>
</Card>
```

## 自動化遷移腳本

以下是一些可以幫助遷移的建議：

### 1. 添加深色模式支援

使用正則表達式查找並替換：

**查找:**
```regex
<Card([^>]*)>
```

**替換為:**
```tsx
<Card$1 mode="light">  {/* 或根據需求設定為 "dark" */}
```

### 2. 為子元件添加 mode 屬性

**查找:**
```regex
<(CardHeader|CardContent|CardFooter)([^>]*)>
```

**替換為:**
```tsx
<$1$2 mode="light">  {/* 或根據需求設定 */}
```

## 檢查清單

升級時請確認以下事項：

- [ ] 更新套件版本到 v2.0.0
- [ ] 檢查所有使用 Card 元件的地方
- [ ] 根據需求添加 `mode` 屬性
- [ ] 測試深色模式下的顯示效果
- [ ] 檢查新增的視覺效果是否符合設計需求
- [ ] 更新相關的測試代碼
- [ ] 確認 TypeScript 類型無錯誤
- [ ] 執行視覺回歸測試

## 常見問題

### Q: 升級後卡片看起來和之前不一樣？

A: v2.0.0 優化了許多視覺細節，包括陰影、圓角、間距等。如果需要保持原樣，可以通過 `className` 覆蓋樣式。

### Q: 是否必須為所有子元件設定 mode 屬性？

A: 如果使用深色模式，建議為所有子元件設定 `mode` 以確保一致性。如果只使用淺色模式，可以省略（預設為 `light`）。

### Q: 新的動畫會影響效能嗎？

A: 所有動畫都經過優化，使用 GPU 加速。如果遇到效能問題，可以通過 `hoverable={false}` 禁用懸停動畫。

### Q: 如何恢復舊版本的樣式？

A: 保持使用相同的 `variant` 和 `theme`，不啟用新功能（如 `glow`）即可獲得接近的效果。

## 需要幫助？

如果在升級過程中遇到問題：

1. 查看 [完整文檔](./README.md)
2. 查看 [Storybook 範例](https://your-storybook-url.com)
3. 提交 [Issue](https://github.com/your-repo/issues)
4. 查看 [CHANGELOG](./CHANGELOG.md) 了解詳細變更

## 總結

v2.0.0 是一次重大升級，但保持了良好的向下相容性。主要變更：

- ✅ **完全相容**: 現有的 variants、themes、sizes 都可以直接使用
- 🆕 **新功能**: 深色模式、新變體、視覺效果控制
- 🎨 **視覺改進**: 更現代化的設計、更豐富的效果
- 📈 **增強功能**: 子元件的新屬性、更靈活的控制

建議分階段遷移：
1. 先更新版本，確保現有功能正常運作
2. 逐步添加 `mode` 屬性支援深色模式
3. 根據需求啟用新的視覺效果
4. 探索新的變體和主題
