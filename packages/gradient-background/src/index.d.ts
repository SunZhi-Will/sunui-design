import { ReactNode } from 'react';

export type GradientPreset = 'sunset' | 'ocean' | 'forest' | 'aurora';
export type GradientDirection = 'diagonal' | 'horizontal' | 'vertical';

export interface GradientBackgroundProps {
    preset?: GradientPreset;
    animated?: boolean;
    speed?: number;
    colors?: string[];
    direction?: GradientDirection;
    children?: ReactNode;
    className?: string;
}

export declare const GradientBackground: React.FC<GradientBackgroundProps>; 