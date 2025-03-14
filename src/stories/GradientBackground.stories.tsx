import type { Meta, StoryObj } from '@storybook/react';
import { GradientBackground } from '@sunui-design/gradient';
import type { GradientBackgroundProps } from '@sunui-design/gradient';

const meta = {
    title: 'Components/GradientBackground',
    component: GradientBackground,
    parameters: {
        layout: 'fullscreen',
    },
} as Meta<GradientBackgroundProps>;

export default meta;
type Story = StoryObj<GradientBackgroundProps>;

export const Default: Story = {
    args: {
        fromColor: "#172554",
        viaColor: "#1e3a8a",
        toColor: "#0f172a",
        glowFromColor: "#60a5fa",
        glowViaColor: "#2563eb",
        gridColor: "#3b82f6",
        gridSize: { width: 14, height: 24 },
        animationDuration: 12,
    },
};

export const Purple: Story = {
    args: {
        fromColor: "#4c1d95",
        viaColor: "#6d28d9",
        toColor: "#2e1065",
        glowFromColor: "#c084fc",
        glowViaColor: "#a855f7",
        gridColor: "#8b5cf6",
        gridSize: { width: 20, height: 30 },
        animationDuration: 8,
    },
};

export const FastAnimation: Story = {
    args: {
        fromColor: "#064e3b",
        viaColor: "#047857",
        toColor: "#022c22",
        glowFromColor: "#34d399",
        glowViaColor: "#10b981",
        gridColor: "#059669",
        gridSize: { width: 16, height: 28 },
        animationDuration: 4,
        animationScale: [1, 1.5, 1],
        animationOpacity: [0.4, 0.1, 0.4],
    },
}; 