import type { Meta, StoryObj } from '@storybook/react';
import { SocialButton } from './SocialButton';

const meta: Meta<typeof SocialButton> = {
    title: 'Components/SocialButton',
    component: SocialButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        href: {
            control: 'text',
            description: '按鈕的連結地址'
        },
        icon: {
            control: 'text',
            description: '按鈕的圖標，可以是圖片 URL 或 React 元素'
        },
        className: {
            control: 'text',
            description: '自定義按鈕類名'
        },
        iconClassName: {
            control: 'text',
            description: '自定義圖標類名'
        },
        title: {
            control: 'text',
            description: '按鈕的提示文字'
        },
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

export const Default: Story = {
    args: {
        href: 'https://github.com',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
        className: 'from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50',
        iconClassName: '[filter:invert(1)]'
    }
};

export const WithTitle: Story = {
    args: {
        href: 'https://github.com',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
        className: 'from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50',
        iconClassName: '[filter:invert(1)]',
        title: '在 GitHub 上關注我',
        titleDisplay: 'hover',
        titlePosition: 'bottom'
    }
};

export const AlwaysShowTitle: Story = {
    args: {
        href: 'https://github.com',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
        className: 'from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50',
        iconClassName: '[filter:invert(1)]',
        title: '在 GitHub 上關注我',
        titleDisplay: 'always',
        titlePosition: 'right'
    }
};

export const WithSVGIcon: Story = {
    args: {
        href: 'mailto:example@mail.com',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        className: 'from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50',
        title: '寄送郵件給我',
        titleDisplay: 'hover',
        titlePosition: 'top'
    }
};

export const Vertical: Story = {
    args: {
        href: 'https://twitter.com',
        icon: '/twitter.svg',
        position: { x: 0, y: 50 },
        className: 'from-blue-400 to-blue-600',
        variant: 'vertical',
    },
};

export const CustomIcon: Story = {
    args: {
        href: 'https://linkedin.com',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>,
        position: { x: 0, y: 0 },
        className: 'from-blue-600 to-blue-800',
    },
}; 