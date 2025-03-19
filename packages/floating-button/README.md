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
        className: 'from-gray-600/90 to-gray-800/90 hover:shadow-gray-500/50'
    },
    {
        type: 'twitter' as const,
        href: 'https://twitter.com',
        className: 'from-blue-400/90 to-blue-600/90 hover:shadow-blue-500/50'
    },
    {
        type: 'facebook' as const,
        href: 'https://facebook.com',
        className: 'from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50'
    },
    {
        type: 'linkedin' as const,
        href: 'https://linkedin.com',
        className: 'from-blue-700/90 to-blue-900/90 hover:shadow-blue-600/50'
    },
    {
        type: 'instagram' as const,
        href: 'https://instagram.com',
        className: 'from-pink-500/90 to-purple-600/90 hover:shadow-purple-500/50'
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

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 