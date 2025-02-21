export var defaultThemes = {
    light: {
        container: "\n            bg-slate-200/80\n            border-slate-200\n            group-hover:border-slate-300\n            group-hover:shadow-[0_0_15px_rgba(241,245,249,0.4)]\n        ",
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
        container: "\n            bg-gradient-to-br from-slate-700/20 to-slate-900/40\n            border-slate-500/20\n            group-hover:border-slate-400/50\n            group-hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]\n        ",
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
        container: "\n            bg-gradient-to-br from-blue-600/20 to-blue-900/40\n            border-blue-500/20\n            group-hover:border-blue-400/50\n            group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]\n        ",
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
        container: "\n            bg-gradient-to-br from-emerald-600/20 to-emerald-900/40\n            border-emerald-500/20\n            group-hover:border-emerald-400/50\n            group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]\n        ",
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
        container: "\n            bg-gradient-to-br from-pink-700/70 to-rose-800/80\n            border-pink-500/40\n            group-hover:border-pink-400/60\n            group-hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]\n        ",
        hover: "bg-pink-600/50",
        text: "text-pink-50",
        image: "brightness-125 contrast-125",
        button: {
            active: "bg-pink-400 text-pink-950 shadow-sm",
            inactive: "bg-pink-700/80 text-pink-50 hover:bg-pink-600/80"
        },
        title: "from-pink-300 to-pink-100"
    }
};
