import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardImage } from '@sunui-design/card';

type CardStory = StoryObj<typeof Card>;

const meta = {
    title: 'Components/Card',
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;

// 基本卡片
export const Basic: CardStory = {
    args: {
        variant: 'outlined',
        size: 'md',
    },
    render: (args) => (
        <Card {...args}>
            <CardHeader className="">
                <h3 className="text-lg font-semibold">基本卡片</h3>
            </CardHeader>
            <CardContent className="">
                <p className="text-gray-600">這是一個基本的卡片組件示例。</p>
            </CardContent>
        </Card>
    ),
};

// 不同主題
export const Themes: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card theme="violet">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">Violet 主題</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">紫色主題的卡片。</p>
                </CardContent>
            </Card>
            <Card theme="cyan">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">Cyan 主題</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">青色主題的卡片。</p>
                </CardContent>
            </Card>
            <Card theme="orange">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">Orange 主題</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">橙色主題的卡片。</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 不同樣式
export const Variants: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="outlined">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">Outlined 樣式</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">帶有邊框的卡片樣式。</p>
                </CardContent>
            </Card>
            <Card variant="filled">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">Filled 樣式</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">填充背景的卡片樣式。</p>
                </CardContent>
            </Card>
            <Card variant="elevated">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">Elevated 樣式</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">帶有陰影的卡片樣式。</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 不同尺寸
export const Sizes: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card size="sm">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">小尺寸</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">較小的內邊距。</p>
                </CardContent>
            </Card>
            <Card size="md">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">中尺寸</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">標準內邊距。</p>
                </CardContent>
            </Card>
            <Card size="lg">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">大尺寸</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">較大的內邊距。</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 載入狀態
export const LoadingStates: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card loading={true} loadingMode="skeleton" theme="violet">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">骨架屏載入</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">使用骨架屏顯示載入狀態。</p>
                </CardContent>
            </Card>
            <Card loading={true} loadingMode="overlay" theme="cyan">
                <CardHeader className="">
                    <h3 className="text-lg font-semibold">覆蓋式載入</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">使用覆蓋式載入動畫。</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// 完整卡片示例
export const Complete: CardStory = {
    args: {
        theme: 'violet',
        variant: 'elevated',
        size: 'lg',
    },
    render: (args) => (
        <div
            role="button"
            tabIndex={0}
            onClick={() => alert('卡片被點擊了！')}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    alert('卡片被點擊了！');
                }
            }}
            className="cursor-pointer"
        >
            <Card {...args}>
                <CardImage
                    className=""
                    src="https://picsum.photos/400/200"
                    alt="示例圖片"
                    loading="lazy"
                    fallback="https://via.placeholder.com/400x200"
                />
                <CardHeader className="" showDivider>
                    <h3 className="text-lg font-semibold">完整卡片示例</h3>
                    <p className="text-sm text-gray-500">副標題</p>
                </CardHeader>
                <CardContent className="" showDivider>
                    <p className="text-gray-600">
                        這是一個完整的卡片示例，包含圖片、標題、內容和底部按鈕。
                        卡片具有 hover 效果和點擊事件。
                    </p>
                </CardContent>
                <CardFooter className="">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        了解更多
                    </button>
                </CardFooter>
            </Card>
        </div>
    ),
}; 