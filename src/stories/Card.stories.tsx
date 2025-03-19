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
        children: 'This is a card component',
    },
};

export const WithCustomClass: Story = {
    args: {
        children: 'Card with custom styles',
        className: 'bg-blue-100 p-4',
    },
}; 