var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
export var SocialButton = function (_a) {
    var href = _a.href, icon = _a.icon, position = _a.position, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.iconClassName, iconClassName = _c === void 0 ? '' : _c, variant = _a.variant, title = _a.title, _d = _a.titleDisplay, titleDisplay = _d === void 0 ? 'none' : _d, _e = _a.titlePosition, titlePosition = _e === void 0 ? 'bottom' : _e, onClick = _a.onClick, isMainButton = _a.isMainButton, isOpen = _a.isOpen;
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
    var buttonContent = (React.createElement(React.Fragment, null,
        typeof icon === 'string' ? (React.createElement(Image, { src: icon, alt: title || "", width: 20, height: 20, className: iconClassName })) : (icon),
        title && titleDisplay !== 'none' && (React.createElement("div", { className: "absolute ".concat(getTitlePosition(), " whitespace-nowrap\n                    px-2 py-1 bg-gray-800/90 text-white text-sm rounded\n                    ").concat(titleDisplay === 'always'
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto', "\n                    transition-opacity duration-200 z-[200]") },
            React.createElement("div", { className: getTitleArrow() }),
            title))));
    var buttonClassName = "\n        ".concat(isMainButton ? 'w-12 h-12' : 'w-10 h-10', "\n        rounded-full flex items-center justify-center\n        bg-gradient-to-r ").concat(className || "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50", "\n        shadow-lg transition-all duration-300\n        text-white relative group\n        hover:z-[145]\n    ");
    var motionProps = {
        initial: { scale: 0, x: variant === 'vertical' ? 0 : (position === null || position === void 0 ? void 0 : position.x) || 0, y: (position === null || position === void 0 ? void 0 : position.y) || 0 },
        animate: { scale: 1, x: variant === 'vertical' ? 0 : (position === null || position === void 0 ? void 0 : position.x) || 0, y: (position === null || position === void 0 ? void 0 : position.y) || 0 },
        exit: { scale: 0, x: variant === 'vertical' ? 0 : (position === null || position === void 0 ? void 0 : position.x) || 0, y: (position === null || position === void 0 ? void 0 : position.y) || 0 },
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.9 },
        transition: { duration: 0.1, ease: [1, 1, 1, 1] }
    };
    // 根據位置計算 z-index，位置越前面 z-index 越大
    var getZIndex = function () {
        if (!position)
            return 140;
        // 計算方式：基礎值 140 減去 x 和 y 的位置值（除以 100 來降低差距）
        return 140 - (position.x / 100 + position.y / 100);
    };
    if (isMainButton) {
        return (React.createElement(motion.button, __assign({ className: buttonClassName, onClick: onClick }, motionProps), buttonContent));
    }
    return (React.createElement(motion.div, { className: "absolute", style: { zIndex: getZIndex() } },
        React.createElement(motion.a, __assign({ href: href, target: "_blank", rel: "noopener noreferrer", className: buttonClassName, onClick: onClick }, motionProps), buttonContent)));
};
