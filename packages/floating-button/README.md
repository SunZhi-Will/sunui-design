# FloatingButton

A floating button component that can expand to display multiple child buttons.

## Features

- Three expansion modes: petal, vertical, grid
- Show/hide control
- Controlled and uncontrolled modes
- Customizable positions: bottom-right, bottom-left, top-right, top-left
- Custom child buttons support
- Gradient background and shadow effects

## Installation

```bash
npm install sunui-floating-button
# or
yarn add sunui-floating-button
# or
pnpm add sunui-floating-button
```

## Usage

```tsx
import { FloatingButton } from 'sunui-floating-button';
import { SocialButton } from 'sunui-social-button';

const socialButtons = [
    {
        href: 'https://github.com',
        icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
        ),
        className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50",
        iconClassName: "[filter:invert(1)]"
    },
    // ... more buttons
];

export default function App() {
    return (
        <FloatingButton
            show={true}
            position="bottom-right"
            variant="petal"
            buttons={socialButtons}
        />
    );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| show | boolean | Control button visibility |
| isOpen | boolean | Control menu expansion (controlled mode) |
| defaultOpen | boolean | Default menu expansion state (uncontrolled mode) |
| onOpenChange | (open: boolean) => void | Callback when menu state changes |
| position | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' | Component position |
| className | string | Custom container styles |
| buttonClassName | string | Custom button styles |
| variant | 'petal' \| 'vertical' \| 'grid' | Button expansion mode |
| buttons | SocialButtonProps[] | Array of button configurations |
| showToggleButton | boolean | Control whether to show the toggle button |

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