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
 * 依 iPhone 17 Pro 的實際比例畫（機身 71.9 × 150 mm，螢幕 1206 × 2622）：
 * 金屬中框 1cqw、黑色玻璃邊 2cqw（真機約為機身寬的 2%），螢幕幾乎佔滿正面。
 * 所有尺寸用 cqw（手機寬度的百分比），縮小時圓角、黑邊、動態島的比例不變。
 * 同心圓角：中框 15.6cqw，玻璃邊 14.6cqw，螢幕 14.6 − 2 = 12.6cqw。
 * 中框是金屬，光從正上方來：上下兩端反光亮、側面暗，內緣一圈倒角高光。
 */
const METAL = "linear-gradient(180deg,#9a9aa0 0%,#47474c 2.2%,#2c2c30 9%,#232327 50%,#2c2c30 91%,#47474c 97.8%,#7d7d83 100%)";
const frameShadow =
  "shadow-[inset_0_0_0_0.35cqw_rgb(255_255_255/0.10),inset_0_0_0_0.6cqw_rgb(0_0_0/0.35),0_0_0_0.5px_rgb(0_0_0/0.6),0_2px_4px_rgb(0_0_0/0.10),0_28px_56px_-20px_rgb(0_0_0/0.40)]";
// 側鍵是圓柱：中間一道反光
const KEY = "linear-gradient(90deg,#1b1b1e 0%,#5a5a60 45%,#2a2a2e 100%)";

function SideKey({ side, top, h }: { side: "left" | "right"; top: string; h: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("absolute w-[1.2cqw]", side === "left" ? "-left-[1cqw] rounded-l-[0.7cqw]" : "-right-[1cqw] rounded-r-[0.7cqw]")}
      style={{ top, height: h, background: KEY }}
    />
  );
}

/** 中框上的天線分隔線：一小段塑料，真機的細節 */
function Antenna({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn("absolute h-[0.9cqw] w-[1cqw] bg-[#55555b]", className)} />;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-[4.6cqw]">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function TabsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" className="size-[4.4cqw]">
      <rect x="4" y="7" width="12" height="12" rx="2.5" />
      <path d="M8 4h9.5A2.5 2.5 0 0 1 20 6.5V16" />
    </svg>
  );
}

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
        {/* 左側：動作鍵、音量加、音量減；右側：電源鍵與相機控制鍵 */}
        <SideKey side="left" top="17%" h="5%" />
        <SideKey side="left" top="25%" h="9%" />
        <SideKey side="left" top="36%" h="9%" />
        <SideKey side="right" top="27%" h="14%" />
        <SideKey side="right" top="58%" h="7%" />
        <div
          className={cn("relative rounded-[15.6cqw] p-[1cqw]", frameShadow)}
          style={{ background: METAL, ...(height ? { height } : { aspectRatio: "71.9 / 150" }) }}
        >
          <Antenna className="top-[8%] left-0" />
          <Antenna className="top-[8%] right-0" />
          <Antenna className="bottom-[8%] left-0" />
          <Antenna className="bottom-[8%] right-0" />
          <div className="h-full rounded-[14.6cqw] bg-[#030304] p-[2cqw]">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[12.6cqw] bg-[var(--wf-surface)] text-[var(--wf-fg)]">
              {/* 動態島：寬約螢幕 32%、高 9%，離頂端 2.7% */}
              <div aria-hidden="true" className="absolute top-[2.7cqw] left-1/2 z-[3] h-[9.2cqw] w-[31cqw] -translate-x-1/2 rounded-full bg-black" />
              {/* 狀態列：時間和圖示各自置中在動態島兩側 */}
              <div aria-hidden="true" className="relative z-[2] grid h-[14.6cqw] flex-none grid-cols-[1fr_31cqw_1fr] items-center pt-[0.6cqw] text-[4.4cqw] font-semibold">
                <span className="justify-self-center pl-[3cqw] tabular-nums tracking-tight">{time}</span>
                <span />
                <span className="justify-self-center pr-[2cqw]">
                  <StatusIcons />
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">{children}</div>
              {/* Safari 的網址列在底部，浮在內容上 */}
              {url && (
                <div className="flex flex-none items-center gap-[2cqw] px-[3.6cqw] pt-[2cqw]">
                  <span aria-hidden="true" className="grid size-[11cqw] flex-none place-items-center rounded-full bg-[var(--wf-raised)] shadow-[0_0_0_1px_var(--wf-line)]">
                    <Chevron />
                  </span>
                  <div
                    aria-label={t.url(url)}
                    className="flex h-[11cqw] min-w-0 flex-1 items-center justify-center gap-[1.4cqw] rounded-full bg-[var(--wf-raised)] px-[3cqw] text-[3.9cqw] shadow-[0_0_0_1px_var(--wf-line)]"
                  >
                    <LockIcon />
                    <span className="truncate">{url}</span>
                  </div>
                  <span aria-hidden="true" className="grid size-[11cqw] flex-none place-items-center rounded-full bg-[var(--wf-raised)] shadow-[0_0_0_1px_var(--wf-line)]">
                    <TabsIcon />
                  </span>
                </div>
              )}
              <div aria-hidden="true" className="relative h-[7.4cqw] flex-none">
                <span className="absolute bottom-[2.2cqw] left-1/2 h-[1.3cqw] w-[35cqw] -translate-x-1/2 rounded-full bg-[var(--wf-fg)] opacity-85" />
              </div>
              {/* 玻璃：極淡的斜向反光，模擬上方光源打在蓋板玻璃上 */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4] rounded-[inherit] bg-[linear-gradient(120deg,rgb(255_255_255/0.07)_0%,transparent_38%)]" />
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
const STAGE_H = 530;

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

/** 機身厚度：真機約為寬度的 12%，用一疊同形狀的薄層往後推出側面 */
const DEPTH_LAYERS = 14;

/** 一支傾斜的手機：靜止角度加上游標偏移乘以跟隨倍率，背後疊出機身側面 */
function TiltedPhone({
  px,
  py,
  pose,
  follow,
  width,
  children,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
  pose: { x: number; y: number; z: number };
  follow: number;
  width: number;
  children: ReactNode;
}) {
  const rotateY = useTransform(px, (v) => pose.y + v * 14 * follow);
  const rotateX = useTransform(py, (v) => pose.x - v * 10 * follow);
  const step = (width * 0.11) / DEPTH_LAYERS;
  return (
    <motion.div style={{ rotateX, rotateY, rotateZ: pose.z, transformPerspective: 1400, transformStyle: "preserve-3d" }} className="relative">
      {Array.from({ length: DEPTH_LAYERS }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            borderRadius: width * 0.156,
            // 側面：靠近正面的幾層是中框的金屬色，越往後越暗
            background: i < DEPTH_LAYERS - 2 ? `rgb(${52 - i * 1.6} ${52 - i * 1.6} ${57 - i * 1.6})` : "#141416",
            transform: `translateZ(${-(i + 1) * step}px)`,
          }}
        />
      ))}
      <div style={{ transform: "translateZ(0.5px)" }}>{children}</div>
    </motion.div>
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
          <TiltedPhone px={px} py={py} pose={{ x: 8, y: 22, z: -2 }} follow={0.55} width={236}>
            <PhoneFrame {...backFrame} width={236} scheme={scheme} locale={locale}>
              {back}
            </PhoneFrame>
          </TiltedPhone>
        </div>
        <div className="absolute top-[100px] left-[188px]" style={{ width: 196 }}>
          <TiltedPhone px={px} py={py} pose={{ x: 8, y: -22, z: 2 }} follow={1} width={196}>
            <PhoneFrame {...frontFrame} width={196} scheme={scheme} locale={locale}>
              {front}
            </PhoneFrame>
          </TiltedPhone>
        </div>
      </div>
    </div>
  );
}
