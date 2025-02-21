import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
export var SocialButton = function (_a) {
    var href = _a.href, icon = _a.icon, position = _a.position, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.iconClassName, iconClassName = _c === void 0 ? '' : _c, variant = _a.variant, title = _a.title, _d = _a.titleDisplay, titleDisplay = _d === void 0 ? 'none' : _d, _e = _a.titlePosition, titlePosition = _e === void 0 ? 'bottom' : _e;
    var getTitlePosition = function () {
        switch (titlePosition) {
            case 'top':
                return 'bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
            case 'right':
                return 'left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2';
            case 'bottom':
                return 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
            case 'left':
                return 'right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2';
            default:
                return 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2';
        }
    };
    var getTitleArrow = function () {
        var baseStyle = "absolute w-2 h-2 bg-gray-800/90 rotate-45";
        switch (titlePosition) {
            case 'top':
                return "".concat(baseStyle, " bottom-[-0.25rem] left-1/2 -translate-x-1/2");
            case 'right':
                return "".concat(baseStyle, " left-[-0.25rem] top-1/2 -translate-y-1/2");
            case 'bottom':
                return "".concat(baseStyle, " top-[-0.25rem] left-1/2 -translate-x-1/2");
            case 'left':
                return "".concat(baseStyle, " right-[-0.25rem] top-1/2 -translate-y-1/2");
            default:
                return "".concat(baseStyle, " top-[-0.25rem] left-1/2 -translate-x-1/2");
        }
    };
    return (React.createElement(motion.div, { initial: { scale: 0, x: variant === 'vertical' ? 0 : 6, y: 6 }, animate: { scale: 1, x: variant === 'vertical' ? 0 : position === null || position === void 0 ? void 0 : position.x, y: position === null || position === void 0 ? void 0 : position.y }, exit: { scale: 0, x: variant === 'vertical' ? 0 : 6, y: 6, transition: { duration: 0.1 } }, transition: { duration: 0.1, ease: [1, 1, 1, 1] }, className: "absolute" },
        React.createElement(motion.a, { href: href, target: "_blank", rel: "noopener noreferrer", className: "w-10 h-10 rounded-full flex items-center justify-center\n                    bg-gradient-to-r ".concat(className, " shadow-lg transition-all duration-300\n                    text-white relative group"), whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } },
            typeof icon === 'string' ? (React.createElement(Image, { src: icon, alt: title || "", width: 20, height: 20, className: iconClassName })) : (icon),
            title && titleDisplay !== 'none' && (React.createElement("div", { className: "absolute ".concat(getTitlePosition(), " whitespace-nowrap\n                        px-2 py-1 bg-gray-800/90 text-white text-sm rounded\n                        ").concat(titleDisplay === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100', "\n                        transition-opacity duration-200") },
                React.createElement("div", { className: getTitleArrow() }),
                title)))));
};
