import type { Meta, StoryObj } from '@storybook/react';

interface CardProps {
    title: string;
    content: string;
    onClick?: () => void;
}

const Card = ({ title, content, onClick }: CardProps) => {
    return (
        <div
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{content}</p>
        </div>
    );
};

const meta: Meta<typeof Card> = {
    title: 'Components/Card',
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
    args: {
        title: '示例卡片',
        content: '這是一個基本的卡片組件示例。',
    },
};

export const WithClick: Story = {
    args: {
        title: '可點擊卡片',
        content: '點擊此卡片可以觸發事件。',
        onClick: () => alert('卡片被點擊了！'),
    },
}; 