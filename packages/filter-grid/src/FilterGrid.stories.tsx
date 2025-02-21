import type { Meta, StoryObj } from '@storybook/react';
import { FilterGrid } from './FilterGrid';
import { FilterGridTranslations, TechStack } from './types';

const defaultTranslations: FilterGridTranslations = {
    title: "技能展示",
    categories: {
        all: "全部"
    }
};

const meta = {
    title: 'Components/FilterGrid',
    component: FilterGrid,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof FilterGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTechStacks: TechStack[] = [
    {
        category: "Programming",
        skills: [
            { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
            { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
            { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' }
        ]
    },
    {
        category: "Framework",
        skills: [
            { name: '.NET', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg' },
            { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
            { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
            { name: 'Tailwind CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
            { name: 'Vue.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
            { name: 'Flutter', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg' }
        ]
    },
    {
        category: "Game",
        skills: [
            { name: 'Unity', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg' }
        ]
    },
    {
        category: "AI",
        skills: [
            { name: 'Azure OpenAI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
            { name: 'Gemini', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' },
            { name: 'Computer Vision', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg' },
        ]
    },
    {
        category: "Other",
        skills: [
            { name: 'SQL Server', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg' },
            { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
            { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' }
        ]
    }
];

export const Primary: Story = {
    args: {
        techStacks: sampleTechStacks,
        translations: defaultTranslations,
        theme: 'light',
        shape: 'hexagon'
    },
    parameters: {
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#f8fafc' }
            ]
        }
    }
};

export const Dark: Story = {
    args: {
        ...Primary.args,
        theme: 'dark'
    },
    parameters: {
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#0f172a' }
            ]
        }
    }
};

export const Blue: Story = {
    args: {
        ...Primary.args,
        theme: 'blue'
    },
    parameters: {
        backgrounds: {
            default: 'blue',
            values: [
                { name: 'blue', value: '#172554' }
            ]
        }
    }
};

export const Green: Story = {
    args: {
        ...Primary.args,
        theme: 'green'
    },
    parameters: {
        backgrounds: {
            default: 'green',
            values: [
                { name: 'green', value: '#064e3b' }
            ]
        }
    }
};

export const Purple: Story = {
    args: {
        ...Primary.args,
        theme: 'purple'
    },
    parameters: {
        backgrounds: {
            default: 'purple',
            values: [
                { name: 'purple', value: '#4c1d95' }
            ]
        }
    }
};

export const Square: Story = {
    args: {
        ...Primary.args,
        shape: 'square'
    }
};

export const Circle: Story = {
    args: {
        ...Primary.args,
        shape: 'circle'
    }
};