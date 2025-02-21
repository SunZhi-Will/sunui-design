import { Shape, Theme } from './types';
import { defaultThemes } from './themes';

export const getThemeClasses = (theme: Theme) => {
    const themeConfig = defaultThemes[theme];
    return {
        container: themeConfig.container,
        text: themeConfig.text,
        hover: themeConfig.hover,
        image: themeConfig.image,
        button: themeConfig.button,
        title: themeConfig.title
    };
};

export const getShapeClasses = (shape: Shape) => {
    switch (shape) {
        case 'hexagon':
            return `
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            `;
        case 'square':
            return `
                border-radius: 1rem;
            `;
        case 'circle':
            return `
                border-radius: 50%;
            `;
        default:
            return '';
    }
}; 