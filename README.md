<div align="center">
  <img src="/public/sunui-title-logo.png" alt="Sun UI Design" width="500" style="margin: 20px 0" />
  <p align="center">
    <b>A modern React UI component library with beautiful animations</b>
    <br />
    <i>Built with React, TailwindCSS, and TypeScript</i>
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

A modern React UI component library featuring beautiful animations and customizable components. Built with React, TailwindCSS, and TypeScript, it's perfect for any React project.

## Features

- 🎨 Modern and beautiful UI components
- 📱 Fully responsive design
- 🌈 Built with TailwindCSS
- 🎯 TypeScript support
- ⚡ Lightweight and performant
- 🔧 Easy to customize
- 📦 Tree-shakeable exports
- 🎁 Available as individual packages or all-in-one bundle
- 🔌 Works with any React project (Next.js, Create React App, Vite, etc.)

## Components

Sun UI Design provides a collection of modern and customizable components. Each component is available as a separate package and can be used independently.

### Available Components

- [Card](packages/card/README.md) - A simple and elegant card component
- [FileUpload](packages/file-upload/README.md) - A modern file upload component with drag and drop support
- [FilterGrid](packages/filter/README.md) - A grid component for displaying categorized content
- [FloatingButton](packages/floating/README.md) - A floating button component with expandable options
- [GradientBackground](packages/gradient/README.md) - An animated gradient background component
- [SidePanel](packages/side-panel/README.md) - A side panel component for displaying side content
- [SocialButton](packages/social/README.md) - A button component for social media links

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
npm install @sunui-design/card
npm install @sunui-design/file-upload
npm install @sunui-design/filter
npm install @sunui-design/floating
npm install @sunui-design/gradient
npm install @sunui-design/side-panel
npm install @sunui-design/social
```

## Development Setup

### Development Environment Setup

1. Clone the project:
```bash
git clone https://github.com/yourusername/sun-ui-design.git
cd sun-ui-design
```

2. Install all dependencies:
```bash
npm install
# or
npx lerna bootstrap
```

3. Build all packages:
```bash
npm run build:packages
```

4. Start development server:
```bash
npm run dev
```

5. Start Storybook:
```bash
npm run storybook
```

### Development Workflow

1. Create a new package:
```bash
cd packages
mkdir your-package-name
cd your-package-name
npm init
```

2. Develop the package:
```bash
npm run dev
```

3. Build the package:
```bash
npm run build
```

4. Pack the package:
```bash
npm run pack
```

5. Publish the package:
```bash
npm run publish
```

### Common Commands

- `npm run dev` - Start development server
- `npm run build` - Build project
- `npm run build:packages` - Build all packages
- `npm run storybook` - Start Storybook
- `npm run build-storybook` - Build Storybook
- `npm run pack:all` - Pack all packages
- `npm run publish` - Publish packages
- `npm run clean` - Clean build files
- `npm run lint` - Run linting

### Troubleshooting

If you encounter module not found errors:

1. Clean and reinstall dependencies:
```bash
npm run clean
npm install
```

2. Rebuild packages:
```bash
npm run build:packages
```

3. If issues persist, check package versions:
```bash
npm ls @sunui-design/core
npm ls @sunui-design/social
```

## Basic Usage

```tsx
import '@sunui-design/core/styles/base.css';
import {
  Card,
  FileUpload,
  FilterGrid,
  FloatingButton,
  GradientBackground,
  SidePanel,
  SocialButton
} from '@sunui-design/all';

export default function App() {
  return (
    <div>
      <GradientBackground>
        <Card>
          <FilterGrid>
            {/* Your content */}
          </FilterGrid>
        </Card>
        <FloatingButton />
        <SocialButton href="https://github.com" />
      </GradientBackground>
    </div>
  );
}
```

## Documentation

Each component comes with comprehensive documentation, including examples and property descriptions. To view the documentation, check the individual package READMEs or run Storybook to see live examples:

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
