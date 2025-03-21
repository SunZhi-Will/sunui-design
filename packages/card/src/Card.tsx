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
            primary: 'violet',
            secondary: 'fuchsia',
            text: 'violet-600',
            bg: 'violet-50',
            border: 'violet-300',
            shadow: 'shadow-violet-100',
            gradient: 'from-violet-500/5 to-fuchsia-500/5',
            hoverGradient: 'from-violet-500/10 to-fuchsia-500/10',
            ring: 'ring-violet-500/20',
        },
        cyan: {
            primary: 'cyan',
            secondary: 'sky',
            text: 'cyan-600',
            bg: 'cyan-50',
            border: 'cyan-300',
            shadow: 'shadow-cyan-100',
            gradient: 'from-cyan-500/5 to-sky-500/5',
            hoverGradient: 'from-cyan-500/10 to-sky-500/10',
            ring: 'ring-cyan-500/20',
        },
        orange: {
            primary: 'orange',
            secondary: 'amber',
            text: 'orange-600',
            bg: 'orange-50',
            border: 'orange-300',
            shadow: 'shadow-orange-100',
            gradient: 'from-orange-500/5 to-amber-500/5',
            hoverGradient: 'from-orange-500/10 to-amber-500/10',
            ring: 'ring-orange-500/20',
        },
    }), []);

    const colors = themeColors[theme];

    const baseStyles = cn(
        'rounded-xl border bg-white/95 text-gray-900 relative overflow-hidden',
        'backdrop-blur-md transition-all duration-300',
        'focus:outline-none focus:ring-2 ring-gray-200/50',
        'shadow-sm hover:shadow-md'
    );

    const variantStyles = {
        outlined: cn(
            'border-gray-200/60',
            'hover:border-gray-300/80 hover:bg-white/100'
        ),
        filled: cn(
            'bg-gray-50/90 backdrop-blur-md border-transparent',
            'hover:bg-white/100'
        ),
        elevated: cn(
            'border-transparent shadow-lg',
            'hover:shadow-xl hover:-translate-y-0.5'
        ),
    };

    const sizeStyles = {
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-7',
    };

    return (
        <motion.div
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                ease: "easeOut"
            }}
            whileHover={{
                scale: 1.01,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{
                scale: 0.99,
                transition: { duration: 0.1, ease: "easeIn" }
            }}
        >
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "absolute inset-0 flex items-center justify-center backdrop-blur-[2px]",
                            loadingMode === 'overlay' ? "bg-white/60" : "bg-white/95"
                        )}
                    >
                        {loadingMode === 'overlay' ? (
                            <motion.div
                                className="relative flex flex-col items-center gap-3"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="relative w-10 h-10">
                                    <div className="absolute w-full h-full rounded-full border-[3px] border-gray-100" />
                                    <div className="absolute w-full h-full rounded-full border-[3px] border-gray-400 border-t-transparent animate-[spin_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                                </div>
                                <span className="font-medium text-xs text-gray-500">
                                    Loading...
                                </span>
                            </motion.div>
                        ) : (
                            <div className="w-full h-full flex flex-col px-5 py-4">
                                {/* 標題載入動畫 */}
                                <div className="flex flex-col gap-2 mb-5">
                                    <div className="h-5 w-2/3 bg-gray-100 rounded-md animate-pulse" />
                                    <div className="h-4 w-1/2 bg-gray-100/80 rounded-md animate-pulse" />
                                </div>
                                {/* 內容載入動畫 */}
                                <div className="flex flex-col gap-2.5 mb-5">
                                    <div className="h-3.5 w-full bg-gray-100/80 rounded animate-pulse" />
                                    <div className="h-3.5 w-11/12 bg-gray-100/80 rounded animate-pulse" />
                                    <div className="h-3.5 w-4/5 bg-gray-100/80 rounded animate-pulse" />
                                    <div className="h-3.5 w-full bg-gray-100/80 rounded animate-pulse" />
                                </div>
                                {/* 底部載入動畫 */}
                                <div className="h-8 w-1/3 bg-gray-100 rounded-md animate-pulse" />
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
                showDivider && 'border-b border-gray-100/60',
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
                showDivider && 'border-b border-gray-100/60',
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
                showDivider && 'border-t border-gray-100/60',
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

