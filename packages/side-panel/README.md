# @sunui-design/side-panel

A modern side panel React component with smooth animations and rich customization options.

## Features

- 🎯 Support for left and right positioning
- 🎨 Fully customizable styling with multiple themes
- 🔄 Smooth transition animations
- 📱 Responsive design
- 🎮 Controllable toggle button
- 🔧 TypeScript support
- 🛡️ Accessibility features (ARIA support)
- 🌓 Dark and light mode support
- 🔑 Keyboard controls (Escape to close)
- 🖱️ Outside click detection
- 📆 Built-in date range selector
- 🚧 Multiple panels management with shared context
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
    
    // 使用setTimeout确保动画流畅
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={togglePanel}
            title="Side Panel"
        >
            <div className="space-y-4">
                <p>This is the side panel content.</p>
                <p>You can place any content here.</p>
            </div>
        </SidePanel>
    );
}
```

### With Theme and Dark Mode

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>
                Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
            </button>

            <SidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="Themed Panel"
                theme="gradient"
                mode={isDarkMode ? 'dark' : 'light'}
                showOverlay={true}
            >
                <div className="space-y-4">
                    <p>This panel uses the gradient theme with {isDarkMode ? 'dark' : 'light'} mode.</p>
                    <p>Themes adapt to the current mode automatically.</p>
                </div>
            </SidePanel>
        </div>
    );
}
```

### Different Positions

```tsx
function App() {
    const [leftIsOpen, setLeftIsOpen] = useState(false);
    const [rightIsOpen, setRightIsOpen] = useState(false);
    
    const toggleLeftPanel = () => {
        setTimeout(() => setLeftIsOpen(!leftIsOpen), 0);
    };
    
    const toggleRightPanel = () => {
        setTimeout(() => setRightIsOpen(!rightIsOpen), 0);
    };

    return (
        <div>
            <SidePanel
                isOpen={leftIsOpen}
                onToggle={toggleLeftPanel}
                title="Left Panel"
                position="left"
                theme="primary"
            >
                <div className="space-y-4">
                    <p>This is the left panel.</p>
                    <p>Typically used for navigation menus.</p>
                </div>
            </SidePanel>

            <SidePanel
                isOpen={rightIsOpen}
                onToggle={toggleRightPanel}
                title="Right Panel"
                position="right"
                theme="success"
            >
                <div className="space-y-4">
                    <p>This is the right panel.</p>
                    <p>Typically used for details or settings.</p>
                </div>
            </SidePanel>
        </div>
    );
}
```

### With Overlay and Outside Click

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);
    
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={togglePanel}
            title="Panel with Overlay"
            showOverlay={true}
            closeOnOutsideClick={true}
            closeOnEscape={true}
            theme="gradient"
        >
            <div className="space-y-4">
                <p>This panel has a backdrop overlay.</p>
                <p>Click outside or press ESC to close it.</p>
            </div>
        </SidePanel>
    );
}
```

### With Date Range Selector

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRangeOption>('day');
    
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };
    
    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={togglePanel}
            title="Analytics Dashboard"
            theme="gradient"
            width="360px"
            showDateRangeSelector={true}
            dateRangeOptions={['day', 'week', 'half-year', 'year']}
            selectedDateRange={dateRange}
            onDateRangeChange={(range) => setDateRange(range)}
        >
            <div className="space-y-4">
                <p>Showing data for the selected period: <strong>{dateRange}</strong></p>
                <p>The date selector has been customized to only show: day, week, half-year, and year options.</p>
            </div>
        </SidePanel>
    );
}
```

### Custom Styling with Theme

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);
    
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={togglePanel}
            title="Custom Style Panel"
            theme="primary"
            rounded={true}
            showShadow={true}
            showBorder={true}
            width="320px"
        >
            <div className="space-y-4">
                <p>This is a panel with the Primary theme.</p>
                <p>You can customize all parts of the panel.</p>
            </div>
        </SidePanel>
    );
}
```

### Custom Animation Duration

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);
    
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={togglePanel}
            title="Slow Animation Panel"
            animationDuration={600} // 600ms animation
            theme="warning"
        >
            <div className="space-y-4">
                <p>This panel has a slower animation.</p>
                <p>Notice how smooth the transition is.</p>
            </div>
        </SidePanel>
    );
}
```

### With Open/Close Callbacks

```tsx
function App() {
    const [isOpen, setIsOpen] = useState(false);
    
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };
    
    const handleOpen = () => {
        console.log('Panel opened!');
    };
    
    const handleClose = () => {
        console.log('Panel closed!');
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onToggle={togglePanel}
            title="Panel with Callbacks"
            onOpen={handleOpen}
            onClose={handleClose}
            theme="danger"
        >
            <div className="space-y-4">
                <p>This panel has open/close callbacks.</p>
                <p>Check the console for messages.</p>
            </div>
        </SidePanel>
    );
}
```

## Using with Multiple Panels

When using multiple panels, wrap them with `SidePanel.Provider` to automatically hide toggle buttons when any panel is open:

```jsx
import SidePanel from '@sunui-design/side-panel';

function App() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  
  const toggleLeftPanel = () => {
    setTimeout(() => setLeftOpen(!leftOpen), 0);
  };
  
  const toggleRightPanel = () => {
    setTimeout(() => setRightOpen(!rightOpen), 0);
  };
  
  return (
    <SidePanel.Provider>
      <div className="App">
        <SidePanel 
          isOpen={leftOpen}
          onToggle={toggleLeftPanel}
          title="Left Panel"
          position="left"
          buttonTopPosition="2rem"
        >
          <p>Left panel content</p>
        </SidePanel>
        
        <SidePanel 
          isOpen={rightOpen}
          onToggle={toggleRightPanel}
          title="Right Panel"
          position="right"
          buttonTopPosition="2rem"
        >
          <p>Right panel content</p>
        </SidePanel>
      </div>
    </SidePanel.Provider>
  );
}
```

## Animation Best Practices

To ensure smooth animations, always use setTimeout when toggling the panel state:

```jsx
const togglePanel = () => {
  setTimeout(() => setIsOpen(!isOpen), 0);
};
```

This ensures that React has time to update the DOM before animation begins, preventing animation glitches.

## Props

| Property               | Type                                                                       | Default        | Description                                    |
| ---------------------- | -------------------------------------------------------------------------- | -------------- | ---------------------------------------------- |
| isOpen                 | boolean                                                                    | false          | Controls whether the panel is open             |
| onToggle               | () => void                                                                 | () => {}       | Callback function for toggling panel state     |
| title                  | string \| ReactNode                                                        | ''             | Panel title                                    |
| position               | 'left' \| 'right'                                                          | 'left'         | Panel display position                         |
| children               | ReactNode                                                                  | -              | Panel content                                  |
| className              | string                                                                     | ''             | Custom panel class name                        |
| toggleButtonClassName  | string                                                                     | ''             | Custom toggle button class name                |
| closeButtonClassName   | string                                                                     | ''             | Custom close button class name                 |
| headerClassName        | string                                                                     | ''             | Custom header class name                       |
| contentClassName       | string                                                                     | ''             | Custom content area class name                 |
| showToggleButton       | boolean                                                                    | true           | Whether to show the toggle button              |
| showCloseButton        | boolean                                                                    | true           | Whether to show the close button               |
| width                  | string                                                                     | '320px'        | Panel width                                    |
| zIndex                 | number                                                                     | 50             | Panel z-index                                  |
| closeOnOutsideClick    | boolean                                                                    | false          | Close panel when clicking outside              |
| closeOnEscape          | boolean                                                                    | false          | Close panel when pressing ESC key              |
| showOverlay            | boolean                                                                    | false          | Show backdrop overlay behind panel             |
| overlayClassName       | string                                                                     | ''             | Custom overlay class name                      |
| onOpen                 | () => void                                                                 | undefined      | Callback when panel is fully opened            |
| onClose                | () => void                                                                 | undefined      | Callback when panel is fully closed            |
| toggleButtonIcon       | IconType                                                                   | IoMenuOutline  | Custom toggle button icon                      |
| closeButtonIcon        | IconType                                                                   | IoCloseOutline | Custom close button icon                       |
| animationDuration      | number                                                                     | 300            | Animation duration in milliseconds             |
| theme                  | 'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'gradient' | 'default'      | Panel theme variant                            |
| mode                   | 'light' \| 'dark'                                                          | 'light'        | Light or dark mode                             |
| showBorder             | boolean                                                                    | true           | Whether to show a border                       |
| showShadow             | boolean                                                                    | true           | Whether to apply shadow effect                 |
| showHeaderBorder       | boolean                                                                    | true           | Whether to show a header border                |
| rounded                | boolean                                                                    | true           | Whether panel should have rounded corners      |
| buttonTopPosition      | string                                                                     | '2rem'         | Toggle button vertical position from top       |
| buttonSticky           | boolean                                                                    | true           | Whether toggle button is fixed to viewport     |
| buttonHorizontalOffset | string                                                                     | '0px'          | Horizontal offset from edge to prevent overlap |
| id                     | string                                                                     | auto-generated | Unique identifier for the panel                |
| hideButtonsWhenAnyOpen | boolean                                                                    | true           | Hide toggle buttons when any panel is open     |
| showDateRangeSelector  | boolean                                                                    | false          | Show date range selector in panel header       |
| dateRangeOptions       | ('day' \| 'week' \| 'half-year' \| 'year')[]                               | All four       | Available date range options                   |
| selectedDateRange      | 'day' \| 'week' \| 'half-year' \| 'year'                                   | 'day'          | Currently selected date range                  |
| onDateRangeChange      | (range: 'day' \| 'week' \| 'half-year' \| 'year') => void                  | () => {}       | Called when date range selection changes       |

## Theme Options

The SidePanel component comes with several built-in themes that can transform its appearance:

- **default**: A clean, minimalist look that adapts to light/dark mode
- **primary**: Blue accent theme for primary actions or navigation
- **success**: Green-themed panel for success states or confirmation
- **warning**: Amber/orange theme for warnings or important notices
- **danger**: Red theme for destructive actions or errors
- **gradient**: A modern gradient background with blur effects

Each theme automatically adapts to the selected `mode` (light or dark).

## Style Customization

The component uses TailwindCSS for styling. You can customize the styles in the following ways:

1. Choose a predefined theme using the `theme` prop
2. Switch between light and dark mode using the `mode` prop
3. Override default styles using the provided className props
4. Use higher specificity selectors in your CSS

For example:

```tsx
<SidePanel
  theme="primary"
  mode="dark"
  className="bg-gray-100"
  headerClassName="bg-primary-700 text-white"
  contentClassName="p-6"
  toggleButtonClassName="bg-secondary-500"
  closeButtonClassName="text-white"
  overlayClassName="bg-black bg-opacity-70"
  // ...other props
>
  {/* Your content */}
</SidePanel>
```

## Date Range Selector

The built-in date range selector allows users to switch between different time periods. This is useful for dashboards and analytics panels:

- Display shows: 日 (Day), 周 (Week), 半年 (Half-year), 年 (Year)
- Automatically styled to match your selected theme
- Customizable options (show only the date ranges you need)
- Proper i18n support for date labels

To enable:

```tsx
<SidePanel
  showDateRangeSelector={true}
  dateRangeOptions={['day', 'week', 'half-year', 'year']}
  selectedDateRange={currentRange}
  onDateRangeChange={handleRangeChange}
  // ...other props
>
  {/* Your content */}
</SidePanel>
```

## Multiple Panel Management

The `SidePanel.Provider` context allows for efficient management of multiple panels:

- Automatically hides toggle buttons when any panel is open
- Handles z-index stacking for proper layering
- Prevents panel conflicts and improves UX

```tsx
<SidePanel.Provider>
  {/* Multiple panels here */}
</SidePanel.Provider>
```

## Troubleshooting

### Animations Not Working

If animations aren't working properly:

1. Always use setTimeout when toggling panel state:
   ```js
   const togglePanel = () => {
     setTimeout(() => setIsOpen(!isOpen), 0);
   };
   ```
   
2. Make sure you're passing the toggle function correctly:
   ```jsx
   <SidePanel isOpen={isOpen} onToggle={togglePanel} />
   ```

3. Verify animation duration is appropriate (default is 300ms)

## Accessibility

The component includes the following accessibility features:

- Proper ARIA attributes (role="dialog", aria-modal, aria-labelledby)
- Keyboard navigation support (ESC to close)
- Focus management
- Screen reader compatible structure

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