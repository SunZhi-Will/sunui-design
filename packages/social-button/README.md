# sunui-social-button

A collection of stylish social media buttons for React applications.

## Installation

```bash
npm install sunui-social-button
```

## Features

- 🎯 TypeScript support
- 🎨 Modern and clean design
- 📱 Responsive and mobile-friendly
- 🌈 Multiple social platforms supported
- ⚡ Built-in hover animations
- 🔧 Customizable styles and icons

## Usage

```jsx
import { SocialButton } from 'sunui-social-button';

function App() {
  return (
    <div>
      <SocialButton
        platform="twitter"
        url="https://twitter.com/yourusername"
        size="medium"
        variant="filled"
      />
      <SocialButton
        platform="github"
        url="https://github.com/yourusername"
        size="medium"
        variant="outlined"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| platform | `'twitter' \| 'facebook' \| 'github' \| 'linkedin' \| 'instagram'` | Social media platform |
| url | `string` | Link to social media profile |
| size | `'small' \| 'medium' \| 'large'` | Button size |
| variant | `'filled' \| 'outlined' \| 'text'` | Button style variant |
| color | `string` | Custom button color |
| iconOnly | `boolean` | Show only icon without text |
| className | `string` | Additional CSS classes |

## Supported Platforms

- Twitter (X)
- Facebook
- GitHub
- LinkedIn
- Instagram

Each platform comes with its official brand color and icon.

## License

MIT 