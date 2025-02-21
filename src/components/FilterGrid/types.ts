export interface TechStack {
    category: string;
    items: {
        name: string;
        icon: string;
    }[];
}

export type Theme = 'light' | 'dark' | 'blue';
export type Shape = 'hexagon' | 'circle';

export interface FilterGridStyleProps {
    container?: string;
    item?: string;
    title?: string;
    titleBar?: string;
    button?: string;
    buttonActive?: string;
    icon?: string;
    label?: string;
    // ...其他樣式屬性
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

export interface FilterGridTranslations {
    title?: string;
    categories: {
        all: string;
    };
}

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