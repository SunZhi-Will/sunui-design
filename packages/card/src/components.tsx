import React, { useState, useCallback, useMemo } from 'react';
import { cn } from './utils';
import {
    CardHeaderProps, CardContentProps, CardFooterProps,
    CardImageProps, CardTextProps, CardGroupProps, CardActionsProps
} from './types';

export const CardHeader: React.FC<CardHeaderProps> = React.memo(({ children, showDivider = false, className = "", action }) => {
    return (
        <div
            className={cn(
                'flex items-start justify-between space-y-1.5 px-5 py-4',
                showDivider && 'border-b dark-card:border-white/10 border-gray-100',
                className
            )}
        >
            <div className="relative z-10 flex-1">{children}</div>
            {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
    );
});

CardHeader.displayName = 'CardHeader';

export const CardContent: React.FC<CardContentProps> = React.memo(({ children, showDivider = false, className = "" }) => {
    return (
        <div
            className={cn(
                'px-5 py-3',
                showDivider && 'border-b dark-card:border-white/10 border-gray-100',
                className
            )}
        >
            <div className="relative z-10">{children}</div>
        </div>
    );
});

CardContent.displayName = 'CardContent';

export const CardFooter: React.FC<CardFooterProps> = React.memo(({ children, showDivider = false, className = "", align = 'start' }) => {
    const alignmentStyles = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
    };

    return (
        <div
            className={cn(
                'flex items-center px-5 py-4',
                alignmentStyles[align],
                showDivider && 'border-t dark-card:border-white/10 border-gray-100',
                className
            )}
        >
            <div className="relative z-10 w-full">{children}</div>
        </div>
    );
});

CardFooter.displayName = 'CardFooter';

export const CardImage: React.FC<CardImageProps> = React.memo(({
    className,
    src,
    alt,
    loading = 'lazy',
    fallback,
    height,
    aspectRatio = '16/9',
    overlay = false,
    roundedTop = true,
    zoom = true
}) => {
    const [error, setError] = useState(false);
    const finalSrc = error && fallback ? fallback : src;

    const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = fallback || '';
        setError(true);
    }, [fallback, setError]);

    return (
        <div
            className={cn(
                "relative overflow-hidden",
                roundedTop && "rounded-t-xl",
                className
            )}
            style={{
                width: "100%",
                height: aspectRatio ? "auto" : height || "auto",
                aspectRatio: aspectRatio || "undefined",
                objectFit: "cover",
                borderTopLeftRadius: roundedTop ? "0.75rem" : "0",
                borderTopRightRadius: roundedTop ? "0.75rem" : "0"
            } as React.CSSProperties}
        >
            <img
                src={finalSrc}
                alt={alt}
                loading={loading}
                onError={handleError}
                className={cn(
                    "w-full h-full object-cover transition-transform duration-500",
                    zoom && "group-hover:scale-105"
                )}
            />
            {overlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            )}
        </div>
    );
});

CardImage.displayName = 'CardImage';

export const CardText: React.FC<CardTextProps> = React.memo(({
    children,
    className,
    colorMode = 'auto',
    as: Component = 'p'
}) => {
    // Determine parent card's color mode
    const colorClass = useMemo(() => {
        if (colorMode === 'light') {
            return 'text-white dark-card:text-white';
        } else if (colorMode === 'dark') {
            return 'text-gray-900 dark-card:text-gray-900';
        } else {
            // Auto mode - check for dark backgrounds
            return 'text-gray-900 dark-card:text-white';
        }
    }, [colorMode]);

    return (
        <Component className={cn(colorClass, className)}>
            {children}
        </Component>
    );
});

CardText.displayName = 'CardText';

export const CardGroup: React.FC<CardGroupProps> = React.memo(({
    children,
    className = "",
    stacked = false,
    horizontal = false,
    gap = '1rem',
    interactive = false,
    theme = 'violet'
}) => {
    // Process children for stacked layout
    const processedChildren = useMemo(() => {
        if (!stacked) return children;

        return React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child;

            const position = index === 0
                ? 'first'
                : index === React.Children.count(children) - 1
                    ? 'last'
                    : 'middle';

            return React.cloneElement(child as React.ReactElement<{
                position?: string;
                style?: React.CSSProperties;
                interactive?: boolean;
            }>, {
                position,
                style: {
                    ...((child as React.ReactElement<{ style?: React.CSSProperties }>).props.style || {}),
                    marginTop: index === 0 ? 0 : '-1rem',
                    zIndex: React.Children.count(children) - index
                },
                interactive: interactive || (child as React.ReactElement<{ interactive?: boolean }>).props.interactive
            });
        });
    }, [children, stacked, interactive]);

    return (
        <div
            className={cn(
                "w-full",
                horizontal ? "flex flex-row flex-wrap" : "flex flex-col",
                stacked ? "items-stretch" : "",
                className
            )}
            style={{
                gap: typeof gap === 'number' ? `${gap}px` : gap,
                ...(stacked ? { marginTop: '1rem' } : {})
            }}
            data-card-group
            data-card-group-stacked={stacked}
            data-card-theme={theme}
        >
            {processedChildren}
        </div>
    );
});

CardGroup.displayName = 'CardGroup';

export const CardActions: React.FC<CardActionsProps> = React.memo(({
    children,
    className = "",
    align = 'end',
    vertical = false
}) => {
    const alignmentStyles = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around'
    };

    return (
        <div
            className={cn(
                'flex gap-2 mt-2 p-2',
                vertical ? 'flex-col' : 'flex-row items-center',
                alignmentStyles[align],
                className
            )}
        >
            {children}
        </div>
    );
});

CardActions.displayName = 'CardActions'; 