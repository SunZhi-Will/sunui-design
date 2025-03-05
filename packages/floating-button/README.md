# sunui-floating-button

An animated floating action button component for React applications.

## Installation

```bash
npm install sunui-floating-button
```

## Features

- 🎯 TypeScript support
- 🎨 Smooth animations powered by Framer Motion
- 📱 Responsive design
- 🎭 Multiple animation variants
- 🌈 Customizable styling

## Usage

```jsx
import { FloatingButton } from 'sunui-floating-button';

function App() {
  return (
    <FloatingButton
      icon={<PlusIcon />}
      onClick={() => console.log('Clicked!')}
      position="bottom-right"
      variant="scale"
    />
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| icon | `ReactNode` | Icon component to display |
| onClick | `() => void` | Click handler function |
| position | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | Button position |
| variant | `'scale' \| 'rotate' \| 'bounce'` | Animation variant |
| size | `'small' \| 'medium' \| 'large'` | Button size (default: 'medium') |
| color | `string` | Button color (default: 'primary') |

## Animation Variants

- `scale`: Button scales up on hover
- `rotate`: Button rotates on hover
- `bounce`: Button bounces on hover

## License

MIT 