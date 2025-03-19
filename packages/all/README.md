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

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 