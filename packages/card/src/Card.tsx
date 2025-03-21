import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

export type CardVariant = 'outlined' | 'filled' | 'elevated';
export type CardSize = 'sm' | 'md' | 'lg';
export type CardTheme = 'violet' | 'cyan' | 'orange';
export type CardLoadingMode = 'overlay' | 'skeleton';

export interface CardProps {
    children?: React.ReactNode;
    variant?: CardVariant;
    size?: CardSize;
    theme?: CardTheme;
    loading?: boolean;
    loadingMode?: CardLoadingMode;
    className?: string;
}

export interface CardHeaderProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
}

export interface CardContentProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
}

export interface CardFooterProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
}

export interface CardImageProps {
    src: string;
    alt: string;
    loading?: 'lazy' | 'eager';
    fallback?: string;
    className?: string;
}

export const Card = ({ children, ...props }: CardProps): JSX.Element => {
    const {
        className,
        variant = 'outlined',
        size = 'md',
        theme = 'violet',
        loading = false,
        loadingMode = 'skeleton',
    } = props;

    // 主題顏色配置
    const themeColors = React.useMemo(() => ({
        violet: {
            primary: 'primary',
            text: 'primary-700',
            bg: 'primary-50/30',
            border: 'primary-200',
            shadow: 'shadow-primary-100/50',
            gradient: 'from-primary-100/20 to-primary-50/20',
            hoverGradient: 'from-primary-100/30 to-primary-50/30',
            ring: 'ring-primary-200',
        },
        cyan: {
            primary: 'info',
            text: 'info-700',
            bg: 'info-50/30',
            border: 'info-200',
            shadow: 'shadow-info-100/50',
            gradient: 'from-info-100/20 to-info-50/20',
            hoverGradient: 'from-info-100/30 to-info-50/30',
            ring: 'ring-info-200',
        },
        orange: {
            primary: 'warning',
            text: 'warning-700',
            bg: 'warning-50/30',
            border: 'warning-200',
            shadow: 'shadow-warning-100/50',
            gradient: 'from-warning-100/20 to-warning-50/20',
            hoverGradient: 'from-warning-100/30 to-warning-50/30',
            ring: 'ring-warning-200',
        },
    }), []);

    const colors = themeColors[theme];

    const baseStyles = cn(
        'rounded-xl border bg-white/95 text-gray-900 relative overflow-hidden',
        'backdrop-blur-md transition-all duration-300',
        'focus:outline-none focus:ring-2',
        'shadow-sm hover:shadow-md'
    );

    const variantStyles = {
        outlined: cn(
            'border-primary-200',
            'hover:border-primary-300/80 hover:bg-primary-50/30',
            'hover:shadow-primary-100/20'
        ),
        filled: cn(
            'bg-primary-50/30 backdrop-blur-md border-transparent',
            'bg-gradient-to-br from-primary-100/20 to-primary-50/20',
            'hover:bg-gradient-to-br from-primary-100/30 to-primary-50/30',
            'hover:shadow-primary-100/30'
        ),
        elevated: cn(
            'border-transparent shadow-lg',
            'bg-gradient-to-br from-primary-100/20 to-primary-50/20',
            'hover:shadow-xl hover:-translate-y-0.5 hover:shadow-primary-100/20'
        ),
    };

    const sizeStyles = {
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-7',
    };

    const loadingOverlayStyles = cn(
        "absolute inset-0 flex items-center justify-center",
        loadingMode === 'overlay' ? "bg-white/60" : "bg-white/95"
    );

    const loadingSpinnerStyles = {
        outer: "absolute w-full h-full rounded-full border-[3px] border-gray-100",
        inner: "absolute w-full h-full rounded-full border-[3px] border-gray-400 border-t-transparent animate-[spin_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite]"
    };

    const skeletonStyles = {
        base: "bg-gray-100 rounded animate-pulse",
        title: "h-5 w-2/3",
        subtitle: "h-4 w-1/2",
        line: "h-3.5",
        button: "h-8 w-1/3"
    };

    return (
        <motion.div
            className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.99, transition: { duration: 0.1, ease: "easeIn" } }}
        >
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
                                <div className="relative w-10 h-10">
                                    <div className={loadingSpinnerStyles.outer} />
                                    <div className={loadingSpinnerStyles.inner} />
                                </div>
                                <span className="font-medium text-xs text-gray-500">
                                    Loading...
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
            <div className={cn(
                "relative z-10",
                loading && loadingMode === 'skeleton' && "invisible",
                loading && loadingMode === 'overlay' && "blur-[1px] select-none pointer-events-none opacity-50"
            )}>{children}</div>
        </motion.div>
    );
};

export const CardHeader = ({ children, showDivider = false, className }: CardHeaderProps): JSX.Element => {
    return (
        <div
            className={cn(
                'flex flex-col space-y-1.5 px-5 py-4',
                showDivider && 'border-b border-primary-100/30',
                className
            )}
        >
            <div className="relative z-10">{children}</div>
        </div>
    );
};

export const CardContent = ({ children, showDivider = false, className }: CardContentProps): JSX.Element => {
    return (
        <div
            className={cn(
                'px-5 py-3',
                showDivider && 'border-b border-primary-100/30',
                className
            )}
        >
            <div className="relative z-10">{children}</div>
        </div>
    );
};

export const CardFooter = ({ children, showDivider = false, className }: CardFooterProps): JSX.Element => {
    return (
        <div
            className={cn(
                'flex items-center px-5 py-4',
                showDivider && 'border-t border-primary-100/30',
                className
            )}
        >
            <div className="relative z-10">{children}</div>
        </div>
    );
};

export const CardImage = ({ className, src, alt, loading = 'lazy', fallback }: CardImageProps): JSX.Element => {
    const [imgSrc, setImgSrc] = React.useState(src);

    const handleError = () => {
        if (fallback) {
            setImgSrc(fallback);
        }
    };

    return (
        <div className="relative w-full aspect-[16/9] overflow-hidden group rounded-xl">
            <motion.img
                src={imgSrc}
                alt={alt}
                loading={loading}
                onError={handleError}
                className={cn(
                    'w-full h-full object-cover transition-transform duration-500',
                    'group-hover:scale-105 group-hover:brightness-105',
                    className
                )}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
            />
        </div>
    );
};

