"use client";

import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { cn } from "@/lib/utils";

import { FLIP_PROFILE_CARD_CSS } from "./flip-profile-card-styles";

/* ---------- 資料形狀（同 CardFlow ProfileForm） ---------- */

export interface ProfileCardData {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  skills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export interface CardFace {
  /** Tailwind 漸層類別，或 glassmorphism-front / glassmorphism-back */
  gradient: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface CardTheme {
  front: CardFace;
  back: CardFace;
}

export type LightEffect = "none" | "dynamic" | "diagonal" | "center" | "top" | "dual" | "gradient";

/* ---------- 主題（2025 流行配色，色值照原檔） ---------- */

export const cardThemes = {
  classic: {
    name: "Classic Violet",
    description: "The classic purple to blue gradient",
    front: { gradient: "from-purple-600 via-blue-600 to-indigo-700", primary: "purple-600", secondary: "blue-600", accent: "indigo-700" },
    back: { gradient: "from-pink-500 via-red-500 to-orange-500", primary: "pink-500", secondary: "red-500", accent: "orange-500" },
  },
  peachFuzz: {
    name: "Peach Fuzz",
    description: "2025 trend colour, warm and cosy",
    front: { gradient: "from-orange-300 via-pink-300 to-rose-400", primary: "orange-300", secondary: "pink-300", accent: "rose-400" },
    back: { gradient: "from-amber-400 via-yellow-400 to-orange-500", primary: "amber-400", secondary: "yellow-400", accent: "orange-500" },
  },
  cobaltBlue: {
    name: "Cobalt Blue",
    description: "Cool, bright cobalt tones",
    front: { gradient: "from-blue-600 via-indigo-700 to-purple-800", primary: "blue-600", secondary: "indigo-700", accent: "purple-800" },
    back: { gradient: "from-cyan-500 via-blue-600 to-indigo-700", primary: "cyan-500", secondary: "blue-600", accent: "indigo-700" },
  },
  monochrome: {
    name: "Monochrome",
    description: "Timeless black and white",
    front: { gradient: "from-gray-800 via-gray-700 to-gray-900", primary: "gray-800", secondary: "gray-700", accent: "gray-900" },
    back: { gradient: "from-gray-600 via-gray-500 to-gray-700", primary: "gray-600", secondary: "gray-500", accent: "gray-700" },
  },
  softPastels: {
    name: "Soft Pastels",
    description: "Calm, relaxing soft tones",
    front: { gradient: "from-pink-200 via-purple-200 to-indigo-200", primary: "pink-200", secondary: "purple-200", accent: "indigo-200" },
    back: { gradient: "from-green-200 via-blue-200 to-purple-200", primary: "green-200", secondary: "blue-200", accent: "purple-200" },
  },
  sunset: {
    name: "Sunset",
    description: "Warm sunset tones",
    front: { gradient: "from-orange-400 via-pink-500 to-purple-600", primary: "orange-400", secondary: "pink-500", accent: "purple-600" },
    back: { gradient: "from-yellow-400 via-orange-500 to-red-500", primary: "yellow-400", secondary: "orange-500", accent: "red-500" },
  },
  glassmorphism: {
    name: "Glassmorphism",
    description: "2025 trend, translucent frosted glass",
    front: { gradient: "glassmorphism-front", primary: "glassmorphism", secondary: "glassmorphism", accent: "glassmorphism" },
    back: { gradient: "glassmorphism-back", primary: "glassmorphism", secondary: "glassmorphism", accent: "glassmorphism" },
  },
} satisfies Record<string, CardTheme & { name: string; description: string }>;

export type CardThemeKey = keyof typeof cardThemes;

export const lightEffects: Record<LightEffect, { name: string; description: string; icon: string }> = {
  none: { name: "No effect", description: "Hide the light effects", icon: "⚪" },
  dynamic: { name: "Dynamic tracking", description: "Light follows the cursor (default)", icon: "🎯" },
  diagonal: { name: "Diagonal", description: "A light band cast from the top-left corner", icon: "💫" },
  center: { name: "Center light", description: "A light source spreading from the center", icon: "🌟" },
  top: { name: "Top light", description: "Light shining down from the top", icon: "☀️" },
  dual: { name: "Dual light", description: "Two light sources on opposite corners", icon: "💡" },
  gradient: { name: "Gradient light", description: "Multi-colour gradient lighting", icon: "🌈" },
};

/* ---------- 多語系 ---------- */

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

export interface FlipProfileCardLabels {
  namePlaceholder: string;
  titlePlaceholder: string;
  details: string;
  about: string;
  skills: string;
  social: string;
  showBack: string;
  showFront: string;
  avatarAlt: string;
  /** 社群連結裡「網站」的讀屏名稱；GitHub 等品牌名不翻 */
  website: string;
}

const MESSAGES: Record<SunLocale, FlipProfileCardLabels> = {
  en: {
    namePlaceholder: "Your Name",
    titlePlaceholder: "Your Title",
    details: "Details",
    about: "About me",
    skills: "Skills",
    social: "Social links",
    showBack: "Show details",
    showFront: "Show front",
    avatarAlt: "Avatar",
    website: "Website",
  },
  "zh-TW": {
    namePlaceholder: "你的名字",
    titlePlaceholder: "你的職稱",
    details: "詳細資料",
    about: "關於我",
    skills: "技能",
    social: "社群連結",
    showBack: "顯示詳細資料",
    showFront: "顯示正面",
    avatarAlt: "頭像",
    website: "個人網站",
  },
  "zh-CN": {
    namePlaceholder: "你的名字",
    titlePlaceholder: "你的职位",
    details: "详细信息",
    about: "关于我",
    skills: "技能",
    social: "社交链接",
    showBack: "显示详细信息",
    showFront: "显示正面",
    avatarAlt: "头像",
    website: "个人网站",
  },
  ja: {
    namePlaceholder: "お名前",
    titlePlaceholder: "肩書き",
    details: "詳細",
    about: "自己紹介",
    skills: "スキル",
    social: "SNS リンク",
    showBack: "詳細を表示",
    showFront: "表面を表示",
    avatarAlt: "アバター",
    website: "ウェブサイト",
  },
};

type OptionText = { name: string; description: string };

// 選擇器的標題、提示與各選項文字；英文沿用 lightEffects / cardThemes
const PICKER_MESSAGES: Record<
  SunLocale,
  {
    effectHeading: string;
    effectHint: string;
    themeHeading: string;
    themeHint: string;
    effects?: Record<LightEffect, OptionText>;
    themes?: Record<CardThemeKey, OptionText>;
  }
> = {
  en: {
    effectHeading: "Light effect",
    effectHint: "Tip: with “Dynamic tracking” the light follows your mouse for an interactive feel.",
    themeHeading: "Colour theme",
    themeHint: "Tip: picking a theme applies matching gradients to both sides of the card.",
  },
  "zh-TW": {
    effectHeading: "光影效果",
    effectHint: "提示：選擇「動態追蹤」時，光線會跟著滑鼠移動，互動感更強。",
    themeHeading: "配色主題",
    themeHint: "提示：選好主題後，卡片正反兩面都會套用對應的漸層。",
    effects: {
      none: { name: "無效果", description: "隱藏光影效果" },
      dynamic: { name: "動態追蹤", description: "光線跟著游標移動（預設）" },
      diagonal: { name: "斜角光", description: "從左上角投下的一道光帶" },
      center: { name: "中心光", description: "從中央向外擴散的光源" },
      top: { name: "頂光", description: "從上方灑下的光線" },
      dual: { name: "雙光源", description: "對角兩側各一個光源" },
      gradient: { name: "漸層光", description: "多彩的漸層光影" },
    },
    themes: {
      classic: { name: "經典紫羅蘭", description: "經典的紫到藍漸層" },
      peachFuzz: { name: "柔和桃", description: "2025 流行色，溫暖舒適" },
      cobaltBlue: { name: "鈷藍", description: "清爽明亮的鈷藍色調" },
      monochrome: { name: "黑白", description: "經典不敗的黑與白" },
      softPastels: { name: "柔和粉彩", description: "平靜放鬆的柔和色調" },
      sunset: { name: "夕陽", description: "溫暖的夕陽色調" },
      glassmorphism: { name: "毛玻璃", description: "2025 流行，半透明霧面玻璃" },
    },
  },
  "zh-CN": {
    effectHeading: "光影效果",
    effectHint: "提示：选择“动态追踪”时，光线会跟随鼠标移动，互动感更强。",
    themeHeading: "配色主题",
    themeHint: "提示：选好主题后，卡片正反两面都会应用对应的渐变。",
    effects: {
      none: { name: "无效果", description: "隐藏光影效果" },
      dynamic: { name: "动态追踪", description: "光线跟随光标移动（默认）" },
      diagonal: { name: "斜角光", description: "从左上角投下的一道光带" },
      center: { name: "中心光", description: "从中央向外扩散的光源" },
      top: { name: "顶光", description: "从上方洒下的光线" },
      dual: { name: "双光源", description: "对角两侧各一个光源" },
      gradient: { name: "渐变光", description: "多彩的渐变光影" },
    },
    themes: {
      classic: { name: "经典紫罗兰", description: "经典的紫到蓝渐变" },
      peachFuzz: { name: "柔和桃", description: "2025 流行色，温暖舒适" },
      cobaltBlue: { name: "钴蓝", description: "清爽明亮的钴蓝色调" },
      monochrome: { name: "黑白", description: "经典永不过时的黑与白" },
      softPastels: { name: "柔和马卡龙", description: "平静放松的柔和色调" },
      sunset: { name: "日落", description: "温暖的日落色调" },
      glassmorphism: { name: "毛玻璃", description: "2025 流行，半透明磨砂玻璃" },
    },
  },
  ja: {
    effectHeading: "ライト効果",
    effectHint: "ヒント：「ダイナミック追従」を選ぶと、光がマウスに合わせて動きます。",
    themeHeading: "カラーテーマ",
    themeHint: "ヒント：テーマを選ぶと、カードの表と裏に対応するグラデーションが適用されます。",
    effects: {
      none: { name: "なし", description: "ライト効果を表示しない" },
      dynamic: { name: "ダイナミック追従", description: "光がカーソルを追う（デフォルト）" },
      diagonal: { name: "斜光", description: "左上から差し込む光の帯" },
      center: { name: "センターライト", description: "中央から広がる光源" },
      top: { name: "トップライト", description: "上から降り注ぐ光" },
      dual: { name: "デュアルライト", description: "対角に置いた二つの光源" },
      gradient: { name: "グラデーションライト", description: "多色のグラデーション照明" },
    },
    themes: {
      classic: { name: "クラシックバイオレット", description: "定番の紫から青へのグラデーション" },
      peachFuzz: { name: "ピーチファズ", description: "2025 年のトレンド色、温かく心地よい" },
      cobaltBlue: { name: "コバルトブルー", description: "涼しげで明るいコバルトの色調" },
      monochrome: { name: "モノクローム", description: "色あせない白と黒" },
      softPastels: { name: "ソフトパステル", description: "穏やかでくつろげる淡い色調" },
      sunset: { name: "サンセット", description: "温かな夕焼けの色調" },
      glassmorphism: { name: "グラスモーフィズム", description: "2025 年のトレンド、半透明のすりガラス" },
    },
  },
};

function Styles() {
  // React 19 依 href 去重並提升到 head
  return (
    <style href="sunui-flip-profile-card" precedence="default">
      {FLIP_PROFILE_CARD_CSS}
    </style>
  );
}

function effectClasses(effect: LightEffect) {
  switch (effect) {
    case "none":
      return "";
    case "diagonal":
      return "fpc-light-diagonal fpc-multi-shadow";
    case "center":
      return "fpc-light-center fpc-multi-shadow";
    case "top":
      return "fpc-light-top fpc-multi-shadow";
    case "dual":
      return "fpc-light-dual fpc-multi-shadow";
    case "gradient":
      return "fpc-light-gradient fpc-multi-shadow";
    default:
      return "fpc-light-tracker fpc-edge-glow fpc-reflection fpc-multi-shadow";
  }
}

/* ---------- 卡片 ---------- */

export interface FlipProfileCardProps {
  data: ProfileCardData;
  /** 預設 classic */
  theme?: CardTheme;
  /** 預設 dynamic */
  lightEffect?: LightEffect;
  defaultFlipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  /** 陰影光暈色，"r, g, b"，預設 102, 126, 234（#667eea） */
  glowColor?: string;
  className?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<FlipProfileCardLabels>;
}

// 原版卡片固定 w-80 h-96，中心光以此換算像素
const BASE_SIZE = { w: 320, h: 384 };

export function FlipProfileCard({
  data,
  theme = cardThemes.classic,
  lightEffect = "dynamic",
  defaultFlipped = false,
  onFlippedChange,
  glowColor = "102, 126, 234",
  className,
  locale = "en",
  labels,
}: FlipProfileCardProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [finePointer, setFinePointer] = useState(false);

  const [isFlipped, setIsFlipped] = useState(defaultFlipped);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(BASE_SIZE);
  const timers = useRef<number[]>([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [lightPosition, setLightPosition] = useState({ x: 50, y: 50 });
  const [lightIntensity, setLightIntensity] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState({ x: 20, y: 20 });
  const [diagonalAngle, setDiagonalAngle] = useState(135);

  const enableDynamicTracking = lightEffect !== "none";
  const adjustedLightIntensity = enableDynamicTracking ? lightIntensity : 0;
  // 減少動態時不傾斜
  const allowTilt = finePointer && !reduce;

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const flip = useCallback(() => {
    if (isFlipping) return;
    const next = !isFlipped;
    onFlippedChange?.(next);
    if (reduce) {
      setTilt({ x: 0, y: 0 });
      setIsFlipped(next);
      return;
    }
    setIsFlipping(true);
    setIsAnimating(true);
    // 翻到一半（500ms）才切換正反面狀態，1s 後恢復傾斜，時序同原版
    timers.current.push(
      window.setTimeout(() => setIsFlipped(next), 500),
      window.setTimeout(() => {
        setIsFlipping(false);
        setIsAnimating(false);
      }, 1000),
    );
  }, [isFlipping, isFlipped, onFlippedChange, reduce]);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || isFlipping || !finePointer) return;
      const rect = cardRef.current.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      const mouseX = e.clientX - (rect.left + rect.width / 2);
      const mouseY = e.clientY - (rect.top + rect.height / 2);

      if (allowTilt) {
        const maxTilt = 20;
        setTilt({ x: (mouseY / (rect.height / 2)) * maxTilt, y: (mouseX / (rect.width / 2)) * -maxTilt });
      }

      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      setLightPosition({ x: px, y: py });
      setHighlightPosition({ x: px, y: py });

      if (enableDynamicTracking) {
        const d = Math.sqrt((mouseX / (rect.width / 2)) ** 2 + (mouseY / (rect.height / 2)) ** 2);
        setLightIntensity(Math.max(0, 1 - d * 0.8));
      }

      if (lightEffect === "diagonal" || lightEffect === "gradient") {
        const angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
        const normalized = angle < 0 ? angle + 360 : angle;
        setDiagonalAngle(lightEffect === "diagonal" ? normalized + 180 : normalized + 45);
      }
    },
    [isFlipping, finePointer, allowTilt, enableDynamicTracking, lightEffect],
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    if (enableDynamicTracking) {
      setLightIntensity(0);
      setLightPosition({ x: 50, y: 50 });
      setHighlightPosition({ x: 20, y: 20 });
      if (lightEffect === "diagonal") setDiagonalAngle(135);
      else if (lightEffect === "gradient") setDiagonalAngle(45);
    }
  }, [enableDynamicTracking, lightEffect]);

  const flipDeg = isFlipped ? 180 : 0;
  const transformStyle: CSSProperties = {
    transform: isFlipping
      ? `perspective(1000px) rotateY(${flipDeg}deg)`
      : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y + flipDeg}deg)`,
    transition: reduce ? "none" : isAnimating ? "transform 1s ease-in-out" : "transform 0.1s ease-out",
  };

  const boost = (base: number) => Math.max(base, base + lightIntensity * (1 - base));
  const faceStyle = {
    boxShadow: `0 ${Math.abs(tilt.x) * 3 + 15}px ${Math.abs(tilt.x) * 4 + 25}px rgba(0, 0, 0, 0.2),
      0 ${Math.abs(tilt.y) * 3 + 8}px ${Math.abs(tilt.y) * 5 + 18}px rgba(0, 0, 0, 0.15),
      ${tilt.y * 0.8}px ${tilt.x * 0.5}px ${Math.abs(tilt.x) + Math.abs(tilt.y) + 15}px rgba(${glowColor}, 0.4)`,
    "--light-x": `${lightPosition.x}%`,
    "--light-y": `${lightPosition.y}%`,
    "--light-intensity": adjustedLightIntensity,
    "--edge-glow-intensity": adjustedLightIntensity * 0.8,
    "--reflection-opacity": 0.6 + adjustedLightIntensity * 0.2,
    "--reflection-offset": tilt.y * 0.5,
    "--highlight-x": `${highlightPosition.x}%`,
    "--highlight-y": `${highlightPosition.y}%`,
    "--highlight-opacity": adjustedLightIntensity * 0.6,
    "--diagonal-angle": `${diagonalAngle}deg`,
    "--diagonal-x": `${lightPosition.x}%`,
    "--diagonal-y": `${lightPosition.y}%`,
    "--diagonal-start": `${Math.max(0, Math.min(70, lightPosition.x * 0.7))}%`,
    "--diagonal-intensity": lightEffect === "diagonal" ? 0.4 + lightIntensity * 0.6 : 0.7,
    "--center-x": `${lightPosition.x}%`,
    "--center-y": `${lightPosition.y}%`,
    "--center-intensity": lightEffect === "center" ? boost(0.4) : 0.6,
    "--top-x": `${lightPosition.x}%`,
    "--top-intensity": lightEffect === "top" ? boost(0.4) : 0.7,
    "--dual-x1": `${lightPosition.x}%`,
    "--dual-y1": `${lightPosition.y}%`,
    "--dual-x2": `${100 - lightPosition.x}%`,
    "--dual-y2": `${100 - lightPosition.y}%`,
    "--dual-intensity": lightEffect === "dual" ? boost(0.4) : 0.7,
    "--gradient-angle": `${diagonalAngle}deg`,
    "--gradient-x": `${lightPosition.x}%`,
    "--gradient-y": `${lightPosition.y}%`,
    "--gradient-intensity": lightEffect === "gradient" ? boost(0.3) : 0.6,
  } as CSSProperties;

  // 頂部光與中心光用獨立元素，避免和偽元素衝突
  const lightLayers = (
    <>
      {lightEffect === "top" && (
        <div className="fpc-top-light" style={{ "--top-x": `${lightPosition.x}%`, "--top-intensity": boost(0.4) } as CSSProperties} />
      )}
      {lightEffect === "center" && (
        <div
          className="fpc-center-light"
          style={
            {
              "--center-x-px": `${(lightPosition.x / 100) * sizeRef.current.w}px`,
              "--center-y-px": `${(lightPosition.y / 100) * sizeRef.current.h}px`,
              "--center-intensity": boost(0.4),
            } as CSSProperties
          }
        />
      )}
    </>
  );

  const frontGlass = theme.front.gradient === "glassmorphism-front";
  const backGlass = theme.back.gradient === "glassmorphism-back";
  const faceBase = cn("relative h-full w-full overflow-hidden rounded-2xl fpc-glow fpc-card-hover", effectClasses(lightEffect));
  const social = data.socialLinks ?? {};
  const socialItems = (
    [
      ["github", "🐙", "GitHub"],
      ["linkedin", "💼", "LinkedIn"],
      ["twitter", "🐦", "Twitter"],
      ["website", "🌐", l.website],
    ] as const
  ).filter(([key]) => social[key]);
  const skills = data.skills ?? [];
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <div
      ref={cardRef}
      className={cn("fpc-root fpc-perspective relative w-80 max-w-full cursor-pointer select-none", className)}
      style={{ "--fpc-glow": glowColor } as CSSProperties}
      onClick={flip}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Styles />
      {/* 鍵盤與讀屏用的翻面按鈕，焦點框畫在卡片外圍 */}
      <button
        type="button"
        className="fpc-flip-btn sr-only"
        aria-pressed={isFlipped}
        onClick={(e) => {
          e.stopPropagation();
          flip();
        }}
      >
        {isFlipped ? l.showFront : l.showBack}
      </button>

      <div className="fpc-3d relative h-96 w-full" style={transformStyle}>
        {/* 正面 */}
        <div className="fpc-backface absolute h-full w-full" aria-hidden={isFlipped} inert={isFlipped}>
          <div
            className={cn(faceBase, frontGlass ? "fpc-glass-front fpc-glass-dynamic fpc-glass-liquid" : `bg-gradient-to-br ${theme.front.gradient}`)}
            style={faceStyle}
          >
            {lightLayers}
            <div aria-hidden className={cn("absolute inset-0", frontGlass ? "opacity-30" : "opacity-20")}>
              {frontGlass ? (
                <>
                  <div className="fpc-glass-decoration absolute top-10 left-10 h-20 w-20 rounded-full blur-xl" />
                  <div className="fpc-glass-decoration absolute right-10 bottom-10 h-32 w-32 rounded-full blur-2xl" />
                  <div className="fpc-glass-decoration absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
                </>
              ) : (
                <>
                  <div className="absolute top-10 left-10 h-20 w-20 rounded-full bg-white blur-xl" />
                  <div className="absolute right-10 bottom-10 h-32 w-32 rounded-full bg-yellow-300 blur-2xl" />
                  <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300 blur-3xl" />
                </>
              )}
            </div>

            <div className={cn("relative z-10 flex h-full flex-col justify-between p-8", frontGlass ? "fpc-glass-text" : "text-white")}>
              <div className="text-center">
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full backdrop-blur-sm",
                    frontGlass ? "fpc-glass-decoration" : "bg-white/20",
                  )}
                >
                  {data.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.avatar} alt={l.avatarAlt} className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden className="text-3xl font-bold text-white">
                      {data.name.charAt(0).toUpperCase() || "👤"}
                    </span>
                  )}
                </div>
                <h2 className="mb-2 text-2xl font-bold">{data.name || l.namePlaceholder}</h2>
                <p className="mb-4 text-lg opacity-90">{data.title || l.titlePlaceholder}</p>
                <div className="space-y-2 text-sm opacity-80">
                  {data.email && (
                    <p className="flex items-center justify-center gap-2">
                      <span aria-hidden>📧</span> {data.email}
                    </p>
                  )}
                  {data.phone && (
                    <p className="flex items-center justify-center gap-2">
                      <span aria-hidden>📱</span> {data.phone}
                    </p>
                  )}
                  {data.location && (
                    <p className="flex items-center justify-center gap-2">
                      <span aria-hidden>📍</span> {data.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 背面 */}
        <div className="fpc-backface fpc-rotate-y-180 absolute h-full w-full" aria-hidden={!isFlipped} inert={!isFlipped}>
          <div
            className={cn(faceBase, backGlass ? "fpc-glass-back fpc-glass-dynamic fpc-glass-liquid" : `bg-gradient-to-br ${theme.back.gradient}`)}
            style={faceStyle}
          >
            {lightLayers}
            <div aria-hidden className={cn("absolute inset-0", backGlass ? "opacity-30" : "opacity-20")}>
              {backGlass ? (
                <>
                  <div className="fpc-glass-decoration absolute top-5 right-5 h-16 w-16 rounded-full blur-lg" />
                  <div className="fpc-glass-decoration absolute bottom-5 left-5 h-24 w-24 rounded-full blur-xl" />
                  <div className="fpc-glass-decoration absolute top-1/3 right-1/3 h-20 w-20 rounded-full blur-lg" />
                </>
              ) : (
                <>
                  <div className="absolute top-5 right-5 h-16 w-16 rounded-full bg-white blur-lg" />
                  <div className="absolute bottom-5 left-5 h-24 w-24 rounded-full bg-yellow-200 blur-xl" />
                  <div className="absolute top-1/3 right-1/3 h-20 w-20 rounded-full bg-blue-200 blur-lg" />
                </>
              )}
            </div>

            <div className={cn("relative z-10 flex h-full flex-col p-6", backGlass ? "fpc-glass-text" : "text-white")}>
              <div className="mb-6 text-center">
                <h3 className="mb-2 text-xl font-bold">{l.details}</h3>
                <div className="mx-auto h-0.5 w-12 bg-white/50" />
              </div>

              <div className="flex-1 space-y-4">
                {data.bio && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold opacity-90">{l.about}</h4>
                    <p className="text-sm leading-relaxed opacity-80">{data.bio}</p>
                  </div>
                )}

                {skills.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold opacity-90">{l.skills}</h4>
                    <ul className="flex flex-wrap gap-2">
                      {skills.map((skill, i) => (
                        <li key={i} className="rounded-full bg-white/20 px-2 py-1 text-xs backdrop-blur-sm">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {socialItems.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold opacity-90">{l.social}</h4>
                    <div className="flex justify-center gap-3">
                      {socialItems.map(([key, icon, label]) => (
                        <a
                          key={key}
                          href={social[key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          onClick={stop}
                          onKeyDown={stop}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          <span aria-hidden className="text-sm">
                            {icon}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 選擇器共用：radiogroup 方向鍵切換 ---------- */

function useRadioKeys<T extends string>(keys: readonly T[], value: T, select: (k: T) => void, cols = 1) {
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = keys.indexOf(value);
    const step = { ArrowRight: 1, ArrowDown: cols, ArrowLeft: -1, ArrowUp: -cols }[e.key];
    let next: number | undefined;
    if (step !== undefined) next = (i + step + keys.length) % keys.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = keys.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    select(keys[next]);
    refs.current.get(keys[next])?.focus();
  };
  const setRef = (k: T) => (el: HTMLButtonElement | null) => {
    if (el) refs.current.set(k, el);
    else refs.current.delete(k);
  };
  return { onKeyDown, setRef };
}

const optionBase = "rounded-lg border-2 p-3 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2";
const optionOn = "border-purple-500 bg-purple-50 shadow-md";
const optionOff = "border-gray-200 hover:border-gray-300 hover:shadow-sm";

/* ---------- 光影效果選擇器 ---------- */

export interface LightEffectPickerProps {
  value?: LightEffect;
  defaultValue?: LightEffect;
  onValueChange?: (effect: LightEffect) => void;
  className?: string;
  /** 覆寫各效果的名稱與說明 */
  options?: Partial<Record<LightEffect, { name?: string; description?: string; icon?: string }>>;
  /** 介面語言：en、zh-TW、zh-CN、ja */
  locale?: string;
  labels?: { heading?: string; hint?: string };
}

const effectKeys = Object.keys(lightEffects) as LightEffect[];

export function LightEffectPicker({
  value,
  defaultValue = "dynamic",
  onValueChange,
  className,
  options,
  locale = "en",
  labels,
}: LightEffectPickerProps) {
  const pm = PICKER_MESSAGES[resolveLocale(locale)];
  const [inner, setInner] = useState<LightEffect>(defaultValue);
  const selected = value ?? inner;
  const headingId = useId();
  const select = (k: LightEffect) => {
    setInner(k);
    onValueChange?.(k);
  };
  const { onKeyDown, setRef } = useRadioKeys(effectKeys, selected, select);
  const heading = labels?.heading ?? pm.effectHeading;
  const hint = labels?.hint ?? pm.effectHint;

  return (
    <div className={cn("space-y-4", className)}>
      <Styles />
      <h3 id={headingId} className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-700">
        <span aria-hidden>💡</span> {heading}
      </h3>
      <div role="radiogroup" aria-labelledby={headingId} className="grid grid-cols-1 gap-2">
        {effectKeys.map((key) => {
          const meta = { ...lightEffects[key], ...pm.effects?.[key], ...options?.[key] };
          const on = selected === key;
          return (
            <button
              key={key}
              ref={setRef(key)}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => select(key)}
              onKeyDown={onKeyDown}
              className={cn(optionBase, "text-left", on ? optionOn : optionOff)}
            >
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-2xl">
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800">{meta.name}</div>
                  <div className="text-xs text-gray-500">{meta.description}</div>
                </div>
                {on && (
                  <span aria-hidden className="text-lg text-purple-500">
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {hint && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            <span aria-hidden>💡 </span>
            {hint}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- 主題選擇器 ---------- */

export interface ThemePickerProps {
  value?: CardThemeKey;
  defaultValue?: CardThemeKey;
  onValueChange?: (key: CardThemeKey, theme: CardTheme) => void;
  className?: string;
  /** 覆寫各主題的名稱與說明 */
  options?: Partial<Record<CardThemeKey, { name?: string; description?: string }>>;
  /** 介面語言：en、zh-TW、zh-CN、ja */
  locale?: string;
  labels?: { heading?: string; hint?: string };
}

const themeKeys = Object.keys(cardThemes) as CardThemeKey[];

export function ThemePicker({
  value,
  defaultValue = "classic",
  onValueChange,
  className,
  options,
  locale = "en",
  labels,
}: ThemePickerProps) {
  const pm = PICKER_MESSAGES[resolveLocale(locale)];
  const [inner, setInner] = useState<CardThemeKey>(defaultValue);
  const selected = value ?? inner;
  const headingId = useId();
  const select = (k: CardThemeKey) => {
    setInner(k);
    const t = cardThemes[k];
    onValueChange?.(k, { front: t.front, back: t.back });
  };
  const { onKeyDown, setRef } = useRadioKeys(themeKeys, selected, select, 2);
  const heading = labels?.heading ?? pm.themeHeading;
  const hint = labels?.hint ?? pm.themeHint;

  return (
    <div className={cn("space-y-4", className)}>
      <Styles />
      <h3 id={headingId} className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-700">
        <span aria-hidden>🎨</span> {heading}
      </h3>
      <div role="radiogroup" aria-labelledby={headingId} className="grid grid-cols-2 gap-3">
        {themeKeys.map((key) => {
          const t = cardThemes[key];
          const meta = { name: t.name, description: t.description, ...pm.themes?.[key], ...options?.[key] };
          const on = selected === key;
          const glass = key === "glassmorphism";
          return (
            <button
              key={key}
              ref={setRef(key)}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => select(key)}
              onKeyDown={onKeyDown}
              className={cn(optionBase, "min-w-0", on ? optionOn : optionOff)}
            >
              <div className="space-y-2">
                <div aria-hidden className="flex gap-1">
                  <div className={cn("h-6 w-8 rounded", glass ? "fpc-glass-preview-front border border-white/20" : `bg-gradient-to-r ${t.front.gradient} border border-gray-300`)} />
                  <div className={cn("h-6 w-8 rounded", glass ? "fpc-glass-preview-back border border-white/20" : `bg-gradient-to-r ${t.back.gradient} border border-gray-300`)} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-800">{meta.name}</div>
                  <div className="text-xs text-gray-500">{meta.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {hint && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            <span aria-hidden>💡 </span>
            {hint}
          </p>
        </div>
      )}
    </div>
  );
}
