<div align="center">
  <img src="sunui-title-logo.png" alt="Sun UI Design" width="500" style="margin: 20px 0" />
  <p align="center">
    <b>A modern React UI component library built with Next.js and TailwindCSS</b>
    <br />
    <i>Beautiful animations and customizable components</i>
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/@sunui-design/all">
      <img src="https://img.shields.io/npm/v/@sunui-design/all.svg?style=flat-square" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/@sunui-design/all">
      <img src="https://img.shields.io/npm/dm/@sunui-design/all.svg?style=flat-square" alt="npm downloads" />
    </a>
    <a href="https://github.com/yourusername/sun-ui-design/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square" alt="license" />
    </a>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#components">Components</a> •
    <a href="#installation">Installation</a> •
    <a href="#documentation">Documentation</a>
  </p>
  <br />
</div>

# Sun UI Design

A modern React UI component library built with Next.js and TailwindCSS, featuring beautiful animations and customizable components.

## Features

- 🎨 Modern and beautiful UI components
- 📱 Fully responsive design
- 🌈 Built with TailwindCSS
- 🎯 TypeScript support
- ⚡ Lightweight and performant
- 🔧 Easy to customize
- 📦 Tree-shakeable exports
- 🎁 Available as individual packages or all-in-one bundle

## Components

### FilterGrid

A grid component for displaying skills or categorized content with filtering, pagination, and loading states.

Features:
- Multiple themes: light, dark, blue, green, purple
- Multiple shapes: hexagon, square, circle
- Customizable categories and items
- Icon support with hover effects
- Pagination support
- Infinite scroll support
- Loading states with animations
- Click handlers for items
- Optional title and category filters
- Customizable item dimensions

### SocialButton

A button component for social media links with tooltip and gradient effects.

Features:
- Custom icon support (image URL or React element)
- Customizable button and icon styles
- Tooltip support with multiple display modes
- Tooltip positions: top, right, bottom, left
- Gradient background effects
- Main button mode support
- Animation effects
- Multiple layout modes: petal, vertical, grid

### FloatingButton

A floating button component that can expand to display multiple child buttons.

Features:
- Three expansion modes: petal, vertical, grid
- Show/hide control with animations
- Controlled and uncontrolled modes
- Customizable positions: bottom-right, bottom-left, top-right, top-left
- Custom child buttons support
- Gradient background and shadow effects
- Smooth animations and transitions

### GradientBackground

An animated gradient background component with dynamic glow effects and customizable grid overlay.

Features:
- Customizable gradient colors (from, via, to)
- Dynamic glow effects with customizable colors
- Customizable grid overlay with adjustable size and color
- Smooth animations with configurable duration and effects
- Multiple animation layers for enhanced visual depth
- Responsive and full-screen design
- Zero-configuration defaults

## Installation

### All-in-one Package

```bash
npm install @sunui-design/all
# or
yarn add @sunui-design/all
# or
pnpm add @sunui-design/all
```

### Individual Packages

```bash
# Core styles and utilities
npm install @sunui-design/core

# Individual components
npm install @sunui-design/filter    # FilterGrid
npm install @sunui-design/floating  # FloatingButton
npm install @sunui-design/gradient  # GradientBackground
npm install @sunui-design/social    # SocialButton
```

## Basic Usage

```tsx
import '@sunui-design/core/styles/base.css';
import {
  FilterGrid,
  FloatingButton,
  GradientBackground,
  SocialButton
} from '@sunui-design/all';

export default function App() {
  return (
    <div>
      <GradientBackground>
        <FilterGrid>
          {/* Your content */}
        </FilterGrid>
        <FloatingButton />
        <SocialButton href="https://github.com" />
      </GradientBackground>
    </div>
  );
}
```

## Documentation

Each component comes with comprehensive documentation, including examples and property descriptions. To view the documentation, check the individual package READMEs:

- [@sunui-design/core](packages/core/README.md)
- [@sunui-design/all](packages/all/README.md)
- [@sunui-design/filter](packages/filter-grid/README.md)
- [@sunui-design/floating](packages/floating-button/README.md)
- [@sunui-design/gradient](packages/gradient-background/README.md)
- [@sunui-design/social](packages/social-button/README.md)

Or run Storybook to see live examples:

```bash
npm run storybook
# or
yarn storybook
# or
pnpm storybook
```

## Contributing

Issues and Pull Requests are welcome! Please read our contributing guidelines before submitting a PR.

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
