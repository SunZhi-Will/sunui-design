import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload, FileUploadProps } from '@sunui-design/file-upload';

const meta = {
    title: 'Components/FileUpload',
    component: FileUpload,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: '一個現代化的檔案上傳元件，支援拖放上傳、多檔案上傳、檔案預覽和進度顯示。'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        theme: {
            control: 'select',
            options: ['violet', 'cyan', 'custom'],
            description: '元件主題顏色'
        },
        accept: {
            control: 'text',
            description: '接受的檔案類型，例如：image/*,application/pdf'
        },
        multiple: {
            control: 'boolean',
            description: '是否允許多檔案上傳'
        },
        maxSize: {
            control: 'number',
            description: '檔案大小限制（bytes）'
        },
        showProgress: {
            control: 'boolean',
            description: '是否顯示上傳進度'
        },
        showPreview: {
            control: 'boolean',
            description: '是否顯示檔案預覽'
        }
    }
} satisfies Meta<FileUploadProps>;

export default meta;
type Story = StoryObj<FileUploadProps>;

// 基本用法
export const Basic: Story = {
    args: {
        onFileSelect: (files: File[]) => console.log('選擇的檔案:', files),
        onFileUpload: async (files: File[]) => {
            console.log('上傳檔案中:', files);
            await new Promise(resolve => setTimeout(resolve, 2000));
        },
        accept: 'image/*,application/pdf',
        multiple: true,
        maxSize: 5 * 1024 * 1024, // 5MB
        theme: 'violet',
        className: 'w-96'
    },
    parameters: {
        docs: {
            description: {
                story: '最基本的檔案上傳功能，支援拖放和點擊上傳。'
            }
        }
    }
};

// 青色主題
export const CyanTheme: Story = {
    args: {
        ...Basic.args,
        theme: 'cyan'
    },
    parameters: {
        docs: {
            description: {
                story: '使用青色主題的上傳元件。'
            }
        }
    }
};

// 單檔案上傳
export const SingleFile: Story = {
    args: {
        onFileSelect: (files: File[]) => console.log('選擇的檔案:', files),
        onFileUpload: async (files: File[]) => {
            console.log('上傳檔案中:', files);
            await new Promise(resolve => setTimeout(resolve, 2000));
        },
        multiple: false,
        accept: 'image/*',
        maxSize: 2 * 1024 * 1024, // 2MB
        theme: 'violet',
        className: 'w-96',
        showProgress: true
    },
    parameters: {
        docs: {
            description: {
                story: '限制單檔案上傳的示例，只接受圖片檔案。'
            }
        }
    }
};

// 完整功能展示
export const FullFeatured: Story = {
    args: {
        onFileSelect: (files: File[]) => console.log('選擇的檔案:', files),
        onFileUpload: async (files: File[]) => {
            console.log('上傳檔案中:', files);
            await new Promise(resolve => setTimeout(resolve, 2000));
        },
        multiple: true,
        accept: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx',
        maxSize: 10 * 1024 * 1024, // 10MB
        showPreview: true,
        showProgress: true,
        theme: 'violet',
        className: 'w-[600px]',
        previewGridClassName: 'mt-4',
        onRemovePreview: (index: number) => {
            console.log(`移除預覽項目 ${index}`);
        }
    },
    parameters: {
        docs: {
            description: {
                story: '展示所有功能的完整示例，包括多檔案上傳、檔案預覽、進度顯示等。'
            }
        }
    }
}; 