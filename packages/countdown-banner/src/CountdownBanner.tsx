import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { cn } from './utils';

export type LanguageType = 'zh' | 'en';
export type ThemeMode = 'light' | 'dark';

// 語言包
const translations = {
    zh: {
        days: '天',
        hours: '時',
        minutes: '分',
        seconds: '秒',
        originalPrice: '原價',
        discountedPrice: '優惠價'
    },
    en: {
        days: 'Days',
        hours: 'Hrs',
        minutes: 'Min',
        seconds: 'Sec',
        originalPrice: 'Original Price',
        discountedPrice: 'Sale Price'
    }
};

export interface CountdownBannerProps {
    title?: string;
    subtitle?: string;
    discount?: string;
    originalPrice?: string;
    discountedPrice?: string;
    endDate?: Date | string;
    ctaText?: string;
    onCtaClick?: () => void;
    theme?: 'orange' | 'violet' | 'cyan' | 'gradient' | 'dark';
    className?: string;
    style?: React.CSSProperties;
    showParticles?: boolean;
    layout?: 'default' | 'spacious' | 'modern';
    variant?: 'card' | 'banner' | 'floating';
    language?: LanguageType;
    mode?: ThemeMode;
}

type TimeUnit = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

type Particle = {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    speed: number;
    opacity: number;
};

export const CountdownBanner: React.FC<CountdownBannerProps> = ({
    title = '限時優惠活動',
    subtitle = '倒數結束，錯過不再',
    discount = '40% OFF',
    originalPrice = '42,000 NTD',
    discountedPrice = '25,200 NTD',
    endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 預設一週後結束
    ctaText = '立即查看優惠',
    onCtaClick = () => { },
    theme = 'gradient',
    className,
    style,
    showParticles = true,
    layout = 'modern',
    variant = 'card',
    language = 'zh',
    mode = 'dark'
}) => {
    const [timeLeft, setTimeLeft] = useState<TimeUnit>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [glowPulse, setGlowPulse] = useState(false);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.3 });

    // 取得目前語言的文字
    const t = translations[language];

    // 每秒更新倒數計時
    useEffect(() => {
        const calculateTimeLeft = () => {
            const endDateTime = new Date(endDate).getTime();
            const now = new Date().getTime();
            const difference = endDateTime - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    // 光暈脈動效果
    useEffect(() => {
        const pulseTimer = setInterval(() => {
            setGlowPulse(prev => !prev);
        }, 2000);

        return () => clearInterval(pulseTimer);
    }, []);

    // 粒子效果
    useEffect(() => {
        if (!showParticles) return;

        // 初始化粒子
        const initParticles = () => {
            const newParticles: Particle[] = [];
            const colors = theme === 'orange'
                ? ['#FF8A00', '#FF5E00', '#FFB800', '#FFD700']
                : theme === 'violet'
                    ? ['#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD']
                    : theme === 'cyan'
                        ? ['#06B6D4', '#0891B2', '#22D3EE', '#67E8F9']
                        : theme === 'dark'
                            ? ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']
                            : ['#FF8A00', '#8B5CF6', '#06B6D4', '#FFD700'];

            for (let i = 0; i < 20; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 6 + 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    speed: Math.random() * 0.5 + 0.2,
                    opacity: Math.random() * 0.6 + 0.2,
                });
            }
            setParticles(newParticles);
        };

        initParticles();

        // 更新粒子位置
        const particleInterval = setInterval(() => {
            setParticles(prevParticles =>
                prevParticles.map(particle => ({
                    ...particle,
                    y: particle.y - particle.speed,
                    x: particle.x + (Math.random() * 0.6 - 0.3),
                    opacity: particle.y < 15
                        ? particle.opacity - 0.02
                        : particle.opacity,
                    // 當粒子到頂部或變透明時重設
                    ...(particle.y < 0 || particle.opacity <= 0
                        ? {
                            y: 100 + Math.random() * 20,
                            opacity: Math.random() * 0.6 + 0.2,
                            x: Math.random() * 100,
                        }
                        : {})
                }))
            );
        }, 50);

        return () => clearInterval(particleInterval);
    }, [showParticles, theme]);

    // 定义暗色和浅色主题模式的主题类
    const darkThemeClasses = {
        orange: {
            banner: 'bg-gradient-to-b from-gray-950 to-gray-900',
            title: 'text-orange-400',
            discount: 'text-orange-400',
            timeBox: 'bg-gray-800 text-white',
            timeBoxShadow: 'shadow-lg shadow-orange-500/20',
            timeSeparator: 'text-gray-400',
            cta: 'bg-orange-500 hover:bg-orange-600 text-white',
            ctaShadow: 'shadow-lg shadow-orange-500/30',
            glow: 'from-orange-500/10 via-orange-400/5 to-transparent',
            border: 'border-orange-900/50',
            icon: 'text-orange-400',
            text: 'text-gray-300',
            subtitleText: 'text-gray-300',
            originalPriceText: 'text-gray-400',
            discountedPriceText: 'text-gray-100',
        },
        violet: {
            banner: 'bg-gradient-to-b from-gray-950 to-gray-900',
            title: 'text-violet-400',
            discount: 'text-violet-400',
            timeBox: 'bg-gray-800 text-white',
            timeBoxShadow: 'shadow-lg shadow-violet-500/20',
            timeSeparator: 'text-gray-400',
            cta: 'bg-violet-500 hover:bg-violet-600 text-white',
            ctaShadow: 'shadow-lg shadow-violet-500/30',
            glow: 'from-violet-500/10 via-violet-400/5 to-transparent',
            border: 'border-violet-900/50',
            icon: 'text-violet-400',
            text: 'text-gray-300',
            subtitleText: 'text-gray-300',
            originalPriceText: 'text-gray-400',
            discountedPriceText: 'text-gray-100',
        },
        cyan: {
            banner: 'bg-gradient-to-b from-gray-950 to-gray-900',
            title: 'text-cyan-400',
            discount: 'text-cyan-400',
            timeBox: 'bg-gray-800 text-white',
            timeBoxShadow: 'shadow-lg shadow-cyan-500/20',
            timeSeparator: 'text-gray-400',
            cta: 'bg-cyan-500 hover:bg-cyan-600 text-white',
            ctaShadow: 'shadow-lg shadow-cyan-500/30',
            glow: 'from-cyan-500/10 via-cyan-400/5 to-transparent',
            border: 'border-cyan-900/50',
            icon: 'text-cyan-400',
            text: 'text-gray-300',
            subtitleText: 'text-gray-300',
            originalPriceText: 'text-gray-400',
            discountedPriceText: 'text-gray-100',
        },
        gradient: {
            banner: 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950',
            title: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500',
            discount: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600',
            timeBox: 'bg-gray-800/80 backdrop-blur-sm text-white',
            timeBoxShadow: 'shadow-lg shadow-pink-500/20',
            timeSeparator: 'text-gray-400',
            cta: 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-90 text-white',
            ctaShadow: 'shadow-lg shadow-pink-500/30',
            glow: 'from-pink-500/10 via-purple-400/5 to-transparent',
            border: 'border-pink-900/50',
            icon: 'text-pink-400',
            text: 'text-gray-300',
            subtitleText: 'text-gray-300',
            originalPriceText: 'text-gray-400',
            discountedPriceText: 'text-gray-100',
        },
        dark: {
            banner: 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900',
            title: 'text-blue-400',
            discount: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400',
            timeBox: 'bg-gray-800/80 backdrop-blur-sm text-white',
            timeBoxShadow: 'shadow-lg shadow-blue-500/20',
            timeSeparator: 'text-gray-400',
            cta: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white',
            ctaShadow: 'shadow-lg shadow-blue-500/30',
            glow: 'from-blue-500/10 via-blue-400/5 to-transparent',
            border: 'border-blue-900/50',
            icon: 'text-blue-400',
            text: 'text-gray-300',
            subtitleText: 'text-gray-300',
            originalPriceText: 'text-gray-400',
            discountedPriceText: 'text-gray-100',
        }
    };

    const lightThemeClasses = {
        orange: {
            banner: 'bg-gradient-to-b from-white to-orange-50',
            title: 'text-orange-600',
            discount: 'text-orange-600',
            timeBox: 'bg-white text-gray-800 border border-orange-200',
            timeBoxShadow: 'shadow-lg shadow-orange-200/30',
            timeSeparator: 'text-orange-300',
            cta: 'bg-orange-500 hover:bg-orange-600 text-white',
            ctaShadow: 'shadow-lg shadow-orange-300/30',
            glow: 'from-orange-300/10 via-orange-200/5 to-transparent',
            border: 'border-orange-200',
            icon: 'text-orange-500',
            text: 'text-gray-700',
            subtitleText: 'text-gray-600',
            originalPriceText: 'text-gray-500',
            discountedPriceText: 'text-gray-800',
        },
        violet: {
            banner: 'bg-gradient-to-b from-white to-violet-50',
            title: 'text-violet-600',
            discount: 'text-violet-600',
            timeBox: 'bg-white text-gray-800 border border-violet-200',
            timeBoxShadow: 'shadow-lg shadow-violet-200/30',
            timeSeparator: 'text-violet-300',
            cta: 'bg-violet-500 hover:bg-violet-600 text-white',
            ctaShadow: 'shadow-lg shadow-violet-300/30',
            glow: 'from-violet-300/10 via-violet-200/5 to-transparent',
            border: 'border-violet-200',
            icon: 'text-violet-500',
            text: 'text-gray-700',
            subtitleText: 'text-gray-600',
            originalPriceText: 'text-gray-500',
            discountedPriceText: 'text-gray-800',
        },
        cyan: {
            banner: 'bg-gradient-to-b from-white to-cyan-50',
            title: 'text-cyan-600',
            discount: 'text-cyan-600',
            timeBox: 'bg-white text-gray-800 border border-cyan-200',
            timeBoxShadow: 'shadow-lg shadow-cyan-200/30',
            timeSeparator: 'text-cyan-300',
            cta: 'bg-cyan-500 hover:bg-cyan-600 text-white',
            ctaShadow: 'shadow-lg shadow-cyan-300/30',
            glow: 'from-cyan-300/10 via-cyan-200/5 to-transparent',
            border: 'border-cyan-200',
            icon: 'text-cyan-500',
            text: 'text-gray-700',
            subtitleText: 'text-gray-600',
            originalPriceText: 'text-gray-500',
            discountedPriceText: 'text-gray-800',
        },
        gradient: {
            banner: 'bg-gradient-to-br from-white via-purple-50 to-pink-50',
            title: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600',
            discount: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600',
            timeBox: 'bg-white/90 backdrop-blur-sm text-gray-800 border border-pink-100',
            timeBoxShadow: 'shadow-lg shadow-pink-200/30',
            timeSeparator: 'text-pink-300',
            cta: 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-90 text-white',
            ctaShadow: 'shadow-lg shadow-pink-300/30',
            glow: 'from-pink-300/10 via-purple-200/5 to-transparent',
            border: 'border-pink-200',
            icon: 'text-pink-500',
            text: 'text-gray-700',
            subtitleText: 'text-gray-600',
            originalPriceText: 'text-gray-500',
            discountedPriceText: 'text-gray-800',
        },
        dark: {
            banner: 'bg-gradient-to-br from-white via-blue-50 to-slate-50',
            title: 'text-blue-600',
            discount: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500',
            timeBox: 'bg-white/90 backdrop-blur-sm text-gray-800 border border-blue-100',
            timeBoxShadow: 'shadow-lg shadow-blue-200/30',
            timeSeparator: 'text-blue-300',
            cta: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
            ctaShadow: 'shadow-lg shadow-blue-300/30',
            glow: 'from-blue-300/10 via-blue-200/5 to-transparent',
            border: 'border-blue-200',
            icon: 'text-blue-500',
            text: 'text-gray-700',
            subtitleText: 'text-gray-600',
            originalPriceText: 'text-gray-500',
            discountedPriceText: 'text-gray-800',
        }
    };

    // 根据当前模式选择对应的主题类
    const themeClasses = mode === 'dark' ? darkThemeClasses : lightThemeClasses;
    const selectedTheme = themeClasses[theme];

    const padWithZero = (num: number): string => {
        return num.toString().padStart(2, '0');
    };

    // 倒數格子樣式的動態類名
    const getTimeBoxClass = () => {
        const isModern = layout === 'modern';
        const isSpacious = layout === 'spacious' || layout === 'modern';

        // 根据主题模式和布局选择不同的样式
        let modernBaseClasses;
        if (mode === 'dark') {
            // 深色主题的现代风格
            if (layout === 'modern') {
                modernBaseClasses = "backdrop-blur-xl bg-gradient-to-b from-white/[0.12] to-white/[0.05] rounded-[1.2rem] border border-white/15 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]";
            } else {
                modernBaseClasses = "backdrop-blur-lg bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-[0_8px_16px_rgba(0,0,0,0.4)]";
            }
        } else {
            // 浅色主题的现代风格
            if (layout === 'modern') {
                modernBaseClasses = "backdrop-blur-xl bg-gradient-to-b from-white/95 to-gray-50/95 rounded-[1.2rem] border border-gray-200 shadow-[0_10px_25px_-15px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)]";
            } else {
                modernBaseClasses = "backdrop-blur-lg bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-gray-200 shadow-[0_8px_20px_rgba(0,0,0,0.08)]";
            }
        }

        // 根據不同的佈局返回不同的基礎類
        const baseClasses = cn(
            isModern ? modernBaseClasses : '',
            isSpacious ? 'w-[4.5rem] h-[4.5rem] md:w-[6rem] md:h-[6rem]' : 'w-[4rem] h-[4rem] sm:w-[4.5rem] sm:h-[4.5rem]',
            !isModern ? 'rounded-xl' : '',
            'flex items-center justify-center relative overflow-hidden',
            !isModern ? selectedTheme.timeBox : '',
            selectedTheme.timeBoxShadow
        );

        return baseClasses;
    };

    // 根據佈局設定返回不同的容器尺寸和樣式
    const getContainerClasses = () => {
        if (layout === 'modern') {
            return cn(
                variant === 'card' ? 'w-full max-w-4xl p-10 sm:p-12 rounded-3xl' :
                    variant === 'banner' ? 'w-full p-8 sm:p-10 rounded-xl' :
                        'w-full max-w-4xl p-10 sm:p-12 rounded-3xl'
            );
        }

        return layout === 'spacious'
            ? 'w-full max-w-4xl p-8 sm:p-10 rounded-xl'
            : 'w-full max-w-3xl p-6 rounded-xl';
    };

    // 根據佈局設定返回不同的時間數字尺寸
    const getTimeDigitClass = () => {
        // 现代布局下的数字样式
        if (layout === 'modern') {
            // 根据模式选择不同的渐变色或纯色
            if (mode === 'dark') {
                return 'text-3xl md:text-4xl font-bold bg-gradient-to-br from-white via-gray-100 to-gray-300 text-transparent bg-clip-text drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]';
            } else {
                // 浅色模式使用纯黑色文字
                return 'text-3xl md:text-4xl font-bold text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]';
            }
        }

        // 宽敞布局下的数字样式
        if (layout === 'spacious') {
            return cn('text-3xl md:text-4xl font-bold drop-shadow-sm',
                mode === 'dark' ? 'text-white' : 'text-gray-900');
        }

        // 默认布局下的数字样式
        return cn('text-2xl sm:text-3xl font-bold drop-shadow-sm',
            mode === 'dark' ? 'text-white' : 'text-gray-900');
    };

    // 用于时间盒子内部效果的函数
    const getTimeBoxInnerEffectClass = () => {
        if (mode === 'dark') {
            if (layout === 'modern') {
                // 深色主题现代布局内部效果
                return "bg-gradient-to-b from-white/[0.08] via-transparent to-transparent";
            }
            // 深色主题其他布局内部效果
            return "bg-gradient-to-b from-white/[0.15] via-white/[0.05] to-transparent";
        } else {
            if (layout === 'modern') {
                // 浅色主题现代布局内部效果
                return "bg-gradient-to-b from-white/80 via-white/40 to-transparent";
            }
            // 浅色主题其他布局内部效果
            return "bg-gradient-to-b from-white/90 via-white/60 to-transparent";
        }
    };

    // 根据主题和布局获取时间单位分隔符样式
    const getTimeSpacerClass = () => {
        if (layout === 'modern') {
            return cn(
                'text-4xl font-light mx-1 sm:mx-2',
                mode === 'dark' ? 'text-gray-400/70' : 'text-gray-400'
            );
        }

        return layout === 'spacious'
            ? cn('text-4xl font-light mx-1 sm:mx-3', mode === 'dark' ? 'text-gray-400' : 'text-gray-400')
            : cn('text-3xl font-bold', mode === 'dark' ? 'text-gray-400' : 'text-gray-400');
    };

    // 取得現代化變體的背景效果
    const getModernBackgroundClass = () => {
        if (layout !== 'modern') return '';

        return mode === 'dark'
            ? 'bg-gradient-to-br from-black to-gray-900 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.08)]';
    };

    // 各種動畫變體
    const containerAnimation = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    };

    const childAnimation = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    const timeContainerAnimation = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const timeItemAnimation = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 20
            }
        },
        hover: {
            scale: 1.05,
            boxShadow: mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 15
            }
        }
    };

    // 生成時間單位標籤的類名，針對不同語言調整樣式
    const getTimeUnitLabelClass = () => {
        const baseClass = mode === 'dark' ? "text-gray-400 text-sm mt-2" : "text-gray-500 text-sm mt-2";
        // 英文單位標籤較長，特別是在較小螢幕上，需要微調
        return language === 'en'
            ? cn(baseClass, "text-[11px] sm:text-xs whitespace-nowrap")
            : baseClass;
    };

    return (
        <motion.div
            ref={ref}
            className={cn(
                getContainerClasses(),
                getModernBackgroundClass(),
                'border relative overflow-hidden backdrop-blur-md',
                selectedTheme.banner,
                selectedTheme.border,
                variant === 'floating' && 'sticky bottom-4 mx-auto',
                className
            )}
            style={style}
            variants={containerAnimation}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 背景光暈效果 */}
            <div className={cn(
                'absolute top-0 left-0 w-full h-full',
                'bg-gradient-radial opacity-30',
                selectedTheme.glow,
                glowPulse ? 'scale-110' : 'scale-100',
                'transition-all duration-2000 ease-in-out'
            )} />

            {/* 粒子效果 */}
            {showParticles && (
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="absolute rounded-full"
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                backgroundColor: particle.color,
                                opacity: particle.opacity,
                            }}
                            transition={{ duration: 0.2 }}
                        />
                    ))}
                </div>
            )}

            {/* 主要內容 */}
            <div className="flex flex-col items-center justify-center relative z-10 text-center">
                <motion.div
                    variants={childAnimation}
                    className="flex items-center justify-center mb-5"
                >
                    <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="mr-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", selectedTheme.icon)} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z" />
                        </svg>
                    </motion.div>
                    <h2 className={cn('text-xl md:text-2xl font-bold', selectedTheme.title)}>
                        {layout === 'modern' ? (
                            <span className="tracking-wide">{title}</span>
                        ) : title}
                    </h2>
                </motion.div>

                <motion.div
                    variants={childAnimation}
                    className="flex items-center justify-center mb-6"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-5 w-5 mr-2", selectedTheme.icon, "opacity-70", isHovering ? 'animate-pulse' : '')} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
                    </svg>
                    <p className={cn("text-sm md:text-base", selectedTheme.subtitleText)}>{subtitle}</p>
                </motion.div>

                <motion.div
                    variants={childAnimation}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="mb-6"
                >
                    <h1 className={cn(
                        'text-5xl md:text-6xl font-bold',
                        selectedTheme.discount,
                        layout === 'modern' && 'tracking-wide'
                    )}>
                        {discount}
                    </h1>
                </motion.div>

                <motion.div
                    variants={childAnimation}
                    className="flex flex-col items-center mb-8"
                >
                    <p className={cn("line-through mb-2", selectedTheme.originalPriceText)}>{t.originalPrice} {originalPrice}</p>
                    <motion.p
                        className={cn("text-2xl md:text-3xl font-bold", selectedTheme.discountedPriceText, layout === 'modern' && "tracking-wide")}
                        animate={{ scale: glowPulse ? 1.05 : 1 }}
                        transition={{ duration: 1.5 }}
                    >
                        {t.discountedPrice} {discountedPrice}
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={timeContainerAnimation}
                    className="flex items-center justify-center mb-10 relative"
                >
                    <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
                        {/* 天數 */}
                        <motion.div
                            variants={timeItemAnimation}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                className={getTimeBoxClass()}
                                whileHover="hover"
                                variants={timeItemAnimation}
                            >
                                <AnimatePresence mode="popLayout">
                                    <motion.span
                                        key={`days-${timeLeft.days}`}
                                        className={getTimeDigitClass()}
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {padWithZero(timeLeft.days)}
                                    </motion.span>
                                </AnimatePresence>
                                <motion.div
                                    className={cn(
                                        "absolute inset-0 pointer-events-none",
                                        getTimeBoxInnerEffectClass()
                                    )}
                                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                {/* 底部阴影效果 */}
                                <motion.div
                                    className={cn(
                                        "absolute inset-x-0 bottom-0 h-1/3 pointer-events-none bg-gradient-to-t",
                                        mode === 'dark'
                                            ? "from-black/20 to-transparent"
                                            : "from-black/[0.03] to-transparent"
                                    )}
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                            <span className={getTimeUnitLabelClass()}>{t.days}</span>
                        </motion.div>

                        <span className={getTimeSpacerClass()}>·</span>

                        {/* 小時 */}
                        <motion.div
                            variants={timeItemAnimation}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                className={getTimeBoxClass()}
                                whileHover="hover"
                                variants={timeItemAnimation}
                            >
                                <AnimatePresence mode="popLayout">
                                    <motion.span
                                        key={`hours-${timeLeft.hours}`}
                                        className={getTimeDigitClass()}
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {padWithZero(timeLeft.hours)}
                                    </motion.span>
                                </AnimatePresence>
                                <motion.div
                                    className={cn(
                                        "absolute inset-0 pointer-events-none",
                                        getTimeBoxInnerEffectClass()
                                    )}
                                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                {/* 底部阴影效果 */}
                                <motion.div
                                    className={cn(
                                        "absolute inset-x-0 bottom-0 h-1/3 pointer-events-none bg-gradient-to-t",
                                        mode === 'dark'
                                            ? "from-black/20 to-transparent"
                                            : "from-black/[0.03] to-transparent"
                                    )}
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                            <span className={getTimeUnitLabelClass()}>{t.hours}</span>
                        </motion.div>

                        <span className={getTimeSpacerClass()}>·</span>

                        {/* 分鐘 */}
                        <motion.div
                            variants={timeItemAnimation}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                className={getTimeBoxClass()}
                                whileHover="hover"
                                variants={timeItemAnimation}
                            >
                                <AnimatePresence mode="popLayout">
                                    <motion.span
                                        key={`minutes-${timeLeft.minutes}`}
                                        className={getTimeDigitClass()}
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {padWithZero(timeLeft.minutes)}
                                    </motion.span>
                                </AnimatePresence>
                                <motion.div
                                    className={cn(
                                        "absolute inset-0 pointer-events-none",
                                        getTimeBoxInnerEffectClass()
                                    )}
                                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                {/* 底部阴影效果 */}
                                <motion.div
                                    className={cn(
                                        "absolute inset-x-0 bottom-0 h-1/3 pointer-events-none bg-gradient-to-t",
                                        mode === 'dark'
                                            ? "from-black/20 to-transparent"
                                            : "from-black/[0.03] to-transparent"
                                    )}
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                            <span className={getTimeUnitLabelClass()}>{t.minutes}</span>
                        </motion.div>

                        <span className={getTimeSpacerClass()}>·</span>

                        {/* 秒數 */}
                        <motion.div
                            variants={timeItemAnimation}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                className={getTimeBoxClass()}
                                whileHover="hover"
                                variants={timeItemAnimation}
                            >
                                <AnimatePresence mode="popLayout">
                                    <motion.span
                                        key={`seconds-${timeLeft.seconds}`}
                                        className={getTimeDigitClass()}
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {padWithZero(timeLeft.seconds)}
                                    </motion.span>
                                </AnimatePresence>
                                <motion.div
                                    className={cn(
                                        "absolute inset-0 pointer-events-none",
                                        getTimeBoxInnerEffectClass()
                                    )}
                                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                {/* 底部阴影效果 */}
                                <motion.div
                                    className={cn(
                                        "absolute inset-x-0 bottom-0 h-1/3 pointer-events-none bg-gradient-to-t",
                                        mode === 'dark'
                                            ? "from-black/20 to-transparent"
                                            : "from-black/[0.03] to-transparent"
                                    )}
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                            <span className={getTimeUnitLabelClass()}>{t.seconds}</span>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    variants={childAnimation}
                    className={cn(
                        'flex justify-center',
                        layout === 'modern' && 'relative'
                    )}
                >
                    {layout === 'modern' && (
                        <motion.div
                            className={cn(
                                "absolute -inset-3 rounded-full blur-xl opacity-70",
                                mode === 'dark'
                                    ? "bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20"
                                    : "bg-gradient-to-r from-purple-300/30 via-pink-300/30 to-orange-300/30"
                            )}
                            animate={{
                                opacity: [0.5, 0.7, 0.5],
                                scale: [0.95, 1.05, 0.95]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                repeatType: "mirror"
                            }}
                        />
                    )}
                    <motion.button
                        className={cn(
                            'py-4 px-10 sm:px-12 rounded-full text-lg font-bold transition-all w-auto',
                            selectedTheme.cta,
                            selectedTheme.ctaShadow,
                            layout === 'modern' && 'relative z-10',
                            layout === 'modern' && 'tracking-wide'
                        )}
                        onClick={onCtaClick}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 115, 0, 0.5)' }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                            boxShadow: glowPulse
                                ? ['0 4px 12px rgba(255, 115, 0, 0.25)', '0 4px 20px rgba(255, 115, 0, 0.5)', '0 4px 12px rgba(255, 115, 0, 0.25)']
                                : '0 4px 12px rgba(255, 115, 0, 0.25)'
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    >
                        <motion.span
                            className="inline-block"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {ctaText}
                        </motion.span>
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
}; 