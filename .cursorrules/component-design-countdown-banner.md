# CountdownBanner 倒數橫幅組件設計文檔

## 組件概述

CountdownBanner 是一個功能豐富的倒數計時橫幅組件，用於展示限時優惠、活動倒計時等時間敏感的信息。組件提供多種主題、佈局和顯示風格，支持深淺色模式，並內置流暢的動畫效果。

## 設計目標

- 提供視覺上吸引人的倒數計時展示
- 支持多種主題和佈局風格
- 實現深淺色模式切換
- 提供流暢的動畫和交互效果
- 支持國際化顯示 (中英文)
- 確保各種屏幕尺寸下的響應式設計

## 組件結構

### 主要組件

- `CountdownBanner`: 主倒數橫幅容器
- 內部時間單位顯示 (天、時、分、秒)
- 標題、副標題、折扣信息和價格顯示區域
- 行動按鈕 (CTA)

### 組件內部結構

倒數橫幅組件的內部實現結構如下：

```tsx
// 簡化版內部結構
export const CountdownBanner: React.FC<CountdownBannerProps> = ({
    title = '限時優惠活動',
    subtitle = '倒數結束，錯過不再',
    discount = '40% OFF',
    originalPrice = '42,000 NTD',
    discountedPrice = '25,200 NTD',
    endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ctaText = '立即查看優惠',
    onCtaClick = () => { },
    theme = 'gradient',
    className,
    style,
    showParticles = true,
    layout = 'modern',
    variant = 'card',
    language = 'zh',
    mode = 'dark'
}) => {
    const [timeLeft, setTimeLeft] = useState<TimeUnit>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [glowPulse, setGlowPulse] = useState(false);
    
    // ... 倒數計時邏輯和樣式計算
    
    return (
        <motion.div className={/* 組件容器樣式 */}>
            {/* 背景效果 */}
            {/* 粒子效果 */}
            {/* 主要內容 */}
            <div className="flex flex-col items-center justify-center relative z-10 text-center">
                {/* 標題和副標題 */}
                {/* 折扣顯示 */}
                {/* 價格信息 */}
                {/* 倒數計時區塊 */}
                <motion.div className="flex items-center justify-center mb-10 relative">
                    {/* 天、時、分、秒時間盒子 */}
                </motion.div>
                {/* CTA按鈕 */}
            </div>
        </motion.div>
    );
};
```

## 組件 API

```typescript
export type LanguageType = 'zh' | 'en';
export type ThemeMode = 'light' | 'dark';

export interface CountdownBannerProps {
    title?: string;                       // 橫幅標題
    subtitle?: string;                    // 橫幅副標題
    discount?: string;                    // 折扣信息 (例如: "40% OFF")
    originalPrice?: string;               // 原價格
    discountedPrice?: string;             // 折扣後價格
    endDate?: Date | string;              // 倒數結束日期
    ctaText?: string;                     // 按鈕文字
    onCtaClick?: () => void;              // 按鈕點擊處理函數
    theme?: 'orange' | 'violet' | 'cyan' | 'gradient' | 'dark';  // 主題顏色
    className?: string;                   // 自定義CSS類名
    style?: React.CSSProperties;          // 自定義內聯樣式
    showParticles?: boolean;              // 是否顯示粒子效果
    layout?: 'default' | 'spacious' | 'modern';  // 佈局風格
    variant?: 'card' | 'banner' | 'floating';    // 組件變體
    language?: LanguageType;              // 語言 (中文/英文)
    mode?: ThemeMode;                     // 主題模式 (深色/淺色)
}
```

### 屬性說明

- `theme`: 主題顏色
  - `orange`: 橙色主題
  - `violet`: 紫色主題
  - `cyan`: 青色主題
  - `gradient`: 漸變色主題
  - `dark`: 深藍色主題

- `layout`: 佈局風格
  - `default`: 傳統緊湊佈局
  - `spacious`: 寬敞佈局
  - `modern`: 現代化設計佈局

- `variant`: 組件變體
  - `card`: 卡片式設計
  - `banner`: 橫幅式設計
  - `floating`: 浮動懸浮設計

- `language`: 語言設置
  - `zh`: 中文
  - `en`: 英文

- `mode`: 主題模式
  - `dark`: 深色模式
  - `light`: 淺色模式

## 設計細節

### 樣式實現

倒數橫幅組件使用結合了 TailwindCSS 和 Framer Motion 來實現樣式和動畫效果，主要樣式特點包括：

1. **主題系統**：為每種顏色主題提供深淺色模式變體
2. **時間盒子設計**：精心設計的時間顯示容器，具有精緻的陰影、漸變和交互效果
3. **動畫效果**：使用 Framer Motion 實現的流暢動畫，包括進入/退出、懸停和數字變化動畫
4. **粒子效果**：可選的背景粒子動畫，增強視覺吸引力
5. **響應式設計**：適應不同屏幕尺寸的布局調整

### 時間盒子設計

時間盒子是本組件最關鍵的視覺元素之一，主要設計特點：

- **深色模式**：
  - 透明背景帶白色漸變光澤
  - 精心調整的陰影深度
  - 內部微妙的高光和陰影效果

- **淺色模式**：
  - 白色/淺灰色背景
  - 純黑色文字確保最佳可讀性
  - 柔和的陰影和邊框

每個時間盒子的內部結構：
```jsx
<motion.div className={getTimeBoxClass()} whileHover="hover" variants={timeItemAnimation}>
    <AnimatePresence mode="popLayout">
        <motion.span className={getTimeDigitClass()} key={`days-${timeLeft.days}`}>
            {padWithZero(timeLeft.days)}
        </motion.span>
    </AnimatePresence>
    {/* 內部漸變效果 */}
    <motion.div className={cn("absolute inset-0 pointer-events-none", getTimeBoxInnerEffectClass())}
               animate={{ opacity: [0.1, 0.2, 0.1] }}
               transition={{ duration: 1, repeat: Infinity }} />
    {/* 底部陰影效果 */}
    <motion.div className={cn("absolute inset-x-0 bottom-0 h-1/3 pointer-events-none bg-gradient-to-t",
                             mode === 'dark' ? "from-black/20 to-transparent" : "from-black/[0.03] to-transparent")}
               animate={{ opacity: [0.5, 0.8, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }} />
</motion.div>
```

### 國際化支持

組件內置中英文支持，通過 `language` 屬性切換：

```typescript
const translations = {
    zh: {
        days: '天',
        hours: '時',
        minutes: '分',
        seconds: '秒',
        originalPrice: '原價',
        discountedPrice: '優惠價'
    },
    en: {
        days: 'Days',
        hours: 'Hrs',
        minutes: 'Min',
        seconds: 'Sec',
        originalPrice: 'Original Price',
        discountedPrice: 'Sale Price'
    }
};
```

## 使用示例

### 基本使用

```tsx
import { CountdownBanner } from '@sunui-design/countdown-banner';

export default function Example() {
  return (
    <CountdownBanner
      title="Limited Time Offer"
      subtitle="Hurry, offer ends soon!"
      discount="40% OFF"
      originalPrice="$1,199"
      discountedPrice="$719"
      endDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
      ctaText="Shop Now"
      theme="gradient"
      language="en"
    />
  );
}
```

### 淺色主題示例

```tsx
import { CountdownBanner } from '@sunui-design/countdown-banner';

export default function LightThemeExample() {
  return (
    <CountdownBanner
      title="Special Summer Sale"
      subtitle="Limited quantities available"
      discount="30% OFF"
      originalPrice="$899"
      discountedPrice="$629"
      endDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}
      ctaText="Buy Now"
      theme="orange"
      mode="light"
      language="en"
    />
  );
}
```

### 浮動變體示例

```tsx
import { CountdownBanner } from '@sunui-design/countdown-banner';

export default function FloatingExample() {
  return (
    <CountdownBanner
      title="Flash Sale"
      subtitle="Today only!"
      discount="50% OFF"
      originalPrice="$499"
      discountedPrice="$249"
      endDate={new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()}
      ctaText="Get Deal"
      theme="violet"
      variant="floating"
      language="en"
    />
  );
}
```

## 可訪問性考慮

- 確保文本顏色在不同背景下有足夠的對比度
- 提供可聚焦的行動按鈕
- 數字顯示大小適合各種視力需求
- 有意義的標題和副標題支持屏幕閱讀器

## 性能優化

- 使用 `useRef` 和 `useInView` 進行視窗內可見性檢測，僅在可見時觸發動畫
- 粒子效果進行了性能優化，限制數量並使用效率算法
- 時間計算使用高效的數學運算
- 樣式計算使用緩存和記憶化技術

## 已知限制

- 粒子效果在低端設備上可能影響性能
- 非常長的文本可能需要額外樣式調整
- 自定義主題目前僅支持預定義的主題顏色 