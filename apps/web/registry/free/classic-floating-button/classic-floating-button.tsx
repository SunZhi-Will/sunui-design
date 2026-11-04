"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject, type SVGProps } from "react";

import { cn } from "@/lib/utils";

// 原版 icons/ 內附的五個社群圖示
type IconProps = SVGProps<SVGSVGElement>;

export const FacebookIcon = (props: IconProps) => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const GithubIcon = (props: IconProps) => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export const InstagramIcon = (props: IconProps) => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const LinkedinIcon = (props: IconProps) => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export const TwitterIcon = (props: IconProps) => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

export type SocialMediaType = "facebook" | "github" | "instagram" | "linkedin" | "twitter";

const socialIcons: Record<SocialMediaType, (p: IconProps) => ReactNode> = {
  facebook: FacebookIcon,
  github: GithubIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  twitter: TwitterIcon,
};

const socialNames: Record<SocialMediaType, string> = {
  facebook: "Facebook",
  github: "GitHub",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter",
};

export type FloatingVariant = "petal" | "vertical" | "grid";
export type FloatingPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";
type TitlePosition = "top" | "right" | "bottom" | "left";

export type SocialButtonConfig = {
  type?: SocialMediaType;
  href?: string;
  icon?: ReactNode;
  className?: string;
  iconClassName?: string;
  title?: string;
  titleDisplay?: "always" | "hover" | "none";
  titlePosition?: TitlePosition;
  onClick?: () => void;
};

// 原版 SocialButton 的預設漸層
const ITEM_GRADIENT = "bg-gradient-to-r from-blue-600 to-blue-800 shadow-md hover:shadow-blue-500/50";
const MAIN_GRADIENT = "bg-gradient-to-r from-blue-600 to-blue-800 shadow-md hover:shadow-blue-500/50";

const titlePosClass: Record<TitlePosition, string> = {
  top: "bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2",
  right: "left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2",
  bottom: "top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2",
  left: "right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2",
};

const titleArrowClass: Record<TitlePosition, string> = {
  top: "bottom-[-0.25rem] left-1/2 -translate-x-1/2",
  right: "left-[-0.25rem] top-1/2 -translate-y-1/2",
  bottom: "top-[-0.25rem] left-1/2 -translate-x-1/2",
  left: "right-[-0.25rem] top-1/2 -translate-y-1/2",
};

// 移植自 @sunui-design/social 的 SocialButton
function SocialButton({
  icon,
  href,
  className,
  iconClassName,
  title,
  titleDisplay = "none",
  titlePosition = "bottom",
  onClick,
  isMainButton,
  label,
  expanded,
  controls,
  reduce,
}: Omit<SocialButtonConfig, "type" | "icon"> & {
  icon: ReactNode;
  isMainButton?: boolean;
  label?: string;
  expanded?: boolean;
  controls?: string;
  reduce: boolean;
}) {
  const content = (
    <>
      {typeof icon === "string" ? (
        <img src={icon} alt="" width={20} height={20} className={iconClassName} />
      ) : (
        icon
      )}
      {title && titleDisplay !== "none" && (
        <span
          className={cn(
            "absolute z-[2000] rounded bg-gray-800/90 px-2 py-1 text-sm whitespace-nowrap text-white transition-opacity duration-200",
            titlePosClass[titlePosition],
            titleDisplay === "always"
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          <span className={cn("absolute h-2 w-2 rotate-45 bg-gray-800/90", titleArrowClass[titlePosition])} />
          {title}
        </span>
      )}
    </>
  );

  const base = cn(
    isMainButton ? "h-12 w-12" : "h-10 w-10",
    "group relative flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:z-[1500]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400",
    "bg-gradient-to-r",
    className || "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50",
  );

  const motionProps = {
    initial: reduce ? false : ({ scale: 0 } as const),
    animate: { scale: 1 },
    exit: { scale: 0 },
    whileHover: reduce ? undefined : { scale: 1.1 },
    whileTap: reduce ? undefined : { scale: 0.9 },
    transition: reduce ? { duration: 0 } : { duration: 0.1, ease: [1, 1, 1, 1] as [number, number, number, number] },
  };

  if (isMainButton) {
    return (
      <motion.button
        type="button"
        className={base}
        onClick={onClick}
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={controls}
        {...motionProps}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div>
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn("absolute", base)}
        onClick={onClick}
        {...motionProps}
      >
        {content}
      </motion.a>
    </motion.div>
  );
}

const defaultLabels = { open: "Open menu", close: "Close menu", menu: "Social links" };

export interface FloatingButtonProps {
  /** 顯示或隱藏整組按鈕（下滑淡出） */
  show?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
  className?: string;
  /** 主按鈕漸層，預設原版藍色漸層 */
  buttonClassName?: string;
  position?: FloatingPosition;
  buttons?: SocialButtonConfig[];
  variant?: FloatingVariant;
  showToggleButton?: boolean;
  draggable?: boolean;
  onPositionChange?: (x: number, y: number) => void;
  defaultPosition?: { x: number; y: number };
  /** 拖曳範圍（容器 ref 或邊界），原版沒有限制 */
  dragConstraints?: RefObject<Element | null> | { top?: number; left?: number; right?: number; bottom?: number };
  /** true 時相對視窗定位（原版行為）；false 時相對最近的 relative 容器 */
  fixed?: boolean;
  labels?: Partial<typeof defaultLabels>;
}

const positionClasses: Record<FloatingPosition, string> = {
  "bottom-right": "right-4 sm:right-8 bottom-8",
  "bottom-left": "left-4 sm:left-8 bottom-8",
  "top-right": "right-4 sm:right-8 top-8",
  "top-left": "left-4 sm:left-8 top-8",
};

const SPACING = 56;

// 依展開模式計算每顆按鈕相對主按鈕的位移
function calculatePosition(variant: FloatingVariant, position: FloatingPosition, index: number, total: number) {
  if (variant === "grid") {
    const itemsPerRow = Math.ceil(Math.sqrt(total));
    if (position === "bottom-right" || position === "bottom-left") {
      const r = total - index;
      const row = Math.floor(r / itemsPerRow);
      const col = r % itemsPerRow;
      return { x: (position === "bottom-right" ? -col : col) * SPACING, y: -row * SPACING };
    }
    const now = index + 1;
    const row = Math.floor(now / itemsPerRow);
    const col = now % itemsPerRow;
    return { x: (position === "top-right" ? -col : col) * SPACING, y: row * SPACING };
  }

  if (variant === "vertical") {
    const dir = position.startsWith("bottom") ? -1 : 1;
    return { x: 0, y: dir * SPACING * (index + 1) };
  }

  // 花瓣：第一層 3 顆，之後每層多 2 顆，半徑每層加 56
  let currentIndex = index;
  let layer = 0;
  let before = 0;
  while (currentIndex >= 0) {
    const inLayer = Math.min(3 + layer * 2, total - before);
    if (currentIndex < inLayer) break;
    currentIndex -= inLayer;
    before += inLayer;
    layer++;
  }
  const inLayer = Math.min(3 + layer * 2, total - before);
  const indexInLayer = index - before;
  const radius = SPACING * (layer + 1);
  const angle = (Math.PI / 2 / (inLayer - 1 || 1)) * indexInLayer;
  const sx = position.endsWith("right") ? -1 : 1;
  const sy = position.startsWith("bottom") ? -1 : 1;
  return { x: sx * radius * Math.cos(angle), y: sy * radius * Math.sin(angle) };
}

export function FloatingButton({
  show = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  defaultOpen = false,
  className = "",
  buttonClassName = MAIN_GRADIENT,
  position = "bottom-right",
  buttons = [],
  variant = "petal",
  showToggleButton = true,
  draggable = false,
  onPositionChange,
  defaultPosition,
  dragConstraints,
  fixed = true,
  labels,
}: FloatingButtonProps) {
  const l = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const isMenuOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
  const dragControls = useDragControls();
  const [dragPosition, setDragPosition] = useState(defaultPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragThresholdExceeded = useRef(false);
  const menuId = useRef(`floating-menu-${Math.random().toString(36).slice(2, 9)}`).current;

  // 取消拖曳時重置位置
  useEffect(() => {
    if (!draggable) setDragPosition({ x: 0, y: 0 });
  }, [draggable]);

  const handleToggle = () => {
    // 拖曳中不切換
    if (isDraggingRef.current) return;
    const next = !isMenuOpen;
    onOpenChange?.(next);
    if (controlledIsOpen === undefined) setUncontrolledIsOpen(next);
  };

  const setDragging = (v: boolean) => {
    isDraggingRef.current = v;
    setIsDragging(v);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const x = dragPosition.x + info.offset.x;
    const y = dragPosition.y + info.offset.y;
    setDragPosition({ x, y });
    onPositionChange?.(x, y);
    const wasDrag = dragThresholdExceeded.current;
    dragThresholdExceeded.current = false;
    // 延後解除拖曳狀態以吃掉放開時的 click；沒超過移動閾值則視為點擊
    isDraggingRef.current = true;
    setTimeout(() => {
      setDragging(false);
      if (!wasDrag) handleToggle();
    }, 10);
  };

  const items = buttons.map((b, i) => {
    const Icon = b.type ? socialIcons[b.type] : undefined;
    return {
      key: b.href ?? String(i),
      config: b,
      icon: Icon ? <Icon /> : b.icon,
      label: b.title ?? (b.type ? socialNames[b.type] : undefined),
    };
  });
  const total = items.length;

  const pos = fixed ? "fixed" : "absolute";
  const spring = reduce
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 300, damping: 24 } as const);

  return (
    <motion.div
      className={cn(
        pos,
        !draggable && positionClasses[position],
        "z-[140]",
        !draggable && (reduce ? "" : "transition-all duration-300"),
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0",
        draggable && "cursor-move",
        className,
      )}
      aria-hidden={show ? undefined : true}
      drag={draggable}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragConstraints}
      dragTransition={{ power: 0, timeConstant: 0, modifyTarget: (t) => t }}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      dragListener={draggable}
      style={
        draggable
          ? {
              position: pos,
              right: position.includes("right") ? "20px" : "auto",
              left: position.includes("left") ? "20px" : "auto",
              bottom: position.includes("bottom") ? "20px" : "auto",
              top: position.includes("top") ? "20px" : "auto",
              x: dragPosition.x,
              y: dragPosition.y,
              transition: "none",
              zIndex: 1000,
            }
          : undefined
      }
      layout={false}
      initial={false}
    >
      <AnimatePresence mode="wait">
        {isMenuOpen && (
          <div
            key="menu"
            id={menuId}
            role="group"
            aria-label={l.menu}
            className="absolute"
            style={{ inset: 0, pointerEvents: isDragging ? "none" : "auto" }}
          >
            {items.map((item, i) => {
              let p: { x: number; y: number };
              if (!showToggleButton) {
                // 無主按鈕：第一顆在角落，其餘接著排
                if (i === 0) p = { x: -24, y: -24 };
                else {
                  const b = calculatePosition(variant, position, i - 1, total - 1);
                  p = { x: b.x - 24, y: b.y - 24 };
                }
              } else {
                p = calculatePosition(variant, position, i, total);
              }
              return (
                <motion.div
                  key={item.key}
                  className="absolute"
                  style={{
                    width: 48,
                    height: 48,
                    pointerEvents: isDragging ? "none" : "auto",
                    zIndex: variant === "vertical" ? 1000 - i : 10,
                  }}
                  initial={reduce ? { opacity: 1, scale: 1, x: p.x, y: p.y } : { opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: p.x,
                    y: p.y,
                    transition: reduce ? spring : { ...spring, delay: i * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    scale: reduce ? 1 : 0,
                    x: reduce ? p.x : 0,
                    y: reduce ? p.y : 0,
                    transition: reduce ? { duration: 0 } : { duration: 0.2, delay: (total - i - 1) * 0.05 },
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <SocialButton
                      {...item.config}
                      icon={item.icon}
                      label={item.label}
                      className={cn(item.config.className || ITEM_GRADIENT, "cursor-pointer")}
                      reduce={reduce}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {showToggleButton && (
        <div className="relative" style={{ zIndex: variant === "vertical" ? 2000 : "auto" }}>
          <SocialButton
            isMainButton
            label={isMenuOpen ? l.close : l.open}
            expanded={isMenuOpen}
            controls={isMenuOpen ? menuId : undefined}
            reduce={reduce}
            className={buttonClassName}
            onClick={handleToggle}
            icon={
              <motion.svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: reduce ? 0 : 0.3 }}
                onPointerDown={
                  draggable
                    ? (e) => {
                        // 左鍵按下立即開始拖曳
                        if (e.buttons === 1) {
                          dragControls.start(e);
                          dragThresholdExceeded.current = false;
                          e.stopPropagation();
                        }
                      }
                    : undefined
                }
                onPointerMove={
                  draggable
                    ? (e) => {
                        if (e.buttons === 1 && Math.abs(e.movementX) + Math.abs(e.movementY) > 3) {
                          dragThresholdExceeded.current = true;
                          setDragging(true);
                        }
                      }
                    : undefined
                }
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </motion.svg>
            }
          />
        </div>
      )}
    </motion.div>
  );
}

export default FloatingButton;
