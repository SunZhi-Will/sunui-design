"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  memo,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type FilterGridTheme = "light" | "dark" | "blue" | "green" | "purple";
export type FilterGridShape = "hexagon" | "square" | "circle";

interface ThemeConfig {
  container: string;
  text: string;
  image: string;
  button: { active: string; inactive: string };
  title: string;
}

// 原本 themes.ts 的五組主題（purple 主題原本就是 pink 色系）
const THEMES: Record<FilterGridTheme, ThemeConfig> = {
  light: {
    container: "bg-slate-200/80 border-slate-200 group-hover:border-slate-300 group-hover:shadow-[0_0_15px_rgba(241,245,249,0.4)]",
    text: "text-slate-600",
    image: "brightness-100 contrast-105",
    button: { active: "bg-slate-600 text-white shadow-sm", inactive: "bg-slate-200/80 text-slate-600 hover:bg-slate-300/80" },
    title: "from-slate-400 to-slate-600",
  },
  dark: {
    container:
      "bg-gradient-to-br from-slate-700/40 to-slate-900/60 border-slate-500/20 group-hover:border-slate-400/50 group-hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]",
    text: "text-slate-200",
    image: "brightness-125 contrast-125",
    button: { active: "bg-slate-200 text-slate-800 shadow-sm", inactive: "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50" },
    title: "from-slate-300 to-slate-100",
  },
  blue: {
    container:
      "bg-gradient-to-br from-blue-600/20 to-blue-900/40 border-blue-500/20 group-hover:border-blue-400/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    text: "text-white",
    image: "brightness-125 contrast-125",
    button: { active: "bg-blue-500 text-white shadow-sm", inactive: "bg-blue-400/30 text-white hover:bg-blue-400/40" },
    title: "from-blue-200 to-blue-400",
  },
  green: {
    container:
      "bg-gradient-to-br from-emerald-600/20 to-emerald-900/40 border-emerald-500/20 group-hover:border-emerald-400/50 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]",
    text: "text-white",
    image: "brightness-125 contrast-125",
    button: { active: "bg-emerald-500 text-white shadow-sm", inactive: "bg-emerald-400/30 text-white hover:bg-emerald-400/40" },
    title: "from-emerald-200 to-emerald-400",
  },
  purple: {
    container:
      "bg-gradient-to-br from-pink-600/20 to-pink-900/40 border-pink-500/20 group-hover:border-pink-400/50 group-hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]",
    text: "text-white",
    image: "brightness-125 contrast-125",
    button: { active: "bg-pink-500 text-white shadow-sm", inactive: "bg-pink-400/30 text-white hover:bg-pink-400/40" },
    title: "from-pink-200 to-pink-400",
  },
};

const HEXAGON = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const shapeStyle = (shape: FilterGridShape) => ({
  clipPath: shape === "hexagon" ? HEXAGON : undefined,
  borderRadius: shape === "circle" ? "50%" : shape === "square" ? "0.75rem" : undefined,
});

export interface FilterGridStyles {
  container?: string;
  item?: string;
  title?: string;
  titleBar?: string;
  button?: string;
  buttonActive?: string;
  icon?: string;
  label?: string;
}

export interface FilterGridLabels {
  /** 標題；未提供時不顯示標題區 */
  title?: string;
  all?: string;
  categories?: string;
  pagination?: string;
  previous?: string;
  next?: string;
  page?: (page: number) => string;
  loading?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<Omit<FilterGridLabels, "title">>> = {
  en: {
    all: "All",
    categories: "Filter by category",
    pagination: "Pagination",
    previous: "Previous page",
    next: "Next page",
    page: (page) => `Page ${page}`,
    loading: "Loading more items",
  },
  "zh-TW": {
    all: "全部",
    categories: "依分類篩選",
    pagination: "分頁",
    previous: "上一頁",
    next: "下一頁",
    page: (page) => `第 ${page} 頁`,
    loading: "正在載入更多項目",
  },
  "zh-CN": {
    all: "全部",
    categories: "按分类筛选",
    pagination: "分页",
    previous: "上一页",
    next: "下一页",
    page: (page) => `第 ${page} 页`,
    loading: "正在加载更多项目",
  },
  ja: {
    all: "すべて",
    categories: "カテゴリで絞り込む",
    pagination: "ページ送り",
    previous: "前のページ",
    next: "次のページ",
    page: (page) => `${page} ページ`,
    loading: "さらに読み込み中",
  },
};

export interface GridItemProps {
  name: string;
  /** 圖片網址，或直接傳 SVG 等節點 */
  icon: string | ReactNode;
  category?: string;
  delay?: number;
  theme?: FilterGridTheme;
  shape?: FilterGridShape;
  styles?: FilterGridStyles;
  width?: number;
  height?: number;
  onClick?: (name: string, category?: string) => void;
  showName?: boolean;
}

export const GridItem = memo(function GridItem({
  name,
  icon,
  category,
  delay = 0,
  theme = "light",
  shape = "hexagon",
  styles = {},
  width = 120,
  height = 138,
  onClick,
  showName = true,
}: GridItemProps) {
  const reduce = useReducedMotion() ?? false;
  const themeClasses = THEMES[theme];

  // 圓形與方形取最短邊；只顯示圖示的六邊形維持 1:1.15
  const size = (() => {
    if (shape === "circle" || shape === "square") {
      const s = Math.min(width, height);
      return { width: s, height: s };
    }
    if (shape === "hexagon" && !showName) {
      const base = Math.min(width, height);
      return { width: base, height: Math.round(base * 1.15) };
    }
    return { width, height };
  })();

  const iconPx = showName ? 48 : 32;
  const iconClass = cn(
    showName ? "mb-2" : "mb-0",
    "filter transition-transform group-hover:scale-110",
    themeClasses.image,
    styles.icon,
  );

  const interactive = Boolean(onClick);
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(name, category);
    }
  };

  return (
    <motion.div
      initial={reduce ? false : { scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay * 0.1 }}
      whileHover={reduce ? undefined : { scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
      className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-current"
      onClick={() => onClick?.(name, category)}
      onKeyDown={interactive ? handleKey : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? name : undefined}
      style={{ cursor: interactive ? "pointer" : "default" }}
    >
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden border backdrop-blur-sm transition-all duration-300",
          themeClasses.container,
          (shape === "circle" || shape === "square") && "aspect-square",
          styles.item,
        )}
        style={{ width: `${size.width}px`, height: `${size.height}px`, ...shapeStyle(shape) }}
      >
        <div className="absolute inset-0 bg-current opacity-0 transition-opacity group-hover:opacity-10" />
        {typeof icon === "string" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt={showName ? "" : name} width={iconPx} height={iconPx} className={iconClass} />
        ) : (
          <span role={showName ? undefined : "img"} aria-label={showName ? undefined : name} aria-hidden={showName || undefined} className={cn("flex items-center justify-center [&>svg]:size-full", iconClass)} style={{ width: iconPx, height: iconPx }}>
            {icon}
          </span>
        )}
        {showName && <p className={cn(themeClasses.text, "text-sm font-medium", styles.label)}>{name}</p>}
      </div>
    </motion.div>
  );
});

export interface ClassicFilterGridProps {
  children: ReactNode;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: FilterGridLabels;
  className?: string;
  showTitle?: boolean;
  showCategories?: boolean;
  theme?: FilterGridTheme;
  shape?: FilterGridShape;
  styles?: FilterGridStyles;
  width?: number;
  height?: number;
  /** 指定分類順序；未提供時依子項目的 category 自動收集 */
  categories?: string[];
  loading?: boolean;
  itemsPerPage?: number;
  loadingItemCount?: number;
  /** 無限捲動：底部哨兵進入視窗時呼叫 */
  loadMore?: () => void;
  usePagination?: boolean;
  /** 受控頁碼；不傳時元件自行管理 */
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function ClassicFilterGrid({
  children,
  locale = "en",
  labels,
  className,
  showTitle = true,
  showCategories = true,
  theme = "light",
  shape = "hexagon",
  styles = {},
  width = 120,
  height = 138,
  categories = [],
  loading = false,
  itemsPerPage = 12,
  loadingItemCount = 3,
  loadMore,
  usePagination = false,
  currentPage: currentPageProp,
  totalPages = 1,
  onPageChange,
}: ClassicFilterGridProps) {
  const reduce = useReducedMotion() ?? false;
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const themeClasses = THEMES[theme];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [innerPage, setInnerPage] = useState(1);
  const currentPage = currentPageProp ?? innerPage;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const goToPage = (page: number) => {
    setInnerPage(page);
    onPageChange?.(page);
  };

  // 只收 GridItem 子元素，注入共用的主題、形狀、尺寸與錯開延遲
  const items = Children.toArray(children)
    .filter((child): child is ReactElement<GridItemProps> => isValidElement(child) && child.type === GridItem)
    .map((child, index) =>
      cloneElement<GridItemProps>(child, { theme, shape, styles, width, height, delay: index * 0.1, ...child.props }),
    );

  const filteredItems = selectedCategory ? items.filter((item) => item.props.category === selectedCategory) : items;
  const paginatedItems = usePagination
    ? filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredItems;
  const actualTotalPages = usePagination ? Math.ceil(filteredItems.length / itemsPerPage) : totalPages;

  const availableCategories =
    categories.length > 0
      ? categories
      : Array.from(new Set(items.map((item) => item.props.category).filter((c): c is string => Boolean(c))));

  // 無限捲動哨兵
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !loadMore || usePagination) return;
    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, usePagination]);

  useEffect(() => {
    if (isIntersecting && loadMore && !loading) loadMore();
  }, [isIntersecting, loadMore, loading]);

  const selectCategory = (category: string | null) => {
    setSelectedCategory(category);
    goToPage(1);
  };

  const renderPagination = () => {
    if (!usePagination || actualTotalPages <= 1) return null;
    const pages = Array.from({ length: actualTotalPages }, (_, i) => i + 1);
    let visible = pages;
    // 超過 7 頁時以省略號收合
    if (actualTotalPages > 7) {
      if (currentPage <= 4) visible = [...pages.slice(0, 5), -1, actualTotalPages];
      else if (currentPage >= actualTotalPages - 3) visible = [1, -1, ...pages.slice(actualTotalPages - 5)];
      else visible = [1, -1, currentPage - 1, currentPage, currentPage + 1, -2, actualTotalPages];
    }
    const edge = (disabled: boolean) =>
      cn("rounded-lg px-3 py-2 transition-all duration-300", themeClasses.button.inactive, disabled && "cursor-not-allowed opacity-50");

    return (
      <nav aria-label={t.pagination} className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          aria-label={t.previous}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className={edge(currentPage === 1 || loading)}
        >
          <span aria-hidden="true">←</span>
        </button>
        {visible.map((page, index) =>
          page < 0 ? (
            <span key={`gap-${index}`} aria-hidden="true" className={themeClasses.text}>
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              aria-label={t.page(page)}
              aria-current={currentPage === page ? "page" : undefined}
              onClick={() => goToPage(page)}
              disabled={loading}
              className={cn(
                "size-10 rounded-lg transition-all duration-300",
                currentPage === page ? themeClasses.button.active : themeClasses.button.inactive,
              )}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label={t.next}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === actualTotalPages || loading}
          className={edge(currentPage === actualTotalPages || loading)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </nav>
    );
  };

  return (
    <div className={cn("w-full", className, styles.container)}>
      {showTitle && labels?.title && (
        <div className="mb-16 flex flex-col items-center">
          <h2 className={cn("bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent", themeClasses.title, styles.title)}>
            {labels.title}
          </h2>
          <div className={cn("mt-2 h-1 w-24 rounded-full bg-gradient-to-r", themeClasses.title, styles.titleBar)} />
        </div>
      )}

      {showCategories && availableCategories.length > 0 && (
        <div role="group" aria-label={t.categories} className="mb-12 flex flex-wrap justify-center gap-4">
          {[null, ...availableCategories].map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category ?? "__all"}
                type="button"
                aria-pressed={active}
                onClick={() => selectCategory(category)}
                className={cn(
                  "rounded-full px-4 py-2 transition-all duration-300",
                  active ? cn(themeClasses.button.active, styles.buttonActive) : cn(themeClasses.button.inactive, styles.button),
                )}
              >
                {category ?? t.all}
              </button>
            );
          })}
        </div>
      )}

      <motion.div aria-busy={loading} className="flex flex-wrap justify-center gap-6" layout={!reduce}>
        <AnimatePresence mode="popLayout">
          <Fragment key="items">{paginatedItems}</Fragment>
          {loading &&
            Array.from({ length: loadingItemCount }).map((_, index) => (
              <motion.div
                key={`loading-${index}`}
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={reduce ? { opacity: 0.45, scale: 0.85 } : { opacity: [0.3, 0.6, 0.3], scale: [0.8, 0.9, 0.8] }}
                transition={reduce ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                className={cn("relative flex flex-col items-center justify-center overflow-hidden border backdrop-blur-sm", themeClasses.container)}
                style={{ width: `${width}px`, height: `${height}px`, ...shapeStyle(shape) }}
              >
                <div className="mb-2 size-12 rounded-full bg-current opacity-20" />
                <div className="h-2 w-16 rounded-full bg-current opacity-20" />
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
      {loading && <span className="sr-only" role="status">{t.loading}</span>}

      {usePagination ? renderPagination() : loadMore && <div ref={sentinelRef} className="h-4" />}
    </div>
  );
}
