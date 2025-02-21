import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { SocialButtonProps } from './types';

export const SocialButton: React.FC<SocialButtonProps> = ({
    href,
    icon,
    position,
    className = '',
    iconClassName = '',
    variant,
    title,
    titleDisplay = 'none',
    titlePosition = 'bottom'
}) => {
    const getTitlePosition = () => {
        switch (titlePosition) {
            case 'top':
                return 'bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
            case 'right':
                return 'left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2';
            case 'bottom':
                return 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
            case 'left':
                return 'right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2';
            default:
                return 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
        }
    };

    const getTitleArrow = () => {
        const baseStyle = "absolute w-2 h-2 bg-gray-800/90 rotate-45";
        switch (titlePosition) {
            case 'top':
                return `${baseStyle} bottom-[-0.25rem] left-1/2 -translate-x-1/2`;
            case 'right':
                return `${baseStyle} left-[-0.25rem] top-1/2 -translate-y-1/2`;
            case 'bottom':
                return `${baseStyle} top-[-0.25rem] left-1/2 -translate-x-1/2`;
            case 'left':
                return `${baseStyle} right-[-0.25rem] top-1/2 -translate-y-1/2`;
            default:
                return `${baseStyle} top-[-0.25rem] left-1/2 -translate-x-1/2`;
        }
    };

    return (
        <motion.div
            initial={{ scale: 0, x: variant === 'vertical' ? 0 : 6, y: 6 }}
            animate={{ scale: 1, x: variant === 'vertical' ? 0 : position?.x, y: position?.y }}
            exit={{ scale: 0, x: variant === 'vertical' ? 0 : 6, y: 6, transition: { duration: 0.1 } }}
            transition={{ duration: 0.1, ease: [1, 1, 1, 1] }}
            className="absolute"
        >
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center
                    bg-gradient-to-r ${className} shadow-lg transition-all duration-300
                    text-white relative group`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {typeof icon === 'string' ? (
                    <Image src={icon} alt={title || ""} width={20} height={20} className={iconClassName} />
                ) : (
                    icon
                )}
                {title && titleDisplay !== 'none' && (
                    <div className={`absolute ${getTitlePosition()} whitespace-nowrap
                        px-2 py-1 bg-gray-800/90 text-white text-sm rounded
                        ${titleDisplay === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                        transition-opacity duration-200`}>
                        <div className={getTitleArrow()} />
                        {title}
                    </div>
                )}
            </motion.a>
        </motion.div>
    );
}; 