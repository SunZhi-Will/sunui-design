# FilterGrid

A grid component for displaying skills or categorized content.

## Features

- Multiple themes: light, dark, blue, green, purple
- Multiple shapes: hexagon, square, circle
- Customizable categories and items
- Icon support
- Responsive design

## Installation

```bash
npm install sunui-filter-grid
# or
yarn add sunui-filter-grid
# or
pnpm add sunui-filter-grid
```

## Usage

```tsx
import { FilterGrid, GridItem } from 'sunui-filter-grid';

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

### GridItem Props

| Prop | Type | Description |
|------|------|-------------|
| name | string | Display name |
| icon | string | Icon URL |
| category | string | Category for filtering |

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