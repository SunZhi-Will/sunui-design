# sunui-core

A modern React UI component library built with Next.js and TailwindCSS.

## Installation

```bash
npm install sunui-core
```

## Features

- 🎨 Modern and beautiful UI components
- 📱 Fully responsive
- 🎯 TypeScript support
- ⚡ Lightweight and performant
- 🔧 Easy to customize
- 🌈 Built with TailwindCSS

## Available Components

- `FilterGrid`: A grid layout with filtering capabilities
- `FloatingButton`: An animated floating action button
- `GradientBackground`: Beautiful gradient background effects
- `SocialButton`: Social media styled buttons

## Usage

```jsx
import { FilterGrid, FloatingButton, GradientBackground, SocialButton } from 'sunui-core';

// Use components in your app
function App() {
  return (
    <div>
      <GradientBackground>
        <FilterGrid>
          {/* Your content */}
        </FilterGrid>
        <FloatingButton />
        <SocialButton type="twitter" />
      </GradientBackground>
    </div>
  );
}
```

## Documentation

For detailed documentation of each component, please check their individual packages:

- [sunui-filter-grid](https://www.npmjs.com/package/sunui-filter-grid)
- [sunui-floating-button](https://www.npmjs.com/package/sunui-floating-button)
- [sunui-gradient-background](https://www.npmjs.com/package/sunui-gradient-background)
- [sunui-social-button](https://www.npmjs.com/package/sunui-social-button)

## License

MIT 