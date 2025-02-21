import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GradientBackground } from '../components/GradientBackground';

const meta = {
    title: 'Components/GradientBackground',
    component: GradientBackground,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {
        fromColor: {
            control: 'color',
            description: '主要背景的起始顏色',
            defaultValue: '#172554'
        },
        viaColor: {
            control: 'color',
            description: '主要背景的中間顏色',
            defaultValue: '#1e3a8a'
        },
        toColor: {
            control: 'color',
            description: '主要背景的結束顏色',
            defaultValue: '#0f172a'
        },
        glowFromColor: {
            control: 'color',
            description: '光暈效果的起始顏色',
            defaultValue: '#60a5fa'
        },
        glowViaColor: {
            control: 'color',
            description: '光暈效果的中間顏色',
            defaultValue: '#2563eb'
        },
        gridColor: {
            control: 'color',
            description: '網格線的顏色',
            defaultValue: '#3b82f6'
        },
        gridSize: {
            control: 'object',
            description: '網格大小設定',
            defaultValue: { width: 14, height: 24 }
        },
        animationDuration: {
            control: { type: 'number', min: 1, max: 20, step: 1 },
            description: '動畫持續時間（秒）',
            defaultValue: 12
        },
        animationScale: {
            control: 'object',
            description: '縮放動畫的三個階段值',
            defaultValue: [1, 1.2, 1]
        },
        animationOpacity: {
            control: 'object',
            description: '透明度動畫的三個階段值',
            defaultValue: [0.4, 0.2, 0.4]
        }
    }
} satisfies Meta<typeof GradientBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        fromColor: '#172554',
        viaColor: '#1e3a8a',
        toColor: '#0f172a',
        glowFromColor: '#60a5fa',
        glowViaColor: '#2563eb',
        gridColor: '#3b82f6',
        gridSize: { width: 14, height: 24 },
        animationDuration: 12,
        animationScale: [1, 1.5, 1],
        animationOpacity: [0.6, 0.2, 0.6],
    },
    render: (args) => (
        <div className="relative w-full h-[400px]">
            <GradientBackground {...args} />
            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-4xl font-bold text-white">
                    漸層背景展示
                </h1>
            </div>
        </div>
    ),
};

export const PurpleTheme: Story = {
    args: {
        fromColor: '#1e1b4b',
        viaColor: '#581c87',
        toColor: '#3b0764',
        glowFromColor: '#c4b5fd',
        glowViaColor: '#a855f7',
        gridColor: '#8b5cf6',
        gridSize: { width: 16, height: 28 },
        animationDuration: 15,
        animationScale: [1, 1.6, 1],
        animationOpacity: [0.7, 0.3, 0.7],
    },
    render: (args) => (
        <div className="relative w-full h-[400px]">
            <GradientBackground {...args} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                <h1 className="text-4xl font-bold text-white">
                    Elegant Purple Theme
                </h1>
                <p className="text-lg text-violet-200">
                    優雅的紫色漸層背景
                </p>
            </div>
        </div>
    ),
};

export const WithContent: Story = {
    args: {
        fromColor: '#172554',
        viaColor: '#1e3a8a',
        toColor: '#0f172a',
        glowFromColor: '#60a5fa',
        glowViaColor: '#2563eb',
        gridColor: '#3b82f6',
        gridSize: { width: 14, height: 24 },
        animationDuration: 12,
        animationScale: [1, 1.5, 1],
        animationOpacity: [0.6, 0.2, 0.6],
    },
    render: (args) => (
        <div className="relative w-full h-[400px]">
            <GradientBackground {...args} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                <h1 className="text-4xl font-bold text-white">
                    歡迎使用
                </h1>
                <p className="text-xl text-blue-200">
                    這是一個帶有漸層背景的內容示例
                </p>
                <button className="px-6 py-2 text-white bg-blue-600 rounded-full hover:bg-blue-700">
                    點擊我
                </button>
            </div>
        </div>
    ),
};

export const LightTheme: Story = {
    args: {
        fromColor: '#ffffff',
        viaColor: '#f8fafc',
        toColor: '#f1f5f9',
        glowFromColor: '#818cf8',
        glowViaColor: '#38bdf8',
        gridColor: '#e2e8f0',
        gridSize: { width: 16, height: 28 },
        animationDuration: 15,
        animationScale: [1, 1.8, 1],
        animationOpacity: [0.8, 0.3, 0.8],
    },
    render: (args) => (
        <div className="relative w-full h-[400px]">
            <GradientBackground {...args} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                <h1 className="text-4xl font-bold text-slate-800">
                    Light Theme
                </h1>
                <p className="text-lg text-slate-600">
                    柔美光暈背景
                </p>
                <button className="px-6 py-2 text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all shadow-lg">
                    開始使用
                </button>
            </div>
        </div>
    ),
};

export const DarkTheme: Story = {
    args: {
        fromColor: '#020617',
        viaColor: '#0f172a',
        toColor: '#1e293b',
        glowFromColor: '#475569',
        glowViaColor: '#334155',
        gridColor: '#475569',
        gridSize: { width: 16, height: 28 },
        animationDuration: 15,
        animationScale: [1, 1.6, 1],
        animationOpacity: [0.5, 0.2, 0.5],
    },
    render: (args) => (
        <div className="relative w-full h-[400px]">
            <GradientBackground {...args} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                <h1 className="text-4xl font-bold text-white">
                    Dark Theme
                </h1>
                <p className="text-lg text-slate-300">
                    沉穩高級的深色背景
                </p>
                <button className="px-6 py-2 text-slate-900 bg-slate-200 rounded-full hover:bg-white">
                    探索更多
                </button>
            </div>
        </div>
    ),
}; 