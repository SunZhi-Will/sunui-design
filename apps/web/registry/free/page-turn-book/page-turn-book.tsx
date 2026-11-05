"use client";

/**
 * 翻頁書：純 CSS 3D。先看到闔著的皮革封面（書名、方塊紋章；special 的書有一條書籤緞帶），
 * 翻開後左頁是書名頁，之後每個跨頁兩頁。旅人手記畫成夾在書裡的紙條，手繪地圖有小地圖與方位箭頭。
 *
 * 每一張書頁是一片 leaf（正面＝右頁、背面＝下一個跨頁的左頁），繞書脊 rotateY(-180deg) 翻過去。
 * 書容器不開 preserve-3d，疊放順序完全交給 z-index；正在翻的那幾片暫時墊到最上面，
 * 所以連點很快時會像翻書一樣一片疊一片落下。
 *
 * 操作：→／D／空白／PageDown／滾輪下／點右頁（或封面）＝下一頁；←／A／PageUp／滾輪上／點左頁＝上一頁；Esc 闔上。
 */
import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type BookPageObject =
  | { kind: "text"; text: ReactNode }
  /** note、chart 頁翻到後蓋的小印；bearing 是地圖目標方位（弧度，0＝北、順時針），沒有就不畫 X */
  | { kind: "note"; text: ReactNode; stamp?: ReactNode }
  | { kind: "chart"; text: ReactNode; stamp?: ReactNode; bearing?: number }
  | { kind: "end" };

/** 一頁可以是有型別的頁物件，或任意 ReactNode（當成一般文字頁排版） */
export type BookPage = BookPageObject | ReactNode;

export type BookLeather = readonly [dark: string, main: string, light: string];

export interface PageTurnBookLabels {
  /** 封面下方小字 */
  openIt: string;
  /** 書名頁的頁數，{n} 代入 */
  pages: string;
  theEnd: string;
  note: string;
  map: string;
  closedHint: string;
  openHint: string;
  /** 有 onClose 時接在提示後面，{key} 代入 closeKey */
  closeHint: string;
  closeKey: string;
  prev: string;
  next: string;
  /** 頁點的 aria-label，{n} 代入 */
  goToSpread: string;
  /** 朗讀目前位置，{n}／{total} 代入；封面時用 closed */
  spreadStatus: string;
  closed: string;
}

const defaultLabels: PageTurnBookLabels = {
  openIt: "Open it and see",
  pages: "{n} pages",
  theEnd: "The End",
  note: "A traveller's note",
  map: "A hand-drawn map",
  closedHint: "→ or click the book to open it",
  openHint: "← → turn pages",
  closeHint: "{key} close",
  closeKey: "Esc",
  prev: "Previous page",
  next: "Next page",
  goToSpread: "Go to spread {n}",
  spreadStatus: "Spread {n} of {total}",
  closed: "Book closed",
};

export interface PageTurnBookProps {
  title: string;
  pages: BookPage[];
  /** 書本上方那一行（例如「晨霧村・書架」） */
  heading?: ReactNode;
  /** 五種皮革之一（0..4），或自訂 [深色, 主色, 亮面] */
  cover?: number | BookLeather;
  /** 特別的書：封面有書籤緞帶 */
  special?: boolean;
  /** 文字頁首行縮排兩字（中文書用） */
  indent?: boolean;
  /** 第幾個跨頁翻開、看得到了（0＝剛翻開封面） */
  onSpread?: (spread: number) => void;
  /** 點背景或按 Esc 闔上；沒給就不顯示闔上提示 */
  onClose?: () => void;
  /** true：蓋滿視窗的閱讀層，鍵盤聽 window；false：嵌在容器裡，鍵盤聽元件本身 */
  fixed?: boolean;
  labels?: Partial<PageTurnBookLabels>;
  className?: string;
}

const FLIP_MS = 560;
/** 一次跳好幾頁時，每一片之間的間隔 */
const STAGGER_MS = 70;

const INK = "#3b2a1a";
const PAPER = "#f2e6c8";
const GOLD = "#d9b36a";
const SERIF = '"Noto Serif TC", "Songti TC", "PMingLiU", "Georgia", serif';

/** 五種皮革：[深色, 主色, 亮面] */
const LEATHERS: readonly BookLeather[] = [
  ["#3a1a10", "#5b2d1c", "#6b3522"],
  ["#14301f", "#24513a", "#2d6047"],
  ["#161f3a", "#27386a", "#30447c"],
  ["#3a1220", "#65233a", "#772b46"],
  ["#1a1a1c", "#2c2c30", "#39393f"],
];

const PAGE_KINDS = new Set(["text", "note", "chart", "end"]);
function asPageObject(page: BookPage): BookPageObject | null {
  if (page && typeof page === "object" && !isValidElement(page) && "kind" in page && PAGE_KINDS.has((page as { kind: string }).kind)) {
    return page as BookPageObject;
  }
  return null;
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

export function PageTurnBook({
  title,
  pages,
  heading,
  cover = 0,
  special = false,
  indent = false,
  onSpread,
  onClose,
  fixed = false,
  labels: labelsProp,
  className,
}: PageTurnBookProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const reduce = usePrefersReducedMotion();
  const flipMs = reduce ? 0 : FLIP_MS;
  const staggerMs = reduce ? 0 : STAGGER_MS;

  /** 跨頁數（含第一個「書名頁＋第 1 頁」） */
  const n = Math.ceil((pages.length + 1) / 2);
  const leather = typeof cover === "number" ? LEATHERS[((cover % LEATHERS.length) + LEATHERS.length) % LEATHERS.length] : cover;
  /** 翻過去的片數：0＝闔著（封面）；k+1＝看第 k 個跨頁 */
  const [flipped, setFlipped] = useState(0);
  const flippedRef = useRef(0);
  const flightRef = useRef(new Map<number, { z: number; delay: number; until: number }>());
  const seqRef = useRef(0);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const cleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (target: number) => {
      const to = Math.max(0, Math.min(n, target));
      const from = flippedRef.current;
      if (to === from) return;
      const now = performance.now();
      const leaves: number[] = [];
      if (to > from) for (let i = from; i < to; i++) leaves.push(i);
      else for (let i = from - 1; i >= to; i--) leaves.push(i);
      let maxEnd = 0;
      leaves.forEach((leaf, k) => {
        const delay = k * staggerMs;
        flightRef.current.set(leaf, { z: 1000 + ++seqRef.current, delay, until: now + flipMs + delay });
        maxEnd = Math.max(maxEnd, flipMs + delay);
      });
      flippedRef.current = to;
      setFlipped(to);
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
      cleanupRef.current = setTimeout(() => {
        cleanupRef.current = null;
        const t = performance.now();
        for (const [leaf, f] of flightRef.current) if (f.until <= t) flightRef.current.delete(leaf);
        bump();
      }, maxEnd + 40);
    },
    [n, flipMs, staggerMs],
  );

  useEffect(
    () => () => {
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    },
    [],
  );

  // 頁數變少時把目前位置收回範圍內
  useEffect(() => {
    if (flippedRef.current > n) goTo(n);
  }, [n, goTo]);

  const spread = flipped - 1;
  useEffect(() => {
    if (spread >= 0) onSpread?.(spread);
  }, [spread, onSpread]);

  const next = useCallback(() => goTo(flippedRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(flippedRef.current - 1), [goTo]);

  const handleKey = useCallback(
    (e: KeyboardEvent | ReactKeyboardEvent) => {
      const code = e.code;
      if (code === "ArrowRight" || code === "KeyD" || code === "Space" || code === "PageDown") {
        e.preventDefault();
        next();
        return;
      }
      if (code === "ArrowLeft" || code === "KeyA" || code === "PageUp") {
        e.preventDefault();
        prev();
        return;
      }
      if (code === "Escape" && onClose && !e.repeat) {
        e.preventDefault();
        onClose();
      }
    },
    [next, prev, onClose],
  );

  // ── 鍵盤：fixed 時整個視窗都是書，聽 window；比書出現還早的按鍵一律不理 ──
  const mountedAtRef = useRef(0);
  useEffect(() => {
    if (!fixed) return;
    mountedAtRef.current = performance.now();
    const onKey = (e: KeyboardEvent) => {
      if (e.timeStamp <= mountedAtRef.current) return;
      const t = e.target as HTMLElement | null;
      // 焦點在頁點或箭頭按鈕上時，空白鍵交給按鈕本身
      if (e.code === "Space" && t?.tagName === "BUTTON") return;
      handleKey(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fixed, handleKey]);

  // ── 滾輪：觸控板一次會丟很多小事件，累積到一格再翻 ──
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelAcc = useRef(0);
  const wheelAt = useRef(0);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY + e.deltaX;
      // 嵌在頁面裡時，已經翻到底的方向讓頁面照常捲動
      if (!fixed && ((delta > 0 && flippedRef.current >= n) || (delta < 0 && flippedRef.current <= 0))) return;
      e.preventDefault();
      const now = performance.now();
      if (now - wheelAt.current > 300) wheelAcc.current = 0;
      wheelAt.current = now;
      wheelAcc.current += delta;
      if (wheelAcc.current > 60) {
        wheelAcc.current = 0;
        next();
      } else if (wheelAcc.current < -60) {
        wheelAcc.current = 0;
        prev();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [fixed, n, next, prev]);

  const bookRef = useRef<HTMLDivElement>(null);
  const onBookClick = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      if (flippedRef.current === 0) {
        next();
        return;
      }
      const r = bookRef.current?.getBoundingClientRect();
      if (!r) return;
      if (e.clientX >= r.left + r.width / 2) next();
      else prev();
    },
    [next, prev],
  );

  const now = performance.now();
  const closed = flipped === 0;
  const emblem = useMemo(() => emblemFor(title), [title]);
  const textPages = pages.filter((p) => asPageObject(p)?.kind !== "end").length;
  const fadeIn = closed || reduce ? "none" : `opacity 80ms linear ${Math.round(FLIP_MS * 0.55)}ms`;

  const leafStyle = (i: number): CSSProperties => {
    const isFlipped = i < flipped;
    const flight = flightRef.current.get(i);
    const inFlight = flight && flight.until > now;
    return {
      position: "absolute",
      top: 0,
      left: "50%",
      width: "50%",
      height: "100%",
      transformOrigin: "left center",
      transformStyle: "preserve-3d",
      transform: isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)",
      transition: `transform ${flipMs}ms cubic-bezier(.42,.08,.24,1) ${inFlight ? flight.delay : 0}ms`,
      zIndex: inFlight ? flight.z : isFlipped ? i + 1 : n - i,
    };
  };

  /** 跨頁 k 的左頁：0＝書名頁，之後是第 2k 頁（索引 2k−1） */
  const leftOf = (k: number, board: boolean) =>
    k === 0 ? (
      <TitlePage title={title} leather={leather} emblem={emblem} pagesLabel={labels.pages.replace("{n}", String(textPages))} board={board} />
    ) : (
      <PageView page={pages[2 * k - 1]} side="left" no={2 * k} total={textPages} indent={indent} labels={labels} />
    );
  /** 跨頁 k 的右頁：索引 2k */
  const rightOf = (k: number) => <PageView page={pages[2 * k]} side="right" no={2 * k + 1} total={textPages} indent={indent} labels={labels} />;

  const leaves: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    leaves.push(
      <div key={i} style={leafStyle(i)} aria-hidden={i < flipped - 1 || i > flipped ? true : undefined}>
        <div style={{ ...faceBase, transform: "rotateY(0deg)" }}>
          {i === 0 ? <Cover title={title} leather={leather} emblem={emblem} special={special} openIt={labels.openIt} /> : rightOf(i - 1)}
        </div>
        <div style={{ ...faceBase, transform: "rotateY(180deg)" }}>{leftOf(i, i === 0)}</div>
      </div>,
    );
  }

  const hint = (closed ? labels.closedHint : labels.openHint) + (onClose ? ` · ${labels.closeHint.replace("{key}", labels.closeKey)}` : "");

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="book"
      aria-label={title}
      tabIndex={fixed ? -1 : 0}
      onKeyDown={
        fixed
          ? undefined
          : (e) => {
              if (e.code === "Space" && (e.target as HTMLElement).tagName === "BUTTON") return;
              handleKey(e);
            }
      }
      onClick={onClose}
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-[#d9b36a]/70", className)}
      style={{
        position: fixed ? "fixed" : "relative",
        inset: fixed ? 0 : undefined,
        zIndex: fixed ? 320 : undefined,
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: fixed ? undefined : "28px 24px 24px",
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.62) 75%)",
      }}
    >
      {heading != null && <div style={{ color: GOLD, fontFamily: SERIF, fontSize: 14, letterSpacing: 2, textShadow: "0 1px 4px #000", textAlign: "center" }}>{heading}</div>}
      <div style={{ perspective: 2400, perspectiveOrigin: "50% 30%", width: fixed ? "min(860px, calc(100vw - 48px))" : "min(860px, 100%)" }}>
        <div
          ref={bookRef}
          onClick={onBookClick}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "860 / 520",
            containerType: "inline-size",
            transform: `rotateX(14deg) translateX(${closed ? "-25%" : "0%"})`,
            transition: `transform ${reduce ? 0 : 520}ms cubic-bezier(.3,.7,.2,1)`,
            perspective: 2200,
            cursor: "pointer",
          }}
        >
          {/* 地上的影子 */}
          <div
            style={{
              position: "absolute",
              left: closed ? "52%" : "2%",
              right: "-2%",
              top: "6%",
              bottom: "-6%",
              background: "rgba(0,0,0,0.55)",
              filter: "blur(18px)",
              transition: `left ${reduce ? 0 : 520}ms`,
            }}
          />
          {/* 封底板＋右邊書頁堆 */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "-1.6%",
              width: "51.4%",
              height: "103.2%",
              background: `linear-gradient(90deg, ${leather[0]}, ${leather[1]} 12%)`,
              borderRadius: "0 6px 6px 0",
              boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.35)",
            }}
          />
          <div aria-hidden style={{ position: "absolute", left: "50%", top: 0, width: "50%", height: "100%", zIndex: 0, boxShadow: pageEdges(n - flipped, 1) }}>
            {rightOf(n - 1)}
          </div>
          {/* 左邊翻過去的書頁堆：封面翻過書脊（約一半）才淡入，闔上時立刻撤掉 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "50%",
              height: "100%",
              zIndex: 0,
              boxShadow: pageEdges(flipped - 1, -1),
              background: PAPER,
              pointerEvents: "none",
              opacity: closed ? 0 : 1,
              transition: fadeIn,
            }}
          />
          {leaves}
          {/* 書脊的陰影 */}
          <div
            style={{
              position: "absolute",
              left: "46%",
              width: "8%",
              top: 0,
              height: "100%",
              zIndex: 5000,
              pointerEvents: "none",
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(40,20,5,0.22) 45%, rgba(40,20,5,0.3) 50%, rgba(40,20,5,0.22) 55%, rgba(0,0,0,0) 100%)",
              opacity: closed ? 0 : 1,
              transition: fadeIn,
            }}
          />
        </div>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 18, color: "#e9dcc0", fontSize: 12, textShadow: "0 1px 3px #000" }}
      >
        <NavButton label="‹" ariaLabel={labels.prev} disabled={flipped <= 0} onClick={prev} />
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: n }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={labels.goToSpread.replace("{n}", String(i + 1))}
              aria-current={i === spread ? "page" : undefined}
              onClick={() => goTo(i + 1)}
              style={{
                width: i === spread ? 18 : 8,
                height: 8,
                padding: 0,
                border: "none",
                cursor: "pointer",
                background: i === spread ? GOLD : "rgba(233,220,192,0.35)",
                transition: reduce ? "none" : "width 160ms",
              }}
            />
          ))}
        </div>
        <NavButton label="›" ariaLabel={labels.next} disabled={flipped >= n} onClick={next} />
        <span style={{ opacity: 0.75, textAlign: "center" }}>{hint}</span>
      </div>
      <span aria-live="polite" style={srOnly}>
        {closed ? labels.closed : labels.spreadStatus.replace("{n}", String(spread + 1)).replace("{total}", String(n))}
      </span>
    </div>
  );
}

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

const faceBase: CSSProperties = {
  position: "absolute",
  inset: 0,
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

/** 書頁厚度：往外疊幾條 1px 的紙邊。dir＝1 往右、−1 往左 */
function pageEdges(count: number, dir: 1 | -1): string {
  const k = Math.max(0, Math.min(6, count));
  if (k === 0) return "none";
  const out: string[] = [];
  for (let i = 1; i <= k; i++) out.push(`${dir * i}px ${i * 0.6}px 0 ${i % 2 ? "#d9caa4" : "#efe2c2"}`);
  return out.join(", ");
}

const NavButton: FC<{ label: string; ariaLabel: string; disabled: boolean; onClick: () => void }> = ({ label, ariaLabel, disabled, onClick }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={onClick}
    style={{
      width: 30,
      height: 30,
      fontSize: 20,
      lineHeight: "26px",
      padding: 0,
      background: "rgba(40,24,14,0.85)",
      color: disabled ? "#6b5a44" : GOLD,
      border: `2px solid ${disabled ? "#3a2a1c" : "#8a6a3a"}`,
      cursor: disabled ? "default" : "pointer",
      fontFamily: SERIF,
    }}
  >
    {label}
  </button>
);

const paper = (side: "left" | "right"): CSSProperties => ({
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  background: PAPER,
  color: INK,
  fontFamily: SERIF,
  backgroundImage:
    side === "right"
      ? "linear-gradient(90deg, rgba(90,60,20,0.2) 0%, rgba(90,60,20,0) 9%), radial-gradient(ellipse at 70% 40%, rgba(255,255,255,0.25), rgba(0,0,0,0) 70%)"
      : "linear-gradient(270deg, rgba(90,60,20,0.2) 0%, rgba(90,60,20,0) 9%), radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.25), rgba(0,0,0,0) 70%)",
  borderRadius: side === "right" ? "0 3px 3px 0" : "3px 0 0 3px",
});

// 原本的 vw 字級改成以書寬為準的 cqw（書寬約等於原本的 100vw − 48px），嵌在小容器裡也照比例縮
const fluid = (min: number, cqw: number, max: number) => `clamp(${min}px, ${cqw}cqw, ${max}px)`;

const Cover: FC<{ title: string; leather: BookLeather; emblem: Emblem; special: boolean; openIt: string }> = ({ title, leather, emblem, special, openIt }) => (
  <div
    style={{
      position: "absolute",
      inset: "-1.6% -2.8% -1.6% 0",
      borderRadius: "0 6px 6px 0",
      background: `linear-gradient(90deg, ${leather[0]} 0%, ${leather[1]} 10%, ${leather[2]} 55%, ${leather[1]} 100%)`,
      boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.35), inset 0 0 40px rgba(0,0,0,0.35)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      color: GOLD,
      fontFamily: SERIF,
    }}
  >
    <div style={{ position: "absolute", inset: 16, border: `2px solid ${GOLD}88` }} />
    {(
      [
        [12, 12],
        [12, null],
        [null, 12],
        [null, null],
      ] as const
    ).map(([t, l], i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          background: GOLD,
          opacity: 0.8,
          top: t ?? undefined,
          bottom: t === null ? 12 : undefined,
          left: l ?? undefined,
          right: l === null ? 12 : undefined,
        }}
      />
    ))}
    <EmblemView emblem={emblem} gold />
    <div style={{ fontSize: fluid(18, 2.6, 28), letterSpacing: 4, textAlign: "center", padding: "0 12%", lineHeight: 1.5, textShadow: "0 2px 0 rgba(0,0,0,0.5)" }}>{title}</div>
    <div style={{ width: 90, height: 2, background: GOLD, opacity: 0.7 }} />
    <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: 2 }}>{openIt}</div>
    {special && (
      // 書籤緞帶：特別的書才有，從封面下緣垂出來
      <div
        style={{
          position: "absolute",
          right: "18%",
          bottom: "-4%",
          width: 16,
          height: "11%",
          background: "#a3262a",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
        }}
      />
    )}
  </div>
);

const TitlePage: FC<{ title: string; leather: BookLeather; emblem: Emblem; pagesLabel: string; board: boolean }> = ({ title, leather, emblem, pagesLabel, board }) => (
  <>
    {board && (
      <div
        style={{
          position: "absolute",
          inset: "-1.6% 0 -1.6% -2.8%",
          borderRadius: "6px 0 0 6px",
          background: `linear-gradient(270deg, ${leather[0]}, ${leather[1]} 12%)`,
        }}
      />
    )}
    <div style={{ ...paper("left"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: "8% 12%" }}>
      <EmblemView emblem={emblem} />
      <div style={{ fontSize: fluid(16, 2.3, 24), fontWeight: 700, textAlign: "center", lineHeight: 1.4 }}>{title}</div>
      <div style={{ width: 60, height: 1, background: INK, opacity: 0.4 }} />
      <div style={{ fontSize: 12, opacity: 0.55, letterSpacing: 2 }}>{pagesLabel}</div>
    </div>
  </>
);

const PageView: FC<{ page: BookPage | undefined; side: "left" | "right"; no: number; total: number; indent: boolean; labels: PageTurnBookLabels }> = ({
  page,
  side,
  no,
  total,
  indent,
  labels,
}) => {
  if (page === undefined || page === null || page === false) return <div style={paper(side)} />;
  const obj = asPageObject(page);
  if (obj?.kind === "end") {
    return (
      <div style={{ ...paper(side), display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, opacity: 0.85 }}>
        <div style={{ fontSize: 26, color: "#8a6a3a" }}>✦</div>
        <div style={{ fontSize: 14, letterSpacing: 6, opacity: 0.6 }}>{labels.theEnd}</div>
      </div>
    );
  }
  if (obj?.kind === "note" || obj?.kind === "chart") {
    return (
      <div style={{ ...paper(side), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "78%",
            padding: "18px 20px 16px",
            transform: `rotate(${side === "right" ? -2.2 : 1.6}deg)`,
            background: "#e6d3a6",
            color: "#2e2011",
            fontFamily: SERIF,
            boxShadow: "2px 4px 10px rgba(0,0,0,0.3)",
            backgroundImage: "repeating-linear-gradient(0deg, rgba(90,60,20,0.08) 0 1px, transparent 1px 26px)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8, letterSpacing: 1 }}>{obj.kind === "note" ? labels.note : labels.map}</div>
          {obj.kind === "chart" && <MapSketch bearing={obj.bearing} />}
          <div style={{ fontSize: fluid(13, 1.5, 16), lineHeight: 1.85 }}>{obj.text}</div>
          {obj.stamp != null && (
            <div
              style={{
                marginTop: 12,
                display: "inline-block",
                padding: "2px 8px",
                fontSize: 11,
                color: "#9b2c1c",
                border: "2px solid #9b2c1c",
                transform: "rotate(3deg)",
                opacity: 0.85,
              }}
            >
              {obj.stamp}
            </div>
          )}
        </div>
      </div>
    );
  }
  const body = obj?.kind === "text" ? obj.text : (page as ReactNode);
  return (
    <div style={{ ...paper(side), padding: "10% 11% 8%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: fluid(14, 1.7, 18), lineHeight: 2, whiteSpace: "pre-line", textIndent: indent ? "2em" : 0, flex: 1, minHeight: 0 }}>{body}</div>
      <div style={{ textAlign: "center", fontSize: 11, opacity: 0.45 }}>
        {no} / {total}
      </div>
    </div>
  );
};

/** 手繪小地圖：中間是書架（這座房子），虛線通向 X，右上角一個指北的羅盤。bearing 沒有就不畫 X */
const MapSketch: FC<{ bearing: number | undefined }> = ({ bearing }) => {
  const cx = 100,
    cy = 62,
    R = 44;
  const hasTarget = bearing !== undefined;
  const tx = hasTarget ? cx + Math.sin(bearing) * R : cx,
    ty = hasTarget ? cy - Math.cos(bearing) * R : cy;
  // 路徑往側面彎一點，像手畫的
  const mx = (cx + tx) / 2 + (hasTarget ? -Math.cos(bearing) * 9 : 0),
    my = (cy + ty) / 2 + (hasTarget ? -Math.sin(bearing) * 9 : 0);
  return (
    <svg
      viewBox="0 0 200 124"
      width="100%"
      aria-hidden
      style={{ display: "block", marginBottom: 8, background: "#efe0b8", border: "1px solid rgba(90,60,20,0.35)" }}
    >
      {[
        [24, 24],
        [40, 96],
        [158, 100],
        [150, 20],
        [70, 30],
        [128, 82],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x - 7} ${y + 5} L${x} ${y - 6} L${x + 7} ${y + 5} Z`} fill="none" stroke="#8a6a3a" strokeWidth={1.2} opacity={0.6} />
      ))}
      {hasTarget && <path d={`M${cx} ${cy} Q${mx} ${my} ${tx} ${ty}`} fill="none" stroke="#6b4a1e" strokeWidth={1.6} strokeDasharray="4 4" />}
      <path d={`M${cx - 6} ${cy + 5} L${cx - 6} ${cy - 2} L${cx} ${cy - 8} L${cx + 6} ${cy - 2} L${cx + 6} ${cy + 5} Z`} fill="#b98a4a" stroke="#5a3a14" strokeWidth={1.2} />
      {hasTarget && (
        <g stroke="#9b2c1c" strokeWidth={3} strokeLinecap="round">
          <path d={`M${tx - 6} ${ty - 6} L${tx + 6} ${ty + 6}`} />
          <path d={`M${tx + 6} ${ty - 6} L${tx - 6} ${ty + 6}`} />
        </g>
      )}
      <g transform="translate(176 24)" stroke="#5a3a14" strokeWidth={1.2} fill="none">
        <circle r={13} />
        <path d="M0 -11 L4 2 L0 -1 L-4 2 Z" fill="#5a3a14" />
        <text y={-16} textAnchor="middle" fontSize={9} fill="#5a3a14" stroke="none" fontFamily={SERIF}>
          N
        </text>
      </g>
    </svg>
  );
};

// ── 方塊紋章：每本書一枚，從書名雜湊出一個左右對稱的 7×7 圖樣 ──
interface Emblem {
  cells: boolean[];
  colors: [string, string];
}

const EMBLEM_PALETTES: [string, string][] = [
  ["#7a3b2e", "#c98b4a"],
  ["#2f4f6b", "#7fa7c4"],
  ["#3e5a2c", "#9bbf6a"],
  ["#5a3a6b", "#b28ac4"],
  ["#6b4a1e", "#d9b36a"],
  ["#2e5a57", "#79bdb2"],
  ["#6b2e3e", "#d07a8c"],
];

/** FNV-1a 雜湊後丟進 mulberry32 取一個 [0,1) 確定性值 */
function rollFromKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function emblemFor(title: string): Emblem {
  const cells: boolean[] = new Array(49).fill(false);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 4; x++) {
      const on = rollFromKey(`emblem:${title}:${x}:${y}`) > 0.5;
      cells[y * 7 + x] = on;
      cells[y * 7 + (6 - x)] = on;
    }
  }
  const colors = EMBLEM_PALETTES[Math.floor(rollFromKey(`emblem:${title}:pal`) * EMBLEM_PALETTES.length)];
  return { cells, colors };
}

const EmblemView: FC<{ emblem: Emblem; gold?: boolean }> = ({ emblem, gold }) => (
  <svg viewBox="-1 -1 9 9" width="22%" aria-hidden style={{ maxWidth: 96, opacity: 0.9, shapeRendering: "crispEdges" }}>
    <rect x={-1} y={-1} width={9} height={9} fill="none" stroke={gold ? GOLD : emblem.colors[0]} strokeWidth={0.3} />
    {emblem.cells.map(
      (on, i) =>
        on && (
          <rect
            key={i}
            x={i % 7}
            y={Math.floor(i / 7)}
            width={1}
            height={1}
            fill={gold ? GOLD : ((i % 7) + Math.floor(i / 7)) % 3 === 0 ? emblem.colors[1] : emblem.colors[0]}
            opacity={gold ? (((i % 7) + Math.floor(i / 7)) % 3 === 0 ? 0.95 : 0.65) : 1}
          />
        ),
    )}
  </svg>
);
