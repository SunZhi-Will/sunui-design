import { defaultThemes } from './themes';
export var getThemeClasses = function (theme) {
    var themeConfig = defaultThemes[theme];
    return {
        container: themeConfig.container,
        text: themeConfig.text,
        hover: themeConfig.hover,
        image: themeConfig.image,
        button: themeConfig.button,
        title: themeConfig.title
    };
};
export var getShapeClasses = function (shape) {
    switch (shape) {
        case 'hexagon':
            return "\n                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);\n            ";
        case 'square':
            return "\n                border-radius: 1rem;\n            ";
        case 'circle':
            return "\n                border-radius: 50%;\n            ";
        default:
            return '';
    }
};
