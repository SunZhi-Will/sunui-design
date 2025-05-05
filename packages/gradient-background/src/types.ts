export interface GradientBackgroundProps {
    // 主要背景色系
    fromColor?: string;
    viaColor?: string;
    toColor?: string;
    // 動態光暈效果
    glowFromColor?: string;
    glowViaColor?: string;
    // 網格效果
    gridColor?: string;
    gridSize?: {
        width: number;
        height: number;
    };
    // 動畫設定
    animationDuration?: number;
    animationScale?: [number, number, number];
    animationOpacity?: [number, number, number];
} 