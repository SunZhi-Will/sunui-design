import React, { useState, useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterGrid } from './FilterGrid';
import { GridItem } from './GridItem';
import type { FilterGridProps } from './types';

const defaultTranslations = {
    title: "Skills",
    categories: {
        all: "All"
    }
};

const meta = {
    title: 'Components/FilterGrid',
    component: FilterGrid,
    parameters: {
        layout: 'centered',
    },
} as Meta<FilterGridProps>;

export default meta;
type Story = StoryObj<FilterGridProps>;

const sampleItems = [
    { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg', category: 'Programming' },
    { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', category: 'Programming' },
    { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', category: 'Programming' },
    { name: '.NET', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg', category: 'Framework' },
    { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', category: 'Framework' },
    { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', category: 'Framework' },
    { name: 'Tailwind CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg', category: 'Framework' },
    { name: 'Vue.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg', category: 'Framework' },
    { name: 'Flutter', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg', category: 'Framework' },
    { name: 'Unity', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg', category: 'Game' },
    { name: 'Azure OpenAI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg', category: 'AI' },
    { name: 'Gemini', icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg', category: 'AI' },
    { name: 'Computer Vision', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg', category: 'AI' },
    { name: 'SQL Server', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg', category: 'Other' },
    { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', category: 'Other' },
    { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg', category: 'Other' }
];

const generateMoreItems = (startIndex: number, count: number) => {
    const frameworks = ['Angular', 'Svelte', 'Ember', 'Git', 'jQuery', 'Meteor'];
    const languages = ['TypeScript', 'Ruby', 'Go', 'Rust', 'Java', 'Kotlin'];
    const tools = ['Webpack', 'Vite', 'Babel', 'ESLint', 'Jest', 'Go'];

    return Array.from({ length: count }).map((_, index) => {
        const actualIndex = startIndex + index;
        let item;

        if (actualIndex % 3 === 0) {
            item = frameworks[actualIndex % frameworks.length];
            return {
                name: item,
                icon: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${item.toLowerCase()}/${item.toLowerCase()}-original.svg`,
                category: 'Framework'
            };
        } else if (actualIndex % 3 === 1) {
            item = languages[actualIndex % languages.length];
            return {
                name: item,
                icon: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${item.toLowerCase()}/${item.toLowerCase()}-original.svg`,
                category: 'Programming'
            };
        } else {
            item = tools[actualIndex % tools.length];
            return {
                name: item,
                icon: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${item.toLowerCase()}/${item.toLowerCase()}-original.svg`,
                category: 'Tools'
            };
        }
    });
};

const InfiniteScrollExample = () => {
    const [items, setItems] = useState(sampleItems);
    const [loading, setLoading] = useState(false);

    const handleLoadMore = useCallback(async () => {
        setLoading(true);
        // 模擬 API 請求延遲
        await new Promise(resolve => setTimeout(resolve, 1500));
        const newItems = generateMoreItems(items.length, 6);
        setItems(prev => [...prev, ...newItems]);
        setLoading(false);
    }, [items.length]);

    return (
        <FilterGrid
            translations={defaultTranslations}
            theme="light"
            shape="hexagon"
            loadMore={handleLoadMore}
            loading={loading}
            loadingItemCount={3}
        >
            {items.map((item) => (
                <GridItem
                    key={item.name}
                    {...item}
                />
            ))}
        </FilterGrid>
    );
};

const PaginationExample = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(sampleItems.length / itemsPerPage);

    return (
        <FilterGrid
            translations={defaultTranslations}
            theme="light"
            shape="hexagon"
            usePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
        >
            {sampleItems.map((item) => (
                <GridItem
                    key={item.name}
                    {...item}
                />
            ))}
        </FilterGrid>
    );
};

export const Primary: Story = {
    args: {
        translations: defaultTranslations,
        theme: 'light',
        shape: 'hexagon',
        children: sampleItems.map((item) => (
            <GridItem
                key={item.name}
                {...item}
            />
        ))
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

export const NoCategories: Story = {
    args: {
        ...Primary.args,
        showCategories: false
    }
};

export const WithClickHandler: Story = {
    args: {
        ...Primary.args,
        children: sampleItems.map((item) => (
            <GridItem
                key={item.name}
                {...item}
                onClick={(name, category) => {
                    alert(`Clicked: ${name} (${category})`);
                }}
            />
        ))
    }
};

export const WithPagination: Story = {
    render: () => <PaginationExample />
};

export const WithInfiniteScroll: Story = {
    render: () => <InfiniteScrollExample />
};

export const LoadingState: Story = {
    args: {
        ...Primary.args,
        loading: true,
        loadingItemCount: 6
    }
};

export const CustomCategories: Story = {
    args: {
        ...Primary.args,
        categories: ['Programming', 'Framework', 'Other']
    }
};

export const IconOnly: Story = {
    args: {
        ...Primary.args,
        children: sampleItems.map((item) => (
            <GridItem
                key={item.name}
                {...item}
                showName={false}
                width={60}
                height={60}
            />
        ))
    }
};