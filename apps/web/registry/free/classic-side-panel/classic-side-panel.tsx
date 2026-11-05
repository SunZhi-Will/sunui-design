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
  header: string;
  title: string;
  border: string;
  content: string;
  toggleBtn: string;
  closeBtn: string;
  shadow: string;
  overlay: string;
  dateBtn: string;
  dateBtnActive: string;
};

const grayDate = (d: boolean) => (d ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300");

function getThemeClasses(theme: SidePanelTheme, isDark: boolean): ThemeClasses {
  const map: Record<SidePanelTheme, ThemeClasses> = {
    default: {
      panel: isDark ? "bg-gray-800" : "bg-white",
      header: isDark ? "bg-gray-800" : "bg-white",
      title: isDark ? "text-white" : "text-gray-900",
      border: isDark ? "border-gray-700" : "border-gray-200",
      content: isDark ? "text-gray-300" : "text-gray-700",
      toggleBtn: isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-blue-600 text-white hover:bg-blue-700",
      closeBtn: isDark ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
      shadow: "shadow-lg",
      overlay: "bg-black/50",
      dateBtn: grayDate(isDark),
      dateBtnActive: isDark ? "bg-blue-600" : "bg-blue-500",
    },
    primary: {
      panel: isDark ? "bg-gray-800" : "bg-white",
      header: isDark ? "bg-blue-800 text-white" : "bg-blue-600 text-white",
      title: "text-white",
      border: isDark ? "border-blue-900" : "border-blue-500",
      content: isDark ? "text-gray-300" : "text-gray-700",
      toggleBtn: "bg-blue-600 text-white hover:bg-blue-700",
      closeBtn: "text-white hover:text-white hover:bg-blue-500",
      shadow: "shadow-lg shadow-blue-500/20",
      overlay: "bg-blue-900/40",
      dateBtn: grayDate(isDark),
      dateBtnActive: isDark ? "bg-blue-600" : "bg-blue-500",
    },
    success: {
      panel: isDark ? "bg-gray-800" : "bg-white",
      header: isDark ? "bg-green-800 text-white" : "bg-green-600 text-white",
      title: "text-white",
      border: isDark ? "border-green-900" : "border-green-500",
      content: isDark ? "text-gray-300" : "text-gray-700",
      toggleBtn: "bg-green-600 text-white hover:bg-green-700",
      closeBtn: "text-white hover:text-white hover:bg-green-500",
      shadow: "shadow-lg shadow-green-500/20",
      overlay: "bg-green-900/40",
      dateBtn: grayDate(isDark),
      dateBtnActive: isDark ? "bg-green-600" : "bg-green-500",
    },
    warning: {
      panel: isDark ? "bg-gray-800" : "bg-white",
      header: isDark ? "bg-amber-800 text-white" : "bg-amber-500 text-white",
      title: "text-white",
      border: isDark ? "border-amber-900" : "border-amber-500",
      content: isDark ? "text-gray-300" : "text-gray-700",
      toggleBtn: "bg-amber-500 text-white hover:bg-amber-600",
      closeBtn: "text-white hover:text-white hover:bg-amber-400",
      shadow: "shadow-lg shadow-amber-500/20",
      overlay: "bg-amber-900/40",
      dateBtn: grayDate(isDark),
      dateBtnActive: "bg-amber-500",
    },
    danger: {
      panel: isDark ? "bg-gray-800" : "bg-white",
      header: isDark ? "bg-red-800 text-white" : "bg-red-600 text-white",
      title: "text-white",
      border: isDark ? "border-red-900" : "border-red-500",
      content: isDark ? "text-gray-300" : "text-gray-700",
      toggleBtn: "bg-red-600 text-white hover:bg-red-700",
      closeBtn: "text-white hover:text-white hover:bg-red-500",
      shadow: "shadow-lg shadow-red-500/20",
      overlay: "bg-red-900/40",
      dateBtn: grayDate(isDark),
      dateBtnActive: isDark ? "bg-red-600" : "bg-red-500",
    },
    gradient: {
      panel: isDark ? "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950" : "bg-white",
      header: isDark
        ? "bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white"
        : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white",
      title: "text-white",
      border: isDark ? "border-gray-700" : "border-gray-200",
      content: isDark ? "text-gray-300" : "text-gray-700",
      toggleBtn:
        "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600",
      closeBtn: "text-white hover:text-white backdrop-blur-sm bg-white/20 hover:bg-white/30",
      shadow: "shadow-xl shadow-purple-500/20",
      overlay: "backdrop-blur-sm bg-black/30",
      dateBtn: isDark ? "bg-gray-700/80 hover:bg-gray-600/80" : "bg-gray-200/80 hover:bg-gray-300/80",
      dateBtnActive: isDark
        ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
        : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
    },
  };
  return map[theme];
}

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
  theme?: SidePanelTheme;
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
  mode = "light",
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
  const [isHovering, setIsHovering] = useState(false);
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

  const t = getThemeClasses(theme, mode === "dark");
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
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          aria-label={labels?.open !== undefined && labels.openPanel === undefined ? `${l.open} ${titleText}` : l.openPanel(titleText)}
          aria-expanded={false}
          aria-controls={panelId}
          className={cn(
            "hidden items-center justify-center sm:flex",
            fixed && buttonSticky ? "fixed" : "absolute",
            "min-w-0 p-2.5 ease-in-out",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
            theme === "gradient" ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white" : t.toggleBtn,
            isLeft ? "left-0 rounded-r-lg hover:translate-x-0.5" : "right-0 rounded-l-lg hover:-translate-x-0.5",
            showShadow && t.shadow,
            toggleButtonClassName,
          )}
          style={{
            zIndex,
            top: buttonTopPosition,
            [position]: buttonHorizontalOffset,
            transition: `all ${duration}ms ease-in-out`,
          }}
        >
          <ToggleIcon size={20} className={isLeft ? "rotate-180" : ""} />
          {theme === "gradient" && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute -inset-0.5 rounded-r-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-md transition-opacity",
                isHovering ? "opacity-60" : "opacity-0",
              )}
              style={{ zIndex: -1 }}
            />
          )}
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
            "top-0 h-full max-w-full outline-none transition-transform ease-in-out",
            isLeft ? "left-0" : "right-0",
            t.panel,
            isPositioned ? "translate-x-0" : isLeft ? "-translate-x-full" : "translate-x-full",
            showBorder && (isLeft ? "border-r" : "border-l"),
            showBorder && t.border,
            showShadow && t.shadow,
            rounded && (isLeft ? "rounded-r-lg" : "rounded-l-lg"),
            className,
          )}
          style={{ width, zIndex: panelZIndex, transitionDuration: `${duration}ms`, overflowX: "hidden" }}
        >
          <div className="flex h-full flex-col">
            <div
              className={cn(
                "flex h-14 items-center justify-between p-4",
                showHeaderBorder && "border-b",
                showHeaderBorder && t.border,
                theme !== "default" ? t.header : t.panel,
                rounded && isLeft && "rounded-tr-lg",
                rounded && !isLeft && "rounded-tl-lg",
                headerClassName,
              )}
            >
              <h2 id={titleId} className={cn("flex-1 truncate text-xl font-semibold", theme === "default" && t.title)}>
                {title}
              </h2>
              {showCloseButton && (
                <button
                  ref={closeRef}
                  type="button"
                  onClick={handleToggle}
                  aria-label={l.close}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
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
                  className={cn("mb-4 flex w-full justify-around rounded-lg p-1", mode === "dark" ? "bg-gray-800" : "bg-gray-100")}
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
                          "rounded-md px-3 py-1 text-sm transition-all duration-200",
                          active
                            ? cn(t.dateBtnActive, "text-white")
                            : cn(t.dateBtn, mode === "dark" ? "text-gray-300" : "text-gray-700"),
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

          {theme === "gradient" && (
            <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
              <div
                className="absolute top-0 right-0 -z-10 h-36 w-36 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl"
                style={{ transform: "translate(30%, -30%)" }}
              />
              <div
                className="absolute bottom-0 left-0 -z-10 h-36 w-36 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl"
                style={{ transform: "translate(-30%, 30%)" }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

// 與原版相同：SidePanel.Provider
export const ClassicSidePanel = Object.assign(SidePanel, { Provider: SidePanelProvider });
export default ClassicSidePanel;
