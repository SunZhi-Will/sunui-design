import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardImage } from '@sunui-design/card';

type CardStory = StoryObj<typeof Card>;

const meta = {
    title: 'Components/Card',
    component: Card,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#f5f5f5' },
                { name: 'dark', value: '#1a1a1a' },
            ],
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['outlined', 'filled', 'elevated', 'glass', 'gradient'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl'],
        },
        theme: {
            control: 'select',
            options: ['violet', 'cyan', 'orange', 'gradient', 'dark', 'light'],
        },
        mode: {
            control: 'select',
            options: ['light', 'dark'],
        },
    },
} satisfies Meta<typeof Card>;

export default meta;

// 基本卡片 - 淺色模式
export const Basic: CardStory = {
    args: {
        variant: 'outlined',
        size: 'md',
        theme: 'violet',
        mode: 'light',
        hoverable: true,
        shadow: true,
    },
    render: (args) => (
        <div className="w-full max-w-md">
            <Card {...args}>
                <CardHeader mode={args.mode}>
                    <h3 className="text-2xl font-bold">基本卡片</h3>
                    <p className="text-sm opacity-70 mt-1">這是一個全新設計的現代化卡片</p>
                </CardHeader>
                <CardContent mode={args.mode}>
                    <p className="leading-relaxed opacity-80">
                        全新的卡片元件採用了現代化設計語言，具備更豐富的視覺效果和流暢的動畫。
                    </p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 深色模式卡片
export const DarkMode: CardStory = {
    parameters: {
        backgrounds: { default: 'dark' },
    },
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            <Card variant="outlined" theme="violet" mode="dark" hoverable shadow>
                <CardHeader mode="dark">
                    <h3 className="text-xl font-bold">深色卡片 - Violet</h3>
                </CardHeader>
                <CardContent mode="dark">
                    <p className="opacity-80">使用深色模式的紫色主題卡片</p>
                </CardContent>
            </Card>
            <Card variant="filled" theme="cyan" mode="dark" hoverable shadow>
                <CardHeader mode="dark">
                    <h3 className="text-xl font-bold">深色卡片 - Cyan</h3>
                </CardHeader>
                <CardContent mode="dark">
                    <p className="opacity-80">使用深色模式的青色主題卡片</p>
                </CardContent>
            </Card>
            <Card variant="elevated" theme="orange" mode="dark" hoverable shadow glow>
                <CardHeader mode="dark">
                    <h3 className="text-xl font-bold">深色卡片 - Orange</h3>
                </CardHeader>
                <CardContent mode="dark">
                    <p className="opacity-80">使用深色模式的橙色主題卡片，帶有光暈效果</p>
                </CardContent>
            </Card>
            <Card variant="glass" theme="gradient" mode="dark" hoverable shadow>
                <CardHeader mode="dark">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
                        漸變玻璃效果
                    </h3>
                </CardHeader>
                <CardContent mode="dark">
                    <p className="opacity-80">使用毛玻璃效果的漸變主題卡片</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 不同主題
export const Themes: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            <Card variant="filled" theme="violet" hoverable shadow glow>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold">Violet 主題</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80 leading-relaxed">
                        優雅的紫色主題，適合創意和設計相關的內容展示。
                    </p>
                </CardContent>
            </Card>
            
            <Card variant="filled" theme="cyan" hoverable shadow glow>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold">Cyan 主題</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80 leading-relaxed">
                        清新的青色主題，適合科技和創新相關的內容展示。
                    </p>
                </CardContent>
            </Card>
            
            <Card variant="filled" theme="orange" hoverable shadow glow>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold">Orange 主題</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80 leading-relaxed">
                        溫暖的橙色主題，適合活力和熱情相關的內容展示。
                    </p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 不同變體樣式
export const Variants: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            <Card variant="outlined" theme="violet" hoverable shadow>
                <CardHeader>
                    <h3 className="text-xl font-bold">Outlined</h3>
                    <p className="text-sm opacity-70 mt-1">簡約邊框樣式</p>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">帶有清晰邊框的簡約設計，適合需要明確界限的內容。</p>
                </CardContent>
            </Card>
            
            <Card variant="filled" theme="cyan" hoverable shadow>
                <CardHeader>
                    <h3 className="text-xl font-bold">Filled</h3>
                    <p className="text-sm opacity-70 mt-1">填充背景樣式</p>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">使用漸變背景填充，提供更豐富的視覺效果。</p>
                </CardContent>
            </Card>
            
            <Card variant="elevated" theme="orange" hoverable shadow glow>
                <CardHeader>
                    <h3 className="text-xl font-bold">Elevated</h3>
                    <p className="text-sm opacity-70 mt-1">浮起陰影樣式</p>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">帶有深度陰影效果，創造層次感和立體感。</p>
                </CardContent>
            </Card>
            
            <Card variant="glass" theme="violet" hoverable shadow>
                <CardHeader>
                    <h3 className="text-xl font-bold">Glass</h3>
                    <p className="text-sm opacity-70 mt-1">毛玻璃樣式</p>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">現代化的毛玻璃效果，提供半透明的精緻質感。</p>
                </CardContent>
            </Card>
            
            <Card variant="gradient" theme="gradient" hoverable shadow glow>
                <CardHeader>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
                        Gradient
                    </h3>
                    <p className="text-sm opacity-70 mt-1">漸變效果樣式</p>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">使用多色漸變背景，創造動感和活力。</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 不同尺寸
export const Sizes: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
            <Card size="sm" variant="filled" theme="violet" hoverable shadow>
                <CardHeader>
                    <h3 className="text-base font-bold">Small</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-sm opacity-80">緊湊的小尺寸</p>
                </CardContent>
            </Card>
            
            <Card size="md" variant="filled" theme="cyan" hoverable shadow>
                <CardHeader>
                    <h3 className="text-lg font-bold">Medium</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-sm opacity-80">標準的中等尺寸</p>
                </CardContent>
            </Card>
            
            <Card size="lg" variant="filled" theme="orange" hoverable shadow>
                <CardHeader>
                    <h3 className="text-xl font-bold">Large</h3>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">寬鬆的大尺寸</p>
                </CardContent>
            </Card>
            
            <Card size="xl" variant="filled" theme="gradient" hoverable shadow glow>
                <CardHeader>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
                        Extra Large
                    </h3>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">超大尺寸</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 載入狀態
export const LoadingStates: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            <Card loading={true} loadingMode="skeleton" theme="violet" variant="filled">
                <CardHeader>
                    <h3 className="text-xl font-bold">骨架屏載入</h3>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">使用骨架屏動畫顯示載入狀態。</p>
                </CardContent>
            </Card>
            
            <Card loading={true} loadingMode="shimmer" theme="cyan" variant="filled">
                <CardHeader>
                    <h3 className="text-xl font-bold">光澤載入效果</h3>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">使用閃爍光澤效果的載入動畫。</p>
                </CardContent>
            </Card>
            
            <Card loading={true} loadingMode="overlay" theme="orange" variant="filled">
                <CardHeader>
                    <h3 className="text-xl font-bold">覆蓋式載入</h3>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80">使用旋轉圖標覆蓋式載入動畫。</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 完整卡片示例 - 產品卡片
export const ProductCard: CardStory = {
    render: () => (
        <div className="w-full max-w-md">
            <Card 
                variant="elevated" 
                theme="violet" 
                size="lg" 
                hoverable 
                clickable 
                shadow 
                glow
                onClick={() => alert('產品卡片被點擊了！')}
            >
                <CardImage
                    src="https://picsum.photos/seed/product1/800/450"
                    alt="產品示例圖片"
                    loading="lazy"
                    fallback="https://via.placeholder.com/800x450"
                    aspectRatio="16/9"
                    overlay
                    overlayGradient="bottom"
                />
                <CardHeader showDivider>
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-2xl font-bold">Premium Product</h3>
                            <p className="text-sm opacity-70 mt-1">高品質產品系列</p>
                        </div>
                        <span className="px-3 py-1 bg-violet-500 text-white text-xs font-semibold rounded-full">
                            NEW
                        </span>
                    </div>
                </CardHeader>
                <CardContent showDivider>
                    <p className="opacity-80 leading-relaxed mb-4">
                        這是一個完整的產品卡片示例，展示了所有可用的功能和選項。
                        包含圖片、標題、描述和操作按鈕。
                    </p>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-sm opacity-60">原價</p>
                            <p className="text-lg line-through opacity-50">NT$ 1,999</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-60">特價</p>
                            <p className="text-3xl font-bold text-violet-600">NT$ 1,299</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter justify="between">
                    <button className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                        立即購買
                    </button>
                    <button className="px-4 py-3 border border-violet-300 text-violet-600 rounded-lg hover:bg-violet-50 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </CardFooter>
            </Card>
        </div>
    ),
};

// 文章卡片
export const ArticleCard: CardStory = {
    render: () => (
        <div className="w-full max-w-2xl">
            <Card 
                variant="glass" 
                theme="cyan" 
                size="lg" 
                hoverable 
                clickable 
                shadow
                onClick={() => alert('文章卡片被點擊了！')}
            >
                <CardImage
                    src="https://picsum.photos/seed/article1/1200/600"
                    alt="文章封面圖片"
                    loading="lazy"
                    aspectRatio="16/9"
                    overlay
                    overlayGradient="both"
                />
                <CardHeader>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded">
                            技術文章
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            5 分鐘閱讀
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold">探索現代 Web 開發的最佳實踐</h3>
                    <div className="flex items-center gap-3 mt-3 text-sm opacity-70">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
                            <span>作者名稱</span>
                        </div>
                        <span>•</span>
                        <span>2024年2月12日</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="opacity-80 leading-relaxed">
                        在這篇文章中，我們將深入探討現代 Web 開發的各種最佳實踐，
                        包括性能優化、可訪問性、用戶體驗設計等重要主題。
                        學習如何構建快速、可靠和用戶友好的 Web 應用程序。
                    </p>
                </CardContent>
                <CardFooter justify="between" showDivider>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>128</span>
                        </button>
                        <button className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>24</span>
                        </button>
                    </div>
                    <button className="px-5 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium">
                        閱讀文章
                    </button>
                </CardFooter>
            </Card>
        </div>
    ),
};

// 深色模式完整示例
export const DarkModeComplete: CardStory = {
    parameters: {
        backgrounds: { default: 'dark' },
    },
    render: () => (
        <div className="w-full max-w-md">
            <Card 
                variant="gradient" 
                theme="gradient" 
                mode="dark" 
                size="lg" 
                hoverable 
                clickable 
                shadow 
                glow
            >
                <CardImage
                    src="https://picsum.photos/seed/dark1/800/450"
                    alt="深色模式示例圖片"
                    loading="lazy"
                    aspectRatio="16/9"
                    overlay
                    overlayGradient="bottom"
                />
                <CardHeader mode="dark" showDivider>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-transparent bg-clip-text">
                        深色模式精品卡片
                    </h3>
                    <p className="text-sm opacity-70 mt-1">完美適配深色主題的現代設計</p>
                </CardHeader>
                <CardContent mode="dark">
                    <p className="opacity-80 leading-relaxed mb-4">
                        這是一個專為深色模式設計的精品卡片，使用漸變主題和毛玻璃效果，
                        提供優雅且現代的視覺體驗。
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">React</span>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">TypeScript</span>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">TailwindCSS</span>
                    </div>
                </CardContent>
                <CardFooter mode="dark" justify="between" showDivider>
                    <button className="px-6 py-3 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg font-semibold">
                        探索更多
                    </button>
                    <button className="px-4 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                </CardFooter>
            </Card>
        </div>
    ),
}; 