import { motion } from "framer-motion";
import React from 'react';
import { getThemeClasses } from './utils';
import type { GridItemProps } from './types';

export const GridItem = React.memo<GridItemProps>(({
    name,
    icon,
    category,
    delay = 0,
    theme = 'light',
    shape = 'hexagon',
    styles = {},
    width = 120,
    height = 138,
    onClick,
    showName = true
}) => {
    const themeClasses = getThemeClasses(theme);

    // 調整大小計算邏輯
    const size = (() => {
        if (shape === 'circle' || shape === 'square') {
            return Math.min(width, height);
        }
        if (shape === 'hexagon' && !showName) {
            // 當只顯示圖標時，確保六邊形的寬高比為 1:1.15
            const baseSize = Math.min(width, height);
            return {
                width: baseSize,
                height: Math.round(baseSize * 1.15)
            };
        }
        return {
            width: width,
            height: height
        };
    })();

    const handleClick = () => {
        onClick?.(name, category);
    };

    return (
        <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: delay * 0.1
            }}
            whileHover={{
                scale: 1.1,
                rotate: 5,
                transition: { duration: 0.2 }
            }}
            className="group"
            onClick={handleClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div
                className={`
                    relative
                    flex flex-col items-center justify-center
                    transition-all duration-300
                    backdrop-blur-sm
                    border
                    overflow-hidden
                    ${themeClasses.container}
                    group-hover:${themeClasses.hover}
                    ${styles.item || ''}
                    ${(shape === 'circle' || shape === 'square') ? 'aspect-square' : ''}
                `}
                style={{
                    width: typeof size === 'number' ? `${size}px` : `${size.width}px`,
                    height: typeof size === 'number' ? `${size}px` : `${size.height}px`,
                    clipPath: shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined,
                    borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '0.75rem' : undefined
                }}
            >
                <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity" />
                <img
                    src={icon}
                    alt={name}
                    width={showName ? 48 : 32}
                    height={showName ? 48 : 32}
                    className={`${!showName ? 'mb-0' : 'mb-2'} group-hover:scale-110 transition-transform filter ${themeClasses.image} ${styles.icon || ''}`}
                />
                {showName && (
                    <p className={`${themeClasses.text} text-sm font-medium ${styles.label || ''}`}>
                        {name}
                    </p>
                )}
            </div>
        </motion.div>
    );
});

GridItem.displayName = 'GridItem'; 