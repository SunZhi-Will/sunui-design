# FileUpload

A modern file upload component with drag and drop support and rich animation effects.

## Features

- 🎯 Drag and drop support
- 📊 Upload progress indication
- 🔍 File type validation
- 📏 File size limits
- 🎨 Customizable styling
- 📱 Responsive design
- ⚡ Smooth animations
- 🌈 Multiple file upload
- 🎭 Modern design
- 💫 Rich animation effects
- 🚨 Elegant error handling
- 🖼️ Gradient background effects

## Installation

```bash
npm install @sunui-design/file-upload
# or
yarn add @sunui-design/file-upload
# or
pnpm add @sunui-design/file-upload
```

## Basic Usage

```tsx
import { FileUpload } from '@sunui-design/file-upload';

export default function App() {
    const handleFileSelect = (files: File[]) => {
        console.log('Selected files:', files);
    };

    const handleFileUpload = async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
    };

    return (
        <FileUpload
            onFileSelect={handleFileSelect}
            onFileUpload={handleFileUpload}
            accept="image/*,application/pdf"
            multiple
            maxSize={5 * 1024 * 1024} // 5MB
            className="w-full max-w-md mx-auto"
            dragActiveClassName="border-violet-500"
            showProgress={true}
        />
    );
}
```

## Custom Appearance

```tsx
<FileUpload
    onFileSelect={handleFileSelect}
    className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 backdrop-blur-sm border border-white/20 rounded-xl p-8"
    dragActiveClassName="scale-[1.02] border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10"
>
    <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-violet-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-1 text-lg font-medium bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Click or drag files here to upload
        </p>
    </div>
</FileUpload>
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| onFileSelect | (files: File[]) => void | Callback when files are selected | - |
| onFileUpload | (files: File[]) => Promise<void> | Callback for handling file upload | - |
| accept | string | Accepted file types | undefined |
| multiple | boolean | Allow multiple file selection | false |
| maxSize | number | Maximum file size in bytes | undefined |
| className | string | Container class name | '' |
| dragActiveClassName | string | Class name when drag is active | '' |
| children | React.ReactNode | Custom content | undefined |
| showProgress | boolean | Whether to show progress bar | true |

## Style Customization

The component uses TailwindCSS for styling. You can customize the styles in the following ways:

1. Override default styles using the provided className props
2. Use higher specificity selectors in your CSS

For example:

```tsx
<FileUpload
    className="bg-gradient-to-br from-blue-500/5 to-purple-500/5"
    dragActiveClassName="border-blue-500"
    // ...other props
/>
```

## License

Apache License 2.0 