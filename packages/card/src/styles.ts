import React from 'react';
import { CardVariant, CardAnimation, AnimationVariant } from './types';

// 定義主題色彩
export const themeColorMap = {
    violet: {
        light: '#e0f2fe', // primary-100
        medium: '#0ea5e9', // primary-500
        dark: '#0369a1', // primary-700
        border: '#bae6fd', // primary-200
        shadow: 'rgba(56, 189, 248, 0.3)', // primary-400 with alpha
        hoverBg: 'rgba(56, 189, 248, 0.1)', // primary-400 with alpha
        ringColor: 'rgba(56, 189, 248, 0.5)', // primary-400 with alpha
        lightText: '#e2e8f0', // slate-200
        darkText: '#1e293b', // slate-800
    },
    cyan: {
        light: '#cffafe', // cyan-100
        medium: '#06b6d4', // cyan-500
        dark: '#0e7490', // cyan-700
        border: '#a5f3fc', // cyan-200
        shadow: 'rgba(6, 182, 212, 0.3)', // cyan-500 with alpha
        hoverBg: 'rgba(6, 182, 212, 0.1)', // cyan-500 with alpha
        ringColor: 'rgba(6, 182, 212, 0.5)', // cyan-500 with alpha
        lightText: '#ecfeff', // cyan-50
        darkText: '#164e63', // cyan-800
    },
    orange: {
        light: '#ffedd5', // orange-100
        medium: '#f97316', // orange-500
        dark: '#c2410c', // orange-700
        border: '#fed7aa', // orange-200
        shadow: 'rgba(249, 115, 22, 0.3)', // orange-500 with alpha
        hoverBg: 'rgba(249, 115, 22, 0.1)', // orange-500 with alpha
        ringColor: 'rgba(249, 115, 22, 0.5)', // orange-500 with alpha
        lightText: '#fff7ed', // orange-50
        darkText: '#9a3412', // orange-800
    },
    green: {
        light: '#dcfce7', // green-100
        medium: '#22c55e', // green-500
        dark: '#15803d', // green-700
        border: '#bbf7d0', // green-200
        shadow: 'rgba(34, 197, 94, 0.3)', // green-500 with alpha
        hoverBg: 'rgba(34, 197, 94, 0.1)', // green-500 with alpha
        ringColor: 'rgba(34, 197, 94, 0.5)', // green-500 with alpha
        lightText: '#f0fdf4', // green-50
        darkText: '#166534', // green-800
    },
    slate: {
        light: '#f1f5f9', // slate-100
        medium: '#64748b', // slate-500
        dark: '#334155', // slate-700
        border: '#e2e8f0', // slate-200
        shadow: 'rgba(100, 116, 139, 0.3)', // slate-500 with alpha
        hoverBg: 'rgba(100, 116, 139, 0.1)', // slate-500 with alpha
        ringColor: 'rgba(100, 116, 139, 0.5)', // slate-500 with alpha
        lightText: '#f8fafc', // slate-50
        darkText: '#1e293b', // slate-800
    },
};

// 獲取變體樣式
export const getVariantStyle = (
    variant: CardVariant,
    themeColor: {
        light: string;
        medium: string;
        dark: string;
        border: string;
        shadow: string;
        hoverBg: string;
        ringColor: string;
        lightText: string;
        darkText: string;
    },
    isDarkBackground: boolean,
    isHovered: boolean,
    hoverable: boolean
) => {
    let variantStyle: React.CSSProperties = {};
    let hoverStyle: React.CSSProperties = {};

    if (variant === 'outlined') {
        variantStyle = {
            border: `1px solid ${isDarkBackground ? 'rgba(255, 255, 255, 0.2)' : themeColor.border}`,
            backgroundColor: isDarkBackground ? 'rgba(0, 0, 0, 0.1)' : 'white',
        };
        if (hoverable && isHovered) {
            hoverStyle = {
                borderColor: isDarkBackground ? 'rgba(255, 255, 255, 0.3)' : themeColor.medium,
                backgroundColor: isDarkBackground ? 'rgba(255, 255, 255, 0.05)' : themeColor.hoverBg,
                boxShadow: `0 4px 12px -2px ${isDarkBackground ? 'rgba(0, 0, 0, 0.4)' : themeColor.shadow}`,
            };
        }
    } else if (variant === 'filled') {
        variantStyle = {
            backgroundColor: isDarkBackground ? 'rgba(255, 255, 255, 0.1)' : themeColor.light,
            borderColor: 'transparent',
            backgroundImage: isDarkBackground
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
                : `linear-gradient(135deg, ${themeColor.light}, rgba(255,255,255,0.9))`,
        };
        if (hoverable && isHovered) {
            hoverStyle = {
                backgroundImage: isDarkBackground
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))'
                    : `linear-gradient(135deg, ${themeColor.light}, rgba(255,255,255,0.8))`,
                boxShadow: `0 4px 12px -2px ${isDarkBackground ? 'rgba(0, 0, 0, 0.5)' : themeColor.shadow}`,
            };
        }
    } else if (variant === 'elevated') {
        variantStyle = {
            borderColor: 'transparent',
            backgroundColor: isDarkBackground ? 'rgba(0, 0, 0, 0.2)' : 'white',
            backgroundImage: isDarkBackground
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.1))'
                : `linear-gradient(135deg, ${themeColor.light}, rgba(255,255,255,0.9))`,
            boxShadow: isDarkBackground
                ? '0 4px 12px rgba(0, 0, 0, 0.25)'
                : '0 2px 6px -1px rgba(0, 0, 0, 0.1)',
        };
        if (hoverable && isHovered) {
            hoverStyle = {
                transform: 'translateY(-2px)',
                boxShadow: isDarkBackground
                    ? '0 8px 20px rgba(0, 0, 0, 0.35)'
                    : `0 12px 16px -4px ${themeColor.shadow}`,
            };
        }
    } else if (variant === 'glass') {
        variantStyle = {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        };
        if (hoverable && isHovered) {
            hoverStyle = {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 10px -1px rgba(0, 0, 0, 0.1)',
            };
        }
    }

    return { variantStyle, hoverStyle };
};

// 尺寸樣式映射
export const sizeStylesMap = {
    sm: { padding: '0.75rem' },
    md: { padding: '1rem' },
    lg: { padding: '1.5rem' },
};

// 高度樣式映射
export const elevationStylesMap = {
    flat: { boxShadow: 'none' },
    low: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' },
    medium: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
    high: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }
};

// 位置樣式映射
export const positionStylesMap = {
    first: {
        borderBottomLeftRadius: '0.25rem',
        borderBottomRightRadius: '0.25rem',
        marginBottom: '-0.5rem',
        zIndex: 2
    },
    middle: {
        borderRadius: '0.25rem',
        marginBottom: '-0.5rem',
        zIndex: 1
    },
    last: {
        borderTopLeftRadius: '0.25rem',
        borderTopRightRadius: '0.25rem'
    },
    solo: {}
};

// 生成動畫變體
export const generateAnimationVariants = (
    animation: CardAnimation,
    animationDelay: number
): Record<CardAnimation, AnimationVariant> => ({
    none: {},
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3, delay: animationDelay / 1000 }
    },
    slide: {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.4, delay: animationDelay / 1000 }
    },
    scale: {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.3, delay: animationDelay / 1000 }
    },
    reveal: {
        initial: { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' },
        animate: { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
        transition: { duration: 0.5, delay: animationDelay / 1000 }
    },
    bounce: {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 15,
            delay: animationDelay / 1000
        }
    },
    pop: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 10,
            delay: animationDelay / 1000
        }
    },
    float: {
        initial: { y: 30, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: {
            type: "spring",
            stiffness: 50,
            damping: 20,
            delay: animationDelay / 1000
        }
    }
});

// 獲取懸停動畫
export const getHoverAnimation = (
    isInteractive: boolean,
    hasPopOnHover: boolean,
    hasSpringEffect: boolean,
    intensity: number,
    isDisabled: boolean
) => {
    if (isDisabled) return undefined;

    if (isInteractive) {
        return {
            scale: 1.02,
            transition: { duration: 0.2, ease: "easeOut" }
        };
    }

    if (hasPopOnHover) {
        return {
            scale: 1 + (0.03 * intensity),
            y: -5 * intensity,
            boxShadow: `0 ${10 * intensity}px ${15 * intensity}px -3px rgba(0, 0, 0, 0.1), 0 ${4 * intensity}px ${6 * intensity}px -2px rgba(0, 0, 0, 0.05)`,
            transition: {
                type: hasSpringEffect ? "spring" : "tween",
                stiffness: 300,
                damping: 15,
                duration: hasSpringEffect ? undefined : 0.2
            }
        };
    }

    return undefined;
}; 