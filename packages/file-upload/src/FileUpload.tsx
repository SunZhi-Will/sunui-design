import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// 設置 PDF.js worker
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// 常量配置
const FILE_PREVIEW_CONFIG = {
    maxPreviewSize: 800, // 預覽圖片的最大尺寸
    pdfScale: 2.0,      // PDF 預覽的縮放比例
    imageQuality: 0.9,   // 圖片預覽質量
};

export interface FilePreview {
    url: string;
    name: string;
    type?: string;
}

export interface FileUploadProps {
    onFileSelect?: (files: File[]) => void;
    onFileUpload?: (files: File[]) => Promise<void>;
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    className?: string;
    dragActiveClassName?: string;
    children?: React.ReactNode;
    showProgress?: boolean;
    theme?: 'violet' | 'cyan' | 'custom';
    showPreview?: boolean;
    previewGridClassName?: string;
    onRemovePreview?: (index: number) => void;
}

export const FileUpload = (props: FileUploadProps): JSX.Element => {
    const {
        onFileSelect,
        onFileUpload,
        accept,
        multiple = false,
        maxSize,
        className = '',
        dragActiveClassName = '',
        children,
        showProgress = true,
        theme = 'violet',
        showPreview = true,
        previewGridClassName = '',
        onRemovePreview,
    } = props;

    // 狀態管理
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previews, setPreviews] = useState<FilePreview[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // 主題顏色配置
    const themeColors = useMemo(() => ({
        violet: {
            primary: 'violet',
            secondary: 'fuchsia',
            text: 'violet-600',
            bg: 'violet-100',
            border: 'violet-300',
        },
        cyan: {
            primary: 'cyan',
            secondary: 'sky',
            text: 'cyan-600',
            bg: 'cyan-100',
            border: 'cyan-300',
        },
        custom: {
            primary: 'violet',
            secondary: 'fuchsia',
            text: 'violet-600',
            bg: 'violet-100',
            border: 'violet-300',
        },
    }), []);

    const colors = themeColors[theme];

    // 樣式配置
    const baseClassName = useMemo(() => `min-h-[240px] ${theme === 'violet'
        ? 'bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-300 hover:border-violet-500/50'
        : theme === 'cyan'
            ? 'bg-gradient-to-br from-cyan-500/5 to-sky-500/5 border-cyan-300 hover:border-cyan-500/50'
            : 'bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-300 hover:border-violet-500/50'
        } backdrop-blur-sm border-2 border-dashed rounded-xl p-8 transition-all duration-300 hover:shadow-lg`, [theme]);

    const defaultClassName = `w-full ${baseClassName}`;

    const defaultDragActiveClassName = useMemo(() => `scale-[1.02] ${theme === 'violet'
        ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10'
        : theme === 'cyan'
            ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-sky-500/10'
            : 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10'
        } shadow-xl`, [theme]);

    // 檔案處理相關函數
    const validateFiles = useCallback((files: File[]): File[] => {
        setError(null);
        return files.filter(file => {
            if (maxSize && file.size > maxSize) {
                setError(`檔案 ${file.name} 超過大小限制 ${Math.round(maxSize / 1024 / 1024)}MB`);
                return false;
            }
            if (accept) {
                const acceptedTypes = accept.split(',').map(type => type.trim());
                const fileType = file.type;
                const fileExtension = file.name.split('.').pop()?.toLowerCase();

                const isAccepted = acceptedTypes.some(type => {
                    if (type.startsWith('.')) {
                        return `.${fileExtension}` === type;
                    }
                    return fileType.match(new RegExp(type.replace('*', '.*')));
                });

                if (!isAccepted) {
                    setError(`檔案 ${file.name} 類型不支援`);
                    return false;
                }
            }
            return true;
        });
    }, [maxSize, accept]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    }, []);

    const simulateProgress = useCallback(async () => {
        setIsUploading(true);
        setUploadProgress(0);
        for (let i = 0; i <= 100; i += 5) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setUploadProgress(i);
        }
    }, []);

    const handlePreview = useCallback(async (files: File[]) => {
        for (const file of files) {
            try {
                if (file.type.startsWith('image/')) {
                    const preview = await createImagePreview(file);
                    setPreviews(prev => [...prev, preview]);
                } else if (file.type === 'application/pdf') {
                    const preview = await createPDFPreview(file);
                    setPreviews(prev => [...prev, preview]);
                } else {
                    setPreviews(prev => [...prev, {
                        url: '',
                        name: file.name,
                        type: file.type
                    }]);
                }
            } catch (error) {
                console.error('預覽生成失敗:', error);
                setPreviews(prev => [...prev, {
                    url: '',
                    name: file.name,
                    type: file.type
                }]);
            }
        }
    }, []);

    const createImagePreview = (file: File): Promise<FilePreview> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    url: reader.result as string,
                    name: file.name,
                    type: file.type
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const createPDFPreview = async (file: File): Promise<FilePreview> => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const pdfData = new Uint8Array(reader.result as ArrayBuffer);
                    const loadingTask = pdfjsLib.getDocument({
                        data: pdfData,
                        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
                        cMapPacked: true,
                        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/',
                    });

                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: FILE_PREVIEW_CONFIG.pdfScale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d', { alpha: false });
                    if (!context) {
                        throw new Error('無法創建 Canvas 上下文');
                    }

                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    context.fillStyle = 'white';
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    resolve({
                        url: canvas.toDataURL('image/png', FILE_PREVIEW_CONFIG.imageQuality),
                        name: file.name,
                        type: file.type
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileUploadProcess = useCallback(async (files: File[]) => {
        if (showPreview) {
            await handlePreview(files);
        }
        onFileSelect?.(files);
        if (onFileUpload) {
            await simulateProgress();
            try {
                await onFileUpload(files);
                setUploadProgress(100);
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 1000);
            } catch (error) {
                setError('上傳失敗，請重試。');
                setIsUploading(false);
            }
        }
    }, [onFileSelect, onFileUpload, showPreview, handlePreview, simulateProgress]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        const validFiles = validateFiles(files);

        if (validFiles.length > 0) {
            await handleFileUploadProcess(validFiles);
        }
    }, [validateFiles, handleFileUploadProcess]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles = validateFiles(files);

            if (validFiles.length > 0) {
                await handleFileUploadProcess(validFiles);
            }
        }
    }, [validateFiles, handleFileUploadProcess]);

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return null;
        if (type.includes('pdf')) {
            return (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6" />
                </svg>
            );
        }
        if (type.includes('word') || type.includes('document')) {
            return (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" />
                </svg>
            );
        }
        return (
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    };

    const removePreview = useCallback((index: number) => {
        setPreviews(prev => prev.filter((_, i) => i !== index));
        onRemovePreview?.(index);
    }, [onRemovePreview]);

    const defaultContent = (
        <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div
                className="relative w-20 h-20 mx-auto mb-4"
                animate={isUploading ? {
                    y: [-4, -16, -4],
                    transition: {
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                } : {
                    y: [0, -4, 0],
                    transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }}
            >
                <motion.div
                    className={`absolute inset-0 bg-gradient-to-r from-${colors.primary}-500 to-${colors.secondary}-500 rounded-full opacity-20 blur-xl`}
                    animate={isUploading ? {
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.4, 0.2],
                        y: [-4, -16, -4],
                        transition: {
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    } : {
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        y: [0, -4, 0],
                        transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                />
                <motion.svg
                    className={`relative w-full h-full ${theme === 'violet' ? 'text-violet-500' : 'text-cyan-500'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    initial={false}
                    animate={isUploading ? {
                        y: [-2, -8, -2],
                        transition: {
                            duration: 0.6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    } : {
                        y: 0
                    }}
                >
                    {/* 速度線條 */}
                    {isUploading && (
                        <>
                            {[4, 8, 12, 16, 20].map((x, index) => (
                                <motion.line
                                    key={x}
                                    x1={x} y1="8" x2={x} y2="12"
                                    strokeLinecap="round"
                                    strokeWidth={1}
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{
                                        opacity: [0, 0.6, 0],
                                        y: [0, 12],
                                        transition: {
                                            duration: 0.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 0.08
                                        }
                                    }}
                                />
                            ))}
                        </>
                    )}
                    {/* 主箭頭 */}
                    <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={isUploading ? 3 : 2}
                        d="M12 20V4m-7 7l7-7l7 7"
                        initial={{ pathLength: 0, opacity: 1 }}
                        animate={isUploading ? {
                            pathLength: 1,
                            opacity: 1,
                            transition: {
                                duration: 0.3
                            }
                        } : {
                            pathLength: 1,
                            opacity: 1,
                            transition: {
                                duration: 0.5
                            }
                        }}
                    />
                </motion.svg>
            </motion.div>

            <AnimatePresence mode="wait">
                {isUploading ? (
                    <motion.div
                        key="uploading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <p className={`text-lg font-medium ${theme === 'violet' ? 'text-violet-600' : 'text-cyan-600'
                            }`}>Uploading...</p>
                        {showProgress && (
                            <>
                                <div className={`mt-4 relative h-2 ${theme === 'violet' ? 'bg-violet-100' : 'bg-cyan-100'
                                    } rounded-full overflow-hidden`}>
                                    <motion.div
                                        className={`absolute left-0 top-0 h-full ${theme === 'violet'
                                            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                            : 'bg-gradient-to-r from-cyan-500 to-sky-500'
                                            }`}
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${uploadProgress}%`,
                                            transition: {
                                                duration: 0.3,
                                                ease: "easeOut"
                                            }
                                        }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-white/20"
                                            animate={{
                                                x: ['-100%', '100%'],
                                                transition: {
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    ease: "linear"
                                                }
                                            }}
                                        />
                                    </motion.div>
                                </div>
                                <motion.p
                                    className={`mt-2 text-sm ${theme === 'violet' ? 'text-violet-500' : 'text-cyan-500'
                                        }`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{
                                        scale: 1,
                                        opacity: 1,
                                        transition: {
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 25
                                        }
                                    }}
                                >
                                    {uploadProgress}%
                                </motion.p>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <motion.p
                            className={`text-lg font-medium ${theme === 'violet'
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                : 'bg-gradient-to-r from-cyan-500 to-sky-500'
                                } bg-clip-text text-transparent`}
                            animate={{
                                opacity: [0.5, 1, 0.5],
                                scale: [0.98, 1, 0.98]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            Drop files here or click to upload
                        </motion.p>
                        {accept && (
                            <p className="mt-2 text-sm text-gray-500">
                                Supports {accept.split(',').map(type => type.replace('/*', '')).join(', ')} files
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.p
                    className="mt-4 text-sm text-red-500 bg-red-50 p-2 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    ⚠️ {error}
                </motion.p>
            )}
        </motion.div>
    );

    return (
        <div className="w-full flex flex-col items-center">
            <motion.div
                className={`w-full max-w-[600px] relative ${baseClassName} ${className} ${isDragActive ? (dragActiveClassName || defaultDragActiveClassName) : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={accept}
                    multiple={multiple}
                />

                <div className="cursor-pointer flex items-center justify-center min-h-[200px]" onClick={() => inputRef.current?.click()}>
                    {children || defaultContent}
                </div>
            </motion.div>

            {showPreview && previews.length > 0 && (
                <motion.div
                    className={`w-full max-w-[600px] mt-4 grid grid-cols-3 gap-4 ${previewGridClassName}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                >
                    {previews.map((preview, index) => (
                        <motion.div
                            key={index}
                            className="relative group aspect-square rounded-lg overflow-hidden shadow-lg"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            {(preview.type?.startsWith('image/') || preview.type === 'application/pdf') && preview.url ? (
                                <div className="w-full h-full bg-gray-50 p-2">
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-4">
                                    <div className={`text-${colors.primary}-500`}>
                                        {getFileIcon(preview.type || '')}
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 text-center line-clamp-2">
                                        {preview.name}
                                    </p>
                                </div>
                            )}
                            <motion.div
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                initial={false}
                            >
                                <motion.button
                                    onClick={() => removePreview(index)}
                                    className={`p-2 bg-${colors.primary}-500 rounded-full text-white hover:bg-${colors.primary}-600 transform hover:scale-110 transition-transform`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}; 