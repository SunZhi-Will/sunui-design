# SunUI Design 主題系統設計

## 主題系統概述

SunUI Design 的主題系統是一個基於 TailwindCSS 的靈活配置系統，支持品牌色彩自定義、深淺色模式切換和組件級別的主題變體。系統採用語義化的顏色命名和一致的設計準則，確保整個組件庫風格統一。

## 設計目標

- 提供統一但可高度自定義的設計語言
- 支持全局主題和組件級別主題設定
- 實現無縫的深淺色模式切換
- 確保主題適配符合 WCAG 可訪問性標準
- 優化性能，避免主題變化引起的重渲染

## 顏色系統

SunUI Design 顏色系統遵循語義化命名和系統化的陰影層級：

### 主要色彩系列

每個色彩系列包含 9 個陰影級別 (50-900)：

```typescript
// tailwind.config.ts 中的顏色定義
const colors = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  
  // 其他色彩系列...
  info: { /* 藍色系列 */ },
  success: { /* 綠色系列 */ },
  warning: { /* 橙色系列 */ },
  danger: { /* 紅色系列 */ },
  
  // 中性色彩
  gray: { /* 灰階色彩 */ }
}
```

### 色彩用途

每個色彩陰影層級都有特定用途：

- **50-100**: 背景、懸停狀態
- **200-300**: 輕量邊框、禁用狀態
- **400-500**: 主要 UI 元素、交互元素 
- **600-700**: 高強調元素、活動狀態
- **800-900**: 文本、強調文本

### 色彩輔助工具

為了確保色彩的一致性和可訪問性，我們提供了以下工具：

- **色彩生成器**：根據基礎色自動生成色階
- **對比度檢查器**：確保文本和背景的對比度符合 WCAG 標準
- **色盲模擬**：檢查色彩在各種色覺缺陷下的可辨識度

## 主題配置

### 基本配置

主題配置位於核心包的 `tailwind.config.ts` 文件中：

```typescript
// packages/core/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors,
      borderRadius: {
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      // 其他主題配置...
    }
  }
}
```

### 主題變體

每個組件都支持主題變體，通常通過 `theme` 屬性設置：

```typescript
// 組件中的主題系統實現示例
const themeColors = React.useMemo(() => ({
  violet: {
    primary: 'primary',
    text: 'primary-700',
    bg: 'primary-50/30',
    border: 'primary-200',
    // 其他主題特定屬性...
  },
  cyan: {
    primary: 'info',
    text: 'info-700',
    bg: 'info-50/30',
    border: 'info-200',
    // 其他主題特定屬性...
  },
  // 其他主題變體...
}), []);

// 根據主題選擇應用相應的樣式
const colors = themeColors[theme]; // theme 來自組件 props
```

## 深淺色模式

系統支持完整的深淺色模式切換，採用 CSS 變量和 TailwindCSS 的深色模式功能：

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class', // 或 'media'，基於系統偏好
  theme: {
    extend: {
      // 色彩變量在深色模式下的對應
      colors: {
        // 深色模式顏色...
      }
    }
  }
}
```

### 暗色模式實現詳解

我們的暗色模式實現使用了 CSS 變量和 TailwindCSS 的類條件修飾符，以確保無閃爍的主題切換：

#### 1. CSS 變量定義

```css
:root {
  /* 淺色模式變量 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-border: #e5e7eb;
  
  /* 共享基礎顏色變量 */
  --color-primary-500: #8b5cf6;
  --color-primary-600: #7c3aed;
  /* 其他顏色... */
}

.dark {
  /* 深色模式變量覆蓋 */
  --color-bg-primary: #121212;
  --color-bg-secondary: #1e1e1e;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-border: #333333;
  
  /* 深色模式下的主色調調整 */
  --color-primary-500: #a78bfa;
  --color-primary-600: #8b5cf6;
  /* 其他顏色... */
}
```

#### 2. TailwindCSS 配置

```typescript
// 在 tailwind.config.ts 中
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      backgroundColor: {
        skin: {
          base: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
        }
      },
      textColor: {
        skin: {
          base: 'var(--color-text-primary)',
          muted: 'var(--color-text-secondary)',
        }
      },
      // 其他變量...
    }
  }
}
```

### 組件級深淺模式實現

除了全局的深淺色主題外，組件本身也提供了獨立的主題模式選擇，可通過 `mode` 屬性進行設定。這允許在全局深色主題下，特定組件使用淺色模式，反之亦然。

#### CountdownBanner 組件中的實現

最新的 CountdownBanner 組件展示了我們設計系統對深淺色主題的全面支持。下面是該組件中主題實現的核心部分：

```tsx
// 深色和淺色主題樣式對象
const darkThemeClasses = {
  orange: {
    banner: 'bg-gradient-to-b from-gray-950 to-gray-900',
    title: 'text-orange-400',
    discount: 'text-orange-400',
    timeBox: 'bg-gray-800 text-white',
    timeBoxShadow: 'shadow-lg shadow-orange-500/20',
    // 其他樣式...
  },
  violet: {
    // 紫色主題樣式...
  },
  // 其他主題...
};

const lightThemeClasses = {
  orange: {
    banner: 'bg-gradient-to-b from-white to-orange-50',
    title: 'text-orange-600',
    discount: 'text-orange-600',
    timeBox: 'bg-white text-gray-800 border border-orange-200',
    timeBoxShadow: 'shadow-lg shadow-orange-200/30',
    // 其他樣式...
  },
  // 其他淺色主題...
};

// 組件內部根據mode選擇主題
const selectedTheme = mode === 'dark' 
  ? darkThemeClasses[theme] 
  : lightThemeClasses[theme];
```

#### 深淺色設計原則

在實現深淺色模式時，我們遵循以下設計原則：

1. **顏色對比度**：確保文本在任何背景下都有足夠的對比度 (遵循 WCAG AA 標準)
2. **一致的視覺層次**：深淺模式下保持相同的視覺層次和空間關係
3. **減少眩光**：在暗色模式下降低純白色的使用，避免眩光
4. **微妙過渡**：在不同主題間切換時使用平滑過渡
5. **保持品牌一致性**：在兩種模式中保持品牌識別元素一致性

#### 實現範例 - 時間盒子元素

CountdownBanner 組件的時間盒子設計展示了我們對深淺色模式的精細處理：

```tsx
// 時間盒子樣式函數
const getTimeBoxClass = () => {
  // 根據主題模式選擇不同的現代風格背景
  let modernBaseClasses;
  if (mode === 'dark') {
    // 深色主題的現代風格
    modernBaseClasses = "backdrop-blur-xl bg-gradient-to-b from-white/[0.12] to-white/[0.05] rounded-[1.2rem] border border-white/15 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]";
  } else {
    // 淺色主題的現代風格
    modernBaseClasses = "backdrop-blur-xl bg-gradient-to-b from-white/95 to-gray-50/95 rounded-[1.2rem] border border-gray-200 shadow-[0_10px_25px_-15px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)]";
  }
  
  // 透過條件類合併構建完整樣式
  return cn(
    /* 基本樣式 */,
    modernBaseClasses,
    /* 其他樣式類... */
  );
};

// 數字樣式
const getTimeDigitClass = () => {
  if (layout === 'modern') {
    if (mode === 'dark') {
      // 深色主題下使用漸變白色文字
      return 'text-3xl md:text-4xl font-bold bg-gradient-to-br from-white via-gray-100 to-gray-300 text-transparent bg-clip-text drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]';
    } else {
      // 淺色主題下使用深色文字
      return 'text-3xl md:text-4xl font-bold text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]';
    }
  }
  // 其他佈局樣式...
};
```

### 主題切換實現

我們提供了兩種主題切換機制：

1. **系統偏好響應**：通過 CSS 媒體查詢 `prefers-color-scheme` 自動適應系統設置

```tsx
// tailwind.config.js
module.exports = {
  darkMode: 'media', // 跟隨系統偏好
  // ...
}
```

2. **手動切換**：通過 React Context 實現全局主題控制

```tsx
// ThemeContext.tsx
export const ThemeContext = React.createContext({
  mode: 'light' as ThemeMode,
  setMode: (mode: ThemeMode) => {},
  toggleMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  
  useEffect(() => {
    // 應用主題到 document 元素
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 保存用戶偏好到 localStorage
    localStorage.setItem('theme', mode);
  }, [mode]);
  
  // 初始化主題
  useEffect(() => {
    // 檢查本地存儲的主題偏好
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme) {
      setMode(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // 如果沒有存儲的偏好，則檢查系統偏好
      setMode('dark');
    }
  }, []);
  
  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 自定義主題

用戶可以通過多種方式自定義主題：

### 1. 全局覆蓋

通過在項目根目錄的 `tailwind.config.ts` 中擴展 SunUI 的配置：

```typescript
// 用戶的 tailwind.config.ts
import { tailwindConfig } from '@sunui-design/core';

export default {
  presets: [tailwindConfig],
  theme: {
    extend: {
      colors: {
        primary: {
          // 覆蓋主色調
          500: '#4f46e5', // 自定義品牌色
        }
      }
    }
  }
}
```

### 2. 組件級別覆蓋

通過 props 覆蓋單個組件的主題：

```jsx
<Card 
  theme="violet" // 使用預定義主題
  style={{ 
    // 或使用自定義樣式
    '--sunui-card-bg': '#f8f9fa',
    '--sunui-card-border': '#e9ecef'
  }}
>
  卡片內容
</Card>
```

### 3. CSS 變量覆蓋

通過 CSS 變量在全局或局部覆蓋主題：

```css
:root {
  --sunui-primary: #6366f1;
  --sunui-primary-light: #818cf8;
  --sunui-primary-dark: #4f46e5;
  /* 其他變量... */
}

/* 深色模式 */
.dark {
  --sunui-primary: #818cf8;
  --sunui-primary-light: #a5b4fc;
  --sunui-primary-dark: #6366f1;
  /* 其他變量... */
}
```

### 4. 自定義主題生成器

SunUI 提供了主題生成工具，可以根據基礎色自動生成完整的主題：

```typescript
// @sunui-design/core
import { generateTheme } from '@sunui-design/core/theme';

// 生成自定義主題
const customTheme = generateTheme({
  primary: '#0ea5e9', // 藍色
  secondary: '#8b5cf6', // 紫色
  success: '#10b981', // 綠色
  warning: '#f59e0b', // 琥珀色
  danger: '#ef4444', // 紅色
  info: '#3b82f6', // 藍色
});

// 應用自定義主題
<ThemeProvider theme={customTheme}>
  <App />
</ThemeProvider>
```

### 5. 動態主題切換

支持在運行時切換不同的主題：

```typescript
// 創建多個主題
const themes = {
  default: generateTheme({ primary: '#8b5cf6' }), // 默認紫色主題
  brand: generateTheme({ primary: '#0ea5e9' }), // 品牌藍色主題
  success: generateTheme({ primary: '#10b981' }), // 成功綠色主題
};

// 主題提供者
const ThemeContext = React.createContext({
  currentTheme: 'default',
  setCurrentTheme: (theme: string) => {},
  themes,
});

// 使用主題
const { currentTheme, setCurrentTheme, themes } = useTheme();

// 切換主題
<button onClick={() => setCurrentTheme('brand')}>
  切換到品牌主題
</button>
```

## 主題 Tokens

主題系統使用標準化的設計標記（tokens）確保一致性：

### 間距標記

```typescript
spacing: {
  '0': '0',
  '1': '0.25rem',    // 4px
  '2': '0.5rem',     // 8px
  '3': '0.75rem',    // 12px
  '4': '1rem',       // 16px
  '5': '1.25rem',    // 20px
  '6': '1.5rem',     // 24px
  '8': '2rem',       // 32px
  '10': '2.5rem',    // 40px
  '12': '3rem',      // 48px
  '16': '4rem',      // 64px
  '20': '5rem',      // 80px
  '24': '6rem',      // 96px
  // 其他間距...
}
```

### 字體標記

```typescript
fontSize: {
  'xs': '0.75rem',      // 12px
  'sm': '0.875rem',     // 14px
  'base': '1rem',       // 16px
  'lg': '1.125rem',     // 18px
  'xl': '1.25rem',      // 20px
  '2xl': '1.5rem',      // 24px
  '3xl': '1.875rem',    // 30px
  '4xl': '2.25rem',     // 36px
  // 其他字體大小...
}
```

### 響應式斷點

```typescript
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
},
```

### 圓角標記

```typescript
borderRadius: {
  'none': '0',
  'sm': '0.125rem',      // 2px
  'DEFAULT': '0.25rem',  // 4px
  'md': '0.375rem',      // 6px
  'lg': '0.5rem',        // 8px
  'xl': '0.75rem',       // 12px
  '2xl': '1rem',         // 16px
  'full': '9999px',      // 圓形
},
```

## 組件主題化最佳實踐

1. **使用語義化類名**：不直接使用顏色名稱，而是使用語義化類名
2. **結合 Tailwind 和 CSS 變量**：利用 Tailwind 的工具類和 CSS 變量的靈活性
3. **主題層級抽象**：將主題配置分為全局、組件類別和組件實例三個層級
4. **性能優化**：使用 useMemo 緩存主題計算結果
5. **漸進增強**：確保組件在沒有主題覆蓋的情況下仍有合理的默認外觀

### 命名約定

為了確保主題系統的一致性，我們採用以下命名約定：

```
--sunui-{組件名?}-{屬性}-{狀態?}
```

例如：
- `--sunui-primary`: 全局主色
- `--sunui-card-bg`: 卡片背景色
- `--sunui-button-bg-hover`: 按鈕懸停時的背景色

### CSS-in-JS 整合

對於使用 CSS-in-JS 庫（如 Emotion 或 Styled Components）的項目，我們提供了相應的主題整合：

```javascript
// Emotion 整合示例
import { css, Global } from '@emotion/react';
import { sunuiTheme } from '@sunui-design/core';

const globalStyles = css`
  :root {
    ${Object.entries(sunuiTheme.light).map(
      ([key, value]) => `--sunui-${key}: ${value};`
    ).join('\n')}
  }
  
  .dark {
    ${Object.entries(sunuiTheme.dark).map(
      ([key, value]) => `--sunui-${key}: ${value};`
    ).join('\n')}
  }
`;

const ThemeRoot = ({ children }) => (
  <>
    <Global styles={globalStyles} />
    {children}
  </>
);
```

## 實施範例

以下是一個組件如何實現主題化的完整範例：

```typescript
// 1. 定義主題選項類型
export type ButtonTheme = 'primary' | 'info' | 'success' | 'warning' | 'danger';

// 2. 組件內部主題實現
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  theme = 'primary',
  variant = 'solid',
  size = 'md',
  // 其他屬性...
}) => {
  // 計算主題樣式映射
  const themeStyles = React.useMemo(() => ({
    primary: {
      solid: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600',
      outline: 'border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/30',
      ghost: 'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30',
    },
    info: {
      solid: 'bg-info-600 text-white hover:bg-info-700 dark:bg-info-500 dark:hover:bg-info-600',
      outline: 'border-info-600 text-info-600 hover:bg-info-50 dark:border-info-500 dark:text-info-400 dark:hover:bg-info-900/30',
      ghost: 'text-info-600 hover:bg-info-50 dark:text-info-400 dark:hover:bg-info-900/30',
    },
    // 其他主題變體...
  }), []);

  // 計算尺寸樣式映射
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-2.5',
  };

  // 組合最終的樣式類
  const buttonClasses = cn(
    'rounded-md font-medium transition-colors focus:outline-none focus:ring-2',
    themeStyles[theme]?.[variant],
    sizeStyles[size],
    // 其他樣式類...
  );

  return (
    <button className={buttonClasses}>
      {children}
    </button>
  );
};
```

## 主題的可訪問性考量

為確保主題在各種場景下的可訪問性，我們遵循以下原則：

1. **色彩對比度**：所有文本與背景的對比度符合 WCAG 2.1 AA 標準
   - 普通文本：至少 4.5:1
   - 大字號文本：至少 3:1

2. **狀態指示**：不僅僅依賴顏色傳遞信息
   - 使用圖標、文本和顏色組合表示狀態
   - 為交互元素提供焦點狀態指示器

3. **高對比度模式**：提供高對比度主題選項
   - 增加文本與背景的對比度
   - 加強邊框和焦點指示器

4. **動態文本大小適應**：主題在不同文本大小下保持可用性
   - 使用相對單位 (rem/em) 而非絕對單位 (px)
   - 確保佈局在文本放大時不破壞

## 結論

SunUI Design 的主題系統結合了 TailwindCSS 的簡潔性和強大的自定義能力，提供了既統一又靈活的設計語言。系統支持從全局到組件級別的多層次自定義，同時確保了性能和可訪問性標準的達成。透過標準化的設計標記和一致的實現模式，使開發者能夠創建視覺一致且具有品牌特色的界面。

## 主題系統演進計劃

未來，SunUI Design 主題系統計劃增加以下功能：

1. **主題編輯工具**：可視化主題編輯器，實時預覽主題更改
2. **主題市場**：預設主題庫，可直接導入使用
3. **AI 主題生成**：根據品牌色自動生成和諧的主題
4. **動態主題**：基於時間或用戶行為自動切換主題 