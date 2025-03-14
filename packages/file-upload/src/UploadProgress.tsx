import { motion } from 'framer-motion';
import React from 'react';
import { UploadIcon } from './UploadIcon';

interface UploadProgressProps {
    isUploading: boolean;
    uploadProgress: number;
    showProgress: boolean;
    theme: 'violet' | 'cyan' | 'orange' | 'custom';
    colors: {
        primary: string;
        secondary: string;
    };
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
    isUploading,
    uploadProgress,
    showProgress,
    theme,
    colors
}) => {
    return (
        <motion.div
            className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <UploadIcon isUploading={isUploading} theme={theme} colors={colors} />

            <motion.div
                className="w-[300px] text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className={`text-lg font-medium ${theme === 'violet' ? 'text-violet-600' : theme === 'cyan' ? 'text-cyan-600' : 'text-orange-600'}`}>
                    正在上傳...
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
                                animate={{ width: `${uploadProgress}%` }}
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
                        >
                            {uploadProgress}%
                        </motion.p>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}; 