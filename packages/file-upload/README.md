# @sunui-design/file-upload

A modern, animated file upload component for React applications with rich preview support and smooth animations.

## ✨ Features

- 🎨 Beautiful animations powered by Framer Motion
- 📸 Rich file preview support (images, PDFs, and documents)
- 🎯 Intuitive drag and drop interface
- 📊 Real-time upload progress indicator
- 🎨 Multiple built-in themes (violet, cyan, orange)
- 🔒 Advanced file type and size validation
- 📱 Fully responsive design
- 🎭 Highly customizable appearance
- 🌈 Gradient background effects
- ⚡ Smooth transitions and animations
- 🚨 Elegant error handling
- 💫 Rich animation effects

## 📦 Installation

```bash
npm install @sunui-design/file-upload
# or
yarn add @sunui-design/file-upload
# or
pnpm add @sunui-design/file-upload
```

## 🚀 Basic Usage

```tsx
import { FileUpload } from '@sunui-design/file-upload';

function App() {
  const handleFileSelect = (files: File[]) => {
    console.log('Selected files:', files);
  };

  const handleFileUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      // Handle response
    } catch (error) {
      // Handle error
    }
  };

  return (
    <FileUpload
      onFileSelect={handleFileSelect}
      onFileUpload={handleFileUpload}
      accept="image/*,application/pdf"
      multiple
      maxSize={5 * 1024 * 1024} // 5MB
      showPreview={true}
      showProgress={true}
      theme="orange"
      placeholder="Drop files here or click to upload"
      description="Supported formats: Images, PDF"
    />
  );
}
```

## 🎨 Themes

The component comes with three beautiful built-in themes:

- 🟣 **Violet** - Modern and elegant
- 🔵 **Cyan** - Fresh and professional
- 🟠 **Orange** - Warm and energetic (default)

```tsx
<FileUpload theme="violet" />
<FileUpload theme="cyan" />
<FileUpload theme="orange" />
```

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onFileSelect | `(files: File[]) => void` | - | Callback when files are selected |
| onFileUpload | `(files: File[]) => Promise<void>` | - | Callback to handle file upload |
| accept | `string` | - | Accepted file types (e.g., "image/*,.pdf") |
| multiple | `boolean` | `false` | Allow multiple file selection |
| maxSize | `number` | - | Maximum file size in bytes |
| showPreview | `boolean` | `true` | Show file previews |
| showProgress | `boolean` | `true` | Show upload progress |
| theme | `'violet' \| 'cyan' \| 'orange'` | `'orange'` | Component theme |
| placeholder | `string` | `'Drop files here or click to upload'` | Upload area placeholder text |
| description | `string` | - | Additional description text |
| className | `string` | - | Additional CSS classes |
| previewGridClassName | `string` | - | Additional CSS classes for preview grid |
| onRemovePreview | `(index: number) => void` | - | Callback when a preview is removed |

## 🖼️ Preview Support

The component provides rich preview support for various file types:

- **Images**
  - Supports all common image formats (jpg, png, gif, etc.)
  - Displays actual image previews
  - Maintains aspect ratio
  - Optimized for performance

- **PDFs**
  - Generates preview of the first page
  - Uses PDF.js for rendering
  - High-quality preview generation

- **Other Files**
  - Shows appropriate file type icons
  - Displays file name and size
  - Supports custom icon mapping

## 🎯 Advanced Usage

### Custom Styling

```tsx
<FileUpload
  className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5"
  previewGridClassName="gap-4"
  dragActiveClassName="border-violet-500/50"
  theme="violet"
/>
```

### File Validation

```tsx
<FileUpload
  accept="image/*,application/pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024} // 10MB
  onFileSelect={(files) => {
    // Additional validation logic
  }}
/>
```

### Custom Preview Handling

```tsx
<FileUpload
  showPreview={true}
  onRemovePreview={(index) => {
    // Handle preview removal
  }}
/>
```

## 🛠️ Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build

# Run Storybook
yarn storybook
```

## 📚 Examples

Check out our [Storybook](https://your-storybook-url.com) for more examples and live demos.

## 🤝 Contributing

We welcome contributions! Please see our [contributing guide](CONTRIBUTING.md) for details.

## 📄 License

[Apache License 2.0](LICENSE) © [SunUI Design] 