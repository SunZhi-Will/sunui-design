import { motion } from 'framer-motion';
import React from 'react';

interface UploadIconProps {
    isUploading: boolean;
    theme: 'violet' | 'cyan' | 'orange' | 'custom';
    colors: {
        primary: string;
        secondary: string;
    };
}

export const UploadIcon: React.FC<UploadIconProps> = ({ isUploading, theme, colors }) => {
    return (
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
    );
}; 