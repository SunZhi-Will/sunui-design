'use client'

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
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
    showToggleButton = true,
    draggable = false,
    onPositionChange,
    defaultPosition
}) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
    const isMenuOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
    const dragControls = useDragControls();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragPosition, setDragPosition] = useState(defaultPosition || { x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartTimeRef = useRef(0);
    const dragThresholdExceeded = useRef(false);

    const positionClasses = {
        'bottom-right': 'right-4 sm:right-8 bottom-8',
        'bottom-left': 'left-4 sm:left-8 bottom-8',
        'top-right': 'right-4 sm:right-8 top-8',
        'top-left': 'left-4 sm:left-8 top-8'
    };

    // 當無法拖拉時，重置位置
    useEffect(() => {
        if (!draggable) {
            setDragPosition({ x: 0, y: 0 });
        }
    }, [draggable]);

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const newX = dragPosition.x + info.offset.x;
        const newY = dragPosition.y + info.offset.y;

        setDragPosition({ x: newX, y: newY });
        onPositionChange?.(newX, newY);

        // 如果實際上沒有超過移動閾值，這可能是一個點擊而非拖拽
        if (!dragThresholdExceeded.current) {
            handleToggle();
        }

        // 重置狀態
        setIsDragging(false);
        dragThresholdExceeded.current = false;
    };

    const handleToggle = () => {
        // 如果正在拖動，不觸發切換，但不檢查時間間隔了
        if (isDragging) {
            return;
        }

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
                        className={button.className || "bg-gradient-to-r from-blue-600 to-blue-800 shadow-md hover:shadow-blue-500/50"}
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
                    variant,
                    className: child.props.className?.includes('bg-gradient-to-r')
                        ? child.props.className
                        : `bg-gradient-to-r ${child.props.className || 'from-blue-600 to-blue-800 shadow-md hover:shadow-blue-500/50'}`
                });
            }
            return child;
        }) as React.ReactElement[];
    };

    return (
        <motion.div
            ref={containerRef}
            className={`fixed ${draggable ? '' : positionClasses[position]} z-[140] 
                ${draggable ? '' : 'transition-all duration-300'}
                ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${draggable ? 'cursor-move' : ''}
                ${className}`}
            drag={draggable}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}

            // 使用最基本的拖拽配置，移除所有可能導致延遲的高級功能
            dragTransition={{
                power: 0,
                timeConstant: 0,
                modifyTarget: target => target
            }}

            onDragStart={handleDragStart}
            onDragEnd={(_event, info) => {
                const newX = dragPosition.x + info.offset.x;
                const newY = dragPosition.y + info.offset.y;

                setDragPosition({ x: newX, y: newY });
                onPositionChange?.(newX, newY);

                // 如果實際上沒有超過移動閾值，這可能是一個點擊而非拖拽
                if (!dragThresholdExceeded.current) {
                    // 短暫延遲執行toggle，確保其他事件已處理完成
                    setTimeout(handleToggle, 10);
                }

                // 重置狀態
                setIsDragging(false);
                dragThresholdExceeded.current = false;
            }}

            dragListener={draggable}
            style={draggable ? {
                position: 'fixed',
                right: position.includes('right') ? '20px' : 'auto',
                left: position.includes('left') ? '20px' : 'auto',
                bottom: position.includes('bottom') ? '20px' : 'auto',
                top: position.includes('top') ? '20px' : 'auto',
                x: dragPosition.x,
                y: dragPosition.y,
                // 徹底關閉所有過渡效果，確保即時響應
                transition: 'none',
                // 確保比其他元素更高的層級
                zIndex: 1000
            } : undefined}

            // 關閉所有自動佈局和初始動畫
            layout={false}
            initial={false}
        >
            <AnimatePresence mode="wait">
                {isMenuOpen && (
                    <div className="absolute" style={{ inset: 0, pointerEvents: isDragging ? 'none' : 'auto' }}>
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
                                        pointerEvents: isDragging ? 'none' : 'auto',
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
                                onPointerDown={draggable ? (e) => {
                                    // 只在左鍵點擊時處理
                                    if (e.buttons === 1) {
                                        // 直接開始拖動，不再等待移動
                                        dragControls.start(e);
                                        dragThresholdExceeded.current = false;
                                        e.stopPropagation();
                                    }
                                } : undefined}

                                // 添加移動事件處理
                                onPointerMove={draggable ? (e) => {
                                    if (e.buttons === 1 && Math.abs(e.movementX) + Math.abs(e.movementY) > 3) {
                                        // 如果移動超過閾值，才標記為拖動操作
                                        dragThresholdExceeded.current = true;
                                        setIsDragging(true);
                                    }
                                } : undefined}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </motion.svg>
                        }
                        className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-md hover:shadow-blue-500/50"
                        onClick={handleToggle}
                    />
                </div>
            )}
        </motion.div>
    );
}; 