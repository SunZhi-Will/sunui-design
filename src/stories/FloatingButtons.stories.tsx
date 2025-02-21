import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FloatingButtons from '../components/FloatingButton/FloatingButton';
import { motion } from 'framer-motion';
import { SocialButton } from '../components/SocialButton';

const meta = {
    title: 'Components/FloatingButtons',
    component: FloatingButtons,
    parameters: {
        layout: 'fullscreen',
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
} satisfies Meta<typeof FloatingButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

// 非受控模式
export const Default: Story = {
    args: {
        show: true,
        defaultOpen: false,
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
        ]
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
            <FloatingButtons {...args} />
            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-4xl font-bold text-slate-800">
                    點擊右下角按鈕展開選單
                </h1>
            </div>
        </div>
    ),
};

// 受控模式
export const Controlled: Story = {
    parameters: {
        docs: {
            description: {
                story: '這是一個受控模式的示例，展示如何通過外部狀態控制按鈕的展開/收合。您可以通過點擊中間的按鈕來控制選單的開關狀態。'
            }
        }
    },
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative w-full h-[400px] bg-slate-100">
                <FloatingButtons
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
                    <h1 className="text-4xl font-bold text-slate-800">
                        受控模式示例
                    </h1>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        {isOpen ? '關閉選單' : '開啟選單'}
                    </button>
                </div>
            </div>
        );
    }
};

// 自定義子元素示例
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
            <div className="relative w-full h-[400px] bg-slate-100">
                <FloatingButtons
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    position="bottom-right"
                    variant="petal"
                >
                    <SocialButton
                        href="https://github.com"
                        icon={
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
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
                </FloatingButtons>
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                    <h1 className="text-4xl font-bold text-slate-800">
                        自定義子元素示例
                    </h1>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        {isOpen ? '關閉選單' : '開啟選單'}
                    </button>
                </div>
            </div>
        );
    }
};

// 自定義按鈕配置示例
export const CustomButtons: Story = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示了如何自定義按鈕的外觀和行為。每個按鈕都有獨特的顏色和懸停效果，並連結到不同的社交媒體平台。'
            }
        }
    },
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
            },
            {
                href: "https://twitter.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                    </svg>
                ),
                className: "from-blue-400/90 to-blue-500/90 hover:shadow-blue-400/50"
            },
            {
                href: "https://facebook.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                ),
                className: "from-blue-600/90 to-blue-700/90 hover:shadow-blue-600/50"
            }
        ]
    }
};

// 不同位置示例
export const DifferentPositions: Story = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示了按鈕組可以放置的不同位置：右下、左下、右上、左上。每個位置的按鈕都保持相同的展開動畫效果。'
            }
        }
    },
    render: () => (
        <div className="relative w-full h-[400px] bg-slate-100">
            {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
                <FloatingButtons
                    key={pos}
                    position={pos as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'}
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
            ))}
            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-4xl font-bold text-slate-800">
                    不同位置的展開效果
                </h1>
            </div>
        </div>
    )
};

// 垂直展開示例
export const VerticalLayout: Story = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示了垂直佈局模式，按鈕會在垂直方向上展開，適合側邊欄或需要垂直排列的場景。'
            }
        }
    },
    args: {
        variant: 'vertical',
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
        ]
    }
};

// 網格布局展開示例
export const GridStyle: Story = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示了網格布局的展開效果，按鈕以整齊的網格方式展開。'
            }
        }
    },
    args: {
        variant: 'grid',
        buttons: [
            {
                href: "https://twitter.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                    </svg>
                ),
                className: "from-blue-400/90 to-blue-500/90 hover:shadow-blue-400/50",
                title: "分享到 Twitter",
                titleDisplay: "hover"
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
                titleDisplay: "hover"
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
                titleDisplay: "hover"
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
                titleDisplay: "hover"
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
                titleDisplay: "hover"
            }
        ]
    },
    render: (args) => (
        <div className="relative w-full h-[400px] bg-slate-100">
            <FloatingButtons {...args} />
            <div className="relative z-10 flex items-center justify-center h-full">
                <h1 className="text-4xl font-bold text-slate-800">
                    網格布局展開示例
                </h1>
            </div>
        </div>
    )
};

// 多按鈕示例
export const MultipleButtons: Story = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示了如何設置多個社交媒體按鈕，每個按鈕都有獨特的圖標和顏色主題，適合作為社交媒體分享組件使用。'
            }
        }
    },
    args: {
        buttons: [
            {
                href: "https://github.com",
                icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
                className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50",
                iconClassName: "[filter:invert(1)]"
            },
            {
                href: "https://linkedin.com",
                icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg",
                className: "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
            },
            {
                href: "mailto:example@mail.com",
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                ),
                className: "from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50"
            },
            {
                href: "https://twitter.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                    </svg>
                ),
                className: "from-blue-400/90 to-blue-500/90 hover:shadow-blue-400/50"
            },
            {
                href: "https://facebook.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                ),
                className: "from-blue-600/90 to-blue-700/90 hover:shadow-blue-600/50"
            },
            {
                href: "https://instagram.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                ),
                className: "from-pink-500/90 to-purple-600/90 hover:shadow-pink-500/50"
            },
            {
                href: "https://youtube.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                ),
                className: "from-red-500/90 to-red-600/90 hover:shadow-red-500/50"
            },
            {
                href: "https://discord.com",
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                ),
                className: "from-indigo-500/90 to-indigo-600/90 hover:shadow-indigo-500/50"
            }
        ]
    }
};

// 帶有提示的按鈕示例
export const WithTooltips: Story = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示了如何使用帶有提示的社交按鈕。每個按鈕都有標題提示，可以選擇始終顯示、懸停顯示或不顯示。'
            }
        }
    },
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative w-full h-[400px] bg-slate-100">
                <FloatingButtons
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    position="bottom-right"
                    variant="petal"
                >
                    <SocialButton
                        href="https://github.com"
                        icon={
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        }
                        className="from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50"
                        title="在 GitHub 上關注我"
                        titleDisplay="hover"
                        titlePosition="top"
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
                        titlePosition="right"
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
                        titlePosition="bottom"
                    />
                </FloatingButtons>
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                    <h1 className="text-4xl font-bold text-slate-800">
                        帶有提示的按鈕示例
                    </h1>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        {isOpen ? '關閉選單' : '開啟選單'}
                    </button>
                </div>
            </div>
        );
    }
}; 