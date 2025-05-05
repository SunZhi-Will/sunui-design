import { motion, AnimatePresence } from "framer-motion";
import React, { useState, Children, isValidElement, cloneElement, ReactElement, Fragment, useEffect, useCallback } from 'react';
import { getThemeClasses } from './utils';
import type { FilterGridProps, GridItemProps } from './types';
import { GridItem } from "./GridItem";

export const FilterGrid: React.FC<FilterGridProps> = ({
    children,
    translations = {},
    className = "",
    showTitle = true,
    showCategories = true,
    theme = 'light',
    shape = 'hexagon',
    styles = {},
    width = 120,
    height = 138,
    categories = [],
    loading = false,
    itemsPerPage = 12,
    loadingItemCount = 3,
    loadMore,
    usePagination = false,
    currentPage = 1,
    totalPages = 1,
    onPageChange
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const themeClasses = getThemeClasses(theme);

    const items = Children.toArray(children)
        .filter((child): child is ReactElement<GridItemProps> =>
            isValidElement(child) && child.type === GridItem
        )
        .map((child, index) => {
            return cloneElement<GridItemProps>(child, {
                theme,
                shape,
                styles,
                width,
                height,
                delay: index * 0.1,
                ...child.props
            });
        });

    const filteredItems = selectedCategory
        ? items.filter(item => 'category' in item.props && item.props.category === selectedCategory)
        : items;

    const paginatedItems = usePagination
        ? filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : filteredItems;

    const actualTotalPages = usePagination
        ? Math.ceil(filteredItems.length / itemsPerPage)
        : totalPages;

    const availableCategories = categories.length > 0
        ? categories
        : Array.from(new Set(
            items
                .map(item => ('category' in item.props ? item.props.category : undefined))
                .filter((category): category is string => Boolean(category))
        ));

    const observerRef = useCallback((node: HTMLDivElement) => {
        if (!node || !loadMore || usePagination) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsIntersecting(entry.isIntersecting),
            { threshold: 0.1 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [loadMore, usePagination, setIsIntersecting]);

    useEffect(() => {
        if (isIntersecting && loadMore && !loading) {
            loadMore();
        }
    }, [isIntersecting, loadMore, loading]);

    const handlePageChange = (page: number) => {
        onPageChange?.(page);
    };

    const PaginationControls = () => {
        if (!usePagination || actualTotalPages <= 1) return null;

        const pages = Array.from({ length: actualTotalPages }, (_, i) => i + 1);
        const showEllipsis = actualTotalPages > 7;
        let visiblePages = pages;

        if (showEllipsis) {
            if (currentPage <= 4) {
                visiblePages = [...pages.slice(0, 5), -1, actualTotalPages];
            } else if (currentPage >= actualTotalPages - 3) {
                visiblePages = [1, -1, ...pages.slice(actualTotalPages - 5)];
            } else {
                visiblePages = [1, -1, currentPage - 1, currentPage, currentPage + 1, -2, actualTotalPages];
            }
        }

        return (
            <div className="flex justify-center items-center gap-2 mt-8">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className={`px-3 py-2 rounded-lg transition-all duration-300
                        ${currentPage === 1 || loading
                            ? `${themeClasses.button.inactive} opacity-50 cursor-not-allowed`
                            : `${themeClasses.button.inactive} hover:${themeClasses.hover}`
                        }`}
                >
                    ←
                </button>
                {visiblePages.map((page, index) => (
                    <React.Fragment key={index}>
                        {page === -1 || page === -2 ? (
                            <span className={`${themeClasses.text}`}>...</span>
                        ) : (
                            <button
                                onClick={() => handlePageChange(page)}
                                disabled={loading}
                                className={`w-10 h-10 rounded-lg transition-all duration-300
                                    ${currentPage === page
                                        ? `${themeClasses.button.active}`
                                        : `${themeClasses.button.inactive} hover:${themeClasses.hover}`
                                    }`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === actualTotalPages || loading}
                    className={`px-3 py-2 rounded-lg transition-all duration-300
                        ${currentPage === actualTotalPages || loading
                            ? `${themeClasses.button.inactive} opacity-50 cursor-not-allowed`
                            : `${themeClasses.button.inactive} hover:${themeClasses.hover}`
                        }`}
                >
                    →
                </button>
            </div>
        );
    };

    const LoadingItems = () => (
        <Fragment>
            {Array.from({ length: loadingItemCount }).map((_, index) => (
                <motion.div
                    key={`loading-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [0.8, 0.9, 0.8],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.2
                    }}
                    className={`
                        relative flex flex-col items-center justify-center
                        backdrop-blur-sm border overflow-hidden
                        ${themeClasses.container}
                    `}
                    style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        clipPath: shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined,
                        borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '0.75rem' : undefined
                    }}
                >
                    <div className="w-12 h-12 mb-2 bg-current opacity-20 rounded-full" />
                    <div className="w-16 h-2 bg-current opacity-20 rounded-full" />
                </motion.div>
            ))}
        </Fragment>
    );

    return (
        <div className={`w-full ${className} ${styles.container || ''}`}>
            {showTitle && translations.title && (
                <div className="flex flex-col items-center mb-16">
                    <h2 className={`text-4xl font-bold bg-gradient-to-r ${themeClasses.title} bg-clip-text text-transparent ${styles.title || ''}`}>
                        {translations.title}
                    </h2>
                    <div className={`mt-2 w-24 h-1 bg-gradient-to-r ${themeClasses.title} rounded-full ${styles.titleBar || ''}`} />
                </div>
            )}

            {showCategories && availableCategories.length > 0 && translations.categories && (
                <div className="flex justify-center gap-4 mb-12 flex-wrap">
                    <button
                        onClick={() => {
                            setSelectedCategory(null);
                            onPageChange?.(1);
                        }}
                        className={`px-4 py-2 rounded-full transition-all duration-300
                            ${!selectedCategory
                                ? `${themeClasses.button.active} ${styles.buttonActive || ''}`
                                : `${themeClasses.button.inactive} ${styles.button || ''}`
                            }`}
                    >
                        {translations.categories.all}
                    </button>
                    {availableCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => {
                                setSelectedCategory(category);
                                onPageChange?.(1);
                            }}
                            className={`px-4 py-2 rounded-full transition-all duration-300
                                ${selectedCategory === category
                                    ? `${themeClasses.button.active} ${styles.buttonActive || ''}`
                                    : `${themeClasses.button.inactive} ${styles.button || ''}`
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            <motion.div
                className="flex flex-wrap justify-center gap-6"
                layout
            >
                <AnimatePresence mode="popLayout">
                    <Fragment key="items">
                        {paginatedItems}
                    </Fragment>
                    {loading && <LoadingItems />}
                </AnimatePresence>
            </motion.div>

            {usePagination ? (
                <PaginationControls />
            ) : loadMore && (
                <div ref={observerRef} className="h-4" />
            )}
        </div>
    );
}; 