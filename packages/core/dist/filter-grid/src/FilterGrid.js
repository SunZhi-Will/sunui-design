import { motion } from "framer-motion";
import React, { useState } from 'react';
import Image from "next/image";
import { getThemeClasses } from './utils';
var GridItem = React.memo(function (_a) {
    var name = _a.name, icon = _a.icon, _b = _a.delay, delay = _b === void 0 ? 0 : _b, _c = _a.theme, theme = _c === void 0 ? 'light' : _c, _d = _a.shape, shape = _d === void 0 ? 'hexagon' : _d, _e = _a.styles, styles = _e === void 0 ? {} : _e, _f = _a.width, width = _f === void 0 ? 120 : _f, _g = _a.height, height = _g === void 0 ? 138 : _g;
    var themeClasses = getThemeClasses(theme);
    return (React.createElement(motion.div, { initial: { scale: 0, rotate: -30 }, animate: { scale: 1, rotate: 0 }, transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: delay * 0.1
        }, whileHover: {
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.2 }
        }, className: "group" },
        React.createElement("div", { className: "\n                    relative\n                    flex flex-col items-center justify-center\n                    transition-all duration-300\n                    backdrop-blur-sm\n                    border\n                    overflow-hidden\n                    ".concat(themeClasses.container, "\n                    group-hover:").concat(themeClasses.hover, "\n                    ").concat(styles.item || '', "\n                "), style: {
                width: "".concat(width, "px"),
                height: "".concat(height, "px"),
                clipPath: shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined,
                borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '1rem' : undefined
            } },
            React.createElement("div", { className: "absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity" }),
            React.createElement(Image, { src: icon, alt: name, width: 48, height: 48, className: "mb-2 group-hover:scale-110 transition-transform filter ".concat(themeClasses.image, " ").concat(styles.icon || '') }),
            React.createElement("p", { className: "".concat(themeClasses.text, " text-sm font-medium ").concat(styles.label || '') }, name))));
});
GridItem.displayName = 'GridItem';
export var FilterGrid = function (_a) {
    var _b;
    var techStacks = _a.techStacks, translations = _a.translations, _c = _a.className, className = _c === void 0 ? "" : _c, _d = _a.showTitle, showTitle = _d === void 0 ? true : _d, _e = _a.theme, theme = _e === void 0 ? 'light' : _e, _f = _a.shape, shape = _f === void 0 ? 'hexagon' : _f, _g = _a.styles, styles = _g === void 0 ? {} : _g, _h = _a.width, width = _h === void 0 ? 120 : _h, _j = _a.height, height = _j === void 0 ? 138 : _j;
    var _k = useState(null), selectedCategory = _k[0], setSelectedCategory = _k[1];
    var themeClasses = getThemeClasses(theme);
    var filteredSkills = selectedCategory
        ? ((_b = techStacks.find(function (stack) { return stack.category === selectedCategory; })) === null || _b === void 0 ? void 0 : _b.skills) || []
        : techStacks.flatMap(function (stack) { return stack.skills; });
    return (React.createElement("div", { className: "w-full ".concat(className, " ").concat(styles.container || '') },
        showTitle && (React.createElement("div", { className: "flex flex-col items-center mb-16" },
            React.createElement("h2", { className: "text-4xl font-bold bg-gradient-to-r ".concat(themeClasses.title, " bg-clip-text text-transparent ").concat(styles.title || '') }, translations.title),
            React.createElement("div", { className: "mt-2 w-24 h-1 bg-gradient-to-r ".concat(themeClasses.title, " rounded-full ").concat(styles.titleBar || '') }))),
        React.createElement("div", { className: "flex justify-center gap-4 mb-12 flex-wrap" },
            React.createElement("button", { onClick: function () { return setSelectedCategory(null); }, className: "px-4 py-2 rounded-full transition-all duration-300\n                        ".concat(!selectedCategory
                    ? "".concat(themeClasses.button.active, " ").concat(styles.buttonActive || '')
                    : "".concat(themeClasses.button.inactive, " ").concat(styles.button || '')) }, translations.categories.all),
            techStacks.map(function (category) { return (React.createElement("button", { key: category.category, onClick: function () { return setSelectedCategory(category.category); }, className: "px-4 py-2 rounded-full transition-all duration-300\n                            ".concat(selectedCategory === category.category
                    ? "".concat(themeClasses.button.active, " ").concat(styles.buttonActive || '')
                    : "".concat(themeClasses.button.inactive, " ").concat(styles.button || '')) }, category.category)); })),
        React.createElement(motion.div, { className: "flex flex-wrap justify-center gap-6", layout: true }, filteredSkills.map(function (item, index) { return (React.createElement(GridItem, { key: item.name, name: item.name, icon: item.icon, delay: index * 0.1, theme: theme, shape: shape, styles: styles, width: width, height: height })); }))));
};
