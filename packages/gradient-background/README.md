# sunui-gradient-background

A beautiful and animated gradient background component for React applications.

## Installation

```bash
npm install sunui-gradient-background
```

## Features

- 🎯 TypeScript support
- 🎨 Smooth gradient animations
- 📱 Responsive design
- 🌈 Multiple gradient presets
- ⚡ Optimized performance
- 🔧 Customizable colors and animation

## Usage

```jsx
import { GradientBackground } from 'sunui-gradient-background';

function App() {
  return (
    <GradientBackground
      preset="sunset"
      animated={true}
      speed={1}
    >
      <div>Your content here</div>
    </GradientBackground>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| preset | `'sunset' \| 'ocean' \| 'forest' \| 'aurora'` | Predefined gradient preset |
| animated | `boolean` | Enable/disable animation |
| speed | `number` | Animation speed (default: 1) |
| colors | `string[]` | Custom gradient colors |
| direction | `'diagonal' \| 'horizontal' \| 'vertical'` | Gradient direction |
| children | `ReactNode` | Content to render inside |

## Gradient Presets

- `sunset`: Warm orange to purple gradient
- `ocean`: Blue to cyan gradient
- `forest`: Green to teal gradient
- `aurora`: Multi-color northern lights effect

## License

MIT 