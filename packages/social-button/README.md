# SocialButton

A button component for social media links with tooltip and gradient effects.

## Features

- Custom icon support (image URL or React element)
- Customizable button and icon styles
- Tooltip support
- Tooltip display modes: always, hover, none
- Tooltip positions: top, right, bottom, left
- Gradient background effects
- Main button mode support
- Animation effects
- Multiple layout modes: petal, vertical, grid

## Installation

```bash
npm install @sunui-design/social
# or
yarn add @sunui-design/social
# or
pnpm add @sunui-design/social
```

## Usage

### Basic Usage

```tsx
import { SocialButton } from '@sunui-design/social';

export default function App() {
    return (
        <SocialButton
            href="https://github.com/username"
            icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
            className="from-purple-600/90 to-indigo-800/90"
            iconClassName="[filter:invert(1)]"
            title="GitHub"
            titleDisplay="hover"
            titlePosition="bottom"
        />
    );
}
```

### Using SVG Icons

```tsx
<SocialButton
    href="https://twitter.com"
    icon={
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
    }
    className="from-blue-400/90 to-blue-500/90"
    title="Twitter"
    titleDisplay="hover"
/>
```

### Grid Layout

```tsx
<div className="grid grid-cols-3 gap-8">
    <SocialButton
        href="https://github.com"
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
        className="from-purple-600/90 to-indigo-800/90"
        iconClassName="[filter:invert(1)]"
        title="GitHub"
        titleDisplay="hover"
    />
    <SocialButton
        href="https://linkedin.com"
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
        className="from-blue-600/90 to-blue-800/90"
        title="LinkedIn"
        titleDisplay="hover"
    />
    <SocialButton
        href="https://twitter.com"
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg"
        className="from-blue-400/90 to-blue-500/90"
        title="Twitter"
        titleDisplay="hover"
    />
</div>
```

### Different Positions

```tsx
<div className="relative w-[200px] h-[200px] bg-gray-100/30 rounded-lg p-4">
    <div className="grid grid-cols-2 gap-8">
        <SocialButton
            href="#"
            icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
            position={{ x: 0, y: 0 }}
            className="from-purple-600/90 to-indigo-800/90"
            iconClassName="[filter:invert(1)]"
            title="左上角"
            titleDisplay="always"
            titlePosition="top"
        />
        <SocialButton
            href="#"
            icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
            position={{ x: 48, y: 0 }}
            className="from-blue-600/90 to-blue-800/90"
            title="右上角"
            titleDisplay="always"
            titlePosition="right"
        />
        <SocialButton
            href="#"
            icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg"
            position={{ x: 0, y: 48 }}
            className="from-blue-400/90 to-blue-500/90"
            title="左下角"
            titleDisplay="always"
            titlePosition="left"
        />
        <SocialButton
            href="#"
            icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg"
            position={{ x: 48, y: 48 }}
            className="from-blue-600/90 to-blue-700/90"
            title="右下角"
            titleDisplay="always"
            titlePosition="bottom"
        />
    </div>
</div>
```

### Main Button Usage

```tsx
const [isOpen, setIsOpen] = useState(false);

<SocialButton
    isMainButton
    isOpen={isOpen}
    icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
    }
    className="from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
    onClick={() => setIsOpen(!isOpen)}
/>
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| href | string | Button's link address | - |
| icon | string \| ReactNode | Button's icon (URL or React element) | - |
| position | { x: number, y: number } | Button's position | - |
| className | string | Custom button styles | - |
| iconClassName | string | Custom icon styles | - |
| title | string | Button's tooltip text | - |
| titleDisplay | 'always' \| 'hover' \| 'none' | Tooltip display mode | 'none' |
| titlePosition | 'top' \| 'right' \| 'bottom' \| 'left' | Tooltip position | 'bottom' |
| isMainButton | boolean | Whether this is a main button (toggle button) | false |
| isOpen | boolean | Control main button's open state | - |
| onClick | () => void | Click event handler | - |
| variant | 'petal' \| 'vertical' \| 'grid' | Button layout variant when used in FloatingButton | - |

## Layout Examples

### Grid Layout

```tsx
<div className="grid grid-cols-3 gap-8">
    <SocialButton
        href="https://github.com"
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
        className="from-purple-600/90 to-indigo-800/90"
        iconClassName="[filter:invert(1)]"
        title="GitHub"
        titleDisplay="hover"
    />
    <SocialButton
        href="https://linkedin.com"
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
        className="from-blue-600/90 to-blue-800/90"
        title="LinkedIn"
        titleDisplay="hover"
    />
    {/* Add more buttons... */}
</div>
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