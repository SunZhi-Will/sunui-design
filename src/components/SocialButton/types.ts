export interface SocialButtonProps {
    href: string;
    icon: string | React.ReactNode;
    position?: { x: number; y: number };
    className?: string;
    iconClassName?: string;
    variant?: 'petal' | 'vertical' | 'grid';
    title?: string;
    titleDisplay?: 'always' | 'hover' | 'none';
    titlePosition?: 'top' | 'right' | 'bottom' | 'left';
}

export interface SocialButtonConfig {
    href: string;
    icon: string | React.ReactNode;
    className?: string;
    iconClassName?: string;
    title?: string;
    titleDisplay?: 'always' | 'hover' | 'none';
    titlePosition?: 'top' | 'right' | 'bottom' | 'left';
}