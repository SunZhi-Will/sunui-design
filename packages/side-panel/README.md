# @sunui-design/side-panel

A modern side panel React component with smooth animations and rich customization options.

## Features

- 🎯 Support for left and right positioning
- 🎨 Fully customizable styling
- 🔄 Smooth transition animations
- 📱 Responsive design
- 🎮 Controllable toggle button
- 🔧 TypeScript support
- 🎁 Zero dependencies (except React)

## Installation

Using npm:
```bash
npm install @sunui-design/side-panel
```

Using yarn:
```bash
yarn add @sunui-design/side-panel
```

Using pnpm:
```bash
pnpm add @sunui-design/side-panel
```

## Usage

### Basic Usage

```tsx
import { SidePanel } from '@sunui-design/side-panel';
import { useState } from 'react';

function App() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            title="Side Panel"
        >
            <div className="space-y-4">
                <p className="text-gray-800">This is the side panel content.</p>
                <p className="text-gray-800">You can place any content here.</p>
            </div>
        </SidePanel>
    );
}
```

### Different Positions

```tsx
function App() {
    const [leftIsOpen, setLeftIsOpen] = useState(false);
    const [rightIsOpen, setRightIsOpen] = useState(false);

    return (
        <div>
            <SidePanel
                isOpen={leftIsOpen}
                onToggle={() => setLeftIsOpen(!leftIsOpen)}
                title="Left Panel"
                position="left"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">This is the left panel.</p>
                    <p className="text-gray-800">Typically used for navigation menus.</p>
                </div>
            </SidePanel>

            <SidePanel
                isOpen={rightIsOpen}
                onToggle={() => setRightIsOpen(!rightIsOpen)}
                title="Right Panel"
                position="right"
            >
                <div className="space-y-4">
                    <p className="text-gray-800">This is the right panel.</p>
                    <p className="text-gray-800">Typically used for details or settings.</p>
                </div>
            </SidePanel>
        </div>
    );
}
```

### Custom Styles

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            title="Custom Style Panel"
            className="bg-blue-50"
            headerClassName="bg-blue-500 text-white"
            contentClassName="p-6"
            width="320px"
        >
            <div className="space-y-4">
                <p className="text-blue-800">This is a panel with custom styles.</p>
                <p className="text-blue-600">You can customize all parts of the panel.</p>
            </div>
        </SidePanel>
    );
}
```

### No Buttons

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            title="No Buttons Panel"
            showToggleButton={false}
            showCloseButton={false}
        >
            <div className="space-y-4">
                <p className="text-gray-800">This panel has no toggle or close buttons.</p>
                <p className="text-gray-800">Suitable for programmatically controlled scenarios.</p>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {isOpen ? 'Close Panel' : 'Open Panel'}
                </button>
            </div>
        </SidePanel>
    );
}
```

### With Navigation

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            title="Navigation Panel"
            className="bg-gray-50"
        >
            <nav className="space-y-2">
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                    Home
                </a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                    About Us
                </a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                    Services
                </a>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                    Contact
                </a>
            </nav>
        </SidePanel>
    );
}
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| isOpen | boolean | - | Controls whether the panel is open |
| onToggle | () => void | - | Callback function for toggling panel state |
| title | string | - | Panel title |
| position | 'left' \| 'right' | 'left' | Panel display position |
| children | ReactNode | - | Panel content |
| className | string | '' | Custom panel class name |
| toggleButtonClassName | string | '' | Custom toggle button class name |
| closeButtonClassName | string | '' | Custom close button class name |
| headerClassName | string | '' | Custom header class name |
| contentClassName | string | '' | Custom content area class name |
| showToggleButton | boolean | true | Whether to show the toggle button |
| showCloseButton | boolean | true | Whether to show the close button |
| width | string | '270px' | Panel width |

## Style Customization

The component uses TailwindCSS for styling. You can customize the styles in the following ways:

1. Override default styles using the provided className props
2. Use higher specificity selectors in your CSS

For example:

```tsx
<SidePanel
  className="bg-gray-100"
  headerClassName="bg-primary-700 text-white"
  contentClassName="p-6"
  toggleButtonClassName="bg-secondary-500"
  closeButtonClassName="text-white"
  // ...other props
>
  {/* Your content */}
</SidePanel>
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