export interface GradientBackgroundProps {
    fromColor?: string;
    viaColor?: string;
    toColor?: string;
    glowFromColor?: string;
    glowViaColor?: string;
    gridColor?: string;
    gridSize?: {
        width: number;
        height: number;
    };
    animationDuration?: number;
    animationScale?: [number, number, number];
    animationOpacity?: [number, number, number];
}
