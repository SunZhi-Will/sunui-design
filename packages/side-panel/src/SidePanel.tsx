import React, { memo } from 'react';
import { IoCloseOutline, IoMenuOutline } from 'react-icons/io5';
import type { IconType, IconBaseProps } from 'react-icons';

const Icon = memo((props: { icon: IconType } & IconBaseProps) => {
    const { icon: IconComponent, ...rest } = props;
    return React.createElement(IconComponent as React.ComponentType<IconBaseProps>, rest);
});

Icon.displayName = 'Icon';

export interface SidePanelProps {
    /** Whether the panel is open */
    isOpen?: boolean;
    /** Callback function when toggling the panel */
    onToggle?: () => void;
    /** Panel title */
    title?: string;
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
    /** Panel width (default: 270px) */
    width?: string;
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
    width = '270px',
}) => {
    return (
        <>
            {!isOpen && showToggleButton && (
                <button
                    onClick={onToggle}
                    className={`
            hidden sm:flex items-center justify-center
            absolute top-2 z-50
            bg-blue-600 text-white
            shadow-lg hover:shadow-xl
            transition-all duration-300 ease-in-out
            min-w-0 p-2.5
            ${position === 'left'
                            ? 'left-0 rounded-r-lg hover:translate-x-0.5'
                            : 'right-0 rounded-l-lg hover:-translate-x-0.5'
                        }
            ${toggleButtonClassName}
          `}
                    type="button"
                    aria-label={`Open ${title}`}
                >
                    <Icon
                        icon={IoMenuOutline}
                        size={20}
                        className={position === 'left' ? 'rotate-180' : ''}
                    />
                </button>
            )}

            <div
                className={`
          fixed top-0 ${position}-0 h-full
          bg-white shadow-lg
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'}
          ${className}
        `}
                style={{ width }}
            >
                <div className="flex flex-col h-full">
                    <div className={`
            flex items-center justify-between
            h-12 px-4
            border-b border-gray-200
            ${headerClassName}
          `}>
                        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                        {showCloseButton && (
                            <button
                                onClick={onToggle}
                                className={`
                  hidden sm:flex items-center justify-center
                  w-8 h-8 rounded-full
                  text-gray-500 hover:text-gray-700
                  hover:bg-gray-100
                  transition-colors duration-200
                  ${closeButtonClassName}
                `}
                                type="button"
                                aria-label="Close panel"
                            >
                                <Icon
                                    icon={IoCloseOutline}
                                    size={20}
                                />
                            </button>
                        )}
                    </div>
                    <div className={`
            flex-1 overflow-y-auto
            px-4 py-4
            ${contentClassName}
          `}>
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};