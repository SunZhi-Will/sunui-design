# GradientBackground

An animated gradient background component with dynamic glow effects and customizable grid overlay.

## Features

- Customizable gradient colors (from, via, to)
- Dynamic glow effects with customizable colors
- Customizable grid overlay with adjustable size and color
- Smooth animations with configurable duration and effects
- Multiple animation layers for enhanced visual depth
- Responsive and full-screen design
- Zero-configuration defaults
- Built with Framer Motion for smooth animations
- TypeScript support

## Installation

```bash
npm install @sunui-design/gradient
# or
yarn add @sunui-design/gradient
# or
pnpm add @sunui-design/gradient
```

## Usage

### Basic Usage

```tsx
import { GradientBackground } from '@sunui-design/gradient';

export default function App() {
    return (
        <GradientBackground
            fromColor="#172554"
            viaColor="#1e3a8a"
            toColor="#0f172a"
            glowFromColor="#60a5fa"
            glowViaColor="#2563eb"
            gridColor="#3b82f6"
        />
    );
}
```

### Ocean Theme

```tsx
<GradientBackground
    fromColor="#0c4a6e"
    viaColor="#0369a1"
    toColor="#082f49"
    glowFromColor="#38bdf8"
    glowViaColor="#0ea5e9"
    gridColor="#0284c7"
    gridSize={{ width: 16, height: 28 }}
    animationDuration={8}
    animationScale={[1, 1.2, 1]}
    animationOpacity={[0.3, 0.1, 0.3]}
/>
```

### Sunset Theme

```tsx
<GradientBackground
    fromColor="#7c2d12"
    viaColor="#9a3412"
    toColor="#431407"
    glowFromColor="#fb923c"
    glowViaColor="#f97316"
    gridColor="#ea580c"
    gridSize={{ width: 20, height: 30 }}
    animationDuration={6}
    animationScale={[1, 1.4, 1]}
    animationOpacity={[0.4, 0.15, 0.4]}
/>
```

### Forest Theme

```tsx
<GradientBackground
    fromColor="#064e3b"
    viaColor="#047857"
    toColor="#022c22"
    glowFromColor="#34d399"
    glowViaColor="#10b981"
    gridColor="#059669"
    gridSize={{ width: 18, height: 26 }}
    animationDuration={10}
    animationScale={[1, 1.3, 1]}
    animationOpacity={[0.35, 0.12, 0.35]}
/>
```

### Custom Animation

```tsx
<GradientBackground
    fromColor="#4c1d95"
    viaColor="#6d28d9"
    toColor="#2e1065"
    glowFromColor="#c084fc"
    glowViaColor="#a855f7"
    gridColor="#8b5cf6"
    gridSize={{ width: 14, height: 24 }}
    animationDuration={4}
    animationScale={[1, 1.5, 1]}
    animationOpacity={[0.4, 0.1, 0.4]}
/>
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| fromColor | string | Starting gradient color | '#172554' |
| viaColor | string | Middle gradient color | '#1e3a8a' |
| toColor | string | Ending gradient color | '#0f172a' |
| glowFromColor | string | Starting glow effect color | '#60a5fa' |
| glowViaColor | string | Middle glow effect color | '#2563eb' |
| gridColor | string | Color of the grid overlay | '#3b82f6' |
| gridSize | { width: number, height: number } | Size of grid cells | { width: 14, height: 24 } |
| animationDuration | number | Duration of animation in seconds | 12 |
| animationScale | [number, number, number] | Scale values for animation | [1, 1.3, 1] |
| animationOpacity | [number, number, number] | Opacity values for animation | [0.3, 0.1, 0.3] |

## Animation Details

The component features multiple animation layers:

1. **Main Background**: Static radial gradient with customizable colors
2. **Primary Glow**: Animated radial gradient with configurable scale and opacity
3. **Secondary Glow**: Larger animated radial gradient with offset timing
4. **Grid Overlay**: Static grid pattern with adjustable size and color

The animation uses Framer Motion for smooth transitions and supports:
- Scale animation with three keyframes
- Opacity animation with three keyframes
- Configurable animation duration
- Infinite loop with easeInOut timing

## Examples

### Common Color Schemes

```tsx
// Ocean Theme
<GradientBackground
    fromColor="#0c4a6e"
    viaColor="#0369a1"
    toColor="#082f49"
    glowFromColor="#38bdf8"
    glowViaColor="#0ea5e9"
    gridColor="#0284c7"
/>

// Sunset Theme
<GradientBackground
    fromColor="#7c2d12"
    viaColor="#9a3412"
    toColor="#431407"
    glowFromColor="#fb923c"
    glowViaColor="#f97316"
    gridColor="#ea580c"
/>
```

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