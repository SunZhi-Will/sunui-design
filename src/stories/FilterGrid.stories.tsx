import type { Meta, StoryObj } from '@storybook/react';
import { FilterGrid } from '../components/FilterGrid';
import type { FilterGridTranslations } from '../components/FilterGrid/types';


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

const sampleTechStacks = [
    {
        category: "Programming",
        items: [
            { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
            { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
            { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
            { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
            { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' }
        ]
    },
    {
        category: "Framework",
        items: [
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
        items: [
            { name: 'Unity', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg' }
        ]
    },
    {
        category: "AI",
        items: [
            { name: 'Azure OpenAI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
            { name: 'Gemini', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' },
            { name: 'Computer Vision', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg' },
        ]
    },
    {
        category: "Other",
        items: [
            { name: 'SQL Server', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg' },
            { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
            { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' }
        ]
    }
];

export const Default: Story = {
    args: {
        techStacks: sampleTechStacks,
        translations: defaultTranslations,
        showTitle: true,
    },
};

export const Light: Story = {
    args: {
        ...Default.args,
        theme: 'light',
    },
};

export const Dark: Story = {
    args: {
        ...Default.args,
        theme: 'dark',
    },
    parameters: {
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#1a1a1a' },
            ],
        },
    },
};

export const Blue: Story = {
    args: {
        ...Default.args,
        theme: 'blue',
    },
    parameters: {
        backgrounds: {
            default: 'blue',
            values: [
                { name: 'blue', value: '#0f172a' },
            ],
        },
    },
};

export const HexagonShape: Story = {
    args: {
        ...Default.args,
        shape: 'hexagon',
    },
};

export const CircleShape: Story = {
    args: {
        ...Default.args,
        shape: 'circle',
    },
}; 