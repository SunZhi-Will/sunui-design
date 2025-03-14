import { motion } from 'framer-motion';
import React from 'react';
import { FilePreview } from './FileUpload';

interface PreviewGridProps {
    previews: FilePreview[];
    showPreview: boolean;
    previewGridClassName?: string;
    colors: {
        primary: string;
        text: string;
    };
    getFileIcon: (type: string, isPreview?: boolean) => React.ReactNode;
    removePreview: (index: number) => void;
}

export const PreviewGrid: React.FC<PreviewGridProps> = ({
    previews,
    showPreview,
    previewGridClassName,
    colors,
    getFileIcon,
    removePreview
}) => {
    return (
        <motion.div
            className={`w-full grid grid-cols-4 gap-3 px-4 ${previewGridClassName}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
        >
            {previews.map((preview, index) => (
                <motion.div
                    key={index}
                    className={`relative group ${showPreview ? 'aspect-square' : 'h-12 col-span-2'} rounded-lg overflow-hidden shadow-sm border border-gray-200`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                >
                    {showPreview ? (
                        (preview.type?.startsWith('image/') || preview.type === 'application/pdf') && preview.url ? (
                            <div className="w-full h-full bg-gray-50">
                                <img
                                    src={preview.url}
                                    alt={preview.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                <div className={`text-${colors.primary}-500`}>
                                    {getFileIcon(preview.type || '', true)}
                                </div>
                                <p className="mt-1 text-xs text-gray-600 text-center line-clamp-1 px-2">
                                    {preview.name}
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="w-full h-full flex items-center bg-gray-50 px-3 gap-2">
                            <div className={`text-${colors.primary}-500 flex-shrink-0 w-6 h-6`}>
                                {getFileIcon(preview.type || '', false)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium text-${colors.text} truncate`}>
                                    {preview.name}
                                </p>
                            </div>
                        </div>
                    )}
                    <motion.div
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        initial={false}
                    >
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                removePreview(index);
                            }}
                            className={`p-1.5 bg-${colors.primary}-500 rounded-full text-white hover:bg-${colors.primary}-600 transform hover:scale-110 transition-transform`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </motion.div>
                </motion.div>
            ))}
        </motion.div>
    );
}; 