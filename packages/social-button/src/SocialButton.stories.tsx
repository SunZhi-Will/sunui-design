import type { Meta, StoryObj } from '@storybook/react';
import { SocialButton } from './SocialButton';
import React from 'react';

const meta: Meta<typeof SocialButton> = {
    title: 'Components/SocialButton',
    component: SocialButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        href: { control: 'text', description: '按鈕的連結地址' },
        icon: { control: 'text', description: '按鈕的圖標，可以是圖片 URL 或 React 元素' },
        position: { control: 'object', description: '按鈕的位置 {x, y}' },
        className: { control: 'text', description: '自定義按鈕樣式' },
        iconClassName: { control: 'text', description: '自定義圖標樣式' },
        title: { control: 'text', description: '按鈕的提示文字' },
        titleDisplay: {
            control: 'select',
            options: ['always', 'hover', 'none'],
            description: '提示文字的顯示方式'
        },
        titlePosition: {
            control: 'select',
            options: ['top', 'right', 'bottom', 'left'],
            description: '提示文字的位置'
        }
    }
};

export default meta;
type Story = StoryObj<typeof SocialButton>;

// 基本示例
export const Default: Story = {
    args: {
        href: "https://github.com/SunZhi-Will",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
        position: { x: 0, y: 0 },
        className: "from-purple-600/90 to-indigo-800/90",
        iconClassName: "[filter:invert(1)]",
        title: "GitHub",
        titleDisplay: "hover",
        titlePosition: "bottom"
    },
};

// 標題位置展示
export const TitlePositions: Story = {
    render: () => (
        <div className="relative w-[200px] h-[200px] bg-gray-100/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-10">
                {/* 右上角 */}
                <SocialButton
                    href="#"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                    position={{ x: 0, y: 0 }}
                    className="from-purple-600/90 to-indigo-800/90"
                    iconClassName="[filter:invert(1)]"
                    title="左上角"
                    titleDisplay="always"
                    titlePosition="top"
                />

                {/* 左上角 */}
                <SocialButton
                    href="#"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
                    position={{ x: 100, y: 0 }}
                    className="from-blue-600/90 to-blue-800/90"
                    title="右上角"
                    titleDisplay="always"
                    titlePosition="right"
                />

                {/* 左下角 */}
                <SocialButton
                    href="#"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg"
                    position={{ x: 0, y: 100 }}
                    className="from-white/90 to-white/90"
                    title="左下角"
                    titleDisplay="always"
                    titlePosition="left"
                />

                {/* 右下角 */}
                <SocialButton
                    href="#"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg"
                    position={{ x: 100, y: 100 }}
                    className="from-blue-600/90 to-blue-700/90"
                    title="右下角"
                    titleDisplay="always"
                    titlePosition="bottom"
                />
            </div>
        </div>
    )
};

// 九宮格布局
export const GridLayout: Story = {
    render: () => (
        <div className="relative w-[300px] h-[300px] bg-gray-100/30 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-10">
                {/* 第一行 */}
                <SocialButton
                    href="https://github.com"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                    position={{ x: 0, y: 0 }}
                    className="from-purple-600/90 to-indigo-800/90"
                    iconClassName="[filter:invert(1)]"
                    title="GitHub"
                    titleDisplay="hover"
                />
                <SocialButton
                    href="https://linkedin.com"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
                    position={{ x: 100, y: 0 }}
                    className="from-blue-600/90 to-blue-800/90"
                    title="LinkedIn"
                    titleDisplay="hover"
                />
                <SocialButton
                    href="https://twitter.com"
                    icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                        </svg>
                    }
                    position={{ x: 200, y: 0 }}
                    className="from-blue-400/90 to-blue-500/90"
                    title="Twitter"
                    titleDisplay="hover"
                />

                {/* 第二行 */}
                <SocialButton
                    href="https://facebook.com"
                    icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                    }
                    position={{ x: 0, y: 100 }}
                    className="from-blue-600/90 to-blue-700/90"
                    title="Facebook"
                    titleDisplay="hover"
                />
                <SocialButton
                    href="https://instagram.com"
                    icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                    }
                    position={{ x: 100, y: 100 }}
                    className="from-pink-500/90 to-purple-600/90"
                    title="Instagram"
                    titleDisplay="hover"
                />
                <SocialButton
                    href="mailto:example@mail.com"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    }
                    position={{ x: 200, y: 100 }}
                    className="from-blue-500/90 to-blue-600/90"
                    title="Email"
                    titleDisplay="hover"
                />

                {/* 第三行 */}
                <SocialButton
                    href="https://youtube.com"
                    icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>
                    }
                    position={{ x: 0, y: 200 }}
                    className="from-red-500/90 to-red-600/90"
                    title="YouTube"
                    titleDisplay="hover"
                />
                <SocialButton
                    href="https://discord.com"
                    icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                    }
                    position={{ x: 100, y: 200 }}
                    className="from-indigo-500/90 to-indigo-600/90"
                    title="Discord"
                    titleDisplay="hover"
                />
                <SocialButton
                    href="https://github.com"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                    position={{ x: 200, y: 200 }}
                    className="from-purple-600/90 to-indigo-800/90"
                    iconClassName="[filter:invert(1)]"
                    title="GitHub"
                    titleDisplay="hover"
                />
            </div>
        </div>
    )
};
