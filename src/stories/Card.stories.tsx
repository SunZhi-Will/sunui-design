import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../../packages/card/src/Card';

const meta: Meta<typeof Card> = {
    title: 'Components/Card',
    component: Card,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
    args: {
        children: '這是一個卡片元件',
    },
};

export const WithCustomClass: Story = {
    args: {
        children: '自定義樣式的卡片',
        className: 'bg-blue-100 p-4',
    },
}; 