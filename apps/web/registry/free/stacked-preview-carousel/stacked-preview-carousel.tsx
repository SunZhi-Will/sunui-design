"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 前景 + 幾層堆疊；再往後的卡片直接淡到隱形，不需要真的畫出來
const VISIBLE_DEPTH = 3;
// 錯位用百分比（相對卡片自身尺寸），手機與桌機的相對強度一致
const STEP_Y_PCT = 3.2;
const STEP_X_PCT = 2.6;
// 縮小感由 translateZ ＋ perspective 產生（真的往後退），只留一點點 scale 讓層次更清楚
const STEP_Z = 95;
const STEP_SCALE = 0.025;
const STEP_ROTATE = 3.2;
// 每往後一層再多轉一點 Y 軸，讓整疊像攤開的實體卡片
const STEP_ROTATE_Y = 2.5;
// 滑鼠傾斜幅度（度）
const TILT_MAX = 9;
// hover 時最上層卡片往觀看者推進的距離（px）
const HOVER_LIFT_Z = 48;

export interface StackedPreviewItem {
  key: string;
  title: string;
  /** 標題上方的小字（金色大寫） */
  subtitle: string;
  /** 有就整張卡是連結 */
  href?: string;
  /** 封面圖片網址（16:9） */
  image?: string;
  imageAlt?: string;
  /** 沒有圖片時的封面內容，例如投影片示意圖；會填滿 16:9 封面區 */
  cover?: ReactNode;
  /** 封面本身沒有標題字時，在封面上疊一層標題 */
  overlayTitle?: boolean;
  overlayColor?: string;
}

export interface StackedPreviewCarouselProps {
  items: StackedPreviewItem[];
  /** 自動換張間隔（ms） */
  interval?: number;
  /** 原專案預設暗色，淺色主題的 token 也一起保留 */
  theme?: "dark" | "light";
  /** 唯一強調色（小標、hover 時指向游標的邊框細線），預設暗色 #d4a24c、淺色 #a8741f */
  accent?: string;
  className?: string;
}

const THEMES = {
  dark: {
    "--card": "#161412",
    "--card-raised": "#1c1a17",
    "--border": "rgb(255 255 255 / 0.08)",
    "--text-primary": "#f5f5f4",
    "--accent-gold": "#d4a24c",
  },
  light: {
    "--card": "#ffffff",
    "--card-raised": "#f5f5f4",
    "--border": "rgba(28, 25, 23, 0.08)",
    "--text-primary": "#1c1917",
    "--accent-gold": "#a8741f",
  },
} as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * 卡片下半部的文字區：跟封面同屬一張卡片。標題固定保留兩行高度，換張時整疊高度不變。
 */
function CardMeta({ item }: { item: StackedPreviewItem }) {
  return (
    <div className="flex-1 px-4 py-3.5" style={{ background: "var(--card)" }}>
      <div className="line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent-gold)" }}>
        {item.subtitle}
      </div>
      <div className="mt-1 line-clamp-2 font-serif text-[18px] font-normal leading-snug tracking-[-0.01em]" style={{ color: "var(--text-primary)", minHeight: "2.75em" }}>
        {item.title}
      </div>
    </div>
  );
}

/**
 * 3D 堆疊卡片輪播：換張時最上面那張退到最後一層、下一張補上來，像手上一疊卡片抽換。
 * perspective + translateZ 做真的縱深。最上層卡片跟著游標傾斜、浮起，邊框一段細線指向游標；
 * 這些都寫進 CSS 變數用 ref 直接改，避免 pointermove 觸發 re-render。
 */
export function StackedPreviewCarousel({ items, interval = 3800, theme = "dark", accent, className }: StackedPreviewCarouselProps) {
  const [active, setActive] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const [hovering, setHovering] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 滑鼠停在卡片上時暫停輪播
    if (items.length < 2 || reducedMotion || hovering) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % items.length), interval);
    return () => clearInterval(timer);
  }, [items.length, reducedMotion, hovering, interval]);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const stage = stageRef.current;
      // 觸控裝置沒有真正的 hover，放行會讓輪播在點一下之後永久停住
      if (!stage || reducedMotion || e.pointerType !== "mouse") return;
      // 換張時游標沒動，enter 不會再觸發，所以 move 也補上 hover 狀態
      setHovering(true);
      const rect = stage.getBoundingClientRect();
      // -1 ~ 1 的相對座標，原點在卡片中心
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      stage.style.setProperty("--mx", `${((px + 1) / 2) * 100}%`);
      stage.style.setProperty("--my", `${((py + 1) / 2) * 100}%`);
      stage.style.setProperty("--px", `${px.toFixed(3)}`);
      stage.style.setProperty("--py", `${py.toFixed(3)}`);
      stage.style.setProperty("--tilt-y", `${px * TILT_MAX}deg`);
      stage.style.setProperty("--tilt-x", `${-py * TILT_MAX}deg`);
      // conic-gradient 的 0deg 在正上方，補 90 度讓亮點落在游標方向
      stage.style.setProperty("--glow-angle", `${(Math.atan2(py, px) * 180) / Math.PI + 90}deg`);
    },
    [reducedMotion],
  );

  const resetPointer = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--tilt-y", "0deg");
    stage.style.setProperty("--tilt-x", "0deg");
    stage.style.setProperty("--px", "0");
    stage.style.setProperty("--py", "0");
  }, []);

  if (items.length === 0) return null;

  const tokens: Record<string, string> = { ...THEMES[theme] };
  if (accent) tokens["--accent-gold"] = accent;

  return (
    <div className={cn("relative", className)} style={tokens as CSSProperties}>
      <div
        ref={stageRef}
        className="relative"
        style={
          {
            // perspective 只作用在直接子元素，所以掛在卡片的直接父層
            perspective: "1200px",
            perspectiveOrigin: "50% 45%",
            "--tilt-x": "0deg",
            "--tilt-y": "0deg",
            "--px": "0",
            "--py": "0",
            "--glow-angle": "0deg",
            "--mx": "50%",
            "--my": "50%",
          } as CSSProperties
        }
        onPointerMove={handlePointerMove}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHovering(true);
        }}
        onPointerLeave={() => {
          setHovering(false);
          resetPointer();
        }}
      >
        {/* 撐高度用的隱形骨架：卡片全是絕對定位，用第一張決定「封面 16:9 ＋ 文字區」的總高 */}
        <div aria-hidden className="pointer-events-none invisible flex flex-col">
          <div className="w-full" style={{ aspectRatio: "16/9" }} />
          <CardMeta item={items[0]} />
        </div>

        {items.map((item, i) => {
          const distance = (i - active + items.length) % items.length;
          const isFront = distance === 0;
          const opacity = distance < VISIBLE_DEPTH ? 1 - distance * 0.28 : 0;
          const lifted = isFront && hovering && !reducedMotion;
          const transform = [
            `translateZ(${-distance * STEP_Z + (lifted ? HOVER_LIFT_Z : 0)}px)`,
            `translateY(${distance * STEP_Y_PCT}%)`,
            `translateX(${distance * STEP_X_PCT}%)`,
            `scale(${1 - distance * STEP_SCALE})`,
            `rotateZ(${distance * STEP_ROTATE}deg)`,
            `rotateY(${distance * STEP_ROTATE_Y}deg)`,
            ...(isFront && !reducedMotion ? ["rotateX(var(--tilt-x))", "rotateY(var(--tilt-y))"] : []),
          ].join(" ");

          const cardStyle: CSSProperties = {
            background: "var(--card)",
            border: "1px solid var(--border)",
            // 打光方向固定，卡片一傾斜投影就往反方向偏
            boxShadow: lifted
              ? "calc(var(--px) * -22px) calc(44px - var(--py) * 12px) 76px rgba(0,0,0,0.5)"
              : isFront
                ? "0 24px 48px rgba(0,0,0,0.4)"
                : "0 12px 24px rgba(0,0,0,0.28)",
            transform,
            opacity,
            zIndex: items.length - distance,
            transformOrigin: "50% 100%",
            pointerEvents: isFront ? "auto" : "none",
            transition: reducedMotion
              ? "none"
              : // 透明度收得比位移快：換張時上層卡片若還半透明，會透出後面那張造成重影
                `transform ${hovering && isFront ? "0.18s" : "0.75s"} cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease, box-shadow 0.4s ease`,
          };

          const hasMedia = !!item.image || item.cover != null;
          const content = (
            <>
              {hasMedia ? (
                <div className="relative w-full shrink-0 overflow-hidden" style={{ aspectRatio: "16/9", background: "var(--card-raised)", containerType: "inline-size" }}>
                  {/* 封面往游標反方向微移，像沉在卡片內部（先放大一點避免露邊） */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: lifted ? "translate3d(calc(var(--px) * -12px), calc(var(--py) * -9px), 0) scale(1.06)" : "none",
                      transition: reducedMotion ? "none" : "transform 0.25s ease-out",
                    }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.imageAlt ?? item.title} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0">{item.cover}</div>
                    )}
                  </div>

                  {item.overlayTitle && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{ background: "linear-gradient(to bottom, transparent 38%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.85) 100%)" }}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ padding: "5cqw", paddingRight: "16cqw" }}>
                        <div
                          className="line-clamp-1 font-semibold uppercase tracking-[0.2em]"
                          style={{ fontSize: "clamp(7px,2.4cqw,11px)", marginBottom: "1.2cqw", color: item.overlayColor ?? "var(--accent-gold)" }}
                        >
                          {item.subtitle}
                        </div>
                        <div className="line-clamp-2 font-serif leading-tight" style={{ fontSize: "clamp(11px,3.8cqw,18px)", color: "#f5f5f4" }}>
                          {item.title}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full shrink-0" style={{ aspectRatio: "16/9", background: "var(--card-raised)" }} />
              )}

              {/* 只有最上層那張顯示文字，後面只露出一條的卡片留白，看起來才像真的一疊 */}
              {isFront ? <CardMeta item={item} /> : <div className="flex-1" style={{ background: "var(--card)" }} />}

              {isFront && !reducedMotion && (
                <>
                  {/* 游標光斑：跟著滑鼠移動的柔光 */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.18), rgba(255,255,255,0.04) 34%, transparent 62%)",
                      mixBlendMode: "soft-light",
                      opacity: hovering ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                  />
                  {/* 邊框細線：用 mask 挖空中間只留一圈，亮段角度指向游標；不發光 */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                      padding: 1.5,
                      background:
                        "conic-gradient(from var(--glow-angle), transparent 0deg, var(--accent-gold) 40deg, var(--accent-gold) 76deg, transparent 116deg, transparent 360deg)",
                      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      opacity: hovering ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                  />
                </>
              )}
            </>
          );

          const shared = {
            "aria-hidden": !isFront,
            "aria-label": isFront ? item.title : undefined,
            tabIndex: isFront ? 0 : -1,
            className: "absolute inset-0 flex flex-col overflow-hidden rounded-2xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
            style: cardStyle,
          };

          return item.href ? (
            <a key={item.key} href={item.href} draggable={false} {...shared}>
              {content}
            </a>
          ) : (
            <div key={item.key} role="group" {...shared}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
