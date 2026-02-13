# Changelog

All notable changes to the Card component will be documented in this file.

## [2.1.1] - 2024-02-13

### 🗑️ 移除功能

- **移除可拖拉卡片 (Draggable Cards)**
  - 移除 Card 元件的 `draggable`、`dragConstraints`、`dragElastic`、`onDragStart`、`onDragEnd` 屬性
  - 移除 Storybook 的 Draggable Cards 範例
  - 更新 README 移除可拖拉相關文檔

---

## [2.1.0] - 2024-02-13

### 🐛 修復問題

- ✅ 修復 CardImage 負邊距導致的跑版問題
- ✅ 移除圖片 `-mx-6 -mt-6` 負邊距

### 🎨 視覺優化

- ✅ Storybook 佈局調整為居中顯示

---

## [2.0.0] - 2024-02-12

### 🎉 重大更新 - 完全重新設計

這是一次完整的重新設計，Card 元件現在擁有更現代化的外觀和更豐富的功能。

### ✨ 新增功能

#### 變體樣式 (Variants)
- ✅ **新增 `glass` 變體** - 毛玻璃效果，提供半透明的精緻質感
- ✅ **新增 `gradient` 變體** - 多色漸變背景
- ✅ 優化 `outlined`、`filled`、`elevated` 變體的視覺效果

#### 主題配色 (Themes)
- ✅ **新增 `gradient` 主題** - 多彩漸變主題
- ✅ **新增 `dark` 主題** - 深色系主題
- ✅ **新增 `light` 主題** - 淺色系主題
- ✅ 優化 `violet`、`cyan`、`orange` 主題配色

#### 模式支援 (Mode)
- ✅ **完整支援深色模式** - 新增 `mode` 屬性 (`light` | `dark`)
- ✅ 所有子元件都支援深色模式配置
- ✅ 針對深淺色模式優化的配色方案

#### 尺寸選項 (Sizes)
- ✅ **新增 `xl` 超大尺寸**
- ✅ 優化所有尺寸的內距和圓角

#### 載入狀態 (Loading States)
- ✅ **新增 `shimmer` 載入動畫** - 閃爍光澤效果
- ✅ 優化 `skeleton` 骨架屏動畫
- ✅ 優化 `overlay` 覆蓋式載入動畫
- ✅ 深色模式下的載入狀態優化

#### 視覺效果
- ✅ **新增 `glow` 光暈效果** - 懸停時的動態光暈
- ✅ **新增內部光澤效果** - 微妙的漸變光澤
- ✅ **優化陰影系統** - 更自然的深度感
- ✅ **改進動畫效果** - 更流暢的進入和懸停動畫
- ✅ **新增 viewport 檢測** - 進入視窗時觸發動畫

#### 互動性
- ✅ **新增 `clickable` 屬性** - 明確的點擊狀態
- ✅ **新增 `onClick` 事件處理**
- ✅ **優化 hover 效果** - 可通過 `hoverable` 控制
- ✅ **新增點擊縮放動畫**

#### CardHeader 增強
- ✅ 新增 `align` 屬性 - 對齊方式 (`left` | `center` | `right`)
- ✅ 優化分隔線樣式
- ✅ 支援深色模式

#### CardContent 增強
- ✅ 新增 `noPadding` 屬性 - 移除內距選項
- ✅ 優化分隔線樣式
- ✅ 支援深色模式

#### CardFooter 增強
- ✅ 新增 `justify` 屬性 - 內容對齊方式 (`start` | `center` | `end` | `between` | `around`)
- ✅ 優化分隔線樣式
- ✅ 支援深色模式

#### CardImage 增強
- ✅ **新增 `aspectRatio` 屬性** - 長寬比控制 (`16/9` | `4/3` | `1/1` | `auto`)
- ✅ **新增 `objectFit` 屬性** - 圖片適配方式
- ✅ **新增 `overlay` 屬性** - 覆蓋層效果
- ✅ **新增 `overlayGradient` 屬性** - 漸變方向 (`top` | `bottom` | `both` | `none`)
- ✅ **新增載入骨架屏** - 圖片載入時的佔位效果
- ✅ **優化 hover 效果** - 縮放和亮度調整
- ✅ **新增光澤效果** - 懸停時的光澤動畫

### 🎨 視覺改進

- 更現代化的設計語言
- 更豐富的漸變效果
- 更精緻的毛玻璃效果
- 更自然的陰影系統
- 更流暢的動畫過渡
- 更好的深淺色模式支援

### 🚀 效能優化

- 使用 `useInView` Hook 優化進入動畫
- 優化主題配色的記憶化處理
- 優化動畫效能

### 📝 文檔更新

- 全新的 README 文檔
- 完整的 Storybook 範例
- 詳細的 API 文檔
- 豐富的使用範例

### 🔧 Tailwind 配置

- 新增 `shimmer` 動畫定義
- 優化色彩系統

### 🧪 測試覆蓋

- 新增變體測試
- 新增主題測試
- 新增尺寸測試
- 新增載入狀態測試
- 新增互動性測試
- 新增子元件測試
- 新增深色模式測試
- 新增視覺效果測試

### ⚠️ Breaking Changes

以下是不相容的變更，升級時需要注意：

1. **尺寸屬性值更新**
   - 新增 `xl` 尺寸選項
   - 建議：檢查所有使用 `size` 屬性的地方

2. **新增 `mode` 屬性**
   - 用於控制深淺色模式
   - 預設值：`'light'`
   - 建議：根據應用主題設定對應的 `mode`

3. **子元件屬性更新**
   - `CardHeader`、`CardContent`、`CardFooter` 現在支援 `mode` 屬性
   - 建議：統一設定 `mode` 以保持一致性

4. **CardImage 屬性大幅增強**
   - 新增多個視覺效果屬性
   - 預設行為保持不變
   - 建議：查看新的屬性選項以提升視覺效果

### 📦 相依套件

無新增相依套件，現有相依：
- `framer-motion` - 動畫效果
- `clsx` - CSS 類別管理
- `tailwind-merge` - Tailwind 類別合併

### 🎯 未來計劃

- [ ] 新增更多主題配色
- [ ] 支援自訂主題配色
- [ ] 新增更多載入動畫效果
- [ ] 支援卡片群組佈局
- [ ] 新增卡片翻轉動畫
- [ ] 支援卡片拖曳排序

---

## [1.0.0] - 2024-01-01

### 初始版本

- 基本卡片元件
- 三種變體：outlined、filled、elevated
- 三種主題：violet、cyan、orange
- 三種尺寸：sm、md、lg
- 載入狀態支援
- 子元件：CardHeader、CardContent、CardFooter、CardImage
