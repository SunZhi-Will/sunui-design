# GradientBackground

An animated gradient background component with glow effects and grid overlay.

## Features

- Customizable gradient colors (from, via, to)
- Customizable glow effect colors
- Customizable grid color and size
- Adjustable animation duration
- Animation scale and opacity settings

## Installation

```bash
npm install sunui-gradient-background
# or
yarn add sunui-gradient-background
# or
pnpm add sunui-gradient-background
```

## Usage

```tsx
import { GradientBackground } from 'sunui-gradient-background';

export default function App() {
    return (
        <GradientBackground
            fromColor="#172554"
            viaColor="#1e3a8a"
            toColor="#0f172a"
            glowFromColor="#60a5fa"
            glowViaColor="#2563eb"
            gridColor="#3b82f6"
            gridSize={{ width: 14, height: 24 }}
            animationDuration={12}
            animationScale={[1, 1.5, 1]}
            animationOpacity={[0.4, 0.1, 0.4]}
        />
    );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| fromColor | string | Starting gradient color |
| viaColor | string | Middle gradient color |
| toColor | string | Ending gradient color |
| glowFromColor | string | Starting glow effect color |
| glowViaColor | string | Middle glow effect color |
| gridColor | string | Color of the grid overlay |
| gridSize | { width: number, height: number } | Size of grid cells |
| animationDuration | number | Duration of animation in seconds |
| animationScale | [number, number, number] | Scale values for animation |
| animationOpacity | [number, number, number] | Opacity values for animation |

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