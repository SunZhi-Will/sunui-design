import type { Meta, StoryObj } from '@storybook/react';
import { SidePanel } from '@sunui-design/side-panel';
import type { SidePanelProps } from '@sunui-design/side-panel';
import { useState } from 'react';

const EnhancedSidePanel = SidePanel as any;

const meta = {
    title: 'Components/SidePanel',
    component: EnhancedSidePanel,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: '側邊面板元件，用於顯示側邊內容，支援左右兩側展示。'
            }
        }
    },
} as Meta<SidePanelProps>;

export default meta;
type Story = StoryObj<typeof SidePanel>;

// 基本示例
const BasicTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                title="側邊面板"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">這是側邊面板的內容。</p>
                    <p className="text-gray-800">你可以在這裡放置任何內容。</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const Default: Story = {
    render: () => <BasicTemplate />,
    parameters: {
        docs: {
            description: {
                story: '最基本的側邊面板使用方式。'
            }
        }
    }
};

// 不同位置展示
const PositionsTemplate = () => {
    const [leftIsOpen, setLeftIsOpen] = useState(false);
    const [rightIsOpen, setRightIsOpen] = useState(false);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={leftIsOpen}
                onToggle={() => setLeftIsOpen(!leftIsOpen)}
                title="左側面板"
                position="left"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">這是左側面板。</p>
                    <p className="text-gray-800">通常用於導航菜單。</p>
                </div>
            </EnhancedSidePanel>

            <EnhancedSidePanel
                isOpen={rightIsOpen}
                onToggle={() => setRightIsOpen(!rightIsOpen)}
                title="右側面板"
                position="right"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">這是右側面板。</p>
                    <p className="text-gray-800">通常用於詳細信息或設置。</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const Positions: Story = {
    render: () => <PositionsTemplate />,
    parameters: {
        docs: {
            description: {
                story: '展示左側和右側兩種面板位置。'
            }
        }
    }
};

// 自定義樣式
const CustomStylesTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                title="自定義樣式面板"
                className="bg-blue-50"
                headerClassName="bg-blue-500 text-white"
                contentClassName="p-6"
                width="320px"
            >
                <div className="space-y-4">
                    <p className="text-blue-800">這是一個使用自定義樣式的面板。</p>
                    <p className="text-blue-600">你可以自定義面板的各個部分。</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const CustomStyles: Story = {
    render: () => <CustomStylesTemplate />,
    parameters: {
        docs: {
            description: {
                story: '展示如何自定義面板的樣式，包括背景色、標題樣式和內容樣式。'
            }
        }
    }
};

// 無按鈕版本
const NoButtonsTemplate = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                title="無按鈕面板"
                showToggleButton={false}
                showCloseButton={false}
            >
                <div className="space-y-4">
                    <p className="text-gray-800">這個面板沒有顯示切換按鈕和關閉按鈕。</p>
                    <p className="text-gray-800">適用於需要程式控制開關的場景。</p>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {isOpen ? '關閉面板' : '開啟面板'}
                    </button>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const NoButtons: Story = {
    render: () => <NoButtonsTemplate />,
    parameters: {
        docs: {
            description: {
                story: '展示如何創建沒有內建按鈕的面板，完全由外部控制。'
            }
        }
    }
};