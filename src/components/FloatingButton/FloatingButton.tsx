'use client'

import React, { useState, Children, isValidElement, cloneElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialButton } from '../SocialButton';
import type { SocialButtonProps } from '.';
import { FloatingButtonProps } from '.';


export default function FloatingButtons({
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
}: FloatingButtonProps) {
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
            const spacing = 50; // 減小間距使按鈕更緊湊
            const itemsPerRow = Math.ceil(Math.sqrt(total)); // 計算每行應該有幾個按鈕

            // 計算在網格中的位置
            let row, col;
            const now = index + 1;

            if (position === 'bottom-right') {
                // 從右下角開始，往左上方排列
                // 反轉索引，使最後一個按鈕在左上角
                const reversedIndex = total - index;
                row = Math.floor(reversedIndex / itemsPerRow);
                col = reversedIndex % itemsPerRow;
                return {
                    x: -col * spacing,
                    y: -row * spacing
                };
            } else if (position === 'bottom-left') {
                // 從左下角開始，往右上方排列
                // 反轉索引，使最後一個按鈕在右上角
                const reversedIndex = total - index;
                row = Math.floor(reversedIndex / itemsPerRow);
                col = reversedIndex % itemsPerRow;
                return {
                    x: col * spacing,
                    y: -row * spacing
                };
            } else if (position === 'top-right') {
                // 從右上角開始，往左下方排列
                row = Math.floor(now / itemsPerRow);
                col = now % itemsPerRow;
                return {
                    x: -col * spacing,
                    y: row * spacing
                };
            } else { // top-left
                // 從左上角開始，往右下方排列
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
            return (
                <div className={`absolute inset-0 ${variant === 'vertical' ? 'flex justify-center' : ''}`}>
                    {buttons.map((button, index) => (
                        <SocialButton
                            key={button.href}
                            {...button}
                            className={button.className || "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"}
                            position={calculatePosition(index, buttons.length)}
                            variant={variant}
                        />
                    ))}
                </div>
            );
        }

        const childrenArray = Children.toArray(children);
        return (
            <div className={`absolute inset-0 ${variant === 'vertical' ? 'flex justify-center' : ''}`}>
                {childrenArray.map((child, index) => {
                    if (isValidElement(child) && child.type === SocialButton) {
                        return cloneElement(child as React.ReactElement<SocialButtonProps>, {
                            key: index,
                            position: calculatePosition(index, childrenArray.length),
                            variant
                        });
                    }
                    return child;
                })}
            </div>
        );
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-500
            ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
            ${className}`}>
            <motion.button
                onClick={handleToggle}
                className={`w-12 h-12 rounded-full flex items-center justify-center
                    bg-gradient-to-r from-blue-600/90 to-blue-800/90 
                    shadow-lg hover:shadow-blue-500/50 transition-all duration-300
                    relative z-50 text-white ${buttonClassName}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
            </motion.button>

            <AnimatePresence mode="wait">
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderChildren()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}