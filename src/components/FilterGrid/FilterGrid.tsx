import { motion } from "framer-motion";
import React, { useState } from 'react';
import Image from "next/image";
import { defaultThemes } from './themes';
import type {
    FilterGridProps,
    Theme,
    Shape,
    FilterGridStyleProps,
    TechStack,
    ThemeConfig,
    FilterGridTranslations
} from './types';

interface GridItemProps {
    name: string;
    icon: string;
    delay?: number;
    theme?: Theme;
    shape?: Shape;
    styles?: FilterGridStyleProps;
    width?: number;
    height?: number;
}

const getThemeClasses = (theme: Theme = 'light') => {
    return defaultThemes[theme] || defaultThemes.light;
};

export const FilterGrid: React.FC<FilterGridProps> = ({
    techStacks,
    translations,
    className = "",
    showTitle = true,
    theme = 'light',
    shape = 'hexagon',
    styles = {},
    width = 120,
    height = 138,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const themeClasses = getThemeClasses(theme);

    // 獲取所有技能
    const allSkills = techStacks.flatMap(category =>
        category.items.map(item => ({
            ...item,
            category: category.category
        }))
    );

    // 過濾技能
    const filteredSkills = selectedCategory
        ? allSkills.filter(skill => skill.category === selectedCategory)
        : allSkills;

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

const GridItem = React.memo(({
    name,
    icon,
    delay = 0,
    theme = 'light',
    shape = 'hexagon',
    styles = {},
    width = 120,
    height = 138,
}: GridItemProps) => {
    const themeClasses = getThemeClasses(theme);
    const shapeClass = getShapeClasses(shape);

    return (
        <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: delay
            }}
            whileHover={{
                scale: 1.1,
                rotate: 5,
                transition: { duration: 0.2 }
            }}
            className={`group ${styles.item || ''}`}
        >
            <div className={`
                relative
                backdrop-blur-sm
                flex flex-col items-center justify-center
                transition-all duration-300
                border
                overflow-hidden
                ${shapeClass}
                ${themeClasses.container}
                ${styles.item || ''}
            `}
                style={{
                    width: shape === 'circle' ? `${width}px` : `${width}px`,
                    height: shape === 'circle' ? `${width}px` : `${height}px`,
                }}>
                <div className={`
                    absolute inset-0 
                    opacity-0 
                    group-hover:opacity-100 
                    transition-opacity
                    ${themeClasses.hover}
                `} />
                <Image
                    src={icon}
                    alt={name}
                    width={48}
                    height={48}
                    className={`
                        relative z-10 mb-2 
                        group-hover:scale-110 
                        transition-transform 
                        filter
                        ${themeClasses.image}
                        ${styles.icon || ''}
                    `}
                />
                <p className={`
                    relative z-10 
                    text-sm font-medium
                    ${themeClasses.text}
                    ${styles.label || ''}
                `}>
                    {name}
                </p>
            </div>
        </motion.div>
    );
});

GridItem.displayName = 'GridItem';

const getShapeClasses = (shape: Shape = 'hexagon') => {
    const shapes = {
        hexagon: "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]",
        circle: "rounded-full"
    };
    return shapes[shape];
}; 