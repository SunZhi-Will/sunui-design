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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState } from 'react';
import { FloatingButton } from './FloatingButton';
import { SocialButton } from '@sun-ui/social-button';
var meta = {
    title: 'Components/FloatingButton',
    component: FloatingButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        show: {
            control: 'boolean',
            description: '控制按鈕是否顯示',
            defaultValue: true
        },
        isOpen: {
            control: 'boolean',
            description: '控制選單是否展開（受控模式）'
        },
        defaultOpen: {
            control: 'boolean',
            description: '預設選單是否展開（非受控模式）',
            defaultValue: false
        },
        onOpenChange: {
            description: '選單開關狀態改變時的回調函數'
        },
        position: {
            control: 'select',
            options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
            description: '組件的位置',
            defaultValue: 'bottom-right'
        },
        className: {
            control: 'text',
            description: '自定義容器類名'
        },
        buttonClassName: {
            control: 'text',
            description: '自定義按鈕類名'
        },
        children: {
            description: '自定義子元素'
        },
        buttons: {
            description: '花瓣式按鈕配置陣列'
        },
        variant: {
            control: 'radio',
            options: ['petal', 'vertical', 'grid'],
            description: '按鈕展開方式',
            defaultValue: 'petal'
        }
    }
};
export default meta;
var socialButtons = [
    {
        href: 'https://github.com',
        icon: '/github.svg',
        className: 'from-gray-600 to-gray-800',
    },
    {
        href: 'https://twitter.com',
        icon: '/twitter.svg',
        className: 'from-blue-400 to-blue-600',
    },
    {
        href: 'https://linkedin.com',
        icon: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" },
            React.createElement("path", { d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" })),
        className: 'from-blue-600 to-blue-800',
    },
];
export var Default = {
    args: {
        buttons: [
            {
                href: "https://github.com/SunZhi-Will",
                icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
                className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50",
                iconClassName: "[filter:invert(1)]"
            },
            {
                href: "https://www.linkedin.com/in/sunzhi-will",
                icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg",
                className: "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
            },
            {
                href: "mailto:sun055676@gmail.com",
                icon: (React.createElement("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }))),
                className: "from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50"
            }
        ],
        position: 'bottom-right',
        variant: 'petal'
    },
    parameters: {
        docs: {
            description: {
                story: '這是一個基本的浮動按鈕示例，使用非受控模式。點擊主按鈕時，會以花瓣形式展開社交媒體連結。'
            }
        }
    },
    render: function (args) { return (React.createElement("div", { className: "relative w-full h-[400px] bg-slate-100" },
        React.createElement(FloatingButton, __assign({}, args)),
        React.createElement("div", { className: "relative z-10 flex items-center justify-center h-full" },
            React.createElement("h1", { className: "text-4xl font-bold text-slate-800" }, "\u9EDE\u64CA\u53F3\u4E0B\u89D2\u6309\u9215\u5C55\u958B\u9078\u55AE")))); }
};
export var Vertical = {
    args: {
        buttons: socialButtons,
        position: 'bottom-right',
        variant: 'vertical',
    },
};
export var Grid = {
    args: {
        buttons: __spreadArray(__spreadArray([], socialButtons, true), socialButtons, true),
        position: 'bottom-right',
        variant: 'grid',
    },
};
export var WithChildren = {
    args: {
        position: 'bottom-right',
        variant: 'petal',
        children: (React.createElement(React.Fragment, null,
            React.createElement(SocialButton, { href: "https://github.com", icon: "/github.svg", className: "from-gray-600 to-gray-800" }),
            React.createElement(SocialButton, { href: "https://twitter.com", icon: "/twitter.svg", className: "from-blue-400 to-blue-600" }),
            React.createElement(SocialButton, { href: "https://linkedin.com", icon: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" },
                    React.createElement("path", { d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" })), className: "from-blue-600 to-blue-800" }))),
    },
};
export var Controlled = {
    parameters: {
        docs: {
            description: {
                story: '這是一個受控模式的示例，展示如何通過外部狀態控制按鈕的展開/收合。'
            }
        }
    },
    render: function () {
        var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
        return (React.createElement("div", { className: "relative w-full h-[400px] bg-slate-100" },
            React.createElement(FloatingButton, { isOpen: isOpen, onOpenChange: setIsOpen, buttons: [
                    {
                        href: "https://github.com/SunZhi-Will",
                        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
                        className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50",
                        iconClassName: "[filter:invert(1)]"
                    },
                    {
                        href: "https://www.linkedin.com/in/sunzhi-will",
                        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg",
                        className: "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50"
                    },
                    {
                        href: "mailto:sun055676@gmail.com",
                        icon: (React.createElement("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                            React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }))),
                        className: "from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50"
                    }
                ] }),
            React.createElement("div", { className: "relative z-10 flex flex-col items-center justify-center h-full gap-4" },
                React.createElement("h1", { className: "text-4xl font-bold text-slate-800" }, "\u53D7\u63A7\u6A21\u5F0F\u793A\u4F8B"),
                React.createElement("button", { onClick: function () { return setIsOpen(!isOpen); }, className: "px-4 py-2 bg-blue-500 text-white rounded-md" }, isOpen ? '關閉選單' : '開啟選單'))));
    }
};
export var CustomChildren = {
    parameters: {
        docs: {
            description: {
                story: '這個示例展示如何使用自定義子元素。使用 SocialButton 組件可以輕鬆實現自動排列的效果。'
            }
        }
    },
    render: function () {
        var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
        return (React.createElement("div", { className: "relative w-full h-[400px] bg-slate-100" },
            React.createElement(FloatingButton, { isOpen: isOpen, onOpenChange: setIsOpen, position: "bottom-right", variant: "petal" },
                React.createElement(SocialButton, { href: "https://github.com", icon: React.createElement("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24" },
                        React.createElement("path", { d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" })), className: "from-purple-600/90 to-indigo-800/90 hover:shadow-purple-500/50", title: "\u5728 GitHub \u4E0A\u95DC\u6CE8\u6211", titleDisplay: "hover", titlePosition: "bottom" }),
                React.createElement(SocialButton, { href: "https://linkedin.com", icon: React.createElement("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 24 24" },
                        React.createElement("path", { d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" })), className: "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50", title: "\u5728 LinkedIn \u4E0A\u9023\u63A5", titleDisplay: "hover", titlePosition: "left" }),
                React.createElement(SocialButton, { href: "mailto:example@mail.com", icon: React.createElement("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" })), className: "from-blue-500/90 to-blue-600/90 hover:shadow-blue-500/50", title: "\u5BC4\u9001\u90F5\u4EF6\u7D66\u6211", titleDisplay: "always", titlePosition: "top" })),
            React.createElement("div", { className: "relative z-10 flex flex-col items-center justify-center h-full gap-4" },
                React.createElement("h1", { className: "text-4xl font-bold text-slate-800" }, "\u81EA\u5B9A\u7FA9\u5B50\u5143\u7D20\u793A\u4F8B"),
                React.createElement("button", { onClick: function () { return setIsOpen(!isOpen); }, className: "px-4 py-2 bg-blue-500 text-white rounded-md" }, isOpen ? '關閉選單' : '開啟選單'))));
    }
};
