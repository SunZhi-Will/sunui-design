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
                component: 'A side panel component for displaying side content, supporting both left and right positions.'
            }
        }
    },
} as Meta<SidePanelProps>;

export default meta;
type Story = StoryObj<typeof SidePanel>;

// Basic example
const BasicTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                title="Side Panel"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">This is the side panel content.</p>
                    <p className="text-gray-800">You can place any content here.</p>
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
                story: 'Basic usage of the side panel component.'
            }
        }
    }
};

// Different positions
const PositionsTemplate = () => {
    const [leftIsOpen, setLeftIsOpen] = useState(false);
    const [rightIsOpen, setRightIsOpen] = useState(false);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={leftIsOpen}
                onToggle={() => setLeftIsOpen(!leftIsOpen)}
                title="Left Panel"
                position="left"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">This is the left panel.</p>
                    <p className="text-gray-800">Typically used for navigation menus.</p>
                </div>
            </EnhancedSidePanel>

            <EnhancedSidePanel
                isOpen={rightIsOpen}
                onToggle={() => setRightIsOpen(!rightIsOpen)}
                title="Right Panel"
                position="right"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">This is the right panel.</p>
                    <p className="text-gray-800">Typically used for details or settings.</p>
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
                story: 'Demonstrates both left and right panel positions.'
            }
        }
    }
};

// Custom styles
const CustomStylesTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                title="Custom Styled Panel"
                className="bg-blue-50"
                headerClassName="bg-blue-500 text-white"
                contentClassName="p-6"
                width="320px"
            >
                <div className="space-y-4">
                    <p className="text-blue-800">This is a panel with custom styles.</p>
                    <p className="text-blue-600">You can customize various parts of the panel.</p>
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
                story: 'Shows how to customize panel styles, including background color, header style, and content style.'
            }
        }
    }
};

// No buttons version
const NoButtonsTemplate = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="relative w-full h-[400px] bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                title="No Buttons Panel"
                showToggleButton={false}
                showCloseButton={false}
            >
                <div className="space-y-4">
                    <p className="text-gray-800">This panel does not show toggle and close buttons.</p>
                    <p className="text-gray-800">Suitable for scenarios where programmatic control is needed.</p>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {isOpen ? 'Close Panel' : 'Open Panel'}
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
                story: 'Demonstrates how to create a panel without built-in buttons, controlled entirely externally.'
            }
        }
    }
};