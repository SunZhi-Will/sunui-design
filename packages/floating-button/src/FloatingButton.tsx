'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialButton, SocialButtonProps } from '@sunui-design/social';
import type { FloatingButtonProps } from './types';

export const FloatingButton: React.FC<FloatingButtonProps> = ({
    show = true,
    isOpen: controlledIsOpen,
    onOpenChange,
    defaultOpen = false,
    children,
    className = '',
    buttonClassName = '',
    position = 'bottom-right',
    buttons = [],
    variant = 'petal'
}) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
    const isMenuOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;

    const positionClasses = {
        'bottom-right': 'right-4 sm:right-8 bottom-8',
        'bottom-left': 'left-4 sm:left-8 bottom-8',
        'top-right': 'right-4 sm:right-8 top-8',
        'top-left': 'left-4 sm:left-8 top-8'
    };

    const handleToggle = () => {
        const newState = !isMenuOpen;
        onOpenChange?.(newState);
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(newState);
        }
    };

    const calculatePosition = (index: number, total: number) => {
        const baseRadius = 60;
        const baseButtonCount = 3;

        if (variant === 'grid') {
            const spacing = 50;
            const itemsPerRow = Math.ceil(Math.sqrt(total));

            const now = index + 1;
            let row, col;

            if (position === 'bottom-right') {
                const reversedIndex = total - index;
                row = Math.floor(reversedIndex / itemsPerRow);
                col = reversedIndex % itemsPerRow;
                return {
                    x: -col * spacing,
                    y: -row * spacing
                };
            } else if (position === 'bottom-left') {
                const reversedIndex = total - index;
                row = Math.floor(reversedIndex / itemsPerRow);
                col = reversedIndex % itemsPerRow;
                return {
                    x: col * spacing,
                    y: -row * spacing
                };
            } else if (position === 'top-right') {
                row = Math.floor(now / itemsPerRow);
                col = now % itemsPerRow;
                return {
                    x: -col * spacing,
                    y: row * spacing
                };
            } else {
                row = Math.floor(now / itemsPerRow);
                col = now % itemsPerRow;
                return {
                    x: col * spacing,
                    y: row * spacing
                };
            }
        }

        if (variant === 'vertical') {
            const spacing = 50;
            switch (position) {
                case 'bottom-right':
                case 'bottom-left':
                    return {
                        x: position.includes('right') ? 0 : 0,
                        y: -spacing * (index + 1)
                    };
                case 'top-right':
                case 'top-left':
                    return {
                        x: position.includes('right') ? 0 : 0,
                        y: spacing * (index + 1) + 10
                    };
                default:
                    return { x: 0, y: 0 };
            }
        }

        let currentIndex = index;
        let layer = 0;
        let buttonsInPreviousLayers = 0;

        while (currentIndex >= 0) {
            const buttonsInThisLayer = baseButtonCount + (layer * 2);
            if (currentIndex < buttonsInThisLayer) {
                break;
            }
            currentIndex -= buttonsInThisLayer;
            buttonsInPreviousLayers += buttonsInThisLayer;
            layer++;
        }

        const buttonsInThisLayer = baseButtonCount + (layer * 2);
        const indexInLayer = index - buttonsInPreviousLayers;
        const radius = baseRadius * (layer + 1);
        const angleOffset = (Math.PI / 2) * (indexInLayer / (buttonsInThisLayer - 1));

        switch (position) {
            case 'bottom-right':
                return {
                    x: -radius * Math.cos(angleOffset),
                    y: -radius * Math.sin(angleOffset)
                };
            case 'bottom-left':
                return {
                    x: radius * Math.cos(angleOffset),
                    y: -radius * Math.sin(angleOffset)
                };
            case 'top-right':
                return {
                    x: -radius * Math.cos(angleOffset),
                    y: radius * Math.sin(angleOffset)
                };
            case 'top-left':
                return {
                    x: radius * Math.cos(angleOffset),
                    y: radius * Math.sin(angleOffset)
                };
            default:
                return { x: 0, y: 0 };
        }
    };

    const renderChildren = () => {
        if (!children) {
            return buttons.map((button, index) => (
                <SocialButton
                    key={button.href}
                    {...button}
                    className={button.className || "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"}
                    position={calculatePosition(index, buttons.length)}
                    variant={variant}
                />
            )) as React.ReactElement[];
        }

        return React.Children.map(children, (child, index) => {
            if (React.isValidElement<SocialButtonProps>(child)) {
                return React.cloneElement(child, {
                    ...child.props,
                    key: index,
                    position: calculatePosition(index, React.Children.count(children)),
                    variant
                });
            }
            return child;
        }) as React.ReactElement[];
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-[140] transition-all duration-500
            ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
            ${className}`}>
            <AnimatePresence mode="wait">
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0"
                    >
                        <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={{
                                open: { transition: { staggerChildren: 0.05 } },
                                closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                            }}
                            className={variant === 'vertical' ? 'flex justify-center' : ''}
                        >
                            {renderChildren().map((child) =>
                                <motion.div
                                    className='flex justify-center'
                                    key={child.key}
                                    variants={{
                                        open: {
                                            opacity: 1,
                                            scale: 1,
                                            transition: { type: "spring", stiffness: 300, damping: 24 }
                                        },
                                        closed: {
                                            opacity: 0,
                                            scale: 0,
                                            transition: { duration: 0.2 }
                                        }
                                    }}
                                >
                                    <div>{React.isValidElement(child) && child}</div>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <SocialButton
                    isMainButton
                    isOpen={isMenuOpen}
                    icon={
                        <motion.svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            animate={{ rotate: isMenuOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </motion.svg>
                    }
                    className="from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
                    onClick={handleToggle}
                />
            </div>
        </div>
    );
}; 