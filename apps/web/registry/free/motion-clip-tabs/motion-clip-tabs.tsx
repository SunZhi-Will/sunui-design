"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// 移植自 山河待我 landing/components/MotionShowcase.tsx 與 landing/app/globals.css 的 .motion- 樣式：
// 實機短片輪播。左邊是四角框住的畫面，右邊是編號分頁（壹、貳、參），
// 只有目前這一段會掛上 src 並播放，其餘一律歸零暫停；底下的說明隨分頁換上。
// 離開可視範圍就暫停，偏好減少動態時不自動播放，改由使用者按下播放。

export interface MotionClip {
  id: string;
  /** 分頁上的編號，例如 1 或 壹 */
  no: string;
  title: string;
  /** 標題下方的英文小字 */
  en: string;
  caption: string;
  /** 影片網址，只有目前這一段會掛上 */
  src?: string;
  /** 影片的 poster 圖 */
  poster?: string;
  /** 沒有影片時顯示的畫面（例如插畫或 CSS 圖），進度條改用 fallbackDuration 計時 */
  fallback?: ReactNode;
}

export interface MotionClipTabsProps {
  clips: readonly MotionClip[];
  /** 沒有影片的段落播放多久換下一段（毫秒），預設 6000 */
  fallbackDuration?: number;
  /** 進入可視範圍多少比例才開始播放，預設 0.35 */
  threshold?: number;
  /** 燈火色，預設原本的 #d9a05b */
  accent?: string;
  /** 亮一階的燈火色，預設原本的 #edc186 */
  accentBright?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<MotionClipTabsLabels>;
  onChange?: (index: number, clip: MotionClip) => void;
  className?: string;
  style?: CSSProperties;
}

export interface MotionClipTabsLabels {
  tablist: string;
  live: string;
  play: string;
  pause: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, MotionClipTabsLabels> = {
  en: { tablist: "Gameplay clips", live: "Gameplay", play: "Play gameplay clip", pause: "Pause gameplay clip" },
  "zh-TW": { tablist: "實機短片", live: "實機錄影", play: "播放實機短片", pause: "暫停實機短片" },
  "zh-CN": { tablist: "实机短片", live: "实机录像", play: "播放实机短片", pause: "暂停实机短片" },
  ja: { tablist: "実機映像", live: "実機映像", play: "実機映像を再生", pause: "実機映像を一時停止" },
};

export function MotionClipTabs({
  clips,
  fallbackDuration = 6000,
  threshold = 0.35,
  accent = "#d9a05b",
  accentBright = "#edc186",
  locale = "en",
  labels,
  onChange,
  className,
  style,
}: MotionClipTabsProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const uid = useId();
  const count = clips.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  // 偏好減少動態時，第一次播放必須由使用者觸發
  const [userStarted, setUserStarted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // 沒有影片的段落用這個累計播放時間
  const elapsedRef = useRef(0);

  const shouldPlay = inView && !paused && (!reduceMotion || userStarted);
  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  // 播放 / 暫停目前這段，其餘一律歸零暫停
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i !== active) {
        video.pause();
        return;
      }
      if (shouldPlay) video.play().catch(() => setPaused(true));
      else video.pause();
    });
  }, [active, shouldPlay]);

  const select = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      barRefs.current.forEach((bar, i) => {
        if (bar && i !== next) bar.style.transform = i < next ? "scaleX(1)" : "scaleX(0)";
      });
      const video = videoRefs.current[next];
      if (video) video.currentTime = 0;
      elapsedRef.current = 0;
      setActive(next);
    },
    [count],
  );

  // 以 rAF 直接寫進度條，避免每幀 re-render
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (time: number) => {
      const dt = last ? time - last : 0;
      last = time;
      const video = videoRefs.current[active];
      const bar = barRefs.current[active];
      if (video && bar && video.duration) {
        bar.style.transform = `scaleX(${Math.min(1, video.currentTime / video.duration)})`;
      } else if (!video && bar) {
        if (shouldPlayRef.current) elapsedRef.current += dt;
        const progress = Math.min(1, elapsedRef.current / fallbackDuration);
        bar.style.transform = `scaleX(${progress})`;
        if (progress >= 1) {
          select(active + 1);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, fallbackDuration, select]);

  // 窄版的分頁是橫向捲動列：切換時把目前這格捲進視野，只動水平方向
  useEffect(() => {
    const tab = tabRefs.current[active];
    const list = tab?.parentElement;
    if (!tab || !list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - 16, behavior: reduceMotion ? "auto" : "smooth" });
  }, [active, reduceMotion]);

  useEffect(() => {
    if (clips[active]) onChange?.(active, clips[active]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleTabClick = (index: number) => {
    setUserStarted(true);
    setPaused(false);
    select(index);
  };

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + count) % count;
    tabRefs.current[next]?.focus();
    handleTabClick(next);
  };

  const togglePlay = () => {
    if (!shouldPlay) {
      setUserStarted(true);
      setPaused(false);
    } else {
      setPaused(true);
    }
  };

  const clip = clips[active];
  if (!clip) return null;

  return (
    <div
      ref={rootRef}
      className={cn("smc", className)}
      style={{ "--smc-lantern": accent, "--smc-lantern-bright": accentBright, ...style } as CSSProperties}
    >
      <style>{css}</style>
      <div className="smc-grid">
        <div className="smc-stage">
          <div className="smc-frame">
            <span className="smc-corner smc-corner-tl" aria-hidden="true" />
            <span className="smc-corner smc-corner-tr" aria-hidden="true" />
            <span className="smc-corner smc-corner-bl" aria-hidden="true" />
            <span className="smc-corner smc-corner-br" aria-hidden="true" />
            <div className="smc-screen">
              {clips.map((c, i) => {
                const common = {
                  id: `${uid}-panel-${c.id}`,
                  role: "tabpanel",
                  "aria-labelledby": `${uid}-tab-${c.id}`,
                  "aria-hidden": i !== active,
                  className: cn("smc-video", i === active && "is-active"),
                };
                if (!c.src) {
                  videoRefs.current[i] = null;
                  return (
                    <div key={c.id} {...common}>
                      {c.fallback}
                    </div>
                  );
                }
                return (
                  <video
                    key={c.id}
                    {...common}
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={i === active ? c.src : undefined}
                    poster={c.poster}
                    muted
                    playsInline
                    preload={i === active ? "auto" : "none"}
                    onEnded={() => select(active + 1)}
                  />
                );
              })}
            </div>
          </div>
          <div className="smc-meta">
            <div className="smc-caption" key={clip.id} aria-live="polite">
              <span className="smc-caption-no">{clip.no}</span>
              <div>
                <strong>{clip.title}</strong>
                <p>{clip.caption}</p>
              </div>
            </div>
            <div className="smc-controls">
              <span className="smc-live" aria-hidden="true">
                <span className="smc-live-dot" />
                {l.live}
              </span>
              <button
                type="button"
                className={cn("smc-toggle", !shouldPlay && "is-paused")}
                onClick={togglePlay}
                aria-label={shouldPlay ? l.pause : l.play}
              >
                {shouldPlay ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="smc-tabs" role="tablist" aria-label={l.tablist}>
          {clips.map((c, i) => (
            <button
              key={c.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${c.id}`}
              aria-selected={i === active}
              aria-controls={`${uid}-panel-${c.id}`}
              tabIndex={i === active ? 0 : -1}
              className={cn("smc-tab", i === active && "is-active")}
              onClick={() => handleTabClick(i)}
              onKeyDown={(event) => handleTabKey(event, i)}
            >
              <span className="smc-tab-no" aria-hidden="true">
                {c.no}
              </span>
              <span className="smc-tab-text">
                <span className="smc-tab-title">{c.title}</span>
                <span className="smc-tab-en">{c.en}</span>
              </span>
              <span className="smc-tab-track" aria-hidden="true">
                <span
                  className="smc-tab-bar"
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 原作的斷點是視窗寬 1020px / 640px，這裡改成容器寬，放在任何欄位裡都對得上
const css = `
.smc{container-type:inline-size;min-width:0;color:#e8e4da;font-family:"Noto Serif TC","Songti TC","STSong","PMingLiU","Microsoft JhengHei",serif;--smc-mist:#8b98a9;--smc-mist-bright:#c3ccd8;--smc-paper:#e8e4da;--smc-line:rgba(139,152,169,.18)}
.smc *{box-sizing:border-box}
.smc-grid{display:grid;grid-template-columns:minmax(0,1fr) 264px;gap:26px;align-items:stretch}
.smc-stage{display:flex;flex-direction:column;min-width:0}
.smc-frame{position:relative;padding:10px}
.smc-corner{position:absolute;width:22px;height:22px;pointer-events:none;border-color:rgba(217,160,91,.7);border-style:solid;border-width:0;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.smc-corner-tl{top:0;left:0;border-top-width:2px;border-left-width:2px}
.smc-corner-tr{top:0;right:0;border-top-width:2px;border-right-width:2px}
.smc-corner-bl{bottom:0;left:0;border-bottom-width:2px;border-left-width:2px}
.smc-corner-br{bottom:0;right:0;border-bottom-width:2px;border-right-width:2px}
.smc-frame:hover .smc-corner-tl{transform:translate(-4px,-4px)}
.smc-frame:hover .smc-corner-tr{transform:translate(4px,-4px)}
.smc-frame:hover .smc-corner-bl{transform:translate(-4px,4px)}
.smc-frame:hover .smc-corner-br{transform:translate(4px,4px)}
.smc-screen{position:relative;aspect-ratio:16/9;overflow:hidden;background:#05070b;border:1px solid var(--smc-line);box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 60px rgba(217,160,91,.06)}
.smc-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.04);transition:opacity .8s ease,transform 1.4s cubic-bezier(.2,.7,.2,1)}
.smc-video.is-active{opacity:1;transform:none}
.smc-meta{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:18px 10px 0}
.smc-caption{display:flex;align-items:flex-start;gap:16px;min-width:0;min-height:4.6em;animation:smc-caption-in .8s cubic-bezier(.2,.7,.2,1) both}
.smc-controls{display:flex;align-items:center;gap:12px;flex-shrink:0}
.smc-caption-no{flex-shrink:0;font-size:30px;font-weight:700;line-height:1.1;color:var(--smc-lantern);text-shadow:0 0 18px rgba(217,160,91,.45)}
.smc-caption strong{display:block;font-size:18px;letter-spacing:.2em}
.smc-caption p{margin:4px 0 0;max-width:38rem;font-size:14px;line-height:1.9;color:var(--smc-mist-bright)}
.smc-live{display:inline-flex;align-items:center;gap:8px;padding:4px 12px;font-size:11px;letter-spacing:.3em;color:var(--smc-mist-bright);background:rgba(7,10,16,.6);border:1px solid var(--smc-line);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.smc-live-dot{width:6px;height:6px;border-radius:50%;background:#d9624f;box-shadow:0 0 8px rgba(217,98,79,.8);animation:smc-rec-pulse 1.6s ease-in-out infinite}
.smc-toggle{display:grid;place-items:center;width:38px;height:38px;padding:0;border-radius:50%;border:1px solid rgba(217,160,91,.5);background:rgba(7,10,16,.6);color:var(--smc-lantern-bright);cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .3s ease,color .3s ease,transform .3s ease}
.smc-toggle:hover,.smc-toggle:focus-visible{background:var(--smc-lantern);color:#17130d;outline:none;transform:scale(1.06)}
.smc-toggle.is-paused{animation:smc-ring 2.6s ease-out infinite}
.smc-tabs{display:flex;flex-direction:column;gap:8px;padding:10px 0}
.smc-tab{position:relative;flex:1;display:flex;align-items:center;gap:14px;padding:12px 16px 14px;overflow:hidden;font-family:inherit;text-align:left;color:var(--smc-mist);background:rgba(12,17,25,.6);border:1px solid var(--smc-line);cursor:pointer;transition:background .35s ease,border-color .35s ease,color .35s ease,transform .35s ease}
.smc-tab:hover{color:var(--smc-mist-bright);border-color:rgba(217,160,91,.32);transform:translateX(-4px)}
.smc-tab.is-active{color:var(--smc-paper);background:linear-gradient(90deg,rgba(217,160,91,.14),rgba(12,17,25,.75));border-color:rgba(217,160,91,.55)}
.smc-tab:focus-visible{outline:1px solid var(--smc-lantern-bright);outline-offset:2px}
.smc-tab-no{display:grid;place-items:center;flex-shrink:0;width:34px;height:34px;border:1px solid currentColor;border-radius:50%;font-size:14px;opacity:.8;transition:background .35s ease,color .35s ease,border-color .35s ease,box-shadow .35s ease}
.smc-tab.is-active .smc-tab-no{color:#17130d;background:var(--smc-lantern);border-color:var(--smc-lantern);box-shadow:0 0 16px rgba(217,160,91,.5);opacity:1}
.smc-tab-text{display:flex;flex-direction:column;line-height:1.5}
.smc-tab-title{font-size:15px;font-weight:700;letter-spacing:.16em;white-space:nowrap}
.smc-tab-en{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--smc-lantern);opacity:.8}
.smc-tab-track{position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(139,152,169,.12)}
.smc-tab-bar{display:block;height:100%;background:linear-gradient(90deg,var(--smc-lantern),var(--smc-lantern-bright));box-shadow:0 0 8px rgba(237,193,134,.6);transform:scaleX(0);transform-origin:left center}
@keyframes smc-rec-pulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes smc-ring{0%{box-shadow:0 0 0 0 rgba(237,193,134,.45)}70%,100%{box-shadow:0 0 0 22px rgba(237,193,134,0)}}
@keyframes smc-caption-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@container (max-width:60rem){
.smc-grid{grid-template-columns:minmax(0,1fr);gap:14px}
.smc-tabs{flex-direction:row;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0 10px 4px}
.smc-tabs::-webkit-scrollbar{display:none}
.smc-tab{flex:0 0 auto;min-width:176px;scroll-snap-align:start}
.smc-tab:hover{transform:none}
}
@container (max-width:40rem){
.smc-frame{padding:6px}
.smc-corner{width:16px;height:16px}
.smc-meta{flex-direction:column-reverse;gap:10px;padding:12px 4px 0}
.smc-caption{gap:12px;min-height:0}
.smc-caption-no{font-size:24px}
.smc-caption strong{font-size:16px}
.smc-caption p{font-size:13.5px}
.smc-controls{width:100%;justify-content:space-between}
.smc-live{font-size:10px;letter-spacing:.2em;padding:3px 9px}
.smc-toggle{width:34px;height:34px}
.smc-tab{min-width:150px;padding:10px 12px 12px;gap:10px}
.smc-tab-no{width:28px;height:28px;font-size:12px}
.smc-tab-title{font-size:14px;letter-spacing:.1em}
}
@media (prefers-reduced-motion:reduce){
.smc-caption,.smc-live-dot,.smc-toggle.is-paused{animation:none}
.smc-video{transition:none;transform:none}
}
`;
