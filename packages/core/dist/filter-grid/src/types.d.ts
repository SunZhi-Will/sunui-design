export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple';
export type Shape = 'hexagon' | 'square' | 'circle';
export interface ThemeConfig {
    container: string;
    hover: string;
    text: string;
    image: string;
    button: {
        active: string;
        inactive: string;
    };
    title: string;
}
export interface TechStack {
    category: string;
    skills: {
        name: string;
        icon: string;
    }[];
}
export interface FilterGridStyleProps {
    container?: string;
    item?: string;
    title?: string;
    titleBar?: string;
    button?: string;
    buttonActive?: string;
    icon?: string;
    label?: string;
}
export interface FilterGridTranslations {
    title?: string;
    categories: {
        all: string;
    };
}
export interface FilterGridProps {
    techStacks: TechStack[];
    translations: FilterGridTranslations;
    className?: string;
    showTitle?: boolean;
    theme?: Theme;
    shape?: Shape;
    styles?: FilterGridStyleProps;
    width?: number;
    height?: number;
}
