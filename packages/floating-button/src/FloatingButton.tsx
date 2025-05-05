'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialButton, SocialButtonProps } from '@sunui-design/social';
import type { FloatingButtonProps } from './types';
import { FacebookIcon, GithubIcon, InstagramIcon, LinkedinIcon, TwitterIcon } from './icons';

const socialIcons = {
    facebook: FacebookIcon,
    github: GithubIcon,
    instagram: InstagramIcon,
    linkedin: LinkedinIcon,
    twitter: TwitterIcon
};

export const FloatingButton: React.FC<FloatingButtonProps> = ({
    show = true,
    isOpen: controlledIsOpen,
    onOpenChange,
    defaultOpen = false,
    children,
    className = '',
    buttonClassName: _buttonClassName = '',
    position = 'bottom-right',
    buttons = [],
    variant = 'petal',
    showToggleButton = true
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
        const baseRadius = 56;
        const _baseButtonCount = 3;

        if (variant === 'grid') {
            const spacing = 56;
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
            const spacing = 56;
            switch (position) {
                case 'bottom-right':
                case 'bottom-left':
                    return {
                        x: 0,
                        y: -spacing * (index + 1)
                    };
                case 'top-right':
                case 'top-left':
                    return {
                        x: 0,
                        y: spacing * (index + 1)
                    };
                default:
                    return { x: 0, y: 0 };
            }
        }

        // 花瓣模式的新計算方法
        let currentIndex = index;
        let layer = 0;
        let buttonsInPreviousLayers = 0;

        // 計算當前按鈕所在的層數和之前的按鈕數量
        while (currentIndex >= 0) {
            const buttonsInThisLayer = Math.min(3 + (layer * 2), total - buttonsInPreviousLayers);
            if (currentIndex < buttonsInThisLayer) {
                break;
            }
            currentIndex -= buttonsInThisLayer;
            buttonsInPreviousLayers += buttonsInThisLayer;
            layer++;
        }

        // 計算當前層的按鈕數量和角度
        const buttonsInThisLayer = Math.min(3 + (layer * 2), total - buttonsInPreviousLayers);
        const indexInLayer = index - buttonsInPreviousLayers;
        const radius = baseRadius * (layer + 1);

        // 計算展開角度，根據按鈕數量調整
        const maxAngle = Math.PI / 2; // 90度展開範圍
        const angleStep = maxAngle / (buttonsInThisLayer - 1 || 1);
        const angle = angleStep * indexInLayer;

        switch (position) {
            case 'bottom-right':
                return {
                    x: -radius * Math.cos(angle),
                    y: -radius * Math.sin(angle)
                };
            case 'bottom-left':
                return {
                    x: radius * Math.cos(angle),
                    y: -radius * Math.sin(angle)
                };
            case 'top-right':
                return {
                    x: -radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                };
            case 'top-left':
                return {
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                };
            default:
                return { x: 0, y: 0 };
        }
    };

    const renderChildren = () => {
        if (!children) {
            return buttons.map((button, index) => {
                const IconComponent = button.type ? socialIcons[button.type] : undefined;
                return (
                    <SocialButton
                        key={button.href}
                        {...button}
                        icon={IconComponent ? <IconComponent /> : button.icon}
                        className={button.className || "from-primary-600/90 to-primary-800/90 hover:shadow-primary-500/50"}
                        variant={variant}
                    />
                );
            }) as React.ReactElement[];
        }

        return React.Children.map(children, (child, index) => {
            if (React.isValidElement<SocialButtonProps>(child)) {
                return React.cloneElement(child, {
                    ...child.props,
                    key: index,
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
                    <div className="absolute" style={{ inset: 0 }}>
                        {renderChildren().map((child, _index) => {
                            if (!React.isValidElement(child)) return null;

                            let pos;
                            if (!showToggleButton) {
                                if (_index === 0) {
                                    // 第一個按鈕在展開位置
                                    pos = { x: -24, y: -24 };
                                } else {
                                    // 其他按鈕從第一個位置開始依序排列
                                    const basePos = calculatePosition(_index - 1, renderChildren().length - 1);
                                    pos = {
                                        x: basePos.x - 24,
                                        y: basePos.y - 24
                                    };
                                }
                            } else {
                                pos = calculatePosition(_index, renderChildren().length);
                            }

                            return (
                                <motion.div
                                    className='absolute'
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        pointerEvents: 'auto',
                                        zIndex: variant === 'vertical' ? 1000 - _index : 10,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    key={child.key}
                                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        x: pos.x,
                                        y: pos.y,
                                        transition: {
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 24,
                                            delay: _index * 0.05
                                        }
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0,
                                        x: 0,
                                        y: 0,
                                        transition: {
                                            duration: 0.2,
                                            delay: (renderChildren().length - _index - 1) * 0.05
                                        }
                                    }}
                                >
                                    <div className="w-full h-full flex items-center justify-center">
                                        {React.cloneElement(child as React.ReactElement<SocialButtonProps>, {
                                            variant: (child as React.ReactElement<SocialButtonProps>).props.variant,
                                            className: `${(child as React.ReactElement<SocialButtonProps>).props.className || ''} cursor-pointer`
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>

            {showToggleButton && (
                <div className="relative" style={{ zIndex: variant === 'vertical' ? 2000 : 'auto' }}>
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
                        className="from-primary-600/90 to-primary-800/90 hover:shadow-primary-500/50"
                        onClick={handleToggle}
                    />
                </div>
            )}
        </div>
    );
}; 