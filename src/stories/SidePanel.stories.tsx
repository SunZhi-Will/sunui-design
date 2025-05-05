import type { Meta, StoryObj } from '@storybook/react';
import { SidePanel } from '@sunui-design/side-panel';
import type { SidePanelProps } from '@sunui-design/side-panel';
import { useState } from 'react';
import { IoSettingsOutline, IoArrowBack, IoColorPaletteOutline, IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';

const EnhancedSidePanel = SidePanel as any;

const meta = {
    title: 'Components/SidePanel',
    component: EnhancedSidePanel,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'A side panel component for displaying side content, supporting both left and right positions with rich customization options.'
            }
        }
    },
    argTypes: {
        theme: {
            control: 'select',
            options: ['default', 'primary', 'success', 'warning', 'danger', 'gradient'],
            description: 'Theme variant of the panel'
        },
        mode: {
            control: 'radio',
            options: ['light', 'dark'],
            description: 'Light or dark mode'
        }
    }
} as Meta<SidePanelProps>;

export default meta;
type Story = StoryObj<typeof SidePanel>;

// Basic example
const BasicTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="Side Panel"
            >
                <div className="space-y-4">
                    <p>This is the side panel content.</p>
                    <p>You can place any content here.</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const Default: Story = {
    render: () => <BasicTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Basic usage of the side panel component.'
            }
        }
    }
};

// Different positions
const PositionsTemplate = () => {
    const [leftIsOpen, setLeftIsOpen] = useState(false);
    const [rightIsOpen, setRightIsOpen] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const toggleLeft = () => {
        setTimeout(() => setLeftIsOpen(!leftIsOpen), 0);
    };

    const toggleRight = () => {
        setTimeout(() => setRightIsOpen(!rightIsOpen), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <EnhancedSidePanel
                isOpen={leftIsOpen}
                onToggle={toggleLeft}
                title="Left Panel"
                position="left"
                theme="primary"
            >
                <div className="space-y-4">
                    <p>This is the left panel.</p>
                    <p>Typically used for navigation menus.</p>
                </div>
            </EnhancedSidePanel>

            <EnhancedSidePanel
                isOpen={rightIsOpen}
                onToggle={toggleRight}
                title="Right Panel"
                position="right"
                theme="success"
            >
                <div className="space-y-4">
                    <p>This is the right panel.</p>
                    <p>Typically used for details or settings.</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const Positions: Story = {
    render: () => <PositionsTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates both left and right panel positions.'
            }
        }
    }
};

// Different themes
const ThemesTemplate = () => {
    type ThemeKey = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'gradient';

    const [themeState, setThemeState] = useState<Record<ThemeKey, boolean>>({
        default: false,
        primary: false,
        success: false,
        warning: false,
        danger: false,
        gradient: false,
    });

    const togglePanel = (theme: ThemeKey) => {
        // 使用延迟确保状态更新和动画同步
        setTimeout(() => {
            setThemeState(prev => ({
                ...prev,
                [theme]: !prev[theme]
            }));
        }, 0);
    };

    // Map to provide static positions for each theme
    const themePositions: Record<ThemeKey, { position: 'left' | 'right'; zIndex: number; buttonTopPosition: string }> = {
        default: { position: 'left', zIndex: 60, buttonTopPosition: '2rem' },
        primary: { position: 'right', zIndex: 61, buttonTopPosition: '2rem' },
        success: { position: 'left', zIndex: 62, buttonTopPosition: '7rem' },
        warning: { position: 'right', zIndex: 63, buttonTopPosition: '7rem' },
        danger: { position: 'left', zIndex: 64, buttonTopPosition: '12rem' },
        gradient: { position: 'right', zIndex: 65, buttonTopPosition: '12rem' },
    };

    return (
        <div className="relative w-full h-screen bg-gray-100 flex flex-wrap justify-center items-center gap-4 p-4">
            <div className="mb-8 text-center w-full">
                <p className="mb-2 text-gray-600">Click a theme to see its panel style:</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {(Object.keys(themeState) as ThemeKey[]).map((theme) => (
                        <button
                            key={theme}
                            onClick={() => togglePanel(theme)}
                            className={`px-4 py-2 rounded-md capitalize ${theme === 'default' ? 'bg-gray-700 text-white' :
                                theme === 'primary' ? 'bg-blue-600 text-white' :
                                    theme === 'success' ? 'bg-green-600 text-white' :
                                        theme === 'warning' ? 'bg-amber-500 text-white' :
                                            theme === 'danger' ? 'bg-red-600 text-white' :
                                                'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white'
                                }`}
                        >
                            {theme}
                        </button>
                    ))}
                </div>
            </div>

            {(Object.entries(themeState) as [ThemeKey, boolean][]).map(([theme, isOpen]) => (
                <EnhancedSidePanel
                    key={theme}
                    isOpen={isOpen}
                    onToggle={() => togglePanel(theme)}
                    title={`${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme`}
                    theme={theme}
                    position={themePositions[theme].position}
                    zIndex={themePositions[theme].zIndex}
                    buttonTopPosition={themePositions[theme].buttonTopPosition}
                    showOverlay={true}
                >
                    <div className="space-y-4">
                        <p>This panel uses the <strong className="capitalize">{theme}</strong> theme.</p>
                        <p>Each theme has its own color scheme and styling.</p>
                        <button
                            onClick={() => togglePanel(theme)}
                            className={`px-4 py-2 rounded-md mt-4 ${theme === 'default' ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' :
                                theme === 'primary' ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' :
                                    theme === 'success' ? 'bg-green-100 hover:bg-green-200 text-green-800' :
                                        theme === 'warning' ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' :
                                            theme === 'danger' ? 'bg-red-100 hover:bg-red-200 text-red-800' :
                                                'bg-purple-100 hover:bg-purple-200 text-purple-800'
                                }`}
                        >
                            Close Panel
                        </button>
                    </div>
                </EnhancedSidePanel>
            ))}
        </div>
    );
};

export const Themes: Story = {
    render: () => <ThemesTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Shows the different theme options available for the side panel.'
            }
        }
    }
};

// Dark mode
const DarkModeTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div className={`relative w-full h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex justify-center items-center transition-colors duration-300`}>
            <button
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${isDarkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'
                    }`}
                onClick={toggleDarkMode}
            >
                {isDarkMode ? (
                    <>
                        <IoSunnyOutline /> Switch to Light Mode
                    </>
                ) : (
                    <>
                        <IoMoonOutline /> Switch to Dark Mode
                    </>
                )}
            </button>

            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="Dark Mode Panel"
                theme="gradient"
                mode={isDarkMode ? 'dark' : 'light'}
                showOverlay={true}
                toggleButtonIcon={IoColorPaletteOutline}
            >
                <div className="space-y-4">
                    <p>This panel adapts to the current mode: <strong>{isDarkMode ? 'Dark' : 'Light'}</strong>.</p>
                    <p>All themes support both light and dark modes.</p>
                    <button
                        onClick={toggleDarkMode}
                        className={`px-4 py-2 rounded-md mt-4 flex items-center gap-2 ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                    >
                        {isDarkMode ? <IoSunnyOutline /> : <IoMoonOutline />}
                        Toggle Mode
                    </button>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const DarkMode: Story = {
    render: () => <DarkModeTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates how the panel adapts to light and dark modes.'
            }
        }
    }
};

// Custom styles
const CustomStylesTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="Custom Styled Panel"
                className="bg-blue-50"
                headerClassName="bg-blue-500 text-white"
                contentClassName="p-6"
                width="320px"
                theme="primary"
                rounded={true}
                showShadow={true}
            >
                <div className="space-y-4">
                    <p className="text-blue-800">This is a panel with custom styles.</p>
                    <p className="text-blue-600">You can customize various parts of the panel.</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const CustomStyles: Story = {
    render: () => <CustomStylesTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Shows how to customize panel styles, including background color, header style, and content style.'
            }
        }
    }
};

// No buttons version
const NoButtonsTemplate = () => {
    const [isOpen, setIsOpen] = useState(true);

    // 使用延迟确保状态更新和动画同步
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="No Buttons Panel"
                showToggleButton={false}
                showCloseButton={false}
                theme="warning"
            >
                <div className="space-y-4">
                    <p>This panel does not show toggle and close buttons.</p>
                    <p>Suitable for scenarios where programmatic control is needed.</p>
                    <button
                        onClick={togglePanel}
                        className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
                    >
                        {isOpen ? 'Close Panel' : 'Open Panel'}
                    </button>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const NoButtons: Story = {
    render: () => <NoButtonsTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates how to create a panel without built-in buttons, controlled entirely externally.'
            }
        }
    }
};

// With overlay and outside click
const OverlayTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="Panel with Overlay"
                showOverlay={true}
                closeOnOutsideClick={true}
                closeOnEscape={true}
                overlayClassName="bg-blue-900 bg-opacity-30"
                theme="gradient"
            >
                <div className="space-y-4">
                    <p>This panel has a backdrop overlay.</p>
                    <p>Click outside or press ESC to close it.</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const WithOverlay: Story = {
    render: () => <OverlayTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Shows a panel with backdrop overlay and ability to close by clicking outside or pressing ESC.'
            }
        }
    }
};

// Custom icons and animation duration
const CustomIconsTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="Custom Icons Panel"
                toggleButtonIcon={IoSettingsOutline}
                closeButtonIcon={IoArrowBack}
                animationDuration={600}
                theme="danger"
            >
                <div className="space-y-4">
                    <p>This panel has custom icons.</p>
                    <p>It also uses a slower animation (600ms).</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const CustomIcons: Story = {
    render: () => <CustomIconsTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates how to use custom icons for toggle and close buttons, and customize animation duration.'
            }
        }
    }
};

// With open/close callbacks
const CallbacksTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    const handleOpen = () => {
        setMessage('Panel opened!');
        console.log('Panel opened!');
    };

    const handleClose = () => {
        setMessage('Panel closed!');
        console.log('Panel closed!');
    };

    // Controlled toggle with small delay to ensure animations work properly
    const togglePanel = () => {
        setIsOpen(prev => !prev);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100 flex flex-col justify-center items-center">
            {message && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 px-4 py-2 rounded-md text-yellow-800 z-20">
                    {message}
                </div>
            )}

            <div className="text-center mb-8">
                <p className="text-gray-600 mb-4">Click the button to open the panel with callbacks</p>
                <button
                    onClick={togglePanel}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {isOpen ? "Close Panel" : "Open Panel"}
                </button>
            </div>

            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title="Callbacks Panel"
                onOpen={handleOpen}
                onClose={handleClose}
                theme="primary"
                animationDuration={300}
            >
                <div className="space-y-4">
                    <p>This panel demonstrates open/close callbacks.</p>
                    <p>A message appears when the panel opens or closes.</p>
                    <button
                        onClick={togglePanel}
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                        Close Panel
                    </button>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const WithCallbacks: Story = {
    render: () => <CallbacksTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Shows how to use onOpen and onClose callback functions.'
            }
        }
    }
};

// With ReactNode title
const ReactNodeTitleTemplate = () => {
    const [isOpen, setIsOpen] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const togglePanel = () => {
        setTimeout(() => setIsOpen(!isOpen), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <EnhancedSidePanel
                isOpen={isOpen}
                onToggle={togglePanel}
                title={
                    <div className="flex items-center gap-2 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                        <span>Rich Title</span>
                    </div>
                }
                theme="gradient"
            >
                <div className="space-y-4">
                    <p>This panel has a title with an icon.</p>
                    <p>You can use any ReactNode as a title.</p>
                </div>
            </EnhancedSidePanel>
        </div>
    );
};

export const WithReactNodeTitle: Story = {
    render: () => <ReactNodeTitleTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates using ReactNode (with icon) as panel title instead of simple string.'
            }
        }
    }
};

// Multiple panels with non-overlapping buttons
const MultipleNonOverlappingTemplate = () => {
    const [panel1Open, setPanel1Open] = useState(false);
    const [panel2Open, setPanel2Open] = useState(false);
    const [panel3Open, setPanel3Open] = useState(false);

    // 使用延迟确保状态更新和动画同步
    const togglePanel1 = () => {
        setTimeout(() => setPanel1Open(!panel1Open), 0);
    };

    const togglePanel2 = () => {
        setTimeout(() => setPanel2Open(!panel2Open), 0);
    };

    const togglePanel3 = () => {
        setTimeout(() => setPanel3Open(!panel3Open), 0);
    };

    return (
        <div className="relative w-full h-screen bg-gray-100">
            {/* First panel with default position */}
            <EnhancedSidePanel
                isOpen={panel1Open}
                onToggle={togglePanel1}
                title="Panel 1 - Default"
                position="left"
                theme="primary"
                buttonTopPosition="2rem"
            >
                <div className="space-y-4">
                    <p>This is the first panel.</p>
                    <p>Its toggle button is at the default position (top: 2rem).</p>
                    <button
                        onClick={togglePanel1}
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                        Close Panel
                    </button>
                </div>
            </EnhancedSidePanel>

            {/* Second panel positioned below first */}
            <EnhancedSidePanel
                isOpen={panel2Open}
                onToggle={togglePanel2}
                title="Panel 2 - Middle"
                position="left"
                theme="success"
                buttonTopPosition="7rem"
            >
                <div className="space-y-4">
                    <p>This is the second panel.</p>
                    <p>Its toggle button is positioned at 7rem from the top.</p>
                    <button
                        onClick={togglePanel2}
                        className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                        Close Panel
                    </button>
                </div>
            </EnhancedSidePanel>

            {/* Third panel positioned at the right side */}
            <EnhancedSidePanel
                isOpen={panel3Open}
                onToggle={togglePanel3}
                title="Panel 3 - Right Side"
                position="right"
                theme="gradient"
                buttonTopPosition="2rem"
            >
                <div className="space-y-4">
                    <p>This is the third panel.</p>
                    <p>It&apos;s positioned on the right side of the screen.</p>
                    <button
                        onClick={togglePanel3}
                        className="px-4 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                    >
                        Close Panel
                    </button>
                </div>
            </EnhancedSidePanel>

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="mb-4 text-gray-600">
                    Multiple panels with non-overlapping toggle buttons.
                </p>

                <div className="flex flex-col space-y-3 items-center">
                    <button
                        onClick={togglePanel1}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-40"
                    >
                        Open Panel 1
                    </button>
                    <button
                        onClick={togglePanel2}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-40"
                    >
                        Open Panel 2
                    </button>
                    <button
                        onClick={togglePanel3}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 w-40"
                    >
                        Open Panel 3
                    </button>
                </div>
            </div>
        </div>
    );
};

export const MultipleNonOverlapping: Story = {
    render: () => <MultipleNonOverlappingTemplate />,
    parameters: {
        docs: {
            description: {
                story: 'Shows how to position multiple side panels with non-overlapping toggle buttons on the same page.'
            }
        }
    }
};