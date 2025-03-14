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
      position="left"
    >
      <div>Your content here</div>
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

Apache License 2.0 