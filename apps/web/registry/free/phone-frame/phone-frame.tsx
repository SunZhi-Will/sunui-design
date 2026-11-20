"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** auto 跟著深淺色切換；dark／light 固定色，給不吃主題的簡報舞台用 */
export type PhoneFrameScheme = "auto" | "dark" | "light";

/*
 * 螢幕裡的色彩 token。auto 跟著網站深淺色，dark／light 固定，給不吃主題的簡報舞台用。
 * 全部是中性灰，不帶暖色。
 */
const lightVars =
  "[--wf-surface:#ffffff] [--wf-raised:#f4f4f5] [--wf-sunken:#f4f4f5] [--wf-fg:#171717] [--wf-fg-muted:#525252] [--wf-line-strong:rgba(0,0,0,0.12)] [--wf-line:rgba(0,0,0,0.08)]";
const darkAutoVars =
  "dark:[--wf-surface:#111113] dark:[--wf-raised:#1a1a1d] dark:[--wf-sunken:#1a1a1d] dark:[--wf-fg:#fafafa] dark:[--wf-fg-muted:#a1a1aa] dark:[--wf-line-strong:rgba(255,255,255,0.14)] dark:[--wf-line:rgba(255,255,255,0.1)]";
const fixedDark =
  "[--wf-surface:#111113] [--wf-raised:#1a1a1d] [--wf-sunken:#1a1a1d] [--wf-fg:#fafafa] [--wf-fg-muted:#a1a1aa] [--wf-line-strong:rgba(255,255,255,0.14)] [--wf-line:rgba(255,255,255,0.1)]";
const fixedLight = lightVars;

const schemeVars: Record<PhoneFrameScheme, string> = {
  auto: `${lightVars} ${darkAutoVars}`,
  dark: fixedDark,
  light: fixedLight,
};

function SimBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex-none rounded-full bg-[var(--wf-sunken)] px-2 py-px text-[11px] font-semibold tracking-[0.04em] text-[var(--wf-fg-muted)] shadow-[0_0_0_1px_var(--wf-line-strong)]">
      {children}
    </span>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-[1em] shrink-0">
      <rect width="16" height="10" x="4" y="11" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** 狀態列：實心訊號格、Wi-Fi 扇形、電池，和真的手機一樣是填色而不是線條 */
function StatusIcons() {
  return (
    <span className="inline-flex items-center gap-[1.4cqw]">
      <svg viewBox="0 0 18 12" className="h-[3.2cqw] w-auto" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg viewBox="0 0 16 12" className="h-[3.2cqw] w-auto" fill="currentColor">
        <path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4 10.6 10.6 0 0 0 .5 3.4l1.2 1.3A8.8 8.8 0 0 1 8 2.2Z" />
        <path d="M8 5.6c1.5 0 2.9.6 3.9 1.5l1.2-1.3A7.4 7.4 0 0 0 8 3.8c-2 0-3.8.7-5.1 2l1.2 1.3c1-.9 2.4-1.5 3.9-1.5Z" />
        <path d="M8 9c.6 0 1.2.2 1.6.6L8 11.4 6.4 9.6C6.8 9.2 7.4 9 8 9Z" />
      </svg>
      <svg viewBox="0 0 27 12" className="h-[3.2cqw] w-auto">
        <rect x="0.6" y="0.6" width="22.8" height="10.8" rx="3.4" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" />
        <rect x="2.4" y="2.4" width="17" height="7.2" rx="2" fill="currentColor" />
        <path d="M25 4v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" fillOpacity="0.4" />
      </svg>
    </span>
  );
}

/* ───────── 手機 ───────── */

export interface PhoneFrameProps {
  children: ReactNode;
  /** 瀏覽器網址列；不給就沒有網址列 */
  url?: string;
  time?: string;
  /** 手機寬度（px），窄容器裡會縮到 100%，外框、圓角、動態島跟著等比縮放 */
  width?: number;
  /** 手機整體高度。不給時用真實手機的 9:19.5 比例；內容超出時在螢幕裡捲動 */
  height?: number;
  /** 手機上方的小標 */
  label?: ReactNode;
  scheme?: PhoneFrameScheme;
  badge?: ReactNode;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<PhoneFrameLabels>;
  className?: string;
}

export interface PhoneFrameLabels {
  /** label 不是字串時 figure 的無障礙名稱 */
  screen: string;
  url: (url: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, PhoneFrameLabels> = {
  en: { screen: "Phone screen", url: (u) => `URL ${u}` },
  "zh-TW": { screen: "手機畫面", url: (u) => `網址 ${u}` },
  "zh-CN": { screen: "手机画面", url: (u) => `网址 ${u}` },
  ja: { screen: "スマートフォンの画面", url: (u) => `URL ${u}` },
};

/*
 * 外框由外到內三層：金屬中框（光從正上方來，上緣亮、下緣暗）、黑色玻璃邊、螢幕。
 * 所有尺寸用 cqw（手機寬度的百分比），縮小時圓角、邊框、動態島的比例不變。
 * 同心圓角：中框 14cqw，玻璃邊 13.2cqw，螢幕 13.2 − 3.2 = 10cqw。
 */
const frameMetal =
  "bg-[#2b2b2f] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),inset_0_-1px_0_rgb(0_0_0/0.5),0_0_0_1px_rgb(0_0_0/0.55),0_2px_4px_rgb(0_0_0/0.12),0_24px_48px_-16px_rgb(0_0_0/0.35)]";
const buttonMetal = "absolute w-[1.1cqw] bg-[#2b2b2f] shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_0_0_0.5px_rgb(0_0_0/0.5)]";

export function PhoneFrame({
  children,
  url,
  time = "9:41",
  width = 320,
  height,
  label,
  scheme = "auto",
  badge,
  locale = "en",
  labels,
  className,
}: PhoneFrameProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const part = "bg-[var(--wf-surface)] text-[var(--wf-fg)]";
  return (
    <figure
      aria-label={typeof label === "string" ? label : t.screen}
      className={cn("m-0 grid min-w-0 max-w-full justify-items-center gap-3", schemeVars[scheme], className)}
      style={{ width }}
    >
      {(label || badge) && (
        <figcaption className="flex items-center justify-center gap-2 text-[12.5px] text-[var(--wf-fg-muted)]">
          {label && <span>{label}</span>}
          {badge && <SimBadge>{badge}</SimBadge>}
        </figcaption>
      )}
      <div className="@container relative w-full">
        {/* 側邊按鍵：左側動作鍵與音量鍵，右側電源鍵，各凸出機身一點點 */}
        <span aria-hidden="true" className={cn(buttonMetal, "-left-[0.9cqw] top-[17%] h-[5.5%] rounded-l-[0.6cqw]")} />
        <span aria-hidden="true" className={cn(buttonMetal, "-left-[0.9cqw] top-[25%] h-[10%] rounded-l-[0.6cqw]")} />
        <span aria-hidden="true" className={cn(buttonMetal, "-left-[0.9cqw] top-[37%] h-[10%] rounded-l-[0.6cqw]")} />
        <span aria-hidden="true" className={cn(buttonMetal, "-right-[0.9cqw] top-[28%] h-[15%] rounded-r-[0.6cqw]")} />
        <div className={cn("relative rounded-[14cqw] p-[0.8cqw]", frameMetal)} style={height ? { height } : { aspectRatio: "9 / 19.5" }}>
          <div className="h-full rounded-[13.2cqw] bg-[#050506] p-[3.2cqw]">
            <div className={cn("relative flex h-full flex-col overflow-hidden rounded-[10cqw]", part)}>
              {/* 動態島 */}
              <div aria-hidden="true" className="absolute top-[3.2cqw] left-1/2 z-[2] h-[9cqw] w-[30cqw] -translate-x-1/2 rounded-full bg-[#050506]" />
              <div aria-hidden="true" className="flex h-[15.4cqw] flex-none items-center justify-between pr-[6.4cqw] pl-[8.6cqw] pt-[1cqw] text-[4.6cqw] font-semibold">
                <span className="tabular-nums tracking-tight">{time}</span>
                <StatusIcons />
              </div>
              {url && (
                <div
                  aria-label={t.url(url)}
                  className="mx-[3.2cqw] mb-[2cqw] flex flex-none items-center justify-center gap-[1.4cqw] rounded-[3cqw] bg-[var(--wf-raised)] px-[3cqw] py-[1.8cqw] text-[3.8cqw] text-[var(--wf-fg-muted)]"
                >
                  <LockIcon />
                  <span className="truncate text-[var(--wf-fg)]">{url}</span>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">{children}</div>
              <div aria-hidden="true" className="relative h-[7cqw] flex-none">
                <span className="absolute bottom-[2.4cqw] left-1/2 h-[1.4cqw] w-[36cqw] -translate-x-1/2 rounded-full bg-[var(--wf-fg)] opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

/* ───────── 兩支交疊的手機（原 tilted-phone-pair） ───────── */

/** gentle 彈簧：狀態切換、跟手的位移 */
const GENTLE = { stiffness: 240, damping: 30 };
/** 舞台的設計尺寸；容器較窄時整組等比縮小，不換版 */
const STAGE_W = 400;
const STAGE_H = 580;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type PairFrameProps = Omit<PhoneFrameProps, "children" | "width" | "height" | "scheme" | "locale">;

export interface PhonePairProps {
  /** 後方較大的手機畫面 */
  back: ReactNode;
  /** 前方較小的手機畫面 */
  front: ReactNode;
  /** 傳給後方 PhoneFrame 的其他設定，例如 url、time、badge */
  backFrame?: PairFrameProps;
  /** 傳給前方 PhoneFrame 的其他設定 */
  frontFrame?: PairFrameProps;
  scheme?: PhoneFrameScheme;
  locale?: string;
  /** 游標視差，預設開啟；只在滑鼠這類精準指標上作用，偏好減少動態時固定不動 */
  parallax?: boolean;
  /** 整組的無障礙名稱 */
  label?: string;
  className?: string;
}

/** 一支傾斜的手機：靜止角度加上游標偏移乘以跟隨倍率 */
function TiltedPhone({
  px,
  py,
  pose,
  follow,
  children,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
  pose: { x: number; y: number; z: number };
  follow: number;
  children: ReactNode;
}) {
  const rotateY = useTransform(px, (v) => pose.y + v * 14 * follow);
  const rotateX = useTransform(py, (v) => pose.x - v * 10 * follow);
  return (
    <motion.div style={{ rotateX, rotateY, rotateZ: pose.z, transformPerspective: 1400 }}>{children}</motion.div>
  );
}

/**
 * 兩支交疊、在 3D 裡傾斜的 PhoneFrame。游標移動時兩支一起跟著轉，
 * 前方手機跟得比後方多，做出前後景深。觸控裝置與減少動態時維持靜止角度。
 */
export function PhonePair({
  back,
  front,
  backFrame,
  frontFrame,
  scheme = "auto",
  locale = "en",
  parallax = true,
  label,
  className,
}: PhonePairProps) {
  const reduce = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fine, setFine] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const px = useSpring(x, GENTLE);
  const py = useSpring(y, GENTLE);
  const on = parallax && fine && !reduce;

  useIsoLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / STAGE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 關掉視差時回到靜止角度；減少動態時直接跳回，不播彈簧
  useEffect(() => {
    if (on) return;
    x.set(0);
    y.set(0);
    if (reduce) {
      px.jump(0);
      py.jump(0);
    }
  }, [on, reduce, x, y, px, py]);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!on || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label={label}
      className={cn("relative w-full min-w-0", className)}
      style={{ height: STAGE_H * scale, maxWidth: STAGE_W }}
    >
      <div
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="absolute top-0 left-1/2 origin-top"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translateX(-50%) scale(${scale})` }}
      >
        <div className="absolute top-0 left-[8px]" style={{ width: 236 }}>
          <TiltedPhone px={px} py={py} pose={{ x: 6, y: 14, z: 0 }} follow={0.55}>
            <PhoneFrame {...backFrame} width={236} scheme={scheme} locale={locale}>
              {back}
            </PhoneFrame>
          </TiltedPhone>
        </div>
        <div className="absolute top-[100px] left-[188px]" style={{ width: 196 }}>
          <TiltedPhone px={px} py={py} pose={{ x: 6, y: -14, z: 0 }} follow={1}>
            <PhoneFrame {...frontFrame} width={196} scheme={scheme} locale={locale}>
              {front}
            </PhoneFrame>
          </TiltedPhone>
        </div>
      </div>
    </div>
  );
}
