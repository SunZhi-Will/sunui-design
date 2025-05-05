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
- Smooth draggable functionality with position persistence

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
        className: 'bg-gradient-to-r from-gray-600 to-gray-800 hover:shadow-gray-500/50'
    },
    {
        type: 'twitter' as const,
        href: 'https://twitter.com',
        className: 'bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-blue-500/50'
    },
    {
        type: 'facebook' as const,
        href: 'https://facebook.com',
        className: 'bg-gradient-to-r from-blue-600 to-blue-800 hover:shadow-blue-500/50'
    },
    {
        type: 'linkedin' as const,
        href: 'https://linkedin.com',
        className: 'bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-blue-600/50'
    },
    {
        type: 'instagram' as const,
        href: 'https://instagram.com',
        className: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-purple-500/50'
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

### Draggable Mode

Enable users to drag and position the floating button anywhere on the screen:

```tsx
<FloatingButton
    buttons={socialButtons}
    position="bottom-right"
    variant="petal"
    draggable={true}
    onPositionChange={(x, y) => console.log('New position:', x, y)}
    defaultPosition={{ x: 0, y: 0 }}
/>
```

### Saving Draggable Position

Use localStorage to persist the button position between sessions:

```tsx
import { useState, useEffect } from 'react';
import { FloatingButton } from '@sunui-design/floating';

function App() {
    // Initialize with saved position or default position
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('floatingButtonPosition');
        return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    });
    
    // Update position and save to localStorage
    const handlePositionChange = (x, y) => {
        const newPosition = { x, y };
        setPosition(newPosition);
        localStorage.setItem('floatingButtonPosition', JSON.stringify(newPosition));
    };
    
    return (
        <FloatingButton
            buttons={socialButtons}
            position="bottom-right"
            variant="petal"
            draggable={true}
            defaultPosition={position}
            onPositionChange={handlePositionChange}
        />
    );
}
```

## Props

| Prop             | Type                                                         | Description                                                                         |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| show             | boolean                                                      | Control button visibility                                                           |
| isOpen           | boolean                                                      | Control menu expansion (controlled mode)                                            |
| defaultOpen      | boolean                                                      | Default menu expansion state (uncontrolled mode)                                    |
| onOpenChange     | (open: boolean) => void                                      | Callback when menu state changes                                                    |
| position         | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' | Component position                                                                  |
| className        | string                                                       | Custom container styles                                                             |
| buttonClassName  | string                                                       | Custom button styles                                                                |
| variant          | 'petal' \| 'vertical' \| 'grid'                              | Button expansion mode                                                               |
| buttons          | SocialButtonProps[]                                          | Array of button configurations                                                      |
| showToggleButton | boolean                                                      | Whether to show the toggle button. When set to false, enables No Toggle Button mode |
| draggable        | boolean                                                      | Enable draggable mode                                                               |
| onPositionChange | (x: number, y: number) => void                               | Callback when position changes in draggable mode                                    |
| defaultPosition  | { x: number, y: number }                                     | Initial position in draggable mode                                                  |

## Draggable Mode Behavior

When using the draggable mode:

- Click the button to toggle the menu open/close
- Drag the button to move it around the screen
- The button's position will be maintained while dragging
- Use `onPositionChange` to save the position for persistence

## Button Styling

For proper gradient background rendering, include `bg-gradient-to-r` in your button className:

```tsx
const socialButtons = [
    {
        type: 'github',
        href: 'https://github.com',
        className: 'bg-gradient-to-r from-gray-600 to-gray-800' // Include bg-gradient-to-r
    }
];
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