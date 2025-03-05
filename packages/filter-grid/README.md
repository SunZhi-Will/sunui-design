# sunui-filter-grid

A flexible and responsive grid layout component with filtering capabilities.

## Installation

```bash
npm install sunui-filter-grid
```

## Features

- 🎯 TypeScript support
- 📱 Responsive grid layout
- 🔍 Built-in filtering functionality
- 🎨 Customizable styling
- 🌈 TailwindCSS integration

## Usage

```jsx
import { FilterGrid } from 'sunui-filter-grid';

function App() {
  const items = [
    { id: 1, category: 'tech', title: 'Item 1' },
    { id: 2, category: 'design', title: 'Item 2' },
    // ...more items
  ];

  return (
    <FilterGrid
      items={items}
      filterKey="category"
      renderItem={(item) => (
        <div key={item.id}>
          {item.title}
        </div>
      )}
    />
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| items | `Array<any>` | Array of items to display in the grid |
| filterKey | `string` | Key to use for filtering items |
| renderItem | `(item: any) => ReactNode` | Function to render each item |
| columns | `number` | Number of columns (default: 3) |
| gap | `number` | Gap between items in pixels (default: 16) |

## License

MIT 