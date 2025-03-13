import { Theme, ThemeConfig } from './types';

export const defaultThemes: Record<Theme, ThemeConfig> = {
    light: {
        container: `
            bg-slate-200/80
            border-slate-200
            group-hover:border-slate-300
            group-hover:shadow-[0_0_15px_rgba(241,245,249,0.4)]
        `,
        hover: "bg-slate-100/50",
        text: "text-slate-600",
        image: "brightness-100 contrast-105",
        button: {
            active: "bg-slate-600 text-white shadow-sm",
            inactive: "bg-slate-200/80 text-slate-600 hover:bg-slate-300/80"
        },
        title: "from-slate-400 to-slate-600"
    },
    dark: {
        container: `
            bg-gradient-to-br from-slate-700/40 to-slate-900/60
            border-slate-500/20
            group-hover:border-slate-400/50
            group-hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]
        `,
        hover: "bg-slate-500/10",
        text: "text-slate-200",
        image: "brightness-125 contrast-125",
        button: {
            active: "bg-slate-200 text-slate-800 shadow-sm",
            inactive: "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
        },
        title: "from-slate-300 to-slate-100"
    },
    blue: {
        container: `
            bg-gradient-to-br from-blue-600/20 to-blue-900/40
            border-blue-500/20
            group-hover:border-blue-400/50
            group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
        `,
        hover: "bg-blue-500/10",
        text: "text-white",
        image: "brightness-125 contrast-125",
        button: {
            active: "bg-blue-500 text-white shadow-sm",
            inactive: "bg-blue-400/30 text-white hover:bg-blue-400/40"
        },
        title: "from-blue-200 to-blue-400"
    },
    green: {
        container: `
            bg-gradient-to-br from-emerald-600/20 to-emerald-900/40
            border-emerald-500/20
            group-hover:border-emerald-400/50
            group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]
        `,
        hover: "bg-emerald-500/10",
        text: "text-white",
        image: "brightness-125 contrast-125",
        button: {
            active: "bg-emerald-500 text-white shadow-sm",
            inactive: "bg-emerald-400/30 text-white hover:bg-emerald-400/40"
        },
        title: "from-emerald-200 to-emerald-400"
    },
    purple: {
        container: `
            bg-gradient-to-br from-pink-600/20 to-pink-900/40
            border-pink-500/20
            group-hover:border-pink-400/50
            group-hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]
        `,
        hover: "bg-pink-500/10",
        text: "text-white",
        image: "brightness-125 contrast-125",
        button: {
            active: "bg-pink-500 text-white shadow-sm",
            inactive: "bg-pink-400/30 text-white hover:bg-pink-400/40"
        },
        title: "from-pink-200 to-pink-400"
    }
}; 