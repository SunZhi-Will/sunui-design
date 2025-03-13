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

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.