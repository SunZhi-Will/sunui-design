import React from 'react';

export type CardVariant = 'outlined' | 'filled' | 'elevated' | 'glass';
export type CardSize = 'sm' | 'md' | 'lg';
export type CardTheme = 'violet' | 'cyan' | 'orange' | 'green' | 'slate';
export type CardLoadingMode = 'overlay' | 'skeleton';
export type TextColorMode = 'auto' | 'light' | 'dark';
export type CardPosition = 'first' | 'middle' | 'last' | 'solo';
export type CardElevation = 'flat' | 'low' | 'medium' | 'high';
export type CardAnimation = 'none' | 'fade' | 'slide' | 'scale' | 'reveal' | 'bounce' | 'pop' | 'float';
export type CardLoadingProgress = number;

export interface CardProps {
    children?: React.ReactNode;
    variant?: CardVariant;
    size?: CardSize;
    theme?: CardTheme;
    loading?: boolean;
    loadingMode?: CardLoadingMode;
    loadingProgress?: CardLoadingProgress;
    loadingText?: string;
    className?: string;
    style?: React.CSSProperties;
    interactive?: boolean;
    hoverable?: boolean;
    selectable?: boolean;
    selected?: boolean;
    clickable?: boolean;
    disabled?: boolean;
    elevation?: CardElevation;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onHover?: React.MouseEventHandler<HTMLDivElement>;
    badge?: string;
    badgeColor?: string;
    backgroundImage?: string;
    backgroundImageAlt?: string;
    backgroundImageOverlay?: string;
    textColorMode?: TextColorMode;
    glassMorphism?: boolean;
    backgroundBlur?: boolean;
    position?: CardPosition;
    animation?: CardAnimation;
    animationDelay?: number;
    highlighted?: boolean;
    draggable?: boolean;
    minHeight?: string | number;
    maxHeight?: string | number;
    expanded?: boolean;
    collapsible?: boolean;
    isNew?: boolean;
    bordered?: boolean;
    popOnHover?: boolean;
    floatingEffect?: boolean;
    bounceOnMount?: boolean;
    springEffect?: boolean;
    animationIntensity?: 'low' | 'medium' | 'high';
    onClick3D?: boolean;
}

export interface CardHeaderProps {
    children?: React.ReactNode;
    showDivider?: boolean;
    className?: string;
    action?: React.ReactNode;
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
    align?: 'start' | 'center' | 'end' | 'between';
}

export interface CardImageProps {
    src: string;
    alt: string;
    loading?: 'lazy' | 'eager';
    fallback?: string;
    className?: string;
    height?: number | string;
    aspectRatio?: string;
    overlay?: boolean;
    roundedTop?: boolean;
    zoom?: boolean;
}

export interface CardTextProps {
    children?: React.ReactNode;
    className?: string;
    colorMode?: TextColorMode;
    as?: React.ElementType;
}

export interface CardGroupProps {
    children: React.ReactNode;
    className?: string;
    stacked?: boolean;
    horizontal?: boolean;
    gap?: number | string;
    interactive?: boolean;
    theme?: CardTheme;
}

export interface CardActionsProps {
    children: React.ReactNode;
    className?: string;
    align?: 'start' | 'center' | 'end' | 'between' | 'around';
    vertical?: boolean;
}

export interface AnimationVariant {
    initial?: Record<string, number | string>;
    animate?: Record<string, number | string>;
    transition?: {
        duration?: number;
        delay?: number;
        type?: string;
        stiffness?: number;
        damping?: number;
        times?: number[];
    };
}

export declare const Card: React.FC<CardProps>;
export declare const CardHeader: React.FC<CardHeaderProps>;
export declare const CardContent: React.FC<CardContentProps>;
export declare const CardFooter: React.FC<CardFooterProps>;
export declare const CardImage: React.FC<CardImageProps>;
export declare const CardText: React.FC<CardTextProps>;
export declare const CardGroup: React.FC<CardGroupProps>;
export declare const CardActions: React.FC<CardActionsProps>; 