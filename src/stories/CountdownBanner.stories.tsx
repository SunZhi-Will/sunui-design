import type { Meta, StoryObj } from '@storybook/react';
import { CountdownBanner } from '@sunui-design/countdown-banner';

const meta = {
    title: 'Components/CountdownBanner',
    component: CountdownBanner,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        theme: {
            control: { type: 'select' },
            options: ['orange', 'violet', 'cyan', 'gradient', 'dark'],
        },
        layout: {
            control: { type: 'select' },
            options: ['default', 'spacious', 'modern'],
        },
        variant: {
            control: { type: 'select' },
            options: ['card', 'banner', 'floating'],
        },
        language: {
            control: { type: 'select' },
            options: ['zh', 'en'],
        },
        mode: {
            control: { type: 'select' },
            options: ['light', 'dark'],
        },
        endDate: {
            control: { type: 'date' },
        },
        showParticles: {
            control: { type: 'boolean' },
        },
        onCtaClick: { action: 'clicked' },
    },
} satisfies Meta<typeof CountdownBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Calculate a date 10 days from now for the default end date
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 10);

export const Default: Story = {
    args: {
        title: 'Limited Time Offer',
        subtitle: 'Hurry, offer ends soon!',
        discount: '40% OFF',
        originalPrice: '$1,199',
        discountedPrice: '$719',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ctaText: 'Shop Now',
        theme: 'gradient',
        showParticles: true,
        layout: 'modern',
        variant: 'card',
        language: 'en',
        mode: 'dark',
    },
};

export const LightMode: Story = {
    args: {
        ...Default.args,
        mode: 'light',
        title: 'Light Mode Theme',
    },
};

export const ClassicLayout: Story = {
    args: {
        ...Default.args,
        layout: 'default',
        theme: 'orange',
        title: 'Classic Layout Style',
        language: 'en',
    },
};

export const ModernLayout: Story = {
    args: {
        ...Default.args,
        layout: 'modern',
        theme: 'gradient',
        title: 'Modern Layout Style',
        language: 'en',
    },
};

export const BannerVariant: Story = {
    args: {
        ...Default.args,
        variant: 'banner',
        title: 'Banner Style Example',
        language: 'en',
    },
};

export const FloatingVariant: Story = {
    args: {
        ...Default.args,
        variant: 'floating',
        title: 'Floating Style',
        language: 'en',
    },
};

export const DarkTheme: Story = {
    args: {
        ...Default.args,
        theme: 'dark',
        title: 'Dark Theme Style',
        discount: '35% OFF',
        originalPrice: '$999',
        discountedPrice: '$649',
        language: 'en',
    },
};

export const VioletTheme: Story = {
    args: {
        ...Default.args,
        theme: 'violet',
        title: 'Violet Theme Version',
        language: 'en',
    },
};

export const CyanTheme: Story = {
    args: {
        ...Default.args,
        theme: 'cyan',
        title: 'Cyan Theme Version',
        language: 'en',
    },
};

export const GradientTheme: Story = {
    args: {
        ...Default.args,
        theme: 'gradient',
        title: 'Gradient Theme Version',
        subtitle: 'Colorful design, limited time offer',
        language: 'en',
    },
};

export const LightOrangeTheme: Story = {
    args: {
        ...Default.args,
        theme: 'orange',
        mode: 'light',
        title: 'Light Orange Theme',
        language: 'en',
    },
};

export const LightVioletTheme: Story = {
    args: {
        ...Default.args,
        theme: 'violet',
        mode: 'light',
        title: 'Light Violet Theme',
        language: 'en',
    },
};

export const LightGradientTheme: Story = {
    args: {
        ...Default.args,
        theme: 'gradient',
        mode: 'light',
        title: 'Light Gradient Theme',
        subtitle: 'Colorful light design, limited offer',
        language: 'en',
    },
};

export const WithoutParticles: Story = {
    args: {
        ...Default.args,
        showParticles: false,
        title: 'Version Without Particles',
        language: 'en',
    },
};

export const ShortTimeLeft: Story = {
    args: {
        ...Default.args,
        title: 'Ending Soon',
        subtitle: 'Only a few hours left!',
        // Set endDate to 3 hours from now
        endDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        language: 'en',
    },
};

export const CustomContent: Story = {
    args: {
        title: 'Members Only Deal',
        subtitle: 'Exclusive offer for members, limited quantity',
        discount: '50% OFF',
        originalPrice: '$1,499',
        discountedPrice: '$749',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        ctaText: 'Join Now',
        theme: 'dark',
        layout: 'modern',
        variant: 'card',
        showParticles: true,
        language: 'en',
    },
}; 