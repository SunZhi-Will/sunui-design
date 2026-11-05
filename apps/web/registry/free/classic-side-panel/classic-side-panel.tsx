"use client";

import { useReducedMotion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// 追蹤目前有哪些面板開著（多面板共用）
type PanelContextValue = {
  registerOpenPanel: (id: string) => void;
  unregisterOpenPanel: (id: string) => void;
  isAnyPanelOpen: () => boolean;
};

const SidePanelContext = createContext<PanelContextValue>({
  registerOpenPanel: () => {},
  unregisterOpenPanel: () => {},
  isAnyPanelOpen: () => false,
});

export function SidePanelProvider({ children }: { children: ReactNode }) {
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());

  // 回呼保持穩定，避免面板 effect 反覆註冊
  const registerOpenPanel = useCallback((id: string) => {
    setOpenPanels((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);
  const unregisterOpenPanel = useCallback((id: string) => {
    setOpenPanels((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const size = openPanels.size;
  const value = useMemo(
    () => ({ registerOpenPanel, unregisterOpenPanel, isAnyPanelOpen: () => size > 0 }),
    [registerOpenPanel, unregisterOpenPanel, size],
  );

  return <SidePanelContext.Provider value={value}>{children}</SidePanelContext.Provider>;
}

export type IconProps = { size?: number; className?: string };

// Ionicons 5 menu-outline
function MenuOutline({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} className={className} aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit={10} strokeWidth={32} d="M80 160h352M80 256h352M80 352h352" />
    </svg>
  );
}

// Ionicons 5 close-outline
function CloseOutline({ size = 20, className }: IconProps) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} className={className} aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={32} d="M368 368L144 144M368 144L144 368" />
    </svg>
  );
}

export type DateRangeOption = "day" | "week" | "half-year" | "year";
export type ThemeMode = "light" | "dark";
export type SidePanelTheme = "default" | "primary" | "success" | "warning" | "danger" | "gradient";

type ThemeClasses = {
  panel: string;
  title: string;
  border: string;
  content: string;
  toggleBtn: string;
  closeBtn: string;
  shadow: string;
  overlay: string;
  dateBtn: string;
  dateBtnActive: string;
  /** 狀態主題只在標題前放一顆小點，不把整條標題列上色 */
  dot?: string;
};

// 全部主題共用中性 shadcn token；主要動作（切換鈕）用 primary。
// 舊版 primary、success、warning、danger 的彩色標題列與 gradient 的紫粉漸層已停用。
const NEUTRAL: ThemeClasses = {
  panel: "bg-card",
  title: "text-foreground",
  border: "border-border",
  content: "text-foreground",
  toggleBtn: "bg-primary text-primary-foreground hover:opacity-90",
  closeBtn: "text-muted-foreground hover:bg-muted hover:text-foreground",
  shadow: "shadow-sm",
  overlay: "bg-black/40",
  dateBtn: "text-muted-foreground hover:text-foreground",
  dateBtnActive: "bg-card text-foreground shadow-sm",
};

const STATUS_DOT: Partial<Record<SidePanelTheme, string>> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
};

function getThemeClasses(theme: SidePanelTheme): ThemeClasses {
  return { ...NEUTRAL, dot: STATUS_DOT[theme] };
}

// mode 指定明暗時，在面板內覆寫 shadcn token；不指定就跟隨網站
const forcedTokens: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--background": "#fafaf9",
    "--foreground": "#1c1917",
    "--card": "#ffffff",
    "--muted": "#f5f5f4",
    "--muted-foreground": "#78716c",
    "--border": "#e7e5e4",
    "--primary": "#1c1917",
    "--primary-foreground": "#fafaf9",
    colorScheme: "light",
  },
  dark: {
    "--background": "#0c0a09",
    "--foreground": "#f5f5f4",
    "--card": "#151311",
    "--muted": "#292524",
    "--muted-foreground": "#a8a29e",
    "--border": "#292524",
    "--primary": "#f5f5f4",
    "--primary-foreground": "#1c1917",
    colorScheme: "dark",
  },
};

interface SidePanelMessages {
  /** 舊版寫法：給了就用「open + 標題」組成切換鈕名稱 */
  open: string;
  /** 切換鈕的無障礙名稱 */
  openPanel: (title: string) => string;
  /** 沒有文字標題時代替標題的字 */
  panel: string;
  close: string;
  dateRange: string;
  ranges: Record<DateRangeOption, string>;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, SidePanelMessages> = {
  en: {
    open: "Open",
    openPanel: (title) => `Open ${title}`,
    panel: "panel",
    close: "Close panel",
    dateRange: "Date range",
    ranges: { day: "Day", week: "Week", "half-year": "Half year", year: "Year" },
  },
  "zh-TW": {
    open: "開啟",
    openPanel: (title) => `開啟${title}`,
    panel: "面板",
    close: "關閉面板",
    dateRange: "日期區間",
    ranges: { day: "日", week: "週", "half-year": "半年", year: "年" },
  },
  "zh-CN": {
    open: "打开",
    openPanel: (title) => `打开${title}`,
    panel: "面板",
    close: "关闭面板",
    dateRange: "日期范围",
    ranges: { day: "日", week: "周", "half-year": "半年", year: "年" },
  },
  ja: {
    open: "開く",
    openPanel: (title) => `${title}を開く`,
    panel: "パネル",
    close: "パネルを閉じる",
    dateRange: "期間",
    ranges: { day: "日", week: "週", "half-year": "半年", year: "年" },
  },
};

export type SidePanelLabels = Partial<Omit<SidePanelMessages, "ranges">> & {
  ranges?: Partial<Record<DateRangeOption, string>>;
};

export interface SidePanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  title?: ReactNode;
  position?: "left" | "right";
  children?: ReactNode;
  className?: string;
  toggleButtonClassName?: string;
  closeButtonClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  showToggleButton?: boolean;
  showCloseButton?: boolean;
  /** 面板寬度，預設 320px */
  width?: string;
  zIndex?: number;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  showOverlay?: boolean;
  overlayClassName?: string;
  /** 完全展開後觸發 */
  onOpen?: () => void;
  /** 完全收合後觸發 */
  onClose?: () => void;
  toggleButtonIcon?: ComponentType<IconProps>;
  closeButtonIcon?: ComponentType<IconProps>;
  /** 動畫毫秒數，預設 300 */
  animationDuration?: number;
  /** 舊版配色。現在一律中性；success、warning、danger 只在標題前顯示一顆狀態小點 */
  theme?: SidePanelTheme;
  /** 不給時跟隨網站明暗（shadcn token）；給 light 或 dark 時面板自帶該配色 */
  mode?: ThemeMode;
  showBorder?: boolean;
  showShadow?: boolean;
  showHeaderBorder?: boolean;
  rounded?: boolean;
  /** 切換鈕距頂端位置，預設 2rem */
  buttonTopPosition?: string;
  /** 切換鈕是否固定在視窗邊緣 */
  buttonSticky?: boolean;
  buttonHorizontalOffset?: string;
  id?: string;
  /** 任一面板開啟時隱藏其他切換鈕（需包在 SidePanelProvider 內） */
  hideButtonsWhenAnyOpen?: boolean;
  showDateRangeSelector?: boolean;
  dateRangeOptions?: DateRangeOption[];
  selectedDateRange?: DateRangeOption;
  onDateRangeChange?: (range: DateRangeOption) => void;
  /** true 時相對視窗定位（原版行為）；false 時相對最近的 relative 容器 */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: SidePanelLabels;
}

export function SidePanel({
  isOpen = false,
  onToggle = () => {},
  title = "",
  position = "left",
  children,
  className = "",
  toggleButtonClassName = "",
  closeButtonClassName = "",
  headerClassName = "",
  contentClassName = "",
  showToggleButton = true,
  showCloseButton = true,
  width = "320px",
  zIndex = 50,
  closeOnOutsideClick = false,
  closeOnEscape = false,
  showOverlay = false,
  overlayClassName = "",
  onOpen,
  onClose,
  toggleButtonIcon: ToggleIcon = MenuOutline,
  closeButtonIcon: CloseIcon = CloseOutline,
  animationDuration = 300,
  theme = "default",
  mode,
  showBorder = true,
  showShadow = true,
  showHeaderBorder = true,
  rounded = true,
  buttonTopPosition = "2rem",
  buttonSticky = true,
  buttonHorizontalOffset = "0px",
  id,
  hideButtonsWhenAnyOpen = true,
  showDateRangeSelector = false,
  dateRangeOptions = ["day", "week", "half-year", "year"],
  selectedDateRange = "day",
  onDateRangeChange = () => {},
  fixed = true,
  locale = "en",
  labels,
}: SidePanelProps) {
  const autoId = useId();
  const panelId = id ?? `side-panel-${autoId}`;
  const titleId = `${panelId}-title`;
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labels, ranges: { ...base.ranges, ...labels?.ranges } };

  const reduce = useReducedMotion() ?? false;
  const duration = reduce ? 0 : animationDuration;

  const { registerOpenPanel, unregisterOpenPanel, isAnyPanelOpen } = useContext(SidePanelContext);

  // isInDOM：是否掛載；isPositioned：是否滑入定位
  const [isInDOM, setIsInDOM] = useState(isOpen);
  const [isPositioned, setIsPositioned] = useState(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onToggleRef = useRef(onToggle);
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;
  onToggleRef.current = onToggle;

  // 延遲一個 tick 再切換，確保動畫狀態同步
  const handleToggle = useCallback(() => {
    setTimeout(() => onToggleRef.current(), 0);
  }, []);

  useEffect(() => {
    if (isOpen) registerOpenPanel(panelId);
    else unregisterOpenPanel(panelId);
    return () => {
      if (isOpen) unregisterOpenPanel(panelId);
    };
  }, [isOpen, panelId, registerOpenPanel, unregisterOpenPanel]);

  // 開：先掛載（畫面外）再滑入；關：先滑出再卸載
  useEffect(() => {
    if (isOpen) {
      setIsInDOM(true);
      let raf = 0;
      const openTimer = setTimeout(() => {
        raf = window.requestAnimationFrame(() => setIsPositioned(true));
      }, 10);
      const completeTimer = setTimeout(() => onOpenRef.current?.(), duration + 50);
      return () => {
        clearTimeout(openTimer);
        clearTimeout(completeTimer);
        cancelAnimationFrame(raf);
      };
    }
    setIsPositioned(false);
    const timer = setTimeout(() => {
      setIsInDOM(false);
      onCloseRef.current?.();
    }, duration + 50);
    return () => clearTimeout(timer);
  }, [isOpen, duration]);

  // 焦點：開啟時移到關閉鈕，關閉後還給原本的元素
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => (closeRef.current ?? panelRef.current)?.focus({ preventScroll: true }), 20);
      return () => clearTimeout(t);
    }
    const el = returnFocusRef.current;
    if (el && panelRef.current?.contains(document.activeElement)) el.focus({ preventScroll: true });
    returnFocusRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleToggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOnEscape, isOpen, handleToggle]);

  useEffect(() => {
    if (!closeOnOutsideClick || !isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) handleToggle();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [closeOnOutsideClick, isOpen, handleToggle]);

  const t = getThemeClasses(theme);
  const tokens = mode ? forcedTokens[mode] : undefined;
  const isLeft = position === "left";

  const shouldShowToggleButton = showToggleButton && (!hideButtonsWhenAnyOpen || !isAnyPanelOpen() || isOpen);

  // 開啟中的面板層級高於切換鈕
  const panelZIndex = isOpen ? zIndex + 5 : zIndex;
  const overlayZIndex = isOpen ? zIndex + 4 : zIndex - 1;
  const pos = fixed ? "fixed" : "absolute";
  const titleText = typeof title === "string" && title ? title : l.panel;

  return (
    <>
      {!isOpen && shouldShowToggleButton && (
        <button
          type="button"
          onClick={handleToggle}
          aria-label={labels?.open !== undefined && labels.openPanel === undefined ? `${l.open} ${titleText}` : l.openPanel(titleText)}
          aria-expanded={false}
          aria-controls={panelId}
          className={cn(
            "hidden items-center justify-center sm:flex",
            fixed && buttonSticky ? "fixed" : "absolute",
            "min-w-0 p-2.5 ease-in-out",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            t.toggleBtn,
            isLeft ? "left-0 rounded-r-md hover:translate-x-0.5" : "right-0 rounded-l-md hover:-translate-x-0.5",
            showShadow && t.shadow,
            toggleButtonClassName,
          )}
          style={{
            ...tokens,
            zIndex,
            top: buttonTopPosition,
            [position]: buttonHorizontalOffset,
            transition: `all ${duration}ms ease-in-out`,
          }}
        >
          <ToggleIcon size={20} className={isLeft ? "rotate-180" : ""} />
        </button>
      )}

      {isInDOM && showOverlay && (
        <div
          aria-hidden="true"
          className={cn(
            pos,
            "inset-0 transition-opacity ease-in-out",
            t.overlay,
            isPositioned ? "opacity-100" : "pointer-events-none opacity-0",
            overlayClassName,
          )}
          style={{ zIndex: overlayZIndex, transitionDuration: `${duration}ms` }}
          onClick={closeOnOutsideClick ? handleToggle : undefined}
        />
      )}

      {isInDOM && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            pos,
            "top-0 h-full max-w-full text-foreground outline-none transition-transform ease-in-out",
            isLeft ? "left-0" : "right-0",
            t.panel,
            isPositioned ? "translate-x-0" : isLeft ? "-translate-x-full" : "translate-x-full",
            showBorder && (isLeft ? "border-r" : "border-l"),
            showBorder && t.border,
            showShadow && t.shadow,
            rounded && (isLeft ? "rounded-r-xl" : "rounded-l-xl"),
            className,
          )}
          style={{ ...tokens, width, zIndex: panelZIndex, transitionDuration: `${duration}ms`, overflowX: "hidden" }}
        >
          <div className="flex h-full flex-col">
            <div
              className={cn(
                "flex h-14 items-center justify-between p-4",
                showHeaderBorder && "border-b",
                showHeaderBorder && t.border,
                t.panel,
                rounded && isLeft && "rounded-tr-xl",
                rounded && !isLeft && "rounded-tl-xl",
                headerClassName,
              )}
            >
              <h2 id={titleId} className={cn("flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold tracking-tight", t.title)}>
                {t.dot && <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />}
                <span className="truncate">{title}</span>
              </h2>
              {showCloseButton && (
                <button
                  ref={closeRef}
                  type="button"
                  onClick={handleToggle}
                  aria-label={l.close}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    t.closeBtn,
                    closeButtonClassName,
                  )}
                >
                  <CloseIcon size={20} />
                </button>
              )}
            </div>
            <div className={cn("flex-1 overflow-y-auto p-5", t.content, contentClassName)}>
              {showDateRangeSelector && (
                <div
                  role="group"
                  aria-label={l.dateRange}
                  className="mb-4 flex w-full justify-around rounded-md border border-border bg-muted p-0.5"
                >
                  {dateRangeOptions.map((range) => {
                    const active = selectedDateRange === range;
                    return (
                      <button
                        key={range}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onDateRangeChange(range)}
                        className={cn(
                          "flex-1 rounded-[5px] px-2 py-1 text-sm whitespace-nowrap transition-colors duration-200",
                          active ? t.dateBtnActive : t.dateBtn,
                        )}
                      >
                        {l.ranges[range]}
                      </button>
                    );
                  })}
                </div>
              )}
              {children}
            </div>
          </div>

        </div>
      )}
    </>
  );
}

// 與原版相同：SidePanel.Provider
export const ClassicSidePanel = Object.assign(SidePanel, { Provider: SidePanelProvider });
export default ClassicSidePanel;
