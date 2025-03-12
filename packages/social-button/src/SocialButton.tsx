'use client'

import React from 'react';
import { motion } from 'framer-motion';
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
    titlePosition = 'bottom',
    onClick,
    isMainButton,
    isOpen
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

    const buttonContent = (
        <>
            {typeof icon === 'string' ? (
                <img src={icon} alt={title || ""} width={20} height={20} className={iconClassName} />
            ) : (
                icon
            )}
            {title && titleDisplay !== 'none' && (
                <div className={`absolute ${getTitlePosition()} whitespace-nowrap
                    px-2 py-1 bg-gray-800/90 text-white text-sm rounded
                    ${titleDisplay === 'always'
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'}
                    transition-opacity duration-200 z-[200]`}>
                    <div className={getTitleArrow()} />
                    {title}
                </div>
            )}
        </>
    );

    const buttonClassName = `
        ${isMainButton ? 'w-12 h-12' : 'w-10 h-10'}
        rounded-full flex items-center justify-center
        bg-gradient-to-r ${className || "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"}
        shadow-lg transition-all duration-300
        text-white relative group
        hover:z-[145]
    `;

    const motionProps = {
        initial: { scale: 0, x: variant === 'vertical' ? 0 : position?.x || 0, y: position?.y || 0 },
        animate: { scale: 1, x: variant === 'vertical' ? 0 : position?.x || 0, y: position?.y || 0 },
        exit: { scale: 0, x: variant === 'vertical' ? 0 : position?.x || 0, y: position?.y || 0 },
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.9 },
        transition: { duration: 0.1, ease: [1, 1, 1, 1] }
    };

    // 根據位置計算 z-index，位置越前面 z-index 越大
    const getZIndex = () => {
        if (!position) return 140;
        // 計算方式：基礎值 140 減去 x 和 y 的位置值（除以 100 來降低差距）
        return 140 - (position.x / 100 + position.y / 100);
    };

    if (isMainButton) {
        return (
            <motion.button
                className={buttonClassName}
                onClick={onClick}
                {...motionProps}
            >
                {buttonContent}
            </motion.button>
        );
    }

    return (
        <motion.div className={`absolute`} style={{ zIndex: getZIndex() }}>
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName}
                onClick={onClick}
                {...motionProps}
            >
                {buttonContent}
            </motion.a>
        </motion.div>
    );
}; 