import { Shape, Theme } from './types';
export declare const getThemeClasses: (theme: Theme) => {
    container: string;
    text: string;
    hover: string;
    image: string;
    button: {
        active: string;
        inactive: string;
    };
    title: string;
};
export declare const getShapeClasses: (shape: Shape) => "" | "\n                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);\n            " | "\n                border-radius: 1rem;\n            " | "\n                border-radius: 50%;\n            ";
