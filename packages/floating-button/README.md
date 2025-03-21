# FloatingButton

A floating button component that can expand to display multiple child buttons.

## Features

- Three expansion modes: petal, vertical, grid
- Show/hide control
- Controlled and uncontrolled modes
- Customizable positions: bottom-right, bottom-left, top-right, top-left
- Custom child buttons support
- Gradient background and shadow effects
- No Toggle Button mode support

## Installation

```bash
npm install @sunui-design/floating-button
# or
yarn add @sunui-design/floating-button
# or
pnpm add @sunui-design/floating-button
```

## Usage

### Basic Usage

```tsx
import { FloatingButton } from '@sunui-design/floating';

const socialButtons = [
    {
        type: 'github' as const,
        href: 'https://github.com',
        className: 'from-primary-600/90 to-primary-800/90 hover:shadow-primary-500/50'
    },
    {
        type: 'twitter' as const,
        href: 'https://twitter.com',
        className: 'from-info-400/90 to-info-600/90 hover:shadow-info-500/50'
    },
    {
        type: 'facebook' as const,
        href: 'https://facebook.com',
        className: 'from-primary-600/90 to-primary-800/90 hover:shadow-primary-500/50'
    },
    {
        type: 'linkedin' as const,
        href: 'https://linkedin.com',
        className: 'from-info-700/90 to-info-900/90 hover:shadow-info-600/50'
    },
    {
        type: 'instagram' as const,
        href: 'https://instagram.com',
        className: 'from-warning-500/90 to-danger-600/90 hover:shadow-danger-500/50'
    }
];

export default function App() {
    return (
        <FloatingButton
            buttons={socialButtons}
            position="bottom-right"
            variant="petal"
        />
    );
}
```

### Vertical Layout

```tsx
<FloatingButton
    buttons={socialButtons}
    position="bottom-right"
    variant="vertical"
/>
```

### Grid Layout

```tsx
<FloatingButton
    buttons={socialButtons}
    position="bottom-right"
    variant="grid"
/>
```

### No Toggle Button

```tsx
<FloatingButton
    buttons={socialButtons}
    position="bottom-right"
    variant="petal"
    showToggleButton={false}
    defaultOpen={true}
/>
```

### Different Positions

```tsx
<div>
    <FloatingButton
        buttons={socialButtons.slice(0, 3)}
        position="top-left"
        variant="petal"
    />
    <FloatingButton
        buttons={socialButtons.slice(0, 3)}
        position="top-right"
        variant="petal"
    />
    <FloatingButton
        buttons={socialButtons.slice(0, 3)}
        position="bottom-left"
        variant="petal"
    />
    <FloatingButton
        buttons={socialButtons.slice(0, 3)}
        position="bottom-right"
        variant="petal"
    />
</div>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| show | boolean | Control button visibility |
| isOpen | boolean | Control menu expansion (controlled mode) |
| defaultOpen | boolean | Default menu expansion state (uncontrolled mode) |
| onOpenChange | (open: boolean) => void | Callback when menu state changes |
| position | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' | Component position |
| className | string | Custom container styles |
| buttonClassName | string | Custom button styles |
| variant | 'petal' \| 'vertical' \| 'grid' | Button expansion mode |
| buttons | SocialButtonProps[] | Array of button configurations |
| showToggleButton | boolean | Whether to show the toggle button. When set to false, enables No Toggle Button mode |

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