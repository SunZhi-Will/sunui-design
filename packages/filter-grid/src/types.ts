import React from 'react';

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
    categories?: {
        all: string;
    };
}

export interface FilterGridProps {
    children: React.ReactNode;
    translations?: FilterGridTranslations;
    className?: string;
    showTitle?: boolean;
    showCategories?: boolean;
    theme?: Theme;
    shape?: Shape;
    styles?: FilterGridStyleProps;
    width?: number;
    height?: number;
    categories?: string[];
    loading?: boolean;
    itemsPerPage?: number;
    loadingItemCount?: number;
    loadMore?: () => void;
    usePagination?: boolean;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export interface GridItemProps {
    name: string;
    icon: string;
    category?: string;
    delay?: number;
    theme?: Theme;
    shape?: Shape;
    styles?: FilterGridStyleProps;
    width?: number;
    height?: number;
    onClick?: (name: string, category?: string) => void;
    showName?: boolean;
} 