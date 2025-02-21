import { motion } from "framer-motion";
import React from "react";
export var GradientBackground = function (_a) {
    var _b = _a.fromColor, fromColor = _b === void 0 ? "#172554" : _b, _c = _a.viaColor, viaColor = _c === void 0 ? "#1e3a8a" : _c, _d = _a.toColor, toColor = _d === void 0 ? "#0f172a" : _d, _e = _a.glowFromColor, glowFromColor = _e === void 0 ? "#60a5fa" : _e, _f = _a.glowViaColor, glowViaColor = _f === void 0 ? "#2563eb" : _f, _g = _a.gridColor, gridColor = _g === void 0 ? "#3b82f6" : _g, _h = _a.gridSize, gridSize = _h === void 0 ? { width: 14, height: 24 } : _h, _j = _a.animationDuration, animationDuration = _j === void 0 ? 12 : _j, _k = _a.animationScale, animationScale = _k === void 0 ? [1, 1.3, 1] : _k, _l = _a.animationOpacity, animationOpacity = _l === void 0 ? [0.3, 0.1, 0.3] : _l;
    return (React.createElement("div", { className: "fixed inset-0 -z-10" },
        React.createElement("div", { style: {
                position: 'absolute',
                inset: 0,
                background: "radial-gradient(ellipse at top, ".concat(fromColor, ", ").concat(viaColor, ", ").concat(toColor, ")")
            } }),
        React.createElement(motion.div, { animate: {
                scale: animationScale,
                opacity: animationOpacity,
            }, transition: {
                duration: animationDuration,
                repeat: Infinity,
                ease: "easeInOut",
            }, style: {
                position: 'absolute',
                inset: 0,
                background: "radial-gradient(circle at center, ".concat(glowFromColor, "40, ").concat(glowViaColor, "20, transparent 70%)")
            } }),
        React.createElement(motion.div, { animate: {
                scale: animationScale.map(function (s) { return s * 1.1; }),
                opacity: animationOpacity.map(function (o) { return o * 0.5; }),
            }, transition: {
                duration: animationDuration * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: animationDuration * 0.2,
            }, style: {
                position: 'absolute',
                inset: 0,
                background: "radial-gradient(circle at center, ".concat(glowFromColor, "30, ").concat(glowViaColor, "10, transparent 70%)")
            } }),
        React.createElement("div", { className: "absolute inset-0", style: {
                backgroundImage: "linear-gradient(to right,".concat(gridColor, "20 1px,transparent 1px),linear-gradient(to bottom,").concat(gridColor, "20 1px,transparent 1px)"),
                backgroundSize: "".concat(gridSize.width, "px ").concat(gridSize.height, "px"),
            } })));
};
