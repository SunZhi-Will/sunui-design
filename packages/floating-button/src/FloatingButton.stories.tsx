import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FloatingButton } from './FloatingButton';
import { SocialButton } from '@sun-ui/social-button';
import type { SocialButtonProps } from '@sun-ui/social-button';

const meta: Meta<typeof FloatingButton> = {
    title: 'Components/FloatingButton',
    component: FloatingButton,
    parameters: {
        layout: 'fullscreen',
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#f8fafc' },
                { name: 'dark', value: '#1e293b' },
            ],
        },
    },
    tags: ['autodocs'],
    argTypes: {
        show: {
            control: 'boolean',
            description: '控制按鈕是否顯示',
            defaultValue: true
        },
        isOpen: {
            control: 'boolean',
            description: '控制選單是否展開（受控模式）'
        },
        defaultOpen: {
            control: 'boolean',
            description: '預設選單是否展開（非受控模式）',
            defaultValue: false
        },
        onOpenChange: {
            description: '選單開關狀態改變時的回調函數'
        },
        position: {
            control: 'select',
            options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
            description: '組件的位置',
            defaultValue: 'bottom-right'
        },
        className: {
            control: 'text',
            description: '自定義容器類名'
        },
        buttonClassName: {
            control: 'text',
            description: '自定義按鈕類名'
        },
        children: {
            description: '自定義子元素'
        },
        buttons: {
            description: '花瓣式按鈕配置陣列'
        },
        variant: {
            control: 'radio',
            options: ['petal', 'vertical', 'grid'],
            description: '按鈕展開方式',
            defaultValue: 'petal'
        }
    }
};

export default meta;
type Story = StoryObj<typeof FloatingButton>;

const socialButtons = [
    {
        href: 'https://github.com',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
        ),
        className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50",
        iconClassName: "[filter:invert(1)]"
    },
    {
        href: 'https://twitter.com',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
            </svg>
        ),
        className: "from-blue-400/90 to-blue-500/90 hover:shadow-blue-400/50"
    },
    {
        href: 'https://linkedin.com',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
        ),
        className: "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
    }
];

const extendedSocialButtons = [
    ...socialButtons,
    {
        href: 'https://facebook.com',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
        ),
        className: "from-blue-600/90 to-blue-700/90 hover:shadow-blue-600/50"
    },
    {
        href: 'https://instagram.com',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
        ),
        className: "from-pink-500/90 to-purple-600/90 hover:shadow-pink-500/50"
    }
];

const gridButtons = [
    {
        href: "https://twitter.com",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
            </svg>
        ),
        className: "from-blue-400/90 to-blue-500/90 hover:shadow-blue-400/50",
        title: "分享到 Twitter",
        titleDisplay: "hover" as const
    },
    {
        href: "https://facebook.com",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
        ),
        className: "from-blue-600/90 to-blue-700/90 hover:shadow-blue-600/50",
        title: "分享到 Facebook",
        titleDisplay: "hover" as const
    },
    {
        href: "https://instagram.com",
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
        ),
        className: "from-pink-500/90 to-purple-600/90 hover:shadow-pink-500/50",
        title: "分享到 Instagram",
        titleDisplay: "hover" as const
    },
    {
        href: "mailto:?subject=分享",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        className: "from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50",
        title: "透過 Email 分享",
        titleDisplay: "hover" as const
    },
    {
        href: "#",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ),
        className: "from-gray-600/90 to-gray-700/90 hover:shadow-gray-500/50",
        title: "複製連結",
        titleDisplay: "hover" as const
    }
];

export const Default: Story = {
    args: {
        buttons: [
            {
                href: "https://github.com/SunZhi-Will",
                icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
                className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50",
                iconClassName: "[filter:invert(1)]"
            },
            {
                href: "https://www.linkedin.com/in/sunzhi-will",
                icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg",
                className: "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
            },
            {
                href: "mailto:sun055676@gmail.com",
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                ),
                className: "from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50"
            }
        ],
        position: 'bottom-right',
        variant: 'petal'
    },
    parameters: {
        docs: {
            description: {
                story: '這是一個基本的浮動按鈕示例，使用非受控模式。點擊主按鈕時，會以花瓣形式展開社交媒體連結。'
            }
        }
    },
    render: (args) => (
        <div className="relative w-full h-[400px] bg-slate-100">
            <FloatingButton {...args} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                <h1 className="text-4xl font-bold text-slate-900">
                    點擊右下角按鈕展開選單
                </h1>
                <p className="text-slate-600 text-lg">
                    展示基本的浮動按鈕功能
                </p>
            </div>
        </div>
    )
};

export const Vertical: Story = {
    args: {
        buttons: socialButtons,
        position: 'bottom-right',
        variant: 'vertical',
    },
    render: (args) => (
        <div className="relative w-full h-[400px] bg-white/80 rounded-lg shadow-lg">
            <FloatingButton {...args} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h1 className="text-4xl font-bold text-slate-900">
                    垂直展開模式
                </h1>
                <p className="text-slate-600 text-lg mt-2">
                    按鈕以垂直方向展開
                </p>
            </div>
        </div>
    )
};

export const Grid: Story = {
    args: {
        buttons: gridButtons,
        position: 'bottom-right',
        variant: 'grid',
    },
    render: (args) => (
        <div className="relative w-full h-[400px] bg-white/80 rounded-lg shadow-lg">
            <FloatingButton {...args} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <h1 className="text-4xl font-bold text-slate-900">
                    網格展開模式
                </h1>
                <p className="text-slate-600 text-lg mt-2">
                    按鈕以網格方式展開
                </p>
            </div>
        </div>
    )
};



export const Controlled: Story = {
    parameters: {
        docs: {
            description: {
                story: '這是一個受控模式的示例，展示如何通過外部狀態控制按鈕的展開/收合。'
            }
        }
    },
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative w-full h-[400px] bg-white/80 rounded-lg shadow-lg">
                <FloatingButton
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    buttons={[
                        {
                            href: "https://github.com/SunZhi-Will",
                            icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
                            className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50",
                            iconClassName: "[filter:invert(1)]"
                        },
                        {
                            href: "https://www.linkedin.com/in/sunzhi-will",
                            icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg",
                            className: "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
                        },
                        {
                            href: "mailto:sun055676@gmail.com",
                            icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            ),
                            className: "from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50"
                        }
                    ]}
                />
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                    <h1 className="text-4xl font-bold text-slate-900">
                        受控模式示例
                    </h1>
                    <p className="text-slate-600 text-lg mb-4">
                        展示如何使用外部狀態控制按鈕
                    </p>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-md hover:shadow-lg transition-all duration-300"
                    >
                        {isOpen ? '關閉選單' : '開啟選單'}
                    </button>
                </div>
            </div>
        );
    }
};

export const CustomChildren: Story = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示如何使用自定義子元素。使用 SocialButton 組件可以輕鬆實現自動排列的效果。'
            }
        }
    },
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative w-full h-[400px] bg-white/80 rounded-lg shadow-lg">
                <FloatingButton
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    position="bottom-right"
                    variant="petal"
                >
                    <SocialButton
                        href="https://github.com"
                        icon={
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.237 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        }
                        className="from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50"
                        title="在 GitHub 上關注我"
                        titleDisplay="hover"
                        titlePosition="bottom"
                    />
                    <SocialButton
                        href="https://linkedin.com"
                        icon={
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                        }
                        className="from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
                        title="在 LinkedIn 上連接"
                        titleDisplay="hover"
                        titlePosition="left"
                    />
                    <SocialButton
                        href="mailto:example@mail.com"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        }
                        className="from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50"
                        title="寄送郵件給我"
                        titleDisplay="always"
                        titlePosition="top"
                    />
                </FloatingButton>
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                    <h1 className="text-4xl font-bold text-slate-900">
                        自定義子元素示例
                    </h1>
                    <p className="text-slate-600 text-lg mb-4">
                        展示如何使用自定義的社交媒體按鈕
                    </p>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-md hover:shadow-lg transition-all duration-300"
                    >
                        {isOpen ? '關閉選單' : '開啟選單'}
                    </button>
                </div>
            </div>
        );
    }
};

export const GridStyle: Story = {
    args: {
        variant: 'grid',
        buttons: gridButtons
    }
};

export const MultipleButtons: Story = {
    args: {
        buttons: extendedSocialButtons
    }
}; 