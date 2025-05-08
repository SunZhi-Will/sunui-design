import React, { useCallback, useState, useRef, useMemo, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadIcon as _UploadIcon } from './UploadIcon';
import { DragPrompt as _DragPrompt } from './DragPrompt';
import { UploadProgress } from './UploadProgress';
import { PreviewGrid } from './PreviewGrid';

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

export type FileUploadProps = {
    onFileSelect?: (files: File[]) => void;
    onFileUpload?: (files: File[]) => Promise<void>;
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    className?: string;
    dragActiveClassName?: string;
    children?: React.ReactNode;
    showProgress?: boolean;
    theme?: 'violet' | 'cyan' | 'orange' | 'custom';
    showPreview?: boolean;
    previewGridClassName?: string;
    onRemovePreview?: (index: number) => void;
    placeholder?: string;
    description?: string;
}

export const FileUpload = (props: FileUploadProps): ReactElement => {
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
        theme = 'orange',
        showPreview = true,
        previewGridClassName = '',
        onRemovePreview,
        placeholder = 'Drop files here or click to upload',
        description,
    } = props;

    // 狀態管理
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previews, setPreviews] = useState<FilePreview[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploadComplete, setUploadComplete] = useState(false);
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
        orange: {
            primary: 'orange',
            secondary: 'amber',
            text: 'orange-600',
            bg: 'orange-100',
            border: 'orange-300',
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
    const baseClassName = useMemo(() => `min-h-[200px] ${theme === 'violet'
        ? 'bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-300 hover:border-violet-500/50'
        : theme === 'cyan'
            ? 'bg-gradient-to-br from-cyan-500/5 to-sky-500/5 border-cyan-300 hover:border-cyan-500/50'
            : theme === 'orange'
                ? 'bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-orange-300 hover:border-orange-500/50'
                : 'bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-300 hover:border-violet-500/50'
        } backdrop-blur-sm border-2 border-dashed rounded-xl p-8 transition-all duration-300 hover:shadow-lg`, [theme]);

    const _defaultClassName = `w-full ${baseClassName}`;

    const defaultDragActiveClassName = useMemo(() => `scale-[1.02] ${theme === 'violet'
        ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10'
        : theme === 'cyan'
            ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-sky-500/10'
            : theme === 'orange'
                ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-amber-500/10'
                : 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10'
        } shadow-xl`, [theme]);

    // 檔案處理相關函數
    const validateFiles = useCallback((files: File[]): File[] => {
        setError(null);
        return files.filter(file => {
            if (maxSize && file.size > maxSize) {
                setError(`File ${file.name} exceeds size limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
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
                    setError(`File type ${file.name} is not supported`);
                    return false;
                }
            }
            return true;
        });
    }, [maxSize, accept]);

    const handlePreviewDragAction = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    }, [setIsDragActive]);

    const simulateProgress = useCallback(async () => {
        setIsUploading(true);
        setUploadProgress(0);
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 30));
            setUploadProgress(i);
        }
    }, [setIsUploading, setUploadProgress]);

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
        return new Promise((resolve, _error) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                resolve({
                    url: result,
                    name: file.name,
                    type: file.type
                });
            };
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
                    console.error('預覽生成失敗:', error);
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileUploadProcess = useCallback(async (files: File[]) => {
        await handlePreview(files);
        onFileSelect?.(files);
        if (onFileUpload) {
            await simulateProgress();
            try {
                await onFileUpload(files);
                setUploadProgress(100);
                setUploadedFiles(files);
                setUploadComplete(true);
                setTimeout(() => {
                    setIsUploading(false);
                }, 300);
            } catch (error) {
                console.error('Upload failed:', error);
                setError('Upload failed. Please try again.');
                setIsUploading(false);
                setUploadComplete(false);
            }
        }
    }, [onFileSelect, onFileUpload, handlePreview, simulateProgress, setUploadProgress, setUploadedFiles, setUploadComplete, setIsUploading, setError]);

    const resetUpload = useCallback(() => {
        setUploadedFiles([]);
        setUploadComplete(false);
        setUploadProgress(0);
        setPreviews([]);
        setError(null);
    }, [setUploadedFiles, setUploadComplete, setUploadProgress, setPreviews, setError]);

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

    const getFileIcon = (type: string, isPreview = true) => {
        const iconSize = isPreview ? "w-12 h-12" : "w-6 h-6";
        if (type.startsWith('image/')) return null;
        if (type.includes('pdf')) {
            return (
                <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6" />
                </svg>
            );
        }
        if (type.includes('word') || type.includes('document')) {
            return (
                <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" />
                </svg>
            );
        }
        return (
            <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    };

    const removePreview = useCallback((index: number) => {
        setPreviews(prev => {
            const newPreviews = prev.filter((_item, i) => i !== index);
            if (newPreviews.length === 0) {
                // 當移除所有檔案時，重置所有狀態
                setUploadedFiles([]);
                setUploadComplete(false);
                setUploadProgress(0);
                setError(null);
            }
            return newPreviews;
        });
        onRemovePreview?.(index);
    }, [onRemovePreview, setPreviews, setUploadedFiles, setUploadComplete, setUploadProgress, setError]);

    const renderUploadedFiles = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center w-full h-full min-h-[200px]"
        >
            <div className={`p-4 rounded-lg bg-${colors.primary}-50 w-full max-w-[300px] border border-${colors.primary}-100`}>
                {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center mb-2 last:mb-0 p-2 hover:bg-${colors.primary}-100/50 rounded-lg transition-colors">
                        <div className={`text-${colors.primary}-500 flex-shrink-0 w-8 h-8`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className={`text-sm font-medium text-${colors.text} truncate group-hover:text-${colors.primary}-700`}>
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB &bull; Upload successful
                            </p>
                        </div>
                        <div className={`text-${colors.primary}-500 flex-shrink-0`}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
            <motion.button
                onClick={resetUpload}
                className={`mt-4 px-4 py-2 text-sm bg-${colors.primary}-50 text-${colors.primary}-600 hover:bg-${colors.primary}-100 rounded-lg transition-colors flex items-center gap-2`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m0-16l-4 4m4-4l4 4" />
                </svg>
                Upload New File
            </motion.button>
        </motion.div>
    );

    const defaultContent = (
        <motion.div
            className="text-center h-full flex flex-col items-center justify-center min-h-[160px] relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {showPreview && uploadComplete ? renderUploadedFiles() : (
                <>
                    <motion.div
                        className={`absolute inset-0 pointer-events-none ${isDragActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                    >
                        <div className={`absolute inset-2 border-2 border-${colors.primary}-500 border-dashed rounded-lg flex items-center justify-center`}>
                            <div className={`px-6 py-4 bg-${colors.primary}-50 rounded-lg shadow-sm`}>
                                <p className={`text-${colors.primary}-600 font-medium`}>Release to upload files</p>
                            </div>
                        </div>
                    </motion.div>
                    <AnimatePresence>
                        {(!previews.length || isDragActive) && (
                            <motion.div
                                className="flex flex-col items-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <motion.div
                                    className="relative w-20 h-20 mb-4"
                                    animate={isUploading ? {
                                        y: [-4, -16, -4],
                                        transition: {
                                            duration: 0.6,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }
                                    } : {
                                        y: [-2, -6, -2],
                                        transition: {
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }
                                    }}
                                >
                                    <motion.div
                                        className={`absolute inset-0 bg-gradient-to-r from-${colors.primary}-500 to-${colors.secondary}-500 rounded-full opacity-20 blur-xl`}
                                        animate={isUploading ? {
                                            opacity: [0.2, 0.4, 0.2],
                                            y: [-4, -16, -4],
                                            transition: {
                                                duration: 0.6,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }
                                        } : {
                                            opacity: [0.1, 0.2, 0.1],
                                            y: [-2, -6, -2],
                                            transition: {
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }
                                        }}
                                    />
                                    <motion.svg
                                        className={`relative w-full h-full ${theme === 'violet' ? 'text-violet-500' : theme === 'cyan' ? 'text-cyan-500' : 'text-orange-500'}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        animate={isUploading ? {
                                            y: [-2, -8, -2],
                                            transition: {
                                                duration: 0.4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }
                                        } : {
                                            y: [-1, -3, -1],
                                            transition: {
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }
                                        }}
                                    >
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
                                        <motion.path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={isUploading ? 3 : 2}
                                            d="M12 20V4m-7 7l7-7l7 7"
                                        />
                                    </motion.svg>
                                </motion.div>

                                <AnimatePresence mode="wait">
                                    {isUploading ? (
                                        <motion.div
                                            key="uploading"
                                            className="w-[300px]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <p className={`text-lg font-medium ${theme === 'violet' ? 'text-violet-600' : theme === 'cyan' ? 'text-cyan-600' : 'text-orange-600'}`}>
                                                Uploading...
                                            </p>
                                            {showProgress && (
                                                <>
                                                    <div className={`mt-4 relative h-2 ${theme === 'violet' ? 'bg-violet-100' : theme === 'cyan' ? 'bg-cyan-100' : 'bg-orange-100'} rounded-full overflow-hidden`}>
                                                        <motion.div
                                                            className={`absolute left-0 top-0 h-full ${theme === 'violet'
                                                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                                                : theme === 'cyan'
                                                                    ? 'bg-gradient-to-r from-cyan-500 to-sky-500'
                                                                    : 'bg-gradient-to-r from-orange-500 to-amber-500'
                                                                }`}
                                                            initial={{ width: 0 }}
                                                            animate={{
                                                                width: `${uploadProgress}%`
                                                            }}
                                                            transition={{
                                                                duration: 0.15,
                                                                ease: "linear"
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
                                                        className={`mt-2 text-sm ${theme === 'violet' ? 'text-violet-500' : theme === 'cyan' ? 'text-cyan-500' : 'text-orange-500'}`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {uploadProgress}%
                                                    </motion.p>
                                                </>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            className="w-[300px]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <motion.p
                                                className={`text-lg font-medium ${theme === 'violet'
                                                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                                    : theme === 'cyan'
                                                        ? 'bg-gradient-to-r from-cyan-500 to-sky-500'
                                                        : 'bg-gradient-to-r from-orange-500 to-amber-500'
                                                    } bg-clip-text text-transparent`}
                                                animate={{
                                                    opacity: [0.5, 1, 0.5]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                {placeholder}
                                            </motion.p>
                                            {(accept || description) && (
                                                <p className="mt-2 text-sm text-gray-500">
                                                    {description || (accept && `Supported file types: ${accept.split(",").map(type => type.replace("/*", "")).join(", ")}`)}
                                                </p>
                                            )}
                                            {maxSize && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Maximum file size: {(maxSize / 1024 / 1024).toFixed(0)} MB
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
            {error && (
                <motion.div
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-[300px]"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 shadow-sm text-red-600 p-4 rounded-xl backdrop-blur-sm">
                        <div className="flex-shrink-0">
                            <motion.svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <motion.path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                />
                            </motion.svg>
                        </div>
                        <motion.p
                            className="text-sm flex-1 font-medium"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                        >
                            {error}
                        </motion.p>
                        <motion.button
                            onClick={() => setError(null)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setError(null);
                                }
                            }}
                            className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );

    return (
        <div className="w-full flex flex-col items-center">
            <motion.div
                className={`w-full max-w-[600px] relative ${_defaultClassName} ${className} ${isDragActive ? (dragActiveClassName || defaultDragActiveClassName) : ''}`}
                onDragEnter={handlePreviewDragAction}
                onDragLeave={handlePreviewDragAction}
                onDragOver={handlePreviewDragAction}
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

                <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer flex flex-col items-start justify-start h-full min-h-[200px] relative"
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            inputRef.current?.click();
                        }
                    }}
                >
                    {previews.length > 0 && (
                        <PreviewGrid
                            previews={previews}
                            showPreview={showPreview}
                            previewGridClassName={previewGridClassName}
                            colors={colors}
                            getFileIcon={getFileIcon}
                            removePreview={removePreview}
                        />
                    )}

                    <AnimatePresence>
                        {isUploading && (
                            <UploadProgress
                                isUploading={isUploading}
                                uploadProgress={uploadProgress}
                                showProgress={showProgress}
                                theme={theme}
                                colors={colors}
                            />
                        )}
                    </AnimatePresence>

                    {(!previews.length) && !isUploading && (children || defaultContent)}
                </div>
            </motion.div>
        </div>
    );
}; 