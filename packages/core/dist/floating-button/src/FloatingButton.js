'use client';
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
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialButton } from '@sun-ui/social-button';
export var FloatingButton = function (_a) {
    var _b = _a.show, show = _b === void 0 ? true : _b, controlledIsOpen = _a.isOpen, onOpenChange = _a.onOpenChange, _c = _a.defaultOpen, defaultOpen = _c === void 0 ? false : _c, children = _a.children, _d = _a.className, className = _d === void 0 ? '' : _d, _e = _a.buttonClassName, buttonClassName = _e === void 0 ? '' : _e, _f = _a.position, position = _f === void 0 ? 'bottom-right' : _f, _g = _a.buttons, buttons = _g === void 0 ? [] : _g, _h = _a.variant, variant = _h === void 0 ? 'petal' : _h;
    var _j = useState(defaultOpen), uncontrolledIsOpen = _j[0], setUncontrolledIsOpen = _j[1];
    var isMenuOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
    var positionClasses = {
        'bottom-right': 'right-4 sm:right-8 bottom-8',
        'bottom-left': 'left-4 sm:left-8 bottom-8',
        'top-right': 'right-4 sm:right-8 top-8',
        'top-left': 'left-4 sm:left-8 top-8'
    };
    var handleToggle = function () {
        var newState = !isMenuOpen;
        onOpenChange === null || onOpenChange === void 0 ? void 0 : onOpenChange(newState);
        if (controlledIsOpen === undefined) {
            setUncontrolledIsOpen(newState);
        }
    };
    var calculatePosition = function (index, total) {
        var baseRadius = 60;
        var baseButtonCount = 3;
        if (variant === 'grid') {
            var spacing = 50;
            var itemsPerRow = Math.ceil(Math.sqrt(total));
            var now = index + 1;
            var row = void 0, col = void 0;
            if (position === 'bottom-right') {
                var reversedIndex = total - index;
                row = Math.floor(reversedIndex / itemsPerRow);
                col = reversedIndex % itemsPerRow;
                return {
                    x: -col * spacing,
                    y: -row * spacing
                };
            }
            else if (position === 'bottom-left') {
                var reversedIndex = total - index;
                row = Math.floor(reversedIndex / itemsPerRow);
                col = reversedIndex % itemsPerRow;
                return {
                    x: col * spacing,
                    y: -row * spacing
                };
            }
            else if (position === 'top-right') {
                row = Math.floor(now / itemsPerRow);
                col = now % itemsPerRow;
                return {
                    x: -col * spacing,
                    y: row * spacing
                };
            }
            else {
                row = Math.floor(now / itemsPerRow);
                col = now % itemsPerRow;
                return {
                    x: col * spacing,
                    y: row * spacing
                };
            }
        }
        if (variant === 'vertical') {
            var spacing = 50;
            switch (position) {
                case 'bottom-right':
                case 'bottom-left':
                    return {
                        x: position.includes('right') ? 0 : 0,
                        y: -spacing * (index + 1)
                    };
                case 'top-right':
                case 'top-left':
                    return {
                        x: position.includes('right') ? 0 : 0,
                        y: spacing * (index + 1) + 10
                    };
                default:
                    return { x: 0, y: 0 };
            }
        }
        var currentIndex = index;
        var layer = 0;
        var buttonsInPreviousLayers = 0;
        while (currentIndex >= 0) {
            var buttonsInThisLayer_1 = baseButtonCount + (layer * 2);
            if (currentIndex < buttonsInThisLayer_1) {
                break;
            }
            currentIndex -= buttonsInThisLayer_1;
            buttonsInPreviousLayers += buttonsInThisLayer_1;
            layer++;
        }
        var buttonsInThisLayer = baseButtonCount + (layer * 2);
        var indexInLayer = index - buttonsInPreviousLayers;
        var radius = baseRadius * (layer + 1);
        var angleOffset = (Math.PI / 2) * (indexInLayer / (buttonsInThisLayer - 1));
        switch (position) {
            case 'bottom-right':
                return {
                    x: -radius * Math.cos(angleOffset),
                    y: -radius * Math.sin(angleOffset)
                };
            case 'bottom-left':
                return {
                    x: radius * Math.cos(angleOffset),
                    y: -radius * Math.sin(angleOffset)
                };
            case 'top-right':
                return {
                    x: -radius * Math.cos(angleOffset),
                    y: radius * Math.sin(angleOffset)
                };
            case 'top-left':
                return {
                    x: radius * Math.cos(angleOffset),
                    y: radius * Math.sin(angleOffset)
                };
            default:
                return { x: 0, y: 0 };
        }
    };
    var renderChildren = function () {
        if (!children) {
            return (React.createElement("div", { className: "absolute inset-0 ".concat(variant === 'vertical' ? 'flex justify-center' : '') }, buttons.map(function (button, index) { return (React.createElement(SocialButton, __assign({ key: button.href }, button, { className: button.className || "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50", position: calculatePosition(index, buttons.length), variant: variant }))); })));
        }
        var childrenArray = React.Children.toArray(children);
        return (React.createElement("div", { className: "absolute inset-0 ".concat(variant === 'vertical' ? 'flex justify-center' : '') }, React.Children.map(childrenArray, function (child, index) {
            if (React.isValidElement(child) && child.type === SocialButton) {
                return React.cloneElement(child, {
                    position: calculatePosition(index, childrenArray.length),
                    variant: variant
                });
            }
            return child;
        })));
    };
    return (React.createElement("div", { className: "fixed ".concat(positionClasses[position], " z-50 transition-all duration-500\n            ").concat(show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0', "\n            ").concat(className) },
        React.createElement(motion.button, { onClick: handleToggle, className: "w-12 h-12 rounded-full flex items-center justify-center\n                    bg-gradient-to-r from-blue-600/90 to-blue-800/90 \n                    shadow-lg hover:shadow-blue-500/50 transition-all duration-300\n                    relative z-50 text-white ".concat(buttonClassName), whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 } },
            React.createElement("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16" }))),
        React.createElement(AnimatePresence, { mode: "wait" }, isMenuOpen && (React.createElement(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, className: "absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg p-4" },
            React.createElement("div", { className: "relative ".concat(variant === 'vertical' ? 'flex justify-center' : '') }, renderChildren()))))));
};
