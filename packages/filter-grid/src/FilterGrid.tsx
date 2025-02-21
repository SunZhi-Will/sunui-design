import { motion } from "framer-motion";
import React, { useState } from 'react';
import Image from "next/image";
import { getThemeClasses, getShapeClasses } from './utils';
import type { FilterGridProps } from './types';

interface GridItemProps {
    name: string;
    icon: string;
    delay?: number;
    theme?: FilterGridProps['theme'];
    shape?: FilterGridProps['shape'];
    styles?: FilterGridProps['styles'];
    width?: number;
    height?: number;
}

const GridItem = React.memo<GridItemProps>(({
    name,
    icon,
    delay = 0,
    theme = 'light',
    shape = 'hexagon',
    styles = {},
    width = 120,
    height = 138
}) => {
    const themeClasses = getThemeClasses(theme);

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
                `}
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    clipPath: shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined,
                    borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '1rem' : undefined
                }}
            >
                <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity" />
                <Image
                    src={icon}
                    alt={name}
                    width={48}
                    height={48}
                    className={`mb-2 group-hover:scale-110 transition-transform filter ${themeClasses.image} ${styles.icon || ''}`}
                />
                <p className={`${themeClasses.text} text-sm font-medium ${styles.label || ''}`}>
                    {name}
                </p>
            </div>
        </motion.div>
    );
});

GridItem.displayName = 'GridItem';

export const FilterGrid: React.FC<FilterGridProps> = ({
    techStacks,
    translations,
    className = "",
    showTitle = true,
    theme = 'light',
    shape = 'hexagon',
    styles = {},
    width = 120,
    height = 138
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const themeClasses = getThemeClasses(theme);

    const filteredSkills = selectedCategory
        ? techStacks.find(stack => stack.category === selectedCategory)?.skills || []
        : techStacks.flatMap(stack => stack.skills);

    return (
        <div className={`w-full ${className} ${styles.container || ''}`}>
            {showTitle && (
                <div className="flex flex-col items-center mb-16">
                    <h2 className={`text-4xl font-bold bg-gradient-to-r ${themeClasses.title} bg-clip-text text-transparent ${styles.title || ''}`}>
                        {translations.title}
                    </h2>
                    <div className={`mt-2 w-24 h-1 bg-gradient-to-r ${themeClasses.title} rounded-full ${styles.titleBar || ''}`} />
                </div>
            )}

            <div className="flex justify-center gap-4 mb-12 flex-wrap">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full transition-all duration-300
                        ${!selectedCategory
                            ? `${themeClasses.button.active} ${styles.buttonActive || ''}`
                            : `${themeClasses.button.inactive} ${styles.button || ''}`
                        }`}
                >
                    {translations.categories.all}
                </button>
                {techStacks.map(category => (
                    <button
                        key={category.category}
                        onClick={() => setSelectedCategory(category.category)}
                        className={`px-4 py-2 rounded-full transition-all duration-300
                            ${selectedCategory === category.category
                                ? `${themeClasses.button.active} ${styles.buttonActive || ''}`
                                : `${themeClasses.button.inactive} ${styles.button || ''}`
                            }`}
                    >
                        {category.category}
                    </button>
                ))}
            </div>

            <motion.div
                className="flex flex-wrap justify-center gap-6"
                layout
            >
                {filteredSkills.map((item, index) => (
                    <GridItem
                        key={item.name}
                        name={item.name}
                        icon={item.icon}
                        delay={index * 0.1}
                        theme={theme}
                        shape={shape}
                        styles={styles}
                        width={width}
                        height={height}
                    />
                ))}
            </motion.div>
        </div>
    );
}; 