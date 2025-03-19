# @sunui-design/core

Core styles and utilities for Sun UI Design components.

## Features

- 🎨 Base styles and CSS variables
- 🌈 TailwindCSS integration
- 🔧 Customizable design tokens
- 📱 Responsive utilities
- ⚡ Lightweight and optimized
- 🎯 TypeScript support

## Installation

```bash
npm install @sunui-design/core
# or
yarn add @sunui-design/core
# or
pnpm add @sunui-design/core
```

## Usage

```tsx
// Import base styles in your app's entry point
import '@sunui-design/core/styles/base.css';
```

## Design Tokens

The core package provides CSS variables for consistent styling across components:

```css
:root {
  --sun-ui-primary: #3b82f6;
  --sun-ui-secondary: #6b7280;
  --sun-ui-success: #22c55e;
  --sun-ui-danger: #ef4444;
  --sun-ui-warning: #f59e0b;
  --sun-ui-info: #3b82f6;

  --sun-ui-transition-duration: 0.3s;
  --sun-ui-border-radius: 0.375rem;
  --sun-ui-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
```

## Utility Classes

### Button Base

```css
.sun-ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: var(--sun-ui-border-radius);
  transition: all var(--sun-ui-transition-duration) ease-in-out;
  cursor: pointer;
}
```

### Floating Elements

```css
.sun-ui-floating {
  position: fixed;
  box-shadow: var(--sun-ui-shadow);
  z-index: 50;
}
```

### Animations

```css
@keyframes sun-ui-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes sun-ui-scale-in {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}
```

## TailwindCSS Configuration

If you're using TailwindCSS, you can extend your configuration:

```ts
// tailwind.config.ts
import { withSunUI } from '@sunui-design/core';

export default withSunUI({
  // Your Tailwind configuration
});
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