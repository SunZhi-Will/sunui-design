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
npm install @sunui-design/social
# or
yarn add @sunui-design/social
# or
pnpm add @sunui-design/social
```

## Usage

### Basic Usage

```tsx
import { FilterGrid, GridItem } from '@sunui-design/social';

const items = [
    { name: 'React', icon: 'path/to/react-icon.svg', category: 'Framework' },
    { name: 'TypeScript', icon: 'path/to/ts-icon.svg', category: 'Language' },
    // ... more items
];

const translations = {
    title: "Skills",
    categories: {
        all: "All"
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

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 