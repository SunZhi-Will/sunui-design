import React from 'react';
import { SocialButtonProps } from 'sunui-social-button';

export type SocialButtonConfig = Omit<SocialButtonProps, 'position' | 'variant'>;

export interface FloatingButtonProps {
    show?: boolean;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    defaultOpen?: boolean;
    children?: React.ReactNode;
    className?: string;
    buttonClassName?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    buttons?: SocialButtonConfig[];
    variant?: 'petal' | 'vertical' | 'grid';
} 