import React, { memo, useEffect, useRef, useState, createContext, useContext, useMemo } from 'react';
import { IoCloseOutline, IoMenuOutline } from 'react-icons/io5';
import type { IconType, IconBaseProps } from 'react-icons';

// Helper function to merge class names
const classNames = (...classes: (string | undefined)[]) => {
    return classes.filter(Boolean).join(' ');
};

// Create a context to track open panels globally
const SidePanelContext = createContext<{
    registerOpenPanel: (id: string) => void;
    unregisterOpenPanel: (id: string) => void;
    isAnyPanelOpen: () => boolean;
}>({
    registerOpenPanel: () => { },
    unregisterOpenPanel: () => { },
    isAnyPanelOpen: () => false,
});

// Provider component to track open panels
export const SidePanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());

    const registerOpenPanel = (id: string) => {
        setOpenPanels(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    const unregisterOpenPanel = (id: string) => {
        setOpenPanels(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const isAnyPanelOpen = () => openPanels.size > 0;

    return (
        <SidePanelContext.Provider value={{ registerOpenPanel, unregisterOpenPanel, isAnyPanelOpen }}>
            {children}
        </SidePanelContext.Provider>
    );
};

// Hook to use the SidePanel context
const useSidePanelContext = () => useContext(SidePanelContext);

const Icon = memo((props: { icon: IconType } & IconBaseProps) => {
    const { icon: IconComponent, ...rest } = props;
    return React.createElement(IconComponent as React.ComponentType<IconBaseProps>, rest);
});

Icon.displayName = 'Icon';

// Date range options for panels that include date selectors
export type DateRangeOption = 'day' | 'week' | 'half-year' | 'year';

export type ThemeMode = 'light' | 'dark';

export interface SidePanelProps {
    /** Whether the panel is open */
    isOpen?: boolean;
    /** Callback function when toggling the panel */
    onToggle?: () => void;
    /** Panel title */
    title?: string | React.ReactNode;
    /** Panel position */
    position?: 'left' | 'right';
    /** Panel content */
    children?: React.ReactNode;
    /** Custom CSS class for the panel */
    className?: string;
    /** Custom CSS class for the toggle button */
    toggleButtonClassName?: string;
    /** Custom CSS class for the close button */
    closeButtonClassName?: string;
    /** Custom CSS class for the header */
    headerClassName?: string;
    /** Custom CSS class for the content */
    contentClassName?: string;
    /** Whether to show the toggle button */
    showToggleButton?: boolean;
    /** Whether to show the close button */
    showCloseButton?: boolean;
    /** Panel width (default: 320px) */
    width?: string;
    /** Panel z-index (default: 50) */
    zIndex?: number;
    /** Whether to close the panel when clicking outside */
    closeOnOutsideClick?: boolean;
    /** Whether to close the panel when pressing escape key */
    closeOnEscape?: boolean;
    /** Whether to render an overlay behind the panel */
    showOverlay?: boolean;
    /** Custom CSS class for the overlay */
    overlayClassName?: string;
    /** Callback fired when the panel is fully opened */
    onOpen?: () => void;
    /** Callback fired when the panel is fully closed */
    onClose?: () => void;
    /** Custom toggle button icon */
    toggleButtonIcon?: IconType;
    /** Custom close button icon */
    closeButtonIcon?: IconType;
    /** Animation duration in ms (default: 300) */
    animationDuration?: number;
    /** Panel theme variant */
    theme?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'gradient';
    /** Dark or light mode */
    mode?: ThemeMode;
    /** Whether to show a border */
    showBorder?: boolean;
    /** Whether to apply shadow effect */
    showShadow?: boolean;
    /** Whether to show a header border */
    showHeaderBorder?: boolean;
    /** Whether panel should have rounded corners */
    rounded?: boolean;
    /** Toggle button vertical position (default: '2rem' from top) */
    buttonTopPosition?: string;
    /** Whether to stick the toggle button to the edge (default: true) */
    buttonSticky?: boolean;
    /** Horizontal offset of toggle button to prevent overlapping (default: '0px') */
    buttonHorizontalOffset?: string;
    /** Unique ID for the panel (generated automatically if not provided) */
    id?: string;
    /** Whether to hide toggle buttons when any panel is open */
    hideButtonsWhenAnyOpen?: boolean;
    /** Whether to show date range selector in the panel */
    showDateRangeSelector?: boolean;
    /** Available date range options (default: ['day', 'week', 'half-year', 'year']) */
    dateRangeOptions?: DateRangeOption[];
    /** Current selected date range */
    selectedDateRange?: DateRangeOption;
    /** Callback when date range changes */
    onDateRangeChange?: (range: DateRangeOption) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
    isOpen = false,
    onToggle = () => { },
    title = '',
    position = 'left',
    children,
    className = '',
    toggleButtonClassName = '',
    closeButtonClassName = '',
    headerClassName = '',
    contentClassName = '',
    showToggleButton = true,
    showCloseButton = true,
    width = '320px',
    zIndex = 50,
    closeOnOutsideClick = false,
    closeOnEscape = false,
    showOverlay = false,
    overlayClassName = '',
    onOpen,
    onClose,
    toggleButtonIcon = IoMenuOutline,
    closeButtonIcon = IoCloseOutline,
    animationDuration = 300,
    theme = 'default',
    mode = 'light',
    showBorder = true,
    showShadow = true,
    showHeaderBorder = true,
    rounded = true,
    buttonTopPosition = '2rem',
    buttonSticky = true,
    buttonHorizontalOffset = '0px',
    id,
    hideButtonsWhenAnyOpen = true,
    showDateRangeSelector = false,
    dateRangeOptions = ['day', 'week', 'half-year', 'year'],
    selectedDateRange = 'day',
    onDateRangeChange = () => { },
}) => {
    // Generate unique ID if not provided
    const panelId = useRef(id || `side-panel-${Math.random().toString(36).substr(2, 9)}`).current;

    // Get context if available (falls back to a dummy context if not wrapped in provider)
    const context = useSidePanelContext();

    // Track if panel should be in DOM
    const [isInDOM, setIsInDOM] = useState(isOpen);
    // Track animation state (positioned offscreen or onscreen)
    const [isPositioned, setIsPositioned] = useState(isOpen);
    const [isHovering, setIsHovering] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Define a toggle handler function outside of useMemo
    const handleToggle = () => {
        // Use timeout to ensure state updates properly for animations
        setTimeout(() => {
            onToggle();
        }, 0);
    };

    // Memoize the toggle handler to prevent unnecessary re-renders
    const memoizedToggle = useMemo(() => handleToggle, [handleToggle]);

    // Register/unregister with context when open state changes
    useEffect(() => {
        if (isOpen) {
            context.registerOpenPanel(panelId);
        } else {
            context.unregisterOpenPanel(panelId);
        }

        return () => {
            // Cleanup when component unmounts
            if (isOpen) {
                context.unregisterOpenPanel(panelId);
            }
        };
    }, [isOpen, context, panelId]);

    // Handle panel opening and closing with proper animation
    useEffect(() => {
        if (isOpen) {
            // Step 1: Add to DOM (still off-screen due to CSS transform)
            setIsInDOM(true);

            // Step 2: Trigger transform to slide in (after a small delay to ensure rendering)
            const openTimer = setTimeout(() => {
                // Use RAF for smoother animation timing
                window.requestAnimationFrame(() => {
                    setIsPositioned(true);
                });
            }, 10); // Small delay to ensure DOM update has occurred

            // Step 3: Call onOpen after animation finishes
            const completeTimer = setTimeout(() => {
                onOpen?.();
            }, animationDuration + 50); // Add a small buffer to ensure animation is complete

            return () => {
                clearTimeout(openTimer);
                clearTimeout(completeTimer);
            };
        } else {
            // When closing: Move off-screen with animation
            setIsPositioned(false);

            // After animation, remove from DOM
            const timer = setTimeout(() => {
                setIsInDOM(false);
                onClose?.();
            }, animationDuration + 50); // Add a small buffer to ensure animation is complete

            return () => clearTimeout(timer);
        }
    }, [isOpen, animationDuration, onOpen, onClose, setIsInDOM, setIsPositioned]);

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (closeOnEscape && isOpen && e.key === 'Escape') {
                memoizedToggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeOnEscape, isOpen, memoizedToggle]);

    // Handle outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                closeOnOutsideClick &&
                isOpen &&
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                memoizedToggle();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [closeOnOutsideClick, isOpen, memoizedToggle]);

    // Get theme-based background classes
    const getThemeClasses = () => {
        const isDark = mode === 'dark';

        const themeMap = {
            default: {
                panel: isDark ? 'bg-gray-800' : 'bg-white',
                header: isDark ? 'bg-gray-800' : 'bg-white',
                title: isDark ? 'text-white' : 'text-gray-900',
                border: isDark ? 'border-gray-700' : 'border-gray-200',
                content: isDark ? 'text-gray-300' : 'text-gray-700',
                toggleBtn: isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700',
                closeBtn: isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                shadow: 'shadow-lg',
                overlay: 'bg-black bg-opacity-50',
                dateBtn: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
                dateBtnActive: isDark ? 'bg-blue-600' : 'bg-blue-500',
            },
            primary: {
                panel: isDark ? 'bg-gray-800' : 'bg-white',
                header: isDark ? 'bg-blue-800 text-white' : 'bg-blue-600 text-white',
                title: 'text-white',
                border: isDark ? 'border-blue-900' : 'border-blue-500',
                content: isDark ? 'text-gray-300' : 'text-gray-700',
                toggleBtn: 'bg-blue-600 text-white hover:bg-blue-700',
                closeBtn: 'text-white hover:text-white hover:bg-blue-500',
                shadow: 'shadow-lg shadow-blue-500/20',
                overlay: 'bg-blue-900 bg-opacity-40',
                dateBtn: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
                dateBtnActive: isDark ? 'bg-blue-600' : 'bg-blue-500',
            },
            success: {
                panel: isDark ? 'bg-gray-800' : 'bg-white',
                header: isDark ? 'bg-green-800 text-white' : 'bg-green-600 text-white',
                title: 'text-white',
                border: isDark ? 'border-green-900' : 'border-green-500',
                content: isDark ? 'text-gray-300' : 'text-gray-700',
                toggleBtn: 'bg-green-600 text-white hover:bg-green-700',
                closeBtn: 'text-white hover:text-white hover:bg-green-500',
                shadow: 'shadow-lg shadow-green-500/20',
                overlay: 'bg-green-900 bg-opacity-40',
                dateBtn: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
                dateBtnActive: isDark ? 'bg-green-600' : 'bg-green-500',
            },
            warning: {
                panel: isDark ? 'bg-gray-800' : 'bg-white',
                header: isDark ? 'bg-amber-800 text-white' : 'bg-amber-500 text-white',
                title: 'text-white',
                border: isDark ? 'border-amber-900' : 'border-amber-500',
                content: isDark ? 'text-gray-300' : 'text-gray-700',
                toggleBtn: 'bg-amber-500 text-white hover:bg-amber-600',
                closeBtn: 'text-white hover:text-white hover:bg-amber-400',
                shadow: 'shadow-lg shadow-amber-500/20',
                overlay: 'bg-amber-900 bg-opacity-40',
                dateBtn: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
                dateBtnActive: isDark ? 'bg-amber-500' : 'bg-amber-500',
            },
            danger: {
                panel: isDark ? 'bg-gray-800' : 'bg-white',
                header: isDark ? 'bg-red-800 text-white' : 'bg-red-600 text-white',
                title: 'text-white',
                border: isDark ? 'border-red-900' : 'border-red-500',
                content: isDark ? 'text-gray-300' : 'text-gray-700',
                toggleBtn: 'bg-red-600 text-white hover:bg-red-700',
                closeBtn: 'text-white hover:text-white hover:bg-red-500',
                shadow: 'shadow-lg shadow-red-500/20',
                overlay: 'bg-red-900 bg-opacity-40',
                dateBtn: isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
                dateBtnActive: isDark ? 'bg-red-600' : 'bg-red-500',
            },
            gradient: {
                panel: isDark
                    ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950'
                    : 'bg-white',
                header: isDark
                    ? 'bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white',
                title: 'text-white',
                border: isDark ? 'border-gray-700' : 'border-gray-200',
                content: isDark ? 'text-gray-300' : 'text-gray-700',
                toggleBtn: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600',
                closeBtn: 'text-white hover:text-white backdrop-blur-sm bg-white/20 hover:bg-white/30',
                shadow: 'shadow-xl shadow-purple-500/20',
                overlay: 'backdrop-blur-sm bg-black bg-opacity-30',
                dateBtn: isDark ? 'bg-gray-700/80 hover:bg-gray-600/80' : 'bg-gray-200/80 hover:bg-gray-300/80',
                dateBtnActive: isDark
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
            }
        };

        return themeMap[theme];
    };

    // Get all theme-specific classes
    const themeClasses = getThemeClasses();

    // Check if any panel is open (to hide toggle button if needed)
    const shouldShowToggleButton = showToggleButton &&
        (!hideButtonsWhenAnyOpen || !context.isAnyPanelOpen() || isOpen);

    // Set a higher z-index for the open panel than toggle buttons
    const panelZIndex = isOpen ? zIndex + 5 : zIndex;
    const buttonZIndex = zIndex;
    const overlayZIndex = isOpen ? zIndex + 4 : zIndex - 1;

    // Handle date range changes
    const handleDateRangeChange = (range: DateRangeOption) => {
        onDateRangeChange(range);
    };

    // Date range selector component
    const DateRangeSelector = () => {
        if (!showDateRangeSelector) return null;

        // Display name mapping for date ranges
        const displayNames: Record<DateRangeOption, string> = {
            'day': '日',
            'week': '周',
            'half-year': '半年',
            'year': '年'
        };

        return (
            <div className={`flex justify-around w-full mb-4 p-1 rounded-lg ${mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {dateRangeOptions.map(range => (
                    <button
                        key={range}
                        onClick={() => handleDateRangeChange(range)}
                        className={`
                            px-3 py-1 text-sm rounded-md transition-all duration-200
                            ${selectedDateRange === range
                                ? `${themeClasses.dateBtnActive} text-white`
                                : `${themeClasses.dateBtn} text-gray-700 dark:text-gray-300`}
                        `}
                    >
                        {displayNames[range]}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            {!isOpen && shouldShowToggleButton && (
                <button
                    onClick={memoizedToggle}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className={classNames(
                        'hidden sm:flex items-center justify-center',
                        buttonSticky ? 'fixed' : 'absolute',
                        'transition-all ease-in-out',
                        'min-w-0 p-2.5',
                        theme === 'gradient'
                            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white'
                            : themeClasses.toggleBtn,
                        position === 'left'
                            ? 'left-0 rounded-r-lg hover:translate-x-0.5'
                            : 'right-0 rounded-l-lg hover:-translate-x-0.5',
                        showShadow ? themeClasses.shadow : '',
                        toggleButtonClassName
                    )}
                    type="button"
                    aria-label={`Open ${typeof title === 'string' ? title : 'panel'}`}
                    style={{
                        zIndex: buttonZIndex,
                        top: buttonTopPosition,
                        [position]: buttonHorizontalOffset,
                        transition: `all ${animationDuration}ms ease-in-out`
                    }}
                >
                    <Icon
                        icon={toggleButtonIcon}
                        size={20}
                        className={position === 'left' ? 'rotate-180' : ''}
                    />

                    {theme === 'gradient' && (
                        <div
                            className={classNames(
                                'absolute -inset-0.5 rounded-r-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 transition-opacity blur-md',
                                isHovering ? 'opacity-60' : 'opacity-0'
                            )}
                            style={{ zIndex: -1 }}
                        />
                    )}
                </button>
            )}

            {isInDOM && showOverlay && (
                <div
                    className={classNames(
                        'fixed inset-0',
                        'transition-opacity ease-in-out',
                        themeClasses.overlay,
                        isPositioned ? 'opacity-100' : 'opacity-0 pointer-events-none',
                        overlayClassName
                    )}
                    style={{
                        zIndex: overlayZIndex,
                        transitionDuration: `${animationDuration}ms`
                    }}
                    onClick={closeOnOutsideClick ? memoizedToggle : undefined}
                    aria-hidden="true"
                />
            )}

            {isInDOM && (
                <div
                    ref={panelRef}
                    className={classNames(
                        'fixed top-0 h-full',
                        position === 'left' ? 'left-0' : 'right-0',
                        themeClasses.panel,
                        'transition-transform ease-in-out',
                        isPositioned ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full',
                        showBorder ? `border-${position === 'left' ? 'r' : 'l'} ${themeClasses.border}` : '',
                        showShadow ? themeClasses.shadow : '',
                        rounded ? `rounded-${position === 'left' ? 'r' : 'l'}-lg` : '',
                        className
                    )}
                    style={{
                        width,
                        zIndex: panelZIndex,
                        transitionDuration: `${animationDuration}ms`,
                        overflowX: 'hidden' // Prevent horizontal overflow issues
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="panel-title"
                >
                    <div className="flex flex-col h-full">
                        <div
                            className={classNames(
                                'flex items-center justify-between',
                                'p-4 h-14',
                                showHeaderBorder ? `border-b ${themeClasses.border}` : '',
                                theme !== 'default' ? themeClasses.header : themeClasses.panel,
                                rounded && position === 'left' ? 'rounded-tr-lg' : '',
                                rounded && position === 'right' ? 'rounded-tl-lg' : '',
                                headerClassName
                            )}
                        >
                            <h2
                                id="panel-title"
                                className={classNames(
                                    'text-xl font-semibold truncate flex-1',
                                    theme === 'default' ? themeClasses.title : ''
                                )}
                            >
                                {title}
                            </h2>
                            {showCloseButton && (
                                <button
                                    onClick={memoizedToggle}
                                    className={classNames(
                                        'flex items-center justify-center',
                                        'w-8 h-8 rounded-full',
                                        'transition-colors',
                                        themeClasses.closeBtn,
                                        closeButtonClassName
                                    )}
                                    type="button"
                                    aria-label="Close panel"
                                >
                                    <Icon
                                        icon={closeButtonIcon}
                                        size={20}
                                    />
                                </button>
                            )}
                        </div>
                        <div
                            className={classNames(
                                'flex-1 overflow-y-auto',
                                'p-5',
                                themeClasses.content,
                                contentClassName
                            )}
                        >
                            {showDateRangeSelector && <DateRangeSelector />}
                            {children}
                        </div>
                    </div>

                    {theme === 'gradient' && (
                        <div className="absolute inset-0 -z-10 overflow-hidden">
                            <div
                                className="absolute top-0 right-0 -z-10 h-36 w-36 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                                style={{ transform: 'translate(30%, -30%)' }}
                            />
                            <div
                                className="absolute bottom-0 left-0 -z-10 h-36 w-36 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                                style={{ transform: 'translate(-30%, 30%)' }}
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

// Default export with Provider wrapper
export default Object.assign(SidePanel, { Provider: SidePanelProvider });