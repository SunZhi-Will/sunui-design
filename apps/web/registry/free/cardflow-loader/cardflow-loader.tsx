"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface CardFlowLoaderLabels {
  /** 進度圈下方的標題 */
  title: string;
  /** 輪播的載入詞語 */
  messages: string[];
  /** 進度條的無障礙名稱 */
  progress: string;
}

export interface CardFlowLoaderProps {
  /** 受控進度 0 到 100；不給時播放原專案的分段載入流程 */
  progress?: number;
  /** 分段流程跑完（或受控進度到 100）時觸發 */
  onComplete?: () => void;
  /** 完成後是否自動移除（原專案的 LoadingScreen 會卸載） */
  hideOnComplete?: boolean;
  /** 覆蓋整個視窗；預設填滿父容器 */
  fullScreen?: boolean;
  /** 詞語切換間隔（毫秒），原專案為 10 秒 */
  messageInterval?: number;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CardFlowLoaderLabels>;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, CardFlowLoaderLabels> = {
  en: {
    title: "Personal Cards",
    messages: [
      "Preparing the infinite grid...",
      "Generating profile cards...",
      "Calculating the best positions...",
      "Loading user avatars...",
      "Preparing bubble animations...",
      "Tuning the zoom experience...",
      "Building the coordinate system...",
      "Loading background dots...",
      "Preparing drag controls...",
      "Final checks...",
    ],
    progress: "Loading",
  },
  "zh-TW": {
    title: "個人名片",
    messages: [
      "正在準備無限網格...",
      "正在產生個人名片...",
      "正在計算最佳位置...",
      "正在載入使用者頭像...",
      "正在準備泡泡動畫...",
      "正在調整縮放體驗...",
      "正在建立座標系統...",
      "正在載入背景圓點...",
      "正在準備拖曳控制...",
      "最後檢查中...",
    ],
    progress: "載入中",
  },
  "zh-CN": {
    title: "个人名片",
    messages: [
      "正在准备无限网格...",
      "正在生成个人名片...",
      "正在计算最佳位置...",
      "正在加载用户头像...",
      "正在准备气泡动画...",
      "正在优化缩放体验...",
      "正在构建坐标系统...",
      "正在加载背景圆点...",
      "正在准备拖拽控制...",
      "最后检查中...",
    ],
    progress: "加载中",
  },
  ja: {
    title: "パーソナルカード",
    messages: [
      "無限グリッドを準備中...",
      "プロフィールカードを生成中...",
      "最適な配置を計算中...",
      "アバターを読み込み中...",
      "バブルアニメーションを準備中...",
      "ズームの操作感を調整中...",
      "座標系を構築中...",
      "背景のドットを読み込み中...",
      "ドラッグ操作を準備中...",
      "最終確認中...",
    ],
    progress: "読み込み中",
  },
};

// 原專案 LoadingScreen.tsx 的分段：先設進度，再等待
const STEPS: [progress: number, wait: number][] = [
  [20, 200],
  [40, 200],
  [60, 100],
  [80, 100],
  [100, 300],
];

// 圓周約 2πr = 251（r = 40）
const DASH = 251;

export function CardFlowLoader({
  progress: controlled,
  onComplete,
  hideOnComplete = true,
  fullScreen = false,
  messageInterval = 10000,
  locale = "en",
  labels: labelsProp,
  className,
}: CardFlowLoaderProps) {
  const base = MESSAGES[resolveLocale(locale)];
  const labels = { ...base, ...labelsProp };
  const messages = labels.messages.length ? labels.messages : base.messages;

  const [scripted, setScripted] = useState(0);
  const [done, setDone] = useState(false);
  const [currentText, setCurrentText] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const isControlled = controlled !== undefined;
  const progress = Math.round(Math.max(0, Math.min(100, isControlled ? controlled : scripted)));

  // 分段載入流程
  useEffect(() => {
    if (isControlled) return;
    let cancelled = false;
    const timers: number[] = [];
    let i = 0;
    const next = () => {
      if (cancelled) return;
      if (i >= STEPS.length) {
        setDone(true);
        onCompleteRef.current?.();
        return;
      }
      const [value, wait] = STEPS[i++];
      setScripted(value);
      timers.push(window.setTimeout(next, wait));
    };
    next();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [isControlled]);

  // 受控模式：到 100 時通知
  useEffect(() => {
    if (!isControlled) return;
    if (progress >= 100) {
      setDone(true);
      onCompleteRef.current?.();
    } else {
      setDone(false);
    }
  }, [isControlled, progress]);

  // 每隔一段時間換一句
  useEffect(() => {
    const id = window.setInterval(() => setCurrentText((prev) => (prev + 1) % messages.length), messageInterval);
    return () => clearInterval(id);
  }, [messages.length, messageInterval]);

  if (done && hideOnComplete) return null;

  return (
    <div className={cn(fullScreen ? "fixed inset-0 z-50" : "absolute inset-0 h-full w-full", "flex items-center justify-center bg-white", className)}>
      <style>{`@media (prefers-reduced-motion: reduce) { .cf-loader-ring { transition: none !important; } }`}</style>
      <div className="flex flex-col items-center">
        <div
          className="relative mb-8 h-24 w-24"
          role="progressbar"
          aria-label={labels.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle
              className="cf-loader-ring"
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={DASH}
              strokeDashoffset={DASH - (DASH * progress) / 100}
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="text-lg font-bold text-gray-700">{progress}%</span>
          </div>
        </div>

        <h2 className="mb-4 text-2xl font-semibold text-gray-800">{labels.title}</h2>

        <div className="mb-6 flex h-6 items-center justify-center">
          <p aria-live="polite" className="text-center text-sm font-medium text-gray-600 transition-all duration-300 ease-in-out">
            {messages[currentText % messages.length]}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CardFlowLoader;
