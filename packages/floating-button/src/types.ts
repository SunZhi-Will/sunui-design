import React from 'react';
import { SocialButtonProps } from '@sunui-design/social';

export type SocialMediaType = 'facebook' | 'github' | 'instagram' | 'linkedin' | 'twitter';

export type SocialButtonConfig = (Omit<SocialButtonProps, 'position' | 'variant' | 'icon'> & {
    type?: SocialMediaType;
    icon?: React.ReactNode;
});

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
    showToggleButton?: boolean;
    draggable?: boolean;
    onPositionChange?: (x: number, y: number) => void;
    defaultPosition?: { x: number, y: number };
} 