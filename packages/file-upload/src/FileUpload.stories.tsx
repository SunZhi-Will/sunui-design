import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from './FileUpload';

const meta: Meta<typeof FileUpload> = {
    title: 'Components/FileUpload',
    component: FileUpload,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
    args: {
        placeholder: 'Drop files here or click to upload',
        description: 'Upload your files here',
        showPreview: true,
        showProgress: true,
        theme: 'orange',
        multiple: true,
    },
};

export const ImageUpload: Story = {
    args: {
        accept: 'image/*',
        placeholder: 'Drop images here or click to upload',
        description: 'Supported formats: JPG, PNG, GIF',
        showPreview: true,
        showProgress: true,
        theme: 'violet',
        multiple: true,
        maxSize: 5 * 1024 * 1024, // 5MB
    },
};

export const DocumentUpload: Story = {
    args: {
        accept: '.pdf,.doc,.docx',
        placeholder: 'Drop documents here or click to upload',
        description: 'Supported formats: PDF, DOC, DOCX',
        showPreview: false,
        showProgress: true,
        theme: 'cyan',
        multiple: true,
        maxSize: 10 * 1024 * 1024, // 10MB
    },
};

export const SingleFileUpload: Story = {
    args: {
        multiple: false,
        placeholder: 'Drop a file here or click to upload',
        description: 'Upload a single file',
        showPreview: true,
        showProgress: true,
        theme: 'orange',
    },
}; 