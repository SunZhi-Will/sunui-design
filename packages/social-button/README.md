# SocialButton

A button component for social media links with tooltip and gradient effects.

## Features

- Custom icon support (image URL or React element)
- Customizable button and icon styles
- Tooltip support
- Tooltip display modes: always, hover, none
- Tooltip positions: top, right, bottom, left
- Gradient background effects

## Installation

```bash
npm install sunui-social-button
# or
yarn add sunui-social-button
# or
pnpm add sunui-social-button
```

## Usage

```tsx
import { SocialButton } from 'sunui-social-button';

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

## Props

| Prop | Type | Description |
|------|------|-------------|
| href | string | Button's link address |
| icon | string \| ReactElement | Button's icon (URL or React element) |
| position | { x: number, y: number } | Button's position |
| className | string | Custom button styles |
| iconClassName | string | Custom icon styles |
| title | string | Button's tooltip text |
| titleDisplay | 'always' \| 'hover' \| 'none' | Tooltip display mode |
| titlePosition | 'top' \| 'right' \| 'bottom' \| 'left' | Tooltip position |

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