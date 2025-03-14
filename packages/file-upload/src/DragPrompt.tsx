import { motion } from 'framer-motion';
import React from 'react';

interface DragPromptProps {
    isDragActive: boolean;
    colors: {
        primary: string;
    };
}

export const DragPrompt: React.FC<DragPromptProps> = ({ isDragActive, colors }) => {
    return (
        <motion.div
            className={`absolute inset-0 pointer-events-none ${isDragActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        >
            <div className={`absolute inset-2 border-2 border-${colors.primary}-500 border-dashed rounded-lg flex items-center justify-center`}>
                <div className={`px-6 py-4 bg-${colors.primary}-50 rounded-lg shadow-sm`}>
                    <p className={`text-${colors.primary}-600 font-medium`}>Release to upload files</p>
                </div>
            </div>
        </motion.div>
    );
}; 