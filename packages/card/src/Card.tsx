import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from './utils';
import {
    CardVariant, CardSize, CardTheme, CardAnimation, CardPosition,
    CardElevation, CardProps, CardLoadingMode, CardLoadingProgress,
    CardHeaderProps, CardContentProps, CardFooterProps, CardGroupProps,
    CardImageProps, CardTextProps, CardActionsProps
} from './types';
import {
    themeColorMap, getVariantStyle, sizeStylesMap,
    elevationStylesMap, positionStylesMap, generateAnimationVariants,
    getHoverAnimation
} from './styles';
import {
    CardHeader, CardContent, CardFooter, CardImage,
    CardText, CardGroup, CardActions
} from './components';

// 明確導出所有組件和類型
export {
    CardHeader, CardContent, CardFooter, CardImage,
    CardText, CardGroup, CardActions
};

export type {
    CardVariant, CardSize, CardTheme, CardAnimation, CardPosition,
    CardElevation, CardProps, CardLoadingMode, CardLoadingProgress,
    CardHeaderProps, CardContentProps, CardFooterProps, CardGroupProps,
    CardImageProps, CardTextProps, CardActionsProps
};

export * from './types';

export const Card: React.FC<CardProps> = ({ children, ...props }) => {
    const {
        className,
        variant = 'outlined',
        size = 'md',
        theme = 'violet',
        loading = false,
        loadingMode = 'skeleton',
        loadingProgress,
        loadingText = 'Loading...',
        style: propStyle,
        interactive = false,
        hoverable = true,
        selectable = false,
        selected = false,
        clickable = false,
        disabled = false,
        elevation = 'low',
        onClick,
        onHover,
        badge,
        badgeColor,
        backgroundImage,
        backgroundImageAlt = '背景圖片',
        backgroundImageOverlay,
        textColorMode = 'auto',
        glassMorphism = false,
        backgroundBlur = false,
        position = 'solo',
        animation = 'none',
        animationDelay = 0,
        highlighted = false,
        draggable = false,
        minHeight,
        maxHeight,
        expanded = true,
        collapsible = false,
        isNew = false,
        bordered = true,
        popOnHover = false,
        floatingEffect = false,
        bounceOnMount = false,
        springEffect = false,
        animationIntensity = 'medium',
        onClick3D = false,
    } = props;

    const [isHovered, setIsHovered] = useState(false);
    const [isDarkBackground, setIsDarkBackground] = useState(false);
    const [isExpanded, setIsExpanded] = useState(expanded);
    const [isDragging, setIsDragging] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const controls = useAnimation();
    const cardRef = useRef<HTMLDivElement>(null);

    // Memoized theme color to prevent recalculation
    const themeColor = useMemo(() => themeColorMap[theme], [theme]);

    // Calculate intensity factor based on animation intensity
    const intensityFactor = useMemo(() => {
        return animationIntensity === 'low' ? 0.5 :
            animationIntensity === 'high' ? 1.5 : 1;
    }, [animationIntensity]);

    // Setup floating animation if enabled - memoize the animation configuration
    useEffect(() => {
        if (floatingEffect && !disabled) {
            const floatInterval = setInterval(() => {
                controls.start({
                    y: [0, -5 * intensityFactor, 0],
                    transition: {
                        duration: 3,
                        ease: "easeInOut",
                        times: [0, 0.5, 1]
                    }
                });
            }, 4000);

            return () => clearInterval(floatInterval);
        }
    }, [floatingEffect, disabled, controls, intensityFactor]);

    // Initial bounce animation if enabled
    useEffect(() => {
        if (bounceOnMount && !disabled) {
            controls.start({
                scale: [0.8, 1.05 * intensityFactor, 1],
                opacity: [0, 1, 1],
                transition: {
                    duration: 0.6,
                    ease: "easeOut",
                    times: [0, 0.6, 1]
                }
            });
        }
    }, [bounceOnMount, disabled, controls, intensityFactor]);

    useEffect(() => {
        setIsExpanded(expanded);
    }, [expanded]);

    // Check if background is dark based on backgroundImage or overlay
    useEffect(() => {
        if (backgroundImage) {
            setIsDarkBackground(true);
        } else if (backgroundImageOverlay) {
            // Check if overlay is dark by looking for dark colors in the gradient
            const isDark = backgroundImageOverlay.includes('rgba(0, 0, 0') ||
                backgroundImageOverlay.includes('rgb(0, 0, 0') ||
                backgroundImageOverlay.includes('#000') ||
                backgroundImageOverlay.includes('black') ||
                /rgba\(\d+,\s*\d+,\s*\d+,\s*[0-7]\)/.test(backgroundImageOverlay);
            setIsDarkBackground(isDark);
        } else {
            setIsDarkBackground(false);
        }
    }, [backgroundImage, backgroundImageOverlay]);

    // Memoize variant styles to prevent recalculation on every render
    const { variantStyle, hoverStyle } = useMemo(() =>
        getVariantStyle(variant === 'glass' || glassMorphism ? 'glass' : variant, themeColor, isDarkBackground, isHovered, hoverable),
        [variant, glassMorphism, themeColor, isDarkBackground, isHovered, hoverable]);

    // Memoize animation variants
    const animationVariants = useMemo(() =>
        generateAnimationVariants(animation, animationDelay),
        [animation, animationDelay]);

    // Get current animation variant
    const currentAnimationVariants = useMemo(() =>
        animationVariants[animation],
        [animationVariants, animation]);

    // Memoize hover animation
    const hoverAnimation = useMemo(() =>
        getHoverAnimation(
            interactive,
            popOnHover,
            springEffect,
            intensityFactor,
            disabled
        ),
        [interactive, popOnHover, springEffect, intensityFactor, disabled]);

    // Memoize combined style to prevent object recreation on each render
    const combinedStyle = useMemo(() => ({
        borderRadius: '0.75rem',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        color: isDarkBackground ? themeColor.lightText : themeColor.darkText,
        ...sizeStylesMap[size],
        ...variantStyle,
        ...(isHovered ? hoverStyle : {}),
        ...elevationStylesMap[elevation],
        ...positionStylesMap[position],
        ...propStyle,
        ...(minHeight ? { minHeight } : {}),
        ...(maxHeight ? { maxHeight } : {}),
        opacity: disabled ? 0.6 : 1,
        cursor: (interactive || clickable) ? 'pointer' : (disabled ? 'not-allowed' : 'default'),
        pointerEvents: disabled ? 'none' : 'auto',
    }) as any, [
        isDarkBackground, themeColor, size, variantStyle,
        isHovered, hoverStyle, elevation, position, propStyle,
        minHeight, maxHeight, disabled, interactive, clickable
    ]);

    // Memoize classNames to prevent string recreation
    const baseStyles = useMemo(() => cn(
        'rounded-xl relative overflow-hidden',
        'backdrop-blur-md transition-all duration-200',
        'focus-within:outline-none',
        {
            'p-4': size === 'sm',
            'p-6': size === 'md',
            'p-8': size === 'lg',
            'cursor-pointer': interactive || clickable,
            'hover:z-10': hoverable,
            'border-2': highlighted,
            'opacity-60 cursor-not-allowed pointer-events-none': disabled,
            'ring-2 ring-offset-2': selected,
            'border-none': !bordered,
            'overflow-hidden': !isExpanded,
            'shadow-lg': isDragging,
            'dark-card': isDarkBackground
        }
    ), [
        size, interactive, clickable, hoverable, highlighted,
        disabled, selected, bordered, isExpanded, isDragging, isDarkBackground
    ]);

    // Memoize loading styles
    const loadingOverlayStyles = useMemo(() => cn(
        "absolute inset-0 flex flex-col items-center justify-center z-20",
        loadingMode === 'overlay'
            ? isDarkBackground ? "bg-black/60 backdrop-blur-sm" : "bg-white/60 backdrop-blur-sm"
            : isDarkBackground ? "bg-black/80" : "bg-white/95"
    ), [loadingMode, isDarkBackground]);

    // Memoize loading spinner styles
    const loadingSpinnerStyles = useMemo(() => ({
        outer: "absolute w-full h-full rounded-full border-[3px]",
        inner: "absolute w-full h-full rounded-full border-[3px] border-t-transparent animate-[spin_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite]"
    }), []);

    // Memoize skeleton styles
    const skeletonStyles = useMemo(() => ({
        base: cn(
            "rounded animate-pulse",
            isDarkBackground ? "bg-white/10" : "bg-gray-100"
        ),
        title: "h-5 w-2/3",
        subtitle: "h-4 w-1/2",
        line: "h-3.5",
        button: "h-8 w-1/3"
    }), [isDarkBackground]);

    // Event handlers using useCallback to prevent recreation
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (onClick3D && !disabled && cardRef.current) {
            const card = cardRef.current;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate rotation based on mouse position relative to card center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Max rotation in degrees
            const maxRotate = animationIntensity === 'low' ? 3 :
                animationIntensity === 'high' ? 12 : 7;

            const rotateY = ((x - centerX) / centerX) * maxRotate;
            const rotateX = ((centerY - y) / centerY) * maxRotate;

            // Apply transform via framer-motion
            controls.start({
                rotateY,
                rotateX,
                transition: { type: 'spring', stiffness: 300, damping: 30 }
            });
        }
    }, [onClick3D, disabled, controls, animationIntensity]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);

        if (onClick3D && !disabled) {
            controls.start({
                rotateY: 0,
                rotateX: 0,
                transition: { type: 'spring', stiffness: 300, damping: 20 }
            });
        }
    }, [onClick3D, disabled, controls]);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (hoverable && !disabled) {
            setIsHovered(true);
        }
        if (onHover) {
            onHover(e);
        }
    }, [hoverable, disabled, onHover]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (collapsible) {
            setIsExpanded(prev => !prev);
        }

        if (onClick3D && !disabled) {
            setIsClicked(true);
            controls.start({
                scale: 0.98,
                transition: { duration: 0.1 }
            }).then(() => {
                controls.start({
                    scale: 1,
                    transition: { type: 'spring', stiffness: 300, damping: 15 }
                });
                setIsClicked(false);
            });
        }

        if (onClick && !disabled) {
            onClick(e);
        }
    }, [collapsible, onClick3D, disabled, controls, onClick]);

    const handleDragStart = useCallback(() => {
        if (draggable) {
            setIsDragging(true);
        }
    }, [draggable]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleCollapseClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, []);

    return (
        <motion.div
            className={cn(baseStyles, className)}
            initial={currentAnimationVariants.initial}
            animate={controls}
            whileHover={hoverAnimation}
            whileTap={interactive && !disabled ? { scale: 0.98, transition: { duration: 0.1, ease: "easeIn" } } : undefined}
            style={combinedStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            data-text-color-mode={textColorMode}
            data-theme={theme}
            data-dark-background={isDarkBackground}
            data-selected={selected}
            data-position={position}
            data-disabled={disabled}
            draggable={draggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            ref={cardRef}
        >
            {backgroundImage && (
                <div className="absolute inset-0 -z-10 rounded-xl overflow-hidden">
                    <motion.img
                        src={backgroundImage}
                        alt={backgroundImageAlt}
                        loading="lazy"
                        className={cn(
                            "w-full h-full object-cover",
                            "transition-transform duration-500"
                        )}
                        animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                    {backgroundImageOverlay && (
                        <div
                            className={cn(
                                "absolute inset-0",
                                backgroundBlur && "backdrop-blur-sm",
                            )}
                            style={{ background: backgroundImageOverlay }}
                        ></div>
                    )}
                </div>
            )}

            {/* New Badge & Label */}
            {badge && (
                <div
                    style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        zIndex: 30,
                        backgroundColor: badgeColor || themeColor.medium,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        boxShadow: isDarkBackground ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    {badge}
                </div>
            )}

            {/* New label */}
            {isNew && (
                <div className="absolute top-0 left-0 transform rotate-45 translate-x-[-40%] translate-y-[-40%] z-20">
                    <div
                        className={cn(
                            "bg-red-500 text-white px-8 py-1 shadow-lg",
                            isDarkBackground ? "bg-opacity-90" : ""
                        )}
                        style={{ marginTop: '1.5rem' }}
                    >
                        New
                    </div>
                </div>
            )}

            {/* Loading state with optional progress */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={loadingOverlayStyles}
                    >
                        {loadingMode === 'overlay' ? (
                            <motion.div
                                className="relative flex flex-col items-center gap-3"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {loadingProgress !== undefined ? (
                                    <div className="w-16 h-16 relative">
                                        <svg className="w-full h-full" viewBox="0 0 100 100">
                                            <circle
                                                cx="50" cy="50" r="40"
                                                stroke={isDarkBackground ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                                                strokeWidth="8"
                                                fill="none"
                                            />
                                            <circle
                                                cx="50" cy="50" r="40"
                                                stroke={themeColor.medium}
                                                strokeWidth="8"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - loadingProgress / 100)}`}
                                                transform="rotate(-90 50 50)"
                                            />
                                            <text
                                                x="50" y="55"
                                                textAnchor="middle"
                                                fill={isDarkBackground ? 'white' : themeColor.darkText}
                                                fontSize="16"
                                                fontWeight="bold"
                                            >
                                                {loadingProgress}%
                                            </text>
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="relative w-10 h-10">
                                        <div
                                            className={loadingSpinnerStyles.outer}
                                            style={{ borderColor: isDarkBackground ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                                        />
                                        <div
                                            className={loadingSpinnerStyles.inner}
                                            style={{
                                                borderColor: themeColor.medium,
                                                borderTopColor: 'transparent'
                                            }}
                                        />
                                    </div>
                                )}
                                <span className={cn(
                                    "font-medium text-xs",
                                    isDarkBackground ? "text-white/80" : "text-gray-500"
                                )}>
                                    {loadingText}
                                </span>
                            </motion.div>
                        ) : (
                            <div className="w-full h-full flex flex-col px-5 py-4">
                                {/* 標題載入動畫 */}
                                <div className="flex flex-col gap-2 mb-5">
                                    <div className={cn(skeletonStyles.base, skeletonStyles.title)} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.subtitle)} />
                                </div>
                                {/* 內容載入動畫 */}
                                <div className="flex flex-col gap-2.5 mb-5">
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-full")} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-11/12")} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-4/5")} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-full")} />
                                </div>
                                {/* 底部載入動畫 */}
                                <div className={cn(skeletonStyles.base, skeletonStyles.button)} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main card content - collapsible or expanding based on isExpanded state */}
            <div
                className={cn(
                    "relative z-10 transition-all duration-300",
                    loading && loadingMode === 'skeleton' && "invisible",
                    loading && loadingMode === 'overlay' && "blur-[1px] select-none pointer-events-none opacity-50",
                    !isExpanded && "max-h-16 overflow-hidden"
                )}
            >
                {children}

                {/* Collapse/Expand button for collapsible cards */}
                {collapsible && (
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                        <button
                            onClick={handleCollapseClick}
                            className={cn(
                                "w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center",
                                "hover:bg-gray-100 transition-transform duration-300",
                                isExpanded ? "transform rotate-180" : ""
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Selected state indicator */}
            {selectable && selected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            )}

            {/* Highlight border */}
            {highlighted && (
                <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                        border: `2px solid ${themeColor.medium}`,
                        zIndex: 20
                    }}
                />
            )}
        </motion.div>
    );
};

