"use client";

import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type InstructorCardData = {
  name: string;
  /** 正面左側的人像圖；要自己畫（SVG、插畫元件）就改用 portrait */
  image?: { src: string; alt: string };
  /** 取代 image 的自訂人像節點，會貼齊正面左欄底部 */
  portrait?: ReactNode;
  roles?: string[];
  bio?: string;
  /** 背面的佐證標籤 */
  chips?: string[];
  /** 簽名：字串視為圖片網址（反白、70% 不透明），也可以直接給節點 */
  signature?: string | ReactNode;
  href?: string;
};

export interface InstructorCard3DLabels {
  eyebrow?: ReactNode;
  flipToBack?: ReactNode;
  flipToFront?: ReactNode;
  fullProfile?: ReactNode;
  close?: string;
  dialog?: (name: string) => string;
  signatureAlt?: (name: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<InstructorCard3DLabels>> = {
  en: {
    eyebrow: "INSTRUCTOR",
    flipToBack: "Flip to the back",
    flipToFront: "Flip to the front",
    fullProfile: "Read the full instructor bio",
    close: "Close instructor card",
    dialog: (name) => `${name}'s instructor card`,
    signatureAlt: (name) => `${name}'s signature`,
  },
  "zh-TW": {
    eyebrow: "講師",
    flipToBack: "翻到背面",
    flipToFront: "翻回正面",
    fullProfile: "看完整講師介紹",
    close: "關閉講師名片",
    dialog: (name) => `${name}的講師名片`,
    signatureAlt: (name) => `${name}的簽名`,
  },
  "zh-CN": {
    eyebrow: "讲师",
    flipToBack: "翻到背面",
    flipToFront: "翻回正面",
    fullProfile: "查看完整讲师介绍",
    close: "关闭讲师名片",
    dialog: (name) => `${name}的讲师名片`,
    signatureAlt: (name) => `${name}的签名`,
  },
  ja: {
    eyebrow: "講師",
    flipToBack: "裏面を見る",
    flipToFront: "表面に戻る",
    fullProfile: "講師プロフィールを詳しく見る",
    close: "講師カードを閉じる",
    dialog: (name) => `${name}の講師カード`,
    signatureAlt: (name) => `${name}のサイン`,
  },
};

export interface InstructorCard3DProps {
  card: InstructorCardData;
  open: boolean;
  onClose: () => void;
  /** true：portal 到 body、蓋滿視窗並鎖背景捲動；false：蓋滿最近的 relative 父層 */
  fixed?: boolean;
  /** 點遮罩是否關閉，預設 true */
  closeOnBackdrop?: boolean;
  /** 唯一強調色：眉標、分隔點與「看完整介紹」按鈕，預設琥珀金 #d4a24c */
  accent?: string;
  /** 保留給舊版 API：給了才讓按鈕改成同色相的雙色漸層（起點），預設是純色 accent */
  accentFrom?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: InstructorCard3DLabels;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

const CARD_FACE = "absolute inset-0 overflow-hidden rounded-[20px]";
const CARD_FACE_STYLE: CSSProperties = {
  background: "#161412",
  border: "1px solid rgb(255 255 255 / 0.08)",
  // 陰影下在每一面，不能下在旋轉的容器上：filter 會把 3D 情境壓平，
  // backface-visibility 就會失效，翻面時看到的是鏡像的正面。
  boxShadow: "0 26px 44px rgba(0,0,0,0.55)",
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

const KEYFRAMES = `
@keyframes sunui-icard-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sunui-icard-pop {
  from { opacity: 0; transform: scale(0.97) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}`;

/* 圖示（形狀照 lucide） */
function Svg({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const XIcon = () => (
  <Svg size={16}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

const RotateCwIcon = () => (
  <Svg size={13}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </Svg>
);

const ArrowRightIcon = () => (
  <Svg size={14}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

/**
 * 講師名片對話框：橫式名片比例，滑鼠移動時整張卡片在 3D 空間傾斜並帶光澤，
 * 點卡片（或按「翻到背面」）翻面看簡介。觸控與偏好減少動態時只保留翻面。
 */
export function InstructorCard3D({
  card,
  open,
  onClose,
  fixed = true,
  closeOnBackdrop = true,
  accent = "#d4a24c",
  accentFrom,
  locale = "en",
  labels,
}: InstructorCard3DProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);
  const [glare, setGlare] = useState<{ x: number; y: number } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // 每次重新打開都從正面開始
  useEffect(() => {
    if (open) return;
    setFlipped(false);
    setTilt(null);
    setGlare(null);
  }, [open]);

  // 鎖背景捲動（只有蓋滿視窗時）
  useEffect(() => {
    if (!open || !fixed) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [open, fixed]);

  // 開啟時把焦點移進面板，關閉時還回原本的觸發元素
  useEffect(() => {
    if (!open || !mounted) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [open, mounted]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // 焦點鎖：Tab 走到最後一個繞回第一個，Shift+Tab 反之
      const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 只有滑鼠才傾斜：觸控時手指會蓋住卡片，跟著轉反而看不清楚
    if (e.pointerType !== "mouse" || reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: -(py - 0.5) * 20, y: (px - 0.5) * 24 });
    setGlare({ x: px * 100, y: py * 100 });
  };

  const resetTilt = () => {
    setTilt(null);
    setGlare(null);
  };

  if (!mounted || !open) return null;

  const rotateY = (tilt?.y ?? 0) + (flipped ? 180 : 0);
  const flipTransition = reduce
    ? "none"
    : tilt
      ? "transform 0.12s ease-out"
      : "transform 0.6s cubic-bezier(0.22,1,0.28,1)";

  const node = (
    <div
      className={cn("inset-0 z-[100] flex items-center justify-center p-4", fixed ? "fixed" : "absolute")}
      data-lenis-prevent
      style={{
        background: "rgba(12,10,9,0.88)",
        animation: reduce ? undefined : "sunui-icard-backdrop-in 0.2s ease both",
      }}
      onMouseDown={(e) => {
        // 按下與放開都在遮罩上才關閉，從卡片內拖曳選字不會誤關
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <style>{KEYFRAMES}</style>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={l.dialog(card.name)}
        tabIndex={-1}
        className="relative w-full outline-none"
        style={{
          maxWidth: 430,
          // 3D 傾斜會超出面板邊界，overflow 必須維持 visible
          overflow: "visible",
          animation: reduce ? undefined : "sunui-icard-pop 0.32s cubic-bezier(0.23,1,0.32,1) both",
        }}
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label={l.close}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/10"
            style={{ background: "#161412", color: "#a8a29e", border: "1px solid rgb(255 255 255 / 0.08)" }}
          >
            <XIcon />
          </button>
        </div>

        {/* 名片本體：橫式比例，內部兩面各自 backface-hidden */}
        <div
          className="relative aspect-[1.62/1] w-full cursor-pointer select-none"
          style={{
            transform: `perspective(1150px) rotateX(${tilt?.x ?? 0}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
            transition: flipTransition,
          }}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
          onClick={() => setFlipped((v) => !v)}
        >
          {/* 正面 */}
          <div className={CARD_FACE} style={CARD_FACE_STYLE} aria-hidden={flipped}>
            <div className="flex h-full">
              <div
                className="relative h-full w-[38%] shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(180deg, #e7e5e4 0%, #d6d3d1 100%)" }}
              >
                {card.portrait ? (
                  <div className="absolute inset-x-0 bottom-0 flex justify-center">
                    {card.portrait}
                  </div>
                ) : card.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.image.src}
                    alt={card.image.alt}
                    className="absolute bottom-0 left-1/2 h-auto w-[115%] max-w-none -translate-x-1/2 object-contain"
                  />
                ) : null}
              </div>

              <div className="relative flex min-w-0 flex-1 flex-col justify-center px-5">
                <div className="text-[9px] font-semibold tracking-[0.24em]" style={{ color: accent }}>
                  {l.eyebrow}
                </div>
                <h2 className="mt-2 font-serif text-[23px] font-normal leading-none text-[#f5f5f4]">{card.name}</h2>
                {card.roles && card.roles.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] font-medium text-[#a8a29e]">
                    {/* 分隔點跟在前一個職稱後面，換行時不會變成下一行的行首 */}
                    {card.roles.map((role, index) => (
                      <span key={role} className="flex items-center gap-1.5">
                        {role}
                        {index < card.roles!.length - 1 && (
                          <span style={{ color: accent, opacity: 0.6 }}>·</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {typeof card.signature === "string" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.signature}
                    alt={l.signatureAlt(card.name)}
                    className="mt-3 h-auto w-[74px]"
                    style={{ filter: "invert(1)", opacity: 0.7 }}
                  />
                ) : card.signature ? (
                  <div className="mt-3 w-[74px]" style={{ opacity: 0.7 }}>
                    {card.signature}
                  </div>
                ) : null}
              </div>
            </div>

            {/* 光澤：跟著游標的高光 + 固定的斜向紙面反光 */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: glare ? 1 : 0,
                background: `radial-gradient(circle at ${glare?.x ?? 50}% ${glare?.y ?? 50}%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 46%)`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(118deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 58%)" }}
            />
          </div>

          {/* 背面 */}
          <div
            className={cn(CARD_FACE, "flex flex-col justify-center gap-3 px-6")}
            style={{ ...CARD_FACE_STYLE, transform: "rotateY(180deg)" }}
            aria-hidden={!flipped}
          >
            {card.bio && <p className="text-[11.5px] leading-[1.75] text-[#a8a29e] sm:text-[12px]">{card.bio}</p>}
            {card.chips && card.chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full px-2.5 py-1 text-[9.5px] font-medium tabular-nums text-[#d6d3d1]"
                    style={{ background: "#0c0a09", border: "1px solid rgb(255 255 255 / 0.08)" }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-5 text-[9px] font-semibold tracking-[0.24em] text-white/20"
            >
              {card.name}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[12.5px] font-medium text-[#d6d3d1] transition-colors hover:bg-white/10"
            style={{ background: "#161412", border: "1px solid rgb(255 255 255 / 0.08)" }}
          >
            <RotateCwIcon />
            {flipped ? l.flipToFront : l.flipToBack}
          </button>
          {card.href && (
            <a
              href={card.href}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: accentFrom ? `linear-gradient(135deg, ${accentFrom} 0%, ${accent} 100%)` : accent, color: "#0c0a09" }}
            >
              {l.fullProfile}
              <ArrowRightIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return fixed ? createPortal(node, document.body) : node;
}
