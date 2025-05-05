import React, { useState } from 'react';
import type { Meta as _Meta, StoryObj } from '@storybook/react';
import { FloatingButton } from '@sunui-design/floating';
import type { FloatingButtonProps } from '@sunui-design/floating';

const EnhancedFloatingButton = FloatingButton as any;

const meta = {
    title: 'Components/FloatingButton',
    component: FloatingButton,
    argTypes: {
        show: {
            control: 'boolean',
            description: 'Whether to show the floating button',
            defaultValue: true
        },
        isOpen: {
            control: 'boolean',
            description: 'Whether to expand the button group',
            defaultValue: undefined
        },
        defaultOpen: {
            control: 'boolean',
            description: 'Whether to expand by default',
            defaultValue: false
        },
        position: {
            control: 'select',
            options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
            description: 'Floating button position',
            defaultValue: 'bottom-right'
        },
        variant: {
            control: 'select',
            options: ['petal', 'vertical', 'grid'],
            description: 'Expansion style',
            defaultValue: 'petal'
        },
        showToggleButton: {
            control: 'boolean',
            description: 'Whether to show the toggle button',
            defaultValue: true
        },
        draggable: {
            control: 'boolean',
            description: 'Whether the button is draggable',
            defaultValue: false
        },
        defaultPosition: {
            control: 'object',
            description: 'Initial position in draggable mode',
        }
    }
};

export default meta;

type Story = StoryObj<FloatingButtonProps>;

const socialButtons = [
    {
        type: 'github' as const,
        href: 'https://github.com',
        className: 'bg-gradient-to-r from-gray-600 to-gray-800 hover:shadow-gray-500/50'
    },
    {
        type: 'twitter' as const,
        href: 'https://twitter.com',
        className: 'bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-blue-500/50'
    },
    {
        type: 'facebook' as const,
        href: 'https://facebook.com',
        className: 'bg-gradient-to-r from-blue-600 to-blue-800 hover:shadow-blue-500/50'
    },
    {
        type: 'linkedin' as const,
        href: 'https://linkedin.com',
        className: 'bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-blue-600/50'
    },
    {
        type: 'instagram' as const,
        href: 'https://instagram.com',
        className: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-purple-500/50'
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

export const DraggableButton: Story = {
    args: {
        buttons: socialButtons.slice(0, 3),
        position: 'bottom-right',
        variant: 'petal',
        draggable: true,
        defaultPosition: { x: 0, y: 0 }
    }
};

// 更進階的拖曳按鈕示例，具有位置儲存功能
export const DraggableWithPersistence: Story = {
    render: () => {
        const [position, setPosition] = useState({ x: 0, y: 0 });

        return (
            <div className="flex flex-col gap-4">
                <div className="p-4 rounded-lg text-center">
                    <h3 className="text-lg text-black font-semibold mb-2">Draggable Button with Position Memory</h3>
                    <p className="text-gray-600">
                        This demo allows you to drag the floating button within the container below.
                        The position will be remembered even if the component re-renders.
                    </p>
                </div>

                <div className="relative w-full h-[500px] border border-dashed border-gray-300 p-4 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="max-w-sm bg-gray-50/80 p-4 rounded-lg text-center">
                            <p className="text-gray-500 text-lg">Drag the button anywhere in this area.</p>
                            <p className="text-gray-400 text-sm mt-2">Position: x={Math.round(position.x)}, y={Math.round(position.y)}</p>
                        </div>
                    </div>

                    <FloatingButton
                        buttons={socialButtons.slice(0, 3)}
                        position="bottom-right"
                        variant="petal"
                        draggable={true}
                        defaultPosition={position}
                        onPositionChange={(x, y) => {
                            setPosition({ x, y });
                            console.log('Position updated:', { x, y });
                        }}
                    />
                </div>
            </div>
        );
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
            <EnhancedFloatingButton
                buttons={socialButtons.slice(0, 3)}
                position="top-left"
                variant="petal"
            />
            <EnhancedFloatingButton
                buttons={socialButtons.slice(0, 3)}
                position="top-right"
                variant="petal"
            />
            <EnhancedFloatingButton
                buttons={socialButtons.slice(0, 3)}
                position="bottom-left"
                variant="petal"
            />
            <EnhancedFloatingButton
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