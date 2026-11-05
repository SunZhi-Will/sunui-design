"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * 能真的翻閱的 3D 書：書封、書脊、書口三面與書背組成的長方體。
 *
 * - 一開始是闔著、側轉露出書脊的書；點書封或「翻開」會轉正並翻開書封。
 * - 內文（children）以 CSS 多欄切成固定大小的頁。每一個看得到的頁面都是
 *   同一份內容平移後的一個視窗，頁數由實際排版量出來，不寫死每頁幾段。
 * - 翻頁時有一張紙從書口繞著書脊翻過去；邏輯頁碼立刻更新，動畫只是疊在
 *   上面的視覺層。
 * - 書封預設以 CSS 繪製；傳入 frontSrc／spineSrc／backSrc 則改用圖片。
 */

const TURN_DURATION_MS = 720;
const SWIPE_THRESHOLD_PX = 40;

type VirtualPage = { kind: "page"; index: number } | { kind: "cover-inside" } | { kind: "endpaper" };

interface Geometry {
  pageWidth: number;
  pageHeight: number;
  rim: number;
  depth: number;
  fontSize: number;
  padX: number;
  padTop: number;
  padBottom: number;
  contentWidth: number;
  contentHeight: number;
  columnGap: number;
}

type Turn = {
  direction: "next" | "prev";
  from: number;
  to: number;
  key: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 由舞台可用空間推出書頁大小。高度夠時用接近實體書的 0.72 頁寬比；
 * 高度很少時就讓頁面變寬，換取每行多幾個字。
 */
function computeGeometry(availableWidth: number, availableHeight: number): Geometry {
  const baseHeight = Math.max(200, Math.min(availableHeight * (availableHeight < 480 ? 0.97 : 0.9), 820));
  const ratio = baseHeight >= 480 ? 0.72 : 1.1;
  const pageWidth = Math.round(Math.max(150, Math.min((availableWidth * 0.94) / 2, baseHeight * ratio)));
  const pageHeight = Math.round(Math.min(baseHeight, pageWidth / 0.5));
  // 紙頁比書殼小一圈（rim），內文版心依紙頁而不是書殼計算。
  const rim = Math.max(3, Math.round(pageWidth * 0.016));
  const sheetWidth = pageWidth - rim;
  const sheetHeight = pageHeight - rim * 2;
  const padX = Math.round(sheetWidth * 0.11);
  const padTop = Math.round(sheetHeight * 0.085);
  const padBottom = Math.round(sheetHeight * 0.1);
  return {
    pageWidth,
    pageHeight,
    rim,
    depth: Math.round(clamp(pageWidth * 0.07, 8, 26)),
    fontSize: Math.round(clamp(pageWidth * 0.037, 12, 17.5) * 10) / 10,
    padX,
    padTop,
    padBottom,
    contentWidth: sheetWidth - padX * 2,
    contentHeight: sheetHeight - padTop - padBottom,
    columnGap: padX * 2,
  };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildVirtualPages(pageCount: number): VirtualPage[] {
  const pages: VirtualPage[] = [{ kind: "cover-inside" }];
  for (let index = 0; index < pageCount; index += 1) pages.push({ kind: "page", index });
  if (pages.length % 2 === 1) pages.push({ kind: "endpaper" });
  return pages;
}

/** 量頁數用：內文裡標了 data-book-end 的元素，沒有就取最後一個最深的元素。 */
function findEndMark(flow: HTMLElement): Element | null {
  const marked = flow.querySelector("[data-book-end]");
  if (marked) return marked;
  let node: Element | null = flow.lastElementChild;
  while (node?.lastElementChild) node = node.lastElementChild;
  return node;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/** 書目前朝哪一面：闔著看封面、翻開閱讀、闔著看書背。 */
export type Book3DSide = "front" | "open" | "back";

export interface Book3DPosition {
  side: Book3DSide;
  open: boolean;
  spread: number;
  spreadCount: number;
  /** 目前跨頁實際印著的內文頁碼（從 1 起算），闔書時為空陣列。 */
  pageNumbers: number[];
  pageCount: number;
}

export interface Book3DControls {
  position: Book3DPosition;
  goNext(): void;
  goPrev(): void;
}

export interface Book3DLabels {
  nav?: string;
  openHint?: string;
  backSide?: string;
  titlePage?: string;
  openCover?: string;
  toBack?: string;
  next?: string;
  close?: string;
  prev?: string;
  /** 控制列的頁碼，例如 3–4 / 9 */
  pageOf?: (pages: number[], total: number) => string;
}

export interface Book3DCover {
  /** 書封書名下方的英文副題 */
  subtitle?: string;
  /** 書封上的短文案，一行一句 */
  blurb?: string[];
  /** 書封下方的分類標 */
  tagline?: string;
  /** 書背的長文案，一行一句 */
  backBlurb?: string[];
  backTagline?: string;
}

export interface Book3DProps {
  /** 這一本的書名：題簽、扉頁、右頁書眉 */
  title: string;
  /** 書系名：書封大字、扉頁上方、左頁書眉 */
  seriesTitle?: string;
  /** 扉頁下方的體裁 */
  genre?: string;
  /** 內文。可用 novella-* class（見下方樣式）排出與原作相同的版面 */
  children: ReactNode;
  /** 書背摘要籤上的一行，例如卷數與抉擇次數 */
  summary?: ReactNode;
  /** 日期區間：書背摘要籤與版權頁 */
  date?: string;
  /** 版權頁的句子，一行一句 */
  colophon?: string[];
  cover?: Book3DCover;
  frontSrc?: string;
  spineSrc?: string;
  backSrc?: string;
  /** 方向鍵與 PageUp／PageDown 聽整個視窗，或只在元件內有焦點時 */
  keyboard?: "window" | "self";
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤；也決定書系名、書封文案等預設內容 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Book3DLabels;
  /** 自訂書下方的控制列；預設是上一頁、頁碼、下一頁 */
  renderControls?: (controls: Book3DControls) => ReactNode;
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

/** 控制列字串之外，也包含沒傳入時的預設書系名、體裁、版權頁與書封文案 */
interface Book3DMessages extends Required<Book3DLabels> {
  seriesTitle: string;
  genre: string;
  colophon: string[];
  cover: Required<Book3DCover>;
  /** 書系名與書名之間的分隔 */
  titleSeparator: string;
}

const MESSAGES: Record<SunLocale, Book3DMessages> = {
  en: {
    nav: "Memoir page controls",
    openHint: "Tap the cover to open",
    backSide: "Back cover",
    titlePage: "Title page",
    openCover: "Open",
    toBack: "Back cover",
    next: "Next",
    close: "Close",
    prev: "Previous",
    pageOf: (pages, total) => `${pages.join("–")} / ${total}`,
    seriesTitle: "Where the Mountains Await",
    genre: "Memoir",
    colophon: ["This book", "was written by every choice you made on this journey."],
    cover: {
      subtitle: "SHANHE WEIGUI",
      blurb: ["Eleven years gone, a letter in his late master's hand", "calls him back to the empty, mist-bound gate."],
      tagline: "Wuxia Story RPG",
      backBlurb: [
        "The gate is shut, yet the charcoal seller still climbs each month;",
        "a lost remedy, an erased name,",
        "and a letter that should not exist",
        "lead a long-departed swordsman back down the old road.",
      ],
      backTagline: "A narrative wuxia tale of memory, duty and choice.",
    },
    titleSeparator: " · ",
  },
  "zh-TW": {
    nav: "回憶錄翻頁",
    openHint: "點書封翻開",
    backSide: "書背",
    titlePage: "扉頁",
    openCover: "翻開書封",
    toBack: "看書背",
    next: "下一頁",
    close: "闔上",
    prev: "上一頁",
    pageOf: (pages, total) => `${pages.join("–")}／${total}`,
    seriesTitle: "山河未歸",
    genre: "回憶錄",
    colophon: ["這本書，", "由你在這一輪旅途中的每一個選擇寫成。"],
    cover: {
      subtitle: "WHERE THE MOUNTAINS AWAIT",
      blurb: ["離山十一年，一封亡師的親筆信，", "喚他重返霧鎖的空山門。"],
      tagline: "敘事武俠 RPG",
      backBlurb: [
        "山門關了，送炭的人仍每月上山；",
        "失去的藥、被抹去的名字，",
        "與一封不該存在的信，",
        "將一名離山多年的劍客帶回舊路。",
      ],
      backTagline: "一部關於記憶、責任與選擇的敘事武俠作品。",
    },
    titleSeparator: "・",
  },
  "zh-CN": {
    nav: "回忆录翻页",
    openHint: "点书封翻开",
    backSide: "书背",
    titlePage: "扉页",
    openCover: "翻开书封",
    toBack: "看书背",
    next: "下一页",
    close: "合上",
    prev: "上一页",
    pageOf: (pages, total) => `${pages.join("–")}／${total}`,
    seriesTitle: "山河未归",
    genre: "回忆录",
    colophon: ["这本书，", "由你在这一轮旅途中的每一个选择写成。"],
    cover: {
      subtitle: "WHERE THE MOUNTAINS AWAIT",
      blurb: ["离山十一年，一封亡师的亲笔信，", "唤他重返雾锁的空山门。"],
      tagline: "叙事武侠 RPG",
      backBlurb: [
        "山门关了，送炭的人仍每月上山；",
        "失去的药、被抹去的名字，",
        "与一封不该存在的信，",
        "将一名离山多年的剑客带回旧路。",
      ],
      backTagline: "一部关于记忆、责任与选择的叙事武侠作品。",
    },
    titleSeparator: "・",
  },
  ja: {
    nav: "回想録のページ送り",
    openHint: "表紙を押して開く",
    backSide: "裏表紙",
    titlePage: "扉",
    openCover: "表紙を開く",
    toBack: "裏表紙へ",
    next: "次へ",
    close: "閉じる",
    prev: "前へ",
    pageOf: (pages, total) => `${pages.join("–")}／${total}`,
    seriesTitle: "山河未帰",
    genre: "回想録",
    colophon: ["この本は、", "今回の旅であなたが重ねた選択で綴られています。"],
    cover: {
      subtitle: "WHERE THE MOUNTAINS AWAIT",
      blurb: ["山を離れて十一年。亡き師の直筆の手紙が、", "霧に閉ざされた無人の山門へ彼を呼び戻す。"],
      tagline: "物語武侠 RPG",
      backBlurb: [
        "山門は閉ざされても、炭売りは毎月山を登る。",
        "失われた薬、消された名、",
        "そしてあるはずのない一通の手紙が、",
        "山を離れて久しい剣客を古い道へ連れ戻す。",
      ],
      backTagline: "記憶と責任、そして選択をめぐる物語武侠作品。",
    },
    titleSeparator: "・",
  },
};

/** 書系名沒有中日文字時，書封大字改成可換行的較小字級 */
const CJK_RE = /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

export function Book3D({
  title,
  seriesTitle: seriesTitleProp,
  genre: genreProp,
  children,
  summary,
  date,
  colophon: colophonProp,
  cover,
  frontSrc,
  spineSrc,
  backSrc,
  keyboard = "window",
  locale = "en",
  labels,
  renderControls,
  className,
}: Book3DProps) {
  const m = MESSAGES[resolveLocale(locale)];
  const l = { ...m, ...labels };
  const c = { ...m.cover, ...cover };
  const seriesTitle = seriesTitleProp ?? m.seriesTitle;
  const genre = genreProp ?? m.genre;
  const colophon = colophonProp ?? m.colophon;
  const fullTitle = `${seriesTitle}${m.titleSeparator}${title}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const measureFlowRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1100, height: 620 });
  const [pageCount, setPageCount] = useState(1);
  const [side, setSide] = useState<Book3DSide>("front");
  const open = side === "open";
  const [spread, setSpread] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const turnTimer = useRef<number | undefined>(undefined);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const geometry = useMemo(() => computeGeometry(stageSize.width, stageSize.height), [stageSize]);
  const virtualPages = useMemo(() => buildVirtualPages(pageCount), [pageCount]);
  const spreadCount = virtualPages.length / 2;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize((previous) =>
          Math.abs(previous.width - rect.width) < 1 && Math.abs(previous.height - rect.height) < 1
            ? previous
            : { width: rect.width, height: rect.height },
        );
      }
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // 量頁數：看全書最後一個元素落在第幾欄。字型晚到會改變斷行，
  // 所以 document.fonts 就緒後再量一次。
  useLayoutEffect(() => {
    const measure = () => {
      const flow = measureFlowRef.current;
      const last = flow ? findEndMark(flow) : null;
      if (!flow || !last) return;
      const offset = last.getBoundingClientRect().left - flow.getBoundingClientRect().left;
      const stride = geometry.contentWidth + geometry.columnGap;
      const count = stride > 0 ? Math.max(1, Math.floor(Math.max(0, offset) / stride + 0.001) + 1) : 1;
      setPageCount(count);
    };
    measure();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [geometry, children]);

  // 版面改變後頁數可能變少，目前跨頁要夾回範圍內。
  useEffect(() => {
    setSpread((current) => Math.min(current, spreadCount - 1));
  }, [spreadCount]);

  useEffect(() => () => window.clearTimeout(turnTimer.current), []);

  const startTurn = useCallback((direction: "next" | "prev", from: number, to: number) => {
    window.clearTimeout(turnTimer.current);
    if (prefersReducedMotion()) {
      setTurn(null);
      return;
    }
    setTurn({ direction, from, to, key: Date.now() });
    turnTimer.current = window.setTimeout(() => setTurn(null), TURN_DURATION_MS);
  }, []);

  // 翻到最後一個跨頁再往後翻，書就闔上並轉到背面；從書背往前翻回到最後
  // 一頁。封面那一側同理：第一個跨頁往前翻就闔回封面。
  const goNext = useCallback(() => {
    if (side === "front") {
      setSide("open");
      return;
    }
    if (side === "back") return;
    if (spread >= spreadCount - 1) {
      setSide("back");
      return;
    }
    startTurn("next", spread, spread + 1);
    setSpread(spread + 1);
  }, [side, spread, spreadCount, startTurn]);

  const goPrev = useCallback(() => {
    if (side === "front") return;
    if (side === "back") {
      setSide("open");
      return;
    }
    if (spread === 0) {
      setSide("front");
      return;
    }
    startTurn("prev", spread, spread - 1);
    setSpread(spread - 1);
  }, [side, spread, startTurn]);

  useEffect(() => {
    const target: HTMLElement | Window | null = keyboard === "window" ? window : rootRef.current;
    if (!target) return;
    const handleKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.defaultPrevented || isEditable(e.target)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "PageUp") goPrev();
    };
    target.addEventListener("keydown", handleKeyDown);
    return () => target.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, keyboard]);

  const pageNumbers = useMemo(() => {
    if (!open) return [];
    return virtualPages
      .slice(spread * 2, spread * 2 + 2)
      .flatMap((page) => (page.kind === "page" ? [page.index + 1] : []));
  }, [open, spread, virtualPages]);

  const position: Book3DPosition = { side, open, spread, spreadCount, pageNumbers, pageCount };

  const flowStyle: CSSProperties = {
    width: geometry.contentWidth,
    height: geometry.contentHeight,
    columnWidth: geometry.contentWidth,
    columnGap: geometry.columnGap,
  };

  const coverInside = (
    <div className="m3d-page m3d-page-left m3d-cover-inside">
      <div className="m3d-cover-inside-content">
        <span className="m3d-cover-inside-mark">{seriesTitle}</span>
        <span className="m3d-cover-inside-rule" />
        <span className="m3d-cover-inside-title">{title}</span>
        <span className="m3d-cover-inside-genre">{genre}</span>
      </div>
    </div>
  );

  function renderFace(page: VirtualPage | undefined, faceSide: "left" | "right"): ReactNode {
    if (!page) return <div className={`m3d-page m3d-page-${faceSide} m3d-page-endpaper`} />;
    if (page.kind === "endpaper") {
      // 全書最後一頁的版權頁：頁數是奇數時補在最後，讓書不是停在一張白紙上。
      return (
        <div className={`m3d-page m3d-page-${faceSide} m3d-page-endpaper m3d-colophon`}>
          <div className="m3d-colophon-content">
            <span className="m3d-colophon-title">{fullTitle}</span>
            <span className="m3d-cover-inside-rule" />
            {colophon.map((line) => (
              <span key={line}>{line}</span>
            ))}
            {date && <span className="m3d-colophon-meta">{date}</span>}
          </div>
        </div>
      );
    }
    if (page.kind === "cover-inside") return coverInside;
    const offset = page.index * (geometry.contentWidth + geometry.columnGap);
    return (
      <div className={`m3d-page m3d-page-${faceSide}`}>
        {page.index > 0 && <div className="m3d-running-title">{faceSide === "left" ? seriesTitle : title}</div>}
        <div
          className="m3d-page-window"
          style={{ left: geometry.padX, top: geometry.padTop, width: geometry.contentWidth, height: geometry.contentHeight }}
        >
          <div className="novella-flow" style={{ ...flowStyle, transform: `translateX(${-offset}px)` }}>
            {children}
          </div>
        </div>
        <span className="m3d-page-number">{page.index + 1}</span>
      </div>
    );
  }

  // 翻頁途中：往後翻時左頁還停在舊的那一頁，直到翻起的紙落下蓋住它；
  // 往前翻時右頁則已經是目的地的右頁，紙從左邊翻回來。
  const leftStatic = turn?.direction === "next" ? turn.from : spread;
  const rightStatic = turn?.direction === "prev" ? turn.from : spread;
  const leftPage = virtualPages[leftStatic * 2];
  const rightPage = virtualPages[rightStatic * 2 + 1];
  const leafFront = turn ? virtualPages[(turn.direction === "next" ? turn.from : turn.to) * 2 + 1] : undefined;
  const leafBack = turn ? virtualPages[(turn.direction === "next" ? turn.to : turn.from) * 2] : undefined;

  const sceneStyle = {
    "--m3d-w": `${geometry.pageWidth}px`,
    "--m3d-h": `${geometry.pageHeight}px`,
    "--m3d-d": `${geometry.depth}px`,
    "--m3d-rim": `${geometry.rim}px`,
    "--m3d-fs": `${geometry.fontSize}px`,
    "--m3d-content-h": `${geometry.contentHeight}px`,
    "--m3d-turn-ms": `${TURN_DURATION_MS}ms`,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={fullTitle}
      tabIndex={keyboard === "self" ? 0 : undefined}
      className={cn("m3d-root", !CJK_RE.test(seriesTitle) && "m3d-latin", "relative flex h-[560px] w-full min-w-0 flex-col outline-none", className)}
    >
      <style>{BOOK_CSS}</style>
      <div className="m3d-stage" ref={stageRef}>
        {/* 輔助科技讀這一份線性的全文；下面每一頁的畫面都只是它的視窗。 */}
        <article className="sr-only" aria-label={fullTitle}>
          {children}
        </article>

        <div className="m3d-measure" aria-hidden="true" style={sceneStyle}>
          <div className="novella-flow" ref={measureFlowRef} style={flowStyle}>
            {children}
          </div>
        </div>

        <div
          className={`m3d-scene${open ? " is-open" : ""}${side === "back" ? " is-back" : ""}`}
          ref={sceneRef}
          style={sceneStyle}
          aria-hidden="true"
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current;
            pointerStart.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
              if (dx < 0) goNext();
              else goPrev();
              return;
            }
            if (!open) {
              if (side === "front") goNext();
              else goPrev();
              return;
            }
            const rect = sceneRef.current?.getBoundingClientRect();
            if (!rect) return;
            if (event.clientX >= rect.left + rect.width / 2) goNext();
            else goPrev();
          }}
        >
          <div className="m3d-book">
            <div className="m3d-back">
              {backSrc ? (
                <img src={backSrc} alt="" draggable={false} />
              ) : (
                <BackArt seriesTitle={seriesTitle} blurb={c.backBlurb} tagline={c.backTagline} />
              )}
              {/* 書背下方貼的摘要籤：像實體書背面的條碼貼紙那一塊。 */}
              <div className="m3d-back-summary">
                <span className="m3d-back-summary-title">{fullTitle}</span>
                {summary && <span>{summary}</span>}
                {date && <span className="m3d-back-summary-date">{date}</span>}
              </div>
            </div>
            <div className="m3d-spine">
              {spineSrc ? <img src={spineSrc} alt="" draggable={false} /> : <SpineArt seriesTitle={seriesTitle} />}
            </div>
            <div className="m3d-edge m3d-edge-right" />
            <div className="m3d-edge m3d-edge-top" />
            <div className="m3d-edge m3d-edge-bottom" />
            <div className="m3d-board" />

            <div className="m3d-sheet m3d-sheet-right">{renderFace(rightPage, "right")}</div>
            {open && leftStatic > 0 && <div className="m3d-sheet m3d-sheet-left">{renderFace(leftPage, "left")}</div>}

            <div className="m3d-cover">
              <div className="m3d-face m3d-face-front">
                {frontSrc ? (
                  <img src={frontSrc} alt="" draggable={false} />
                ) : (
                  <FrontArt seriesTitle={seriesTitle} subtitle={c.subtitle} blurb={c.blurb} tagline={c.tagline} />
                )}
                <div className="m3d-title-slip">
                  <span>{title}</span>
                </div>
              </div>
              <div className="m3d-face m3d-face-inside">{coverInside}</div>
            </div>

            {turn && (
              <div key={turn.key} className={`m3d-leaf m3d-leaf-${turn.direction}`}>
                <div className="m3d-face m3d-leaf-front">{renderFace(leafFront, "right")}</div>
                <div className="m3d-face m3d-leaf-back">{renderFace(leafBack, "left")}</div>
              </div>
            )}
          </div>
          <div className="m3d-shadow" />
        </div>
      </div>
      {renderControls ? renderControls({ position, goNext, goPrev }) : <DefaultControls position={position} goNext={goNext} goPrev={goPrev} labels={l} />}
    </div>
  );
}

function DefaultControls({ position, goNext, goPrev, labels: l }: Book3DControls & { labels: Required<Book3DLabels> }) {
  const isLastSpread = position.open && position.spread === position.spreadCount - 1;
  const pageLabel =
    position.side === "front"
      ? l.openHint
      : position.side === "back"
        ? l.backSide
        : position.pageNumbers.length === 0
          ? l.titlePage
          : l.pageOf(position.pageNumbers, position.pageCount);
  const nextLabel = position.side === "front" ? l.openCover : isLastSpread ? l.toBack : l.next;
  const prevLabel = position.open && position.spread === 0 ? l.close : l.prev;
  return (
    <nav className="m3d-controls" aria-label={l.nav}>
      <button type="button" className="m3d-nav-button" disabled={position.side === "front"} onClick={goPrev}>
        〈 {prevLabel}
      </button>
      <span className="m3d-spread-count" aria-live="polite">
        {pageLabel}
      </span>
      <button type="button" className="m3d-nav-button" disabled={position.side === "back"} onClick={goNext}>
        {nextLabel} 〉
      </button>
    </nav>
  );
}

/** 雲霧群山與瀑布：書封與書背共用的夜景底圖。 */
function NightRange({ variant }: { variant: "front" | "back" }) {
  const lanterns =
    variant === "front"
      ? [[67, 12], [70, 12.4], [72, 23], [75, 23.3], [62, 51], [64, 51.4], [40, 64], [43, 64.3], [46, 64]]
      : [[90, 4.5], [92, 5], [72, 70], [76, 70.5], [80, 70], [74, 78], [76, 84], [77, 90]];
  const fallId = `m3d-fall-${useId().replace(/:/g, "")}`;
  return (
    <svg className="m3d-art-svg" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={fallId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9ecef" stopOpacity="0.85" />
          <stop offset="1" stopColor="#c9ced5" stopOpacity="0" />
        </linearGradient>
        <filter id={`${fallId}-mist`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path d="M0 52 L12 30 L22 44 L34 22 L46 40 L58 18 L70 34 L82 14 L100 30 L100 150 L0 150Z" fill="#323b47" opacity="0.7" />
      <path d="M0 78 L10 60 L24 72 L38 50 L52 66 L66 44 L80 58 L92 40 L100 48 L100 150 L0 150Z" fill="#262e38" opacity="0.85" />
      {variant === "front" ? (
        <>
          <path d="M58 150 L60 70 L66 40 L72 14 L80 6 L90 2 L100 0 L100 150Z" fill="#1a2028" />
          <rect x="84" y="18" width="1.4" height="36" fill={`url(#${fallId})`} />
          <rect x="79" y="40" width="1.8" height="34" fill={`url(#${fallId})`} />
          <rect x="45" y="94" width="1.2" height="22" fill={`url(#${fallId})`} />
        </>
      ) : (
        <>
          <path d="M70 150 L72 60 L80 30 L88 8 L100 2 L100 150Z" fill="#1a2028" />
          <rect x="89" y="10" width="1.8" height="26" fill={`url(#${fallId})`} />
          <rect x="31" y="110" width="2.4" height="20" fill={`url(#${fallId})`} />
        </>
      )}
      <g filter={`url(#${fallId}-mist)`}>
        <ellipse cx="50" cy="104" rx="70" ry="12" fill="#a7aeb8" opacity="0.28" />
        <ellipse cx="60" cy="80" rx="50" ry="7" fill="#b6bcc5" opacity="0.2" />
        <ellipse cx="30" cy="60" rx="40" ry="6" fill="#9aa2ad" opacity="0.14" />
      </g>
      {lanterns.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.55" fill="#f2b35a" />
      ))}
      {variant === "front" ? (
        <path d="M54 150 L58 132 L66 124 L78 122 L90 126 L100 124 L100 150Z" fill="#0b0d11" />
      ) : (
        <path d="M0 150 L0 132 L14 128 L30 134 L48 136 L64 142 L100 140 L100 150Z" fill="#0b0d11" />
      )}
      <path d="M0 150 L0 112 L4 118 L7 108 L10 122 L14 114 L18 130 L22 150Z" fill="#0e1115" />
    </svg>
  );
}

/** 山門印記：圓環裡一座山與山門，下方一道河。 */
function Emblem() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 30 A15 15 0 1 1 30 33" fill="none" stroke="#9ba3ae" strokeWidth="1.6" />
      <path d="M9 26 L20 9 L31 26Z" fill="#e8ebef" />
      <path d="M14 26 L20 17 L26 26Z" fill="#8f98a4" />
      <rect x="17.5" y="21" width="5" height="5" fill="#2a313b" />
      <path d="M10 30 C16 27 22 33 30 29" fill="none" stroke="#c8cdd4" strokeWidth="1.4" />
    </svg>
  );
}

function Rule() {
  return (
    <span className="m3d-art-rule">
      <i />
      <b />
      <i />
    </span>
  );
}

function FrontArt({ seriesTitle, subtitle, blurb, tagline }: { seriesTitle: string; subtitle: string; blurb: string[]; tagline: string }) {
  return (
    <div className="m3d-art m3d-art-front">
      <NightRange variant="front" />
      <span className="m3d-art-moon" style={{ top: "3.5%", left: "43%" }} />
      <div className="m3d-art-front-copy">
        <span className="m3d-art-line" />
        <span className="m3d-art-emblem">
          <Emblem />
        </span>
        <span className="m3d-art-line" />
        <span className="m3d-art-title">
          {seriesTitle}
          <span className="m3d-art-seal" />
        </span>
        <span className="m3d-art-subtitle">{subtitle}</span>
        <Rule />
        <span className="m3d-art-blurb">
          {blurb.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </div>
      <div className="m3d-art-tag">
        <span>{tagline}</span>
        <Rule />
      </div>
    </div>
  );
}

function BackArt({ seriesTitle, blurb, tagline }: { seriesTitle: string; blurb: string[]; tagline: string }) {
  return (
    <div className="m3d-art m3d-art-back">
      <NightRange variant="back" />
      <span className="m3d-art-moon" style={{ top: "3%", left: "57%" }} />
      <span className="m3d-art-lantern" />
      <div className="m3d-art-back-copy">
        <span className="m3d-art-line" />
        <span className="m3d-art-emblem">
          <Emblem />
        </span>
        <span className="m3d-art-line" />
        <span className="m3d-art-title">
          {seriesTitle}
          <span className="m3d-art-seal" />
        </span>
        <Rule />
        <span className="m3d-art-blurb">
          {blurb.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
        <Rule />
        <span className="m3d-art-blurb">{tagline}</span>
      </div>
    </div>
  );
}

function SpineArt({ seriesTitle }: { seriesTitle: string }) {
  return (
    <div className="m3d-art m3d-art-spine">
      <span className="m3d-art-spine-title">{seriesTitle}</span>
      <span className="m3d-art-seal" />
      <span className="m3d-art-spine-emblem">
        <Emblem />
      </span>
    </div>
  );
}

const BOOK_CSS = `
.m3d-root {
  --m3d-font-display: "LXGW WenKai TC", "Kaiti TC", "BiauKai", "DFKai-SB", serif;
  overflow: clip;
  color: #f1e7d1;
  background: #060606;
}
.m3d-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  margin: 1.5rem 1rem 0.5rem;
  overflow: clip;
  overflow-clip-margin: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.m3d-scene {
  position: relative;
  flex-shrink: 0;
  width: calc(var(--m3d-w) * 2);
  height: var(--m3d-h);
  perspective: 2400px;
  cursor: pointer;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.m3d-measure {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}
.m3d-book {
  --yaw: 22deg;
  --shift: calc(var(--m3d-w) / -2);
  --pitch: 0deg;
  position: absolute;
  top: 0;
  left: var(--m3d-w);
  width: var(--m3d-w);
  height: var(--m3d-h);
  transform-style: preserve-3d;
  transform: translateX(var(--shift)) rotateX(var(--pitch)) rotateY(var(--yaw));
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.m3d-scene.is-open .m3d-book { --yaw: 0deg; --shift: 0px; --pitch: 9deg; }
.m3d-scene.is-back .m3d-book { --yaw: 162deg; }
.m3d-book img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.m3d-back {
  position: absolute;
  inset: 0;
  overflow: hidden;
  backface-visibility: hidden;
  transform: translateZ(calc(var(--m3d-d) / -2)) rotateY(180deg);
}
.m3d-back-summary {
  position: absolute;
  right: 13%;
  bottom: 6%;
  left: 13%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25em;
  padding: 0.8em 0.6em;
  border: 1px solid rgba(138, 106, 63, 0.75);
  outline: 1px solid rgba(239, 230, 207, 0.4);
  outline-offset: 2px;
  background: linear-gradient(170deg, #f1e8d2, #ddd0b1);
  color: #5c4a34;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  font-size: calc(var(--m3d-fs) * 0.82);
  line-height: 1.6;
  letter-spacing: 0.08em;
  text-align: center;
}
.m3d-back-summary-title { color: #3a2c1c; font-family: var(--m3d-font-display); font-size: 1.3em; letter-spacing: 0.24em; }
.m3d-back-summary-date { color: #8a6a3f; font-size: 0.9em; }
.m3d-spine {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--m3d-d);
  height: 100%;
  overflow: hidden;
  transform: rotateY(-90deg) translateZ(calc(var(--m3d-d) / 2));
}
.m3d-edge {
  position: absolute;
  background: repeating-linear-gradient(to bottom, #ece3cd 0, #ece3cd 2px, #d6c9a6 2px, #d6c9a6 3px);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}
.m3d-edge-right {
  top: 0;
  right: 0;
  width: var(--m3d-d);
  height: 100%;
  transform: rotateY(90deg) translateZ(calc(var(--m3d-d) / 2));
}
.m3d-edge-top, .m3d-edge-bottom {
  left: 0;
  width: 100%;
  height: var(--m3d-d);
  background: repeating-linear-gradient(to right, #ece3cd 0, #ece3cd 2px, #d6c9a6 2px, #d6c9a6 3px);
}
.m3d-edge-top { top: 0; transform: rotateX(90deg) translateZ(calc(var(--m3d-d) / 2)); }
.m3d-edge-bottom { bottom: 0; transform: rotateX(-90deg) translateZ(calc(var(--m3d-d) / 2)); }
.m3d-board {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #2e2219, #1b140e);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.6);
  transform: translateZ(calc(var(--m3d-d) / 2 - 2px));
}
.m3d-sheet, .m3d-leaf { position: absolute; inset: var(--m3d-rim) var(--m3d-rim) var(--m3d-rim) 0; }
.m3d-sheet { backface-visibility: hidden; }
.m3d-sheet-right { transform: translateZ(calc(var(--m3d-d) / 2 - 1px)); }
.m3d-sheet-left {
  right: auto;
  left: calc((var(--m3d-w) - var(--m3d-rim)) * -1);
  width: calc(var(--m3d-w) - var(--m3d-rim));
  transform: translateZ(calc(var(--m3d-d) / 2 + 1px));
}
.m3d-cover {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: left center;
  transform: translateZ(calc(var(--m3d-d) / 2)) rotateY(0deg);
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.m3d-scene.is-open .m3d-cover { transform: translateZ(calc(var(--m3d-d) / 2)) rotateY(-180deg); }
.m3d-face { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; }
.m3d-face-front { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35); }
.m3d-face-inside, .m3d-leaf-back { transform: rotateY(180deg); }
.m3d-face-inside { background: linear-gradient(200deg, #2e2219, #1b140e); }
.m3d-face-inside > .m3d-page { inset: var(--m3d-rim) 0 var(--m3d-rim) var(--m3d-rim); }
.m3d-title-slip {
  position: absolute;
  top: 5%;
  left: 6%;
  max-height: 32%;
  padding: 0.9em 0.45em;
  border: 1px solid rgba(138, 106, 63, 0.7);
  outline: 1px solid rgba(239, 230, 207, 0.5);
  outline-offset: 2px;
  background: linear-gradient(170deg, #f1e8d2, #ddd0b1);
  color: #3a2c1c;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.45);
  font-family: var(--m3d-font-display);
  font-size: min(calc(var(--m3d-fs) * 1.05), calc(var(--m3d-h) * 0.024));
  letter-spacing: 0.24em;
  line-height: 1.2;
  white-space: nowrap;
  writing-mode: vertical-rl;
  overflow: hidden;
}
.m3d-leaf {
  transform-style: preserve-3d;
  transform-origin: left center;
  animation: m3d-turn-next var(--m3d-turn-ms) cubic-bezier(0.45, 0.05, 0.3, 1) both;
}
.m3d-leaf-prev { animation-name: m3d-turn-prev; }
.m3d-leaf .m3d-face::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(40, 28, 14, 0.4), rgba(40, 28, 14, 0.08));
  content: "";
  pointer-events: none;
  animation: m3d-leaf-shade var(--m3d-turn-ms) ease-in-out both;
}
@keyframes m3d-turn-next {
  from { transform: translateZ(calc(var(--m3d-d) / 2 + 2px)) rotateY(0deg); }
  to { transform: translateZ(calc(var(--m3d-d) / 2 + 2px)) rotateY(-180deg); }
}
@keyframes m3d-turn-prev {
  from { transform: translateZ(calc(var(--m3d-d) / 2 + 2px)) rotateY(-180deg); }
  to { transform: translateZ(calc(var(--m3d-d) / 2 + 2px)) rotateY(0deg); }
}
@keyframes m3d-leaf-shade {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
.m3d-shadow {
  position: absolute;
  bottom: calc(var(--m3d-h) * -0.05);
  left: calc(var(--m3d-w) * 0.55);
  width: calc(var(--m3d-w) * 0.9);
  height: calc(var(--m3d-h) * 0.05);
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(6px);
  pointer-events: none;
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.m3d-scene.is-open .m3d-shadow { transform: scaleX(2); }
.m3d-page {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #3a2c1c;
  background:
    linear-gradient(to right, rgba(58, 44, 28, 0.28), rgba(58, 44, 28, 0.06) 6%, transparent 14%),
    linear-gradient(155deg, #f3ebd8 0%, #e8ddc3 100%);
  font-size: var(--m3d-fs);
  text-shadow: none;
}
.m3d-page-left {
  background:
    linear-gradient(to left, rgba(58, 44, 28, 0.28), rgba(58, 44, 28, 0.06) 6%, transparent 14%),
    linear-gradient(205deg, #f1e8d4 0%, #e3d7bb 100%);
}
.m3d-page-endpaper {
  background:
    linear-gradient(to left, rgba(58, 44, 28, 0.28), transparent 14%),
    radial-gradient(circle at 30% 30%, rgba(138, 106, 63, 0.08) 0 2px, transparent 3px) 0 0 / 18px 18px,
    linear-gradient(205deg, #e9dec5 0%, #dccfb1 100%);
}
.m3d-colophon { display: flex; align-items: flex-end; justify-content: center; padding: 0 14% 22%; }
.m3d-colophon-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2em;
  color: #6d5334;
  font-size: 0.82em;
  line-height: 1.8;
  letter-spacing: 0.12em;
  text-align: center;
}
.m3d-colophon-title { color: #3a2c1c; font-size: 1.1em; letter-spacing: 0.2em; }
.m3d-colophon-meta { color: #8a6a3f; font-size: 0.9em; }
.m3d-page-window { position: absolute; overflow: hidden; }
.m3d-running-title, .m3d-page-number {
  position: absolute;
  right: 0;
  left: 0;
  color: #8a6a3f;
  font-size: 0.72em;
  letter-spacing: 0.3em;
  text-align: center;
}
.m3d-running-title { top: 3.6%; }
.m3d-page-number { bottom: 3.8%; }
.m3d-cover-inside {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14% 16% 14% 12%;
  background:
    linear-gradient(to left, rgba(58, 44, 28, 0.3), transparent 12%),
    linear-gradient(155deg, #efe7d3 0%, #e2d6ba 55%, #d8caa8 100%);
}
.m3d-cover-inside-content { display: flex; flex-direction: column; align-items: center; text-align: center; }
.m3d-cover-inside-mark { font-family: var(--m3d-font-display); font-size: 1.9em; font-weight: 400; letter-spacing: 0.32em; }
.m3d-cover-inside-rule { width: 3.5em; height: 1px; margin: 1.4em 0; background: rgba(138, 106, 63, 0.5); }
.m3d-cover-inside-title { color: #5c4a34; font-size: 1.05em; letter-spacing: 0.2em; }
.m3d-cover-inside-genre { margin-top: 1.8em; color: #8a6a3f; font-size: 0.88em; letter-spacing: 0.4em; }

/* 內文排版：novella-* 是原作短篇小說的版式，children 可直接套用。 */
.novella-flow { column-fill: auto; font-size: var(--m3d-fs); line-height: 1.9; letter-spacing: 0.05em; orphans: 2; widows: 2; }
.novella-flow p, .novella-flow h2, .novella-flow h3, .novella-flow li, .novella-flow blockquote { overflow-wrap: anywhere; }
.novella-break { break-before: column; }
.novella-title-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: var(--m3d-content-h);
  text-align: center;
}
.novella-title-kicker { color: #8a6a3f; font-size: 0.8em; letter-spacing: 0.34em; }
.novella-title { margin: 1.1em 0 0.6em; font-family: var(--m3d-font-display); font-size: 1.55em; font-weight: 400; line-height: 1.55; letter-spacing: 0.18em; }
.novella-ornament { color: #9b3a2c; font-size: 0.6em; }
.novella-title-meta { margin: 1.6em 0 0.3em; color: #5c4a34; letter-spacing: 0.2em; }
.novella-title-date { margin: 0; color: #8a6a3f; font-size: 0.8em; letter-spacing: 0.14em; }
.novella-chapter-heading {
  margin: 0 0 1.2em;
  padding-bottom: 0.55em;
  border-bottom: 1px solid rgba(138, 106, 63, 0.4);
  font-family: var(--m3d-font-display);
  font-size: 1.12em;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.16em;
}
.novella-chapter-ordinal { display: block; margin-bottom: 0.2em; color: #9b3a2c; font-size: 0.72em; letter-spacing: 0.4em; }
.novella-prose { margin: 0 0 0.85em; text-align: justify; text-indent: 2em; }
.novella-closing {
  margin: 1.3em 0 0;
  padding: 0.6em 0;
  border-block: 1px solid rgba(138, 106, 63, 0.35);
  color: #6d5334;
  letter-spacing: 0.2em;
  text-align: center;
  break-inside: avoid;
}
.novella-final-line { margin: 1.2em 0 0; padding-top: 0.8em; border-top: 1px solid rgba(138, 106, 63, 0.35); color: #6d5334; text-align: justify; }
.novella-end-mark { margin: 1.4em 0 0; color: #8a6a3f; letter-spacing: 0.4em; text-align: center; }

/* 控制列：與原作回憶錄畫面下方的翻頁列相同。 */
.m3d-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.15rem;
  padding: 0 0.75rem 1rem;
  color: rgba(239, 225, 198, 0.78);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
}
.m3d-nav-button {
  min-width: 7rem;
  padding: 0.36rem 0.7rem;
  border: 1px solid rgba(224, 194, 145, 0.52);
  border-radius: 1px;
  color: #f2dfbd;
  background: rgba(5, 5, 5, 0.5);
  font: inherit;
  cursor: pointer;
}
.m3d-nav-button:disabled { cursor: default; opacity: 0.34; }
.m3d-nav-button:focus-visible { outline: 2px solid #e2c28d; outline-offset: 2px; }
.m3d-spread-count { min-width: 4.5em; text-align: center; font-variant-numeric: tabular-nums; }
@media (max-width: 480px) {
  .m3d-controls { gap: 0.5rem; font-size: 0.74rem; }
  .m3d-nav-button { min-width: 5.2rem; padding: 0.3rem 0.5rem; }
}

/* 預設書封：依原作書封圖的配色與版面以 CSS 繪製。 */
.m3d-art { position: absolute; inset: 0; overflow: hidden; font-family: var(--m3d-font-display); }
.m3d-art-front, .m3d-art-back {
  background:
    radial-gradient(ellipse at 50% 2%, rgba(214, 220, 230, 0.22), transparent 40%),
    radial-gradient(ellipse at 65% 60%, rgba(190, 196, 206, 0.16), transparent 55%),
    linear-gradient(180deg, #161c25 0%, #222a35 32%, #2b333f 55%, #191e26 80%, #0a0c10 100%);
}
.m3d-art-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.m3d-art-moon {
  position: absolute;
  width: 4.5%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #ecebe3;
  box-shadow: 0 0 calc(var(--m3d-w) * 0.04) rgba(236, 235, 227, 0.6);
}
.m3d-art-front-copy, .m3d-art-back-copy { position: absolute; display: flex; flex-direction: column; align-items: center; }
.m3d-art-front-copy { top: 13.5%; left: 9%; width: 52%; }
.m3d-art-back-copy { top: 8%; right: 8%; left: 8%; }
.m3d-art-line { width: 1px; height: calc(var(--m3d-h) * 0.05); background: rgba(200, 170, 110, 0.6); }
.m3d-art-front-copy .m3d-art-line, .m3d-art-front-copy .m3d-art-emblem { align-self: flex-start; margin-left: 30%; }
.m3d-art-emblem { display: block; width: calc(var(--m3d-w) * 0.1); margin-block: calc(var(--m3d-h) * 0.008); }
.m3d-art-emblem svg, .m3d-art-spine-emblem svg { display: block; width: 100%; height: auto; }
.m3d-art-title {
  position: relative;
  margin-top: calc(var(--m3d-h) * 0.02);
  background: linear-gradient(180deg, #f7f5ef 0%, #d9d6ce 55%, #a9a69f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: calc(var(--m3d-w) * 0.12);
  line-height: 1.1;
  letter-spacing: 0.04em;
  white-space: nowrap;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
}
.m3d-art-seal {
  display: inline-block;
  width: calc(var(--m3d-w) * 0.03);
  aspect-ratio: 3 / 4;
  border: 1px solid rgba(255, 210, 190, 0.35);
  background: #9b2a22;
}
.m3d-art-title .m3d-art-seal { position: absolute; right: calc(var(--m3d-w) * -0.045); bottom: 12%; }
.m3d-art-subtitle {
  margin-top: calc(var(--m3d-h) * 0.022);
  color: #dcd8ce;
  font-family: Georgia, "Times New Roman", serif;
  font-size: calc(var(--m3d-w) * 0.022);
  letter-spacing: 0.22em;
  white-space: nowrap;
}
.m3d-art-rule { display: flex; align-items: center; gap: 0.6em; width: 100%; margin-block: calc(var(--m3d-h) * 0.014); font-size: calc(var(--m3d-w) * 0.016); }
.m3d-art-rule i { flex: 1; height: 1px; background: rgba(200, 165, 100, 0.65); }
.m3d-art-rule b { width: 0.6em; height: 0.6em; border: 1px solid #c9a45c; transform: rotate(45deg); }
.m3d-art-blurb {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  color: #ece8df;
  font-size: calc(var(--m3d-w) * 0.027);
  letter-spacing: 0.12em;
  line-height: 1.5;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}
.m3d-art-front-copy .m3d-art-blurb { align-self: flex-start; }
.m3d-art-back-copy .m3d-art-blurb { align-items: center; text-align: center; }
.m3d-art-back-copy .m3d-art-title { font-size: calc(var(--m3d-w) * 0.12); }
.m3d-art-back-copy .m3d-art-rule { width: 64%; }
.m3d-latin .m3d-art-title, .m3d-latin .m3d-art-back-copy .m3d-art-title { font-size: calc(var(--m3d-w) * 0.075); line-height: 1.15; white-space: normal; text-align: center; }
.m3d-art-tag {
  position: absolute;
  bottom: 9.5%;
  left: 14%;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 27%;
  color: #c9a45c;
  font-size: calc(var(--m3d-w) * 0.022);
  letter-spacing: 0.18em;
  white-space: nowrap;
}
.m3d-art-lantern {
  position: absolute;
  bottom: 14%;
  left: 4%;
  width: 16%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 196, 110, 0.9) 0 12%, rgba(242, 160, 70, 0.35) 30%, transparent 70%);
}
.m3d-art-spine {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--m3d-h) * 0.02);
  padding: calc(var(--m3d-h) * 0.08) 0 calc(var(--m3d-h) * 0.07);
  background:
    linear-gradient(to bottom, transparent 2.2%, #a8834a 2.2%, #a8834a 2.6%, transparent 2.6%, transparent 3.4%, #a8834a 3.4%, #a8834a 3.7%, transparent 3.7%),
    linear-gradient(to top, transparent 2.2%, #a8834a 2.2%, #a8834a 2.6%, transparent 2.6%, transparent 3.4%, #a8834a 3.4%, #a8834a 3.7%, transparent 3.7%),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 3px),
    linear-gradient(90deg, #12161c, #1f262f 50%, #12161c);
  box-shadow: inset 2px 0 0 rgba(168, 131, 74, 0.35), inset -2px 0 0 rgba(168, 131, 74, 0.35);
}
.m3d-art-spine-title {
  color: #e6e0d2;
  font-size: calc(var(--m3d-d) * 0.62);
  letter-spacing: 0.1em;
  line-height: 1.15;
  writing-mode: vertical-rl;
  white-space: nowrap;
}
.m3d-art-spine .m3d-art-seal { width: 42%; aspect-ratio: 1; }
.m3d-art-spine-emblem { margin-top: auto; width: 80%; }

@media (prefers-reduced-motion: reduce) {
  .m3d-book, .m3d-cover, .m3d-shadow { transition: none; }
}
`;
