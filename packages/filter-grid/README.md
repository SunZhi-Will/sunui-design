# FilterGrid

A grid component for displaying skills or categorized content with filtering, pagination, and loading states.

## Features

- Multiple themes: light, dark, blue, green, purple
- Multiple shapes: hexagon, square, circle
- Customizable categories and items
- Icon support with hover effects
- Responsive design
- Customizable styles for all elements
- Pagination support
- Infinite scroll support
- Loading states with animations
- Click handlers for items
- Optional title and category filters
- Customizable item dimensions
- Smooth animations and transitions

## Installation

```bash
npm install @sunui-design/filter
# or
yarn add @sunui-design/filter
# or
pnpm add @sunui-design/filter
```

## Usage

### Basic Usage

```tsx
import { FilterGrid, GridItem } from '@sunui-design/filter';

const items = [
    { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', category: 'Framework' },
    { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg', category: 'Language' },
    { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', category: 'Language' },
    { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', category: 'Language' },
    { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', category: 'Framework' },
    { name: 'Vue.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg', category: 'Framework' },
    { name: 'Tailwind CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg', category: 'Framework' },
    { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', category: 'Tools' },
    { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg', category: 'Tools' },
    { name: 'VS Code', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg', category: 'Tools' }
];

const translations = {
    title: "Tech Stack",
    categories: {
        all: "All",
        Framework: "Frameworks",
        Language: "Programming Languages",
        Tools: "Tools"
    }
};

export default function App() {
    return (
        <FilterGrid
            translations={translations}
            theme="light"
            shape="hexagon"
        >
            {items.map(item => (
                <GridItem
                    key={item.name}
                    {...item}
                />
            ))}
        </FilterGrid>
    );
}
```

### With Pagination

```tsx
const PaginatedGrid = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return (
        <FilterGrid
            translations={translations}
            theme="light"
            shape="hexagon"
            usePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
        >
            {items.map(item => (
                <GridItem key={item.name} {...item} />
            ))}
        </FilterGrid>
    );
};
```

### With Infinite Scroll

```tsx
const InfiniteGrid = () => {
    const [loading, setLoading] = useState(false);
    
    const loadMore = async () => {
        setLoading(true);
        // Load more items logic
        setLoading(false);
    };

    return (
        <FilterGrid
            translations={translations}
            theme="light"
            shape="hexagon"
            loading={loading}
            loadMore={loadMore}
            loadingItemCount={3}
        >
            {items.map(item => (
                <GridItem key={item.name} {...item} />
            ))}
        </FilterGrid>
    );
};
```

### Icon-Only Grid

```tsx
<FilterGrid
    translations={translations}
    theme="light"
    shape="circle"
    width={60}
    height={60}
>
    {items.map(item => (
        <GridItem
            key={item.name}
            {...item}
            showName={false}
        />
    ))}
</FilterGrid>
```

### With Click Handlers

```tsx
<FilterGrid translations={translations}>
    {items.map(item => (
        <GridItem
            key={item.name}
            {...item}
            onClick={(name, category) => {
                console.log(`Clicked: ${name} (${category})`);
            }}
        />
    ))}
</FilterGrid>
```

## Props

### FilterGrid Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| children | ReactNode | GridItem components to display | - |
| translations | FilterGridTranslations | Text translations for the component | {} |
| theme | 'light' \| 'dark' \| 'blue' \| 'green' \| 'purple' | Visual theme | 'light' |
| shape | 'hexagon' \| 'square' \| 'circle' | Shape of the items | 'hexagon' |
| showTitle | boolean | Whether to show the title | true |
| showCategories | boolean | Whether to show category filters | true |
| categories | string[] | Custom category order/filter | [] |
| width | number | Item width in pixels | 120 |
| height | number | Item height in pixels | 138 |
| className | string | Additional container class names | '' |
| styles | FilterGridStyleProps | Custom style overrides | {} |
| loading | boolean | Whether items are loading | false |
| loadingItemCount | number | Number of loading placeholders | 3 |
| loadMore | () => void | Callback for infinite scroll | - |
| usePagination | boolean | Enable pagination mode | false |
| currentPage | number | Current page number | 1 |
| totalPages | number | Total number of pages | 1 |
| onPageChange | (page: number) => void | Page change callback | - |
| itemsPerPage | number | Items to show per page | 12 |

### GridItem Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| name | string | Display name | - |
| icon | string | Icon URL | - |
| category | string | Category for filtering | - |
| showName | boolean | Whether to show the name | true |
| onClick | (name: string, category?: string) => void | Click handler | - |
| width | number | Override item width | - |
| height | number | Override item height | - |

### FilterGridStyleProps

| Prop | Type | Description |
|------|------|-------------|
| container | string | Container styles |
| item | string | Item container styles |
| title | string | Title text styles |
| titleBar | string | Title bar styles |
| button | string | Category button styles |
| buttonActive | string | Active category button styles |
| icon | string | Item icon styles |
| label | string | Item label styles |

## License

MIT License

Copyright (c) 2024 SunUI Design

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 