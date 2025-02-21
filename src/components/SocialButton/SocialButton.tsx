import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { SocialButtonProps } from './types';



export default function SocialButton({
    href,
    icon,
    position,
    className,
    iconClassName,
    variant,
    title,
    titleDisplay = 'none',
    titlePosition = 'bottom'
}: SocialButtonProps) {
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
        }
    };

    return (
        <motion.div
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{ scale: 1, x: position?.x, y: position?.y }}
            exit={{ scale: 0, x: 0, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
                duration: 0.3,
                exit: {
                    duration: 0.2,
                    type: "tween",
                    ease: "easeInOut"
                },
            }}
            className="absolute group"
            style={{
                zIndex: 1
            }}
            whileHover={{
                zIndex: 50
            }}
        >
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-block"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center
                        bg-gradient-to-r ${className} shadow-lg transition-all duration-300
                        text-white relative`}
                >
                    {typeof icon === 'string' ? (
                        <Image
                            src={icon}
                            alt={title || ""}
                            width={20}
                            height={20}
                            className={iconClassName}
                        />
                    ) : (
                        icon
                    )}
                </div>
                {title && titleDisplay !== 'none' && (
                    <div
                        className={`
                            absolute ${getTitlePosition()}
                            px-3 py-1.5 rounded-lg bg-gray-800/90 backdrop-blur-sm
                            text-white text-sm font-medium tracking-wide
                            shadow-lg pointer-events-none z-[100]
                            ${titleDisplay === 'hover' ? 'opacity-0 group-hover:opacity-100 invisible group-hover:visible' : 'opacity-100'}
                            transition-all duration-200 transform
                            whitespace-nowrap
                        `}
                    >
                        <div className={getTitleArrow()} />
                        {title}
                    </div>
                )}
            </motion.a>
        </motion.div>
    );
} 