import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FloatingButton } from './FloatingButton';
import type { FloatingButtonProps } from './types';

const meta = {
    title: 'Components/FloatingButton',
    component: FloatingButton,
    argTypes: {
        show: {
            control: 'boolean',
            description: '是否顯示浮動按鈕',
            defaultValue: true
        },
        isOpen: {
            control: 'boolean',
            description: '是否展開按鈕組',
            defaultValue: undefined
        },
        defaultOpen: {
            control: 'boolean',
            description: '默認是否展開',
            defaultValue: false
        },
        position: {
            control: 'select',
            options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
            description: '浮動按鈕位置',
            defaultValue: 'bottom-right'
        },
        variant: {
            control: 'select',
            options: ['petal', 'vertical', 'grid'],
            description: '展開方式',
            defaultValue: 'petal'
        },
        showToggleButton: {
            control: 'boolean',
            description: '是否顯示展開按鈕',
            defaultValue: true
        }
    }
};

export default meta;

type Story = StoryObj<FloatingButtonProps>;

const socialButtons = [
    {
        type: 'github' as const,
        href: 'https://github.com',
        className: 'from-gray-600/90 to-gray-800/90 hover:shadow-gray-500/50'
    },
    {
        type: 'twitter' as const,
        href: 'https://twitter.com',
        className: 'from-blue-400/90 to-blue-600/90 hover:shadow-blue-500/50'
    },
    {
        type: 'facebook' as const,
        href: 'https://facebook.com',
        className: 'from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50'
    },
    {
        type: 'linkedin' as const,
        href: 'https://linkedin.com',
        className: 'from-blue-700/90 to-blue-900/90 hover:shadow-blue-600/50'
    },
    {
        type: 'instagram' as const,
        href: 'https://instagram.com',
        className: 'from-pink-500/90 to-purple-600/90 hover:shadow-purple-500/50'
    }
];

const generateManyButtons = (count: number) => {
    const result: typeof socialButtons = [];
    const baseButtons = socialButtons;

    for (let i = 0; i < count; i++) {
        result.push({
            ...baseButtons[i % baseButtons.length],
            href: `${baseButtons[i % baseButtons.length].href}/${i + 1}`
        });
    }
    return result;
};

export const Basic: Story = {
    args: {
        buttons: socialButtons.slice(0, 3),
        position: 'bottom-right',
        variant: 'petal'
    }
};

export const AllSocialButtons: Story = {
    args: {
        buttons: generateManyButtons(30),
        position: 'bottom-right',
        variant: 'petal'
    }
};

export const NoToggleButton: Story = {
    args: {
        buttons: socialButtons,
        position: 'bottom-right',
        variant: 'petal',
        showToggleButton: false,
        defaultOpen: true
    }
};

export const Positions: Story = {
    render: () => (
        <div>
            <FloatingButton
                buttons={socialButtons.slice(0, 3)}
                position="top-left"
                variant="petal"
            />
            <FloatingButton
                buttons={socialButtons.slice(0, 3)}
                position="top-right"
                variant="petal"
            />
            <FloatingButton
                buttons={socialButtons.slice(0, 3)}
                position="bottom-left"
                variant="petal"
            />
            <FloatingButton
                buttons={socialButtons.slice(0, 3)}
                position="bottom-right"
                variant="petal"
            />
        </div>
    )
};

export const VerticalLayout: Story = {
    args: {
        buttons: socialButtons,
        variant: 'vertical',
        position: 'bottom-right'
    }
};

export const GridLayout: Story = {
    args: {
        buttons: socialButtons,
        variant: 'grid',
        position: 'bottom-right'
    }
}; 