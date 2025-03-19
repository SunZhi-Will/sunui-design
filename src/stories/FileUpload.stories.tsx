import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload, FileUploadProps } from '@sunui-design/file-upload';

const meta = {
    title: 'Components/FileUpload',
    component: FileUpload,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'A modern file upload component that supports drag and drop, multiple file upload, file preview, and progress display.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        theme: {
            control: 'select',
            options: ['orange', 'violet', 'cyan', 'custom'],
            description: 'Component theme color'
        },
        accept: {
            control: 'text',
            description: 'Accepted file types, e.g., image/*,application/pdf'
        },
        multiple: {
            control: 'boolean',
            description: 'Whether to allow multiple file uploads'
        },
        maxSize: {
            control: 'number',
            description: 'File size limit (bytes)'
        },
        showProgress: {
            control: 'boolean',
            description: 'Whether to show upload progress'
        },
        showPreview: {
            control: 'boolean',
            description: 'Whether to show file preview'
        }
    }
} satisfies Meta<FileUploadProps>;

export default meta;
type Story = StoryObj<FileUploadProps>;

// Basic usage
export const Basic: Story = {
    args: {
        onFileSelect: (files: File[]) => console.log('Selected files:', files),
        onFileUpload: async (files: File[]) => {
            console.log('Uploading files:', files);
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
        accept: 'image/*,application/pdf',
        multiple: true,
        maxSize: 5 * 1024 * 1024, // 5MB
        theme: 'orange',
        className: 'w-96'
    },
    parameters: {
        docs: {
            description: {
                story: 'Basic file upload functionality with drag and drop and click-to-upload support. Uses orange theme by default.'
            }
        }
    }
};

// Violet theme
export const VioletTheme: Story = {
    args: {
        ...Basic.args,
        theme: 'violet'
    },
    parameters: {
        docs: {
            description: {
                story: 'Upload component with violet theme.'
            }
        }
    }
};

// Cyan theme
export const CyanTheme: Story = {
    args: {
        ...Basic.args,
        theme: 'cyan'
    },
    parameters: {
        docs: {
            description: {
                story: 'Upload component with cyan theme.'
            }
        }
    }
};

// Single file upload
export const SingleFile: Story = {
    args: {
        onFileSelect: (files: File[]) => console.log('Selected files:', files),
        onFileUpload: async (files: File[]) => {
            console.log('Uploading files:', files);
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
        multiple: false,
        accept: 'image/*',
        maxSize: 2 * 1024 * 1024, // 2MB
        theme: 'orange',
        className: 'w-96',
        showProgress: true
    },
    parameters: {
        docs: {
            description: {
                story: 'Example of single file upload, only accepting image files.'
            }
        }
    }
};

// Full feature showcase
export const FullFeatured: Story = {
    args: {
        onFileSelect: (files: File[]) => console.log('Selected files:', files),
        onFileUpload: async (files: File[]) => {
            console.log('Uploading files:', files);
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
        multiple: true,
        accept: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx',
        maxSize: 10 * 1024 * 1024, // 10MB
        showPreview: true,
        showProgress: true,
        theme: 'orange',
        className: 'w-[600px]',
        previewGridClassName: 'mt-4',
        onRemovePreview: (index: number) => {
            console.log(`Removing preview item ${index}`);
        }
    },
    parameters: {
        docs: {
            description: {
                story: 'Complete example showcasing all features, including multiple file upload, file preview, progress display, and more.'
            }
        }
    }
}; 