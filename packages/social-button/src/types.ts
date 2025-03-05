import React from 'react';

export interface SocialButtonProps {
    href?: string;
    icon: React.ReactNode;
    className?: string;
    iconClassName?: string;
    position?: { x: number; y: number };
    variant?: 'petal' | 'vertical' | 'grid';
    title?: string;
    titleDisplay?: 'always' | 'hover' | 'none';
    titlePosition?: 'top' | 'right' | 'bottom' | 'left';
    onClick?: () => void;
    isMainButton?: boolean;
    isOpen?: boolean;
} 