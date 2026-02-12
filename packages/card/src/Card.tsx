import React from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { cn } from './utils';

export type CardVariant = 'outlined' | 'filled' | 'elevated' | 'glass' | 'gradient';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';
export type CardTheme = 'violet' | 'cyan' | 'orange' | 'gradient' | 'dark' | 'light';
export type CardLoadingMode = 'overlay' | 'skeleton' | 'shimmer';
export type CardMode = 'light' | 'dark';

export interface CardProps {
    children?: React.ReactNode;
    variant?: CardVariant;
    size?: CardSize;
    theme?: CardTheme;
    mode?: CardMode;
    loading?: boolean;
    loadingMode?: CardLoadingMode;
    hoverable?: boolean;
    clickable?: boolean;
    bordered?: boolean;
    shadow?: boolean;
    glow?: boolean;
    draggable?: boolean;
    dragConstraints?: { top?: number; left?: number; right?: number; bottom?: number };
    dragElastic?: number;
    onDragStart?: () => void;
    onDragEnd?: (event: any, info: any) => void;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export interface CardHeaderProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
    mode?: CardMode;
    align?: 'left' | 'center' | 'right';
}

export interface CardContentProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
    mode?: CardMode;
    noPadding?: boolean;
}

export interface CardFooterProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
    mode?: CardMode;
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export interface CardImageProps {
    src: string;
    alt: string;
    loading?: 'lazy' | 'eager';
    fallback?: string;
    className?: string;
    aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    overlay?: boolean;
    overlayGradient?: 'top' | 'bottom' | 'both' | 'none';
}

export const Card = ({ children, ...props }: CardProps): React.JSX.Element => {
    const {
        className,
        variant = 'outlined',
        size = 'md',
        theme = 'violet',
        mode = 'light',
        loading = false,
        loadingMode = 'skeleton',
        hoverable = true,
        clickable = false,
        bordered = true,
        shadow = true,
        glow = false,
        draggable = false,
        dragConstraints,
        dragElastic = 0.1,
        onDragStart,
        onDragEnd,
        style,
        onClick,
    } = props;

    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    const [isHovering, setIsHovering] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);

    // 深色模式主題配置
    const darkThemeColors = React.useMemo(() => ({
        violet: {
            bg: 'from-gray-950 to-gray-900',
            border: 'border-violet-900/50',
            hoverBorder: 'hover:border-violet-700/70',
            text: 'text-gray-100',
            accent: 'text-violet-400',
            glow: 'shadow-violet-500/20',
            glowHover: 'hover:shadow-violet-500/40',
            gradient: 'from-violet-950/50 via-gray-900/50 to-gray-950/50',
            glassBg: 'bg-gray-900/80',
        },
        cyan: {
            bg: 'from-gray-950 to-gray-900',
            border: 'border-cyan-900/50',
            hoverBorder: 'hover:border-cyan-700/70',
            text: 'text-gray-100',
            accent: 'text-cyan-400',
            glow: 'shadow-cyan-500/20',
            glowHover: 'hover:shadow-cyan-500/40',
            gradient: 'from-cyan-950/50 via-gray-900/50 to-gray-950/50',
            glassBg: 'bg-gray-900/80',
        },
        orange: {
            bg: 'from-gray-950 to-gray-900',
            border: 'border-orange-900/50',
            hoverBorder: 'hover:border-orange-700/70',
            text: 'text-gray-100',
            accent: 'text-orange-400',
            glow: 'shadow-orange-500/20',
            glowHover: 'hover:shadow-orange-500/40',
            gradient: 'from-orange-950/50 via-gray-900/50 to-gray-950/50',
            glassBg: 'bg-gray-900/80',
        },
        gradient: {
            bg: 'from-gray-950 via-gray-900 to-gray-950',
            border: 'border-pink-900/50',
            hoverBorder: 'hover:border-pink-700/70',
            text: 'text-gray-100',
            accent: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500',
            glow: 'shadow-pink-500/20',
            glowHover: 'hover:shadow-pink-500/40',
            gradient: 'from-pink-950/50 via-purple-950/50 to-orange-950/50',
            glassBg: 'bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80',
        },
        dark: {
            bg: 'from-gray-950 via-slate-900 to-gray-900',
            border: 'border-blue-900/50',
            hoverBorder: 'hover:border-blue-700/70',
            text: 'text-gray-100',
            accent: 'text-blue-400',
            glow: 'shadow-blue-500/20',
            glowHover: 'hover:shadow-blue-500/40',
            gradient: 'from-blue-950/50 via-slate-900/50 to-gray-950/50',
            glassBg: 'bg-gray-900/80',
        },
        light: {
            bg: 'from-white to-gray-50',
            border: 'border-gray-200',
            hoverBorder: 'hover:border-gray-300',
            text: 'text-gray-900',
            accent: 'text-gray-700',
            glow: 'shadow-gray-200/50',
            glowHover: 'hover:shadow-gray-300/60',
            gradient: 'from-gray-50/50 via-white/50 to-gray-100/50',
            glassBg: 'bg-white/80',
        },
    }), []);

    // 淺色模式主題配置
    const lightThemeColors = React.useMemo(() => ({
        violet: {
            bg: 'from-white to-violet-50',
            border: 'border-violet-200',
            hoverBorder: 'hover:border-violet-300',
            text: 'text-gray-900',
            accent: 'text-violet-600',
            glow: 'shadow-violet-200/50',
            glowHover: 'hover:shadow-violet-300/60',
            gradient: 'from-violet-50/50 via-white/50 to-purple-50/50',
            glassBg: 'bg-white/80',
        },
        cyan: {
            bg: 'from-white to-cyan-50',
            border: 'border-cyan-200',
            hoverBorder: 'hover:border-cyan-300',
            text: 'text-gray-900',
            accent: 'text-cyan-600',
            glow: 'shadow-cyan-200/50',
            glowHover: 'hover:shadow-cyan-300/60',
            gradient: 'from-cyan-50/50 via-white/50 to-blue-50/50',
            glassBg: 'bg-white/80',
        },
        orange: {
            bg: 'from-white to-orange-50',
            border: 'border-orange-200',
            hoverBorder: 'hover:border-orange-300',
            text: 'text-gray-900',
            accent: 'text-orange-600',
            glow: 'shadow-orange-200/50',
            glowHover: 'hover:shadow-orange-300/60',
            gradient: 'from-orange-50/50 via-white/50 to-amber-50/50',
            glassBg: 'bg-white/80',
        },
        gradient: {
            bg: 'from-white via-purple-50 to-pink-50',
            border: 'border-pink-200',
            hoverBorder: 'hover:border-pink-300',
            text: 'text-gray-900',
            accent: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600',
            glow: 'shadow-pink-200/50',
            glowHover: 'hover:shadow-pink-300/60',
            gradient: 'from-pink-50/50 via-purple-50/50 to-orange-50/50',
            glassBg: 'bg-gradient-to-br from-white/80 via-purple-50/80 to-pink-50/80',
        },
        dark: {
            bg: 'from-gray-50 to-gray-100',
            border: 'border-gray-300',
            hoverBorder: 'hover:border-gray-400',
            text: 'text-gray-900',
            accent: 'text-gray-700',
            glow: 'shadow-gray-300/50',
            glowHover: 'hover:shadow-gray-400/60',
            gradient: 'from-gray-100/50 via-gray-50/50 to-slate-100/50',
            glassBg: 'bg-white/80',
        },
        light: {
            bg: 'from-white to-gray-50',
            border: 'border-gray-200',
            hoverBorder: 'hover:border-gray-300',
            text: 'text-gray-900',
            accent: 'text-gray-700',
            glow: 'shadow-gray-200/50',
            glowHover: 'hover:shadow-gray-300/60',
            gradient: 'from-gray-50/50 via-white/50 to-gray-100/50',
            glassBg: 'bg-white/80',
        },
    }), []);

    const themeColors = mode === 'dark' ? darkThemeColors : lightThemeColors;
    const colors = themeColors[theme];

    // 基礎樣式
    const baseStyles = cn(
        'relative overflow-hidden transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        colors.text,
        clickable && 'cursor-pointer',
    );

    // 變體樣式
    const variantStyles = {
        outlined: cn(
            'bg-gradient-to-b backdrop-blur-sm',
            mode === 'dark' ? 'from-gray-900/95 to-gray-950/95' : 'from-white/95 to-gray-50/95',
            bordered && colors.border,
            bordered && colors.hoverBorder,
            shadow && 'shadow-md',
            shadow && hoverable && 'hover:shadow-xl',
            glow && colors.glow,
            glow && hoverable && colors.glowHover,
        ),
        filled: cn(
            `bg-gradient-to-br ${colors.bg}`,
            'backdrop-blur-md',
            bordered && 'border border-white/10',
            shadow && 'shadow-lg',
            shadow && hoverable && 'hover:shadow-2xl',
            glow && colors.glow,
            glow && hoverable && colors.glowHover,
        ),
        elevated: cn(
            'bg-gradient-to-br backdrop-blur-md',
            mode === 'dark' ? 'from-gray-900/95 via-gray-800/95 to-gray-900/95' : 'from-white/95 via-gray-50/95 to-white/95',
            'border-transparent',
            'shadow-xl',
            hoverable && 'hover:shadow-2xl',
            glow && colors.glow,
            glow && hoverable && colors.glowHover,
        ),
        glass: cn(
            `backdrop-blur-xl ${colors.glassBg}`,
            'border border-white/20',
            mode === 'dark' && 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
            mode === 'light' && 'shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
            hoverable && mode === 'dark' && 'hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)]',
            hoverable && mode === 'light' && 'hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]',
        ),
        gradient: cn(
            `bg-gradient-to-br ${colors.gradient}`,
            'backdrop-blur-lg border border-white/10',
            shadow && 'shadow-xl',
            shadow && hoverable && 'hover:shadow-2xl',
            glow && colors.glow,
            glow && hoverable && colors.glowHover,
        ),
    };

    // 尺寸樣式
    const sizeStyles = {
        sm: 'p-4 rounded-lg',
        md: 'p-6 rounded-xl',
        lg: 'p-8 rounded-2xl',
        xl: 'p-10 rounded-3xl',
    };

    // 載入覆蓋層樣式
    const loadingOverlayStyles = cn(
        "absolute inset-0 flex items-center justify-center z-30",
        "backdrop-blur-sm",
        mode === 'dark' ? "bg-gray-900/80" : "bg-white/80"
    );

    // 載入動畫樣式
    const loadingSpinnerStyles = {
        outer: cn(
            "absolute w-full h-full rounded-full border-[3px]",
            mode === 'dark' ? 'border-gray-700' : 'border-gray-200'
        ),
        inner: cn(
            "absolute w-full h-full rounded-full border-[3px] border-t-transparent animate-[spin_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite]",
            mode === 'dark' ? 'border-gray-300' : 'border-gray-600'
        ),
    };

    // 骨架屏樣式
    const skeletonStyles = {
        base: cn(
            "rounded animate-pulse",
            mode === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200'
        ),
        title: "h-6 w-2/3",
        subtitle: "h-4 w-1/2",
        line: "h-4",
        button: "h-10 w-1/3"
    };

    // Shimmer 載入效果
    const shimmerStyles = cn(
        "absolute inset-0 z-20",
        "bg-gradient-to-r",
        mode === 'dark' 
            ? 'from-transparent via-white/5 to-transparent' 
            : 'from-transparent via-white/50 to-transparent',
        "animate-[shimmer_2s_infinite]"
    );

    const handleDragStart = () => {
        setIsDragging(true);
        onDragStart?.();
    };

    const handleDragEnd = (event: any, info: any) => {
        setIsDragging(false);
        onDragEnd?.(event, info);
    };

    return (
        <motion.div
            ref={ref}
            className={cn(
                baseStyles, 
                variantStyles[variant], 
                sizeStyles[size],
                bordered && 'border',
                draggable && 'cursor-move',
                isDragging && 'cursor-grabbing',
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={hoverable && !isDragging ? { 
                scale: clickable ? 1.02 : 1.01, 
                transition: { duration: 0.2, ease: "easeOut" } 
            } : undefined}
            whileTap={clickable && !draggable ? { 
                scale: 0.98, 
                transition: { duration: 0.1, ease: "easeIn" } 
            } : undefined}
            drag={draggable}
            dragConstraints={dragConstraints}
            dragElastic={dragElastic}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={style}
            onClick={!isDragging ? onClick : undefined}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 光暈效果 */}
            {glow && isHovering && (
                <motion.div
                    className={cn(
                        "absolute inset-0 -z-10 blur-xl opacity-50",
                        `bg-gradient-radial ${colors.glow}`
                    )}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                />
            )}

            {/* 內部光澤效果 */}
            <div className={cn(
                "absolute inset-0 pointer-events-none z-0",
                "bg-gradient-to-b",
                mode === 'dark' 
                    ? "from-white/[0.05] via-transparent to-transparent" 
                    : "from-white/60 via-transparent to-transparent"
            )} />

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
                                <div className="relative w-12 h-12">
                                    <div className={loadingSpinnerStyles.outer} />
                                    <div className={loadingSpinnerStyles.inner} />
                                </div>
                                <span className={cn(
                                    "font-medium text-sm",
                                    mode === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                    Loading...
                                </span>
                            </motion.div>
                        ) : loadingMode === 'shimmer' ? (
                            <>
                                <div className={shimmerStyles} />
                                <div className="w-full h-full flex flex-col px-6 py-5">
                                    <div className="flex flex-col gap-3 mb-6">
                                        <div className={cn(skeletonStyles.base, skeletonStyles.title)} />
                                        <div className={cn(skeletonStyles.base, skeletonStyles.subtitle)} />
                                    </div>
                                    <div className="flex flex-col gap-3 mb-6">
                                        <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-full")} />
                                        <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-11/12")} />
                                        <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-4/5")} />
                                        <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-full")} />
                                    </div>
                                    <div className={cn(skeletonStyles.base, skeletonStyles.button)} />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col px-6 py-5">
                                <div className="flex flex-col gap-3 mb-6">
                                    <div className={cn(skeletonStyles.base, skeletonStyles.title)} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.subtitle)} />
                                </div>
                                <div className="flex flex-col gap-3 mb-6">
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-full")} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-11/12")} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-4/5")} />
                                    <div className={cn(skeletonStyles.base, skeletonStyles.line, "w-full")} />
                                </div>
                                <div className={cn(skeletonStyles.base, skeletonStyles.button)} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className={cn(
                "relative z-10",
                loading && loadingMode !== 'overlay' && "invisible",
                loading && loadingMode === 'overlay' && "blur-[1px] select-none pointer-events-none opacity-30"
            )}>
                {children}
            </div>
        </motion.div>
    );
};

export const CardHeader = ({ 
    children, 
    showDivider = false, 
    className, 
    mode = 'light',
    align = 'left' 
}: CardHeaderProps): React.JSX.Element => {
    const alignStyles = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right',
    };

    return (
        <div
            className={cn(
                'flex flex-col space-y-2 relative z-10',
                showDivider && 'pb-4 mb-4',
                showDivider && mode === 'dark' && 'border-b border-white/10',
                showDivider && mode === 'light' && 'border-b border-gray-200/60',
                alignStyles[align],
                className
            )}
        >
            {children}
        </div>
    );
};

export const CardContent = ({ 
    children, 
    showDivider = false, 
    className, 
    mode = 'light',
    noPadding = false 
}: CardContentProps): React.JSX.Element => {
    return (
        <div
            className={cn(
                'relative z-10',
                !noPadding && 'py-3',
                showDivider && 'pb-4 mb-4',
                showDivider && mode === 'dark' && 'border-b border-white/10',
                showDivider && mode === 'light' && 'border-b border-gray-200/60',
                className
            )}
        >
            {children}
        </div>
    );
};

export const CardFooter = ({ 
    children, 
    showDivider = false, 
    className, 
    mode = 'light',
    justify = 'start' 
}: CardFooterProps): React.JSX.Element => {
    const justifyStyles = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
    };

    return (
        <div
            className={cn(
                'flex items-center relative z-10',
                showDivider && 'pt-4 mt-4',
                showDivider && mode === 'dark' && 'border-t border-white/10',
                showDivider && mode === 'light' && 'border-t border-gray-200/60',
                justifyStyles[justify],
                className
            )}
        >
            {children}
        </div>
    );
};

export const CardImage = ({ 
    className, 
    src, 
    alt, 
    loading = 'lazy', 
    fallback,
    aspectRatio = '16/9',
    objectFit = 'cover',
    overlay = false,
    overlayGradient = 'bottom'
}: CardImageProps): React.JSX.Element => {
    const [imgSrc, setImgSrc] = React.useState(src);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const handleError = () => {
        if (fallback) {
            setImgSrc(fallback);
        }
    };

    const handleLoad = () => {
        setImageLoaded(true);
    };

    const aspectRatioStyles = {
        '16/9': 'aspect-[16/9]',
        '4/3': 'aspect-[4/3]',
        '1/1': 'aspect-square',
        'auto': 'h-auto',
    };

    const objectFitStyles = {
        cover: 'object-cover',
        contain: 'object-contain',
        fill: 'object-fill',
        none: 'object-none',
    };

    const overlayGradients = {
        top: 'bg-gradient-to-b from-black/40 via-transparent to-transparent',
        bottom: 'bg-gradient-to-t from-black/40 via-transparent to-transparent',
        both: 'bg-gradient-to-b from-black/30 via-transparent to-black/30',
        none: '',
    };

    return (
        <div className={cn(
            "relative w-full overflow-hidden rounded-xl mb-4",
            aspectRatioStyles[aspectRatio]
        )}>
            {/* 載入骨架屏 */}
            {!imageLoaded && (
                <div className={cn(
                    "absolute inset-0 animate-pulse",
                    "bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"
                )} />
            )}

            <motion.img
                src={imgSrc}
                alt={alt}
                loading={loading}
                onError={handleError}
                onLoad={handleLoad}
                className={cn(
                    'w-full h-full transition-all duration-700',
                    objectFitStyles[objectFit],
                    'group-hover:scale-110 group-hover:brightness-110',
                    className
                )}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* 覆蓋層漸變 */}
            {overlay && overlayGradient !== 'none' && (
                <motion.div
                    className={cn(
                        "absolute inset-0 pointer-events-none",
                        overlayGradients[overlayGradient],
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    )}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                />
            )}

            {/* 光暈效果 */}
            <div className={cn(
                "absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100",
                "bg-gradient-to-t from-transparent via-white/5 to-transparent",
                "transition-opacity duration-500"
            )} />
        </div>
    );
};

