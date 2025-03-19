# @sunui-design/react

All-in-one package for Sun UI Design components.

## Features

- 🎁 All Sun UI Design components in one package
- 🔧 Easy installation and setup
- 📦 Optimized bundle size
- 🎯 TypeScript support
- 🌈 Built with TailwindCSS
- ⚡ Tree-shakeable exports

## Installation

```bash
npm install @sunui-design/react
# or
yarn add @sunui-design/react
# or
pnpm add @sunui-design/react
```

## Available Components

This package includes all Sun UI Design components:

- `FilterGrid`: A grid layout with filtering capabilities
- `FloatingButton`: An animated floating action button
- `GradientBackground`: Beautiful gradient background effects
- `SocialButton`: Social media styled buttons

## Usage

```tsx
import {
  FilterGrid,
  FloatingButton,
  GradientBackground,
  SocialButton
} from '@sunui-design/react';

export default function App() {
  return (
    <div>
      <GradientBackground>
        <FilterGrid>
          {/* Your content */}
        </FilterGrid>
        <FloatingButton />
        <SocialButton href="https://twitter.com" />
      </GradientBackground>
    </div>
  );
}
```

## Component Documentation

For detailed documentation of each component, please refer to their individual packages:

- [@sunui-design/filter](https://www.npmjs.com/package/@sunui-design/filter)
- [@sunui-design/floating](https://www.npmjs.com/package/@sunui-design/floating)
- [@sunui-design/gradient](https://www.npmjs.com/package/@sunui-design/gradient)
- [@sunui-design/social](https://www.npmjs.com/package/@sunui-design/social)

## Base Styles

This package includes the core styles. Make sure to import them in your app's entry point:

```tsx
import '@sunui-design/core/styles/base.css';
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