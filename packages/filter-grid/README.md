# FilterGrid

A grid component for displaying skills or categorized content.

## Features

- Multiple themes: light, dark, blue, green, purple
- Multiple shapes: hexagon, square, circle
- Customizable categories and skills
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
import { FilterGrid } from 'sunui-filter-grid';

const techStacks = [
    {
        category: "Programming",
        skills: [
            { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
            { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
            { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' }
        ]
    },
    // ... more categories
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
            techStacks={techStacks}
            translations={translations}
            theme="light"
            shape="hexagon"
        />
    );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| techStacks | TechStack[] | Array of skill categories and their items |
| translations | FilterGridTranslations | Text translations for the component |
| theme | 'light' \| 'dark' \| 'blue' \| 'green' \| 'purple' | Visual theme |
| shape | 'hexagon' \| 'square' \| 'circle' | Shape of the skill items |

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