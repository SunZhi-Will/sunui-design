import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardGroup, CardActions } from '@sunui-design/card';

type CardStory = StoryObj<typeof Card>;

const meta = {
    title: 'Components/Card',
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;

// Basic Card
export const Basic: CardStory = {
    args: {
        variant: 'outlined',
        size: 'md',
    },
    render: (args) => (
        <Card {...args}>
            <CardHeader className="" action={null}>
                <h3 className="text-lg font-semibold">Basic Card</h3>
            </CardHeader>
            <CardContent className="">
                <p className="text-gray-600">This is a basic card component example.</p>
            </CardContent>
        </Card>
    ),
};

// Different Themes
export const Themes: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card theme="violet" badge="New">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Violet Theme</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A card with violet theme.</p>
                </CardContent>
            </Card>
            <Card theme="cyan" hoverable={true}>
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Cyan Theme</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A cyan themed card with enhanced hover effects.</p>
                </CardContent>
            </Card>
            <Card theme="orange" variant="filled">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Orange Theme</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">An orange themed card with filled style.</p>
                </CardContent>
            </Card>
            <Card theme="green" variant="elevated">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Green Theme</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A green themed card with shadow effects.</p>
                </CardContent>
            </Card>
            <Card theme="slate" variant="glass">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Slate Theme</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A slate themed card with glass effect.</p>
                </CardContent>
            </Card>
            <Card
                theme="violet"
                badge="Popular"
                badgeColor="#ef4444"
                interactive={true}
                onClick={() => alert('Card was clicked!')}
            >
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Interactive Theme</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">An interactive card that can be clicked, with a badge.</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// Different Styles
export const Variants: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="outlined" badge="Basic">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Outlined Style</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A card style with border.</p>
                </CardContent>
            </Card>
            <Card variant="filled" badge="Filled">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Filled Style</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A card style with background fill.</p>
                </CardContent>
            </Card>
            <Card variant="elevated" badge="Shadow">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Elevated Style</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A card style with shadow effect.</p>
                </CardContent>
            </Card>
            <Card variant="glass" theme="violet" badge="Glass">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Glass Style</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">A card style with glass effect.</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// Different Sizes
export const Sizes: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card size="sm" badge="Small">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Small Size</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">Smaller padding.</p>
                </CardContent>
            </Card>
            <Card size="md" badge="Medium">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Medium Size</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">Standard padding.</p>
                </CardContent>
            </Card>
            <Card size="lg" badge="Large">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Large Size</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">Larger padding.</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// Loading States
export const LoadingStates: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card loading={true} loadingMode="skeleton" theme="violet">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Skeleton Loading</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">Using skeleton screen to show loading state.</p>
                </CardContent>
            </Card>
            <Card loading={true} loadingMode="overlay" theme="cyan">
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Overlay Loading</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">Using overlay loading animation.</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// Interactive Cards
export const Interactive: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
                theme="violet"
                variant="elevated"
                interactive={true}
                onClick={() => alert('Interactive card clicked!')}
                badge="Click Me"
            >
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">Interactive Card</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">This card has interactive effects and is clickable as a whole.</p>
                </CardContent>
                <CardFooter className="">
                    <div className="flex justify-end w-full">
                        <span className="text-sm text-violet-500">View Details →</span>
                    </div>
                </CardFooter>
            </Card>
            <Card
                theme="slate"
                variant="outlined"
                hoverable={false}
                badge="Static"
                badgeColor="#64748b"
            >
                <CardHeader className="" action={null}>
                    <h3 className="text-lg font-semibold">No Hover Effect</h3>
                </CardHeader>
                <CardContent className="">
                    <p className="text-gray-600">This card has hover effects disabled.</p>
                </CardContent>
            </Card>
        </div>
    ),
};

// Cards With Actions
export const WithActions: CardStory = {
    render: () => (
        <Card theme="cyan" variant="elevated" badge="Actionable">
            <CardHeader className="" action={null}>
                <div className="flex justify-between items-start w-full">
                    <div>
                        <h3 className="text-lg font-semibold">Card With Actions</h3>
                        <p className="text-sm text-gray-500">Card header area with action buttons</p>
                    </div>
                    <button className="p-1.5 rounded-full hover:bg-cyan-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    </button>
                </div>
            </CardHeader>
            <CardContent className="" showDivider>
                <p className="text-gray-600">
                    This card has an action button in the title area. The button can trigger a menu or other actions.
                </p>
            </CardContent>
            <CardFooter className="">
                <div className="flex justify-between w-full">
                    <button className="px-3 py-1.5 rounded text-sm text-cyan-500 hover:bg-cyan-50 transition-colors">
                        Cancel
                    </button>
                    <button className="px-3 py-1.5 rounded-md text-sm text-white bg-cyan-500 hover:bg-cyan-600 transition-colors">
                        Confirm
                    </button>
                </div>
            </CardFooter>
        </Card>
    ),
};

// Image Cards
export const WithImages: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-auto">
            {/* Mountain Landscape Card */}
            <Card
                variant="elevated"
                className="group h-auto"
                badge="Landscape"
                theme="cyan"
                interactive={true}
                backgroundImage="https://images.unsplash.com/photo-1491466424936-e304919aada7"
                backgroundImageAlt="Mountain background"
                backgroundImageOverlay="linear-gradient(to top, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8), rgba(6, 182, 212, 0.3))"
            >
                <CardHeader className="relative z-10 pt-16" action={
                    <button className="rounded-full p-1.5 hover:bg-cyan-100/80 transition-colors backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                        </svg>
                    </button>
                }>
                    <div className="relative flex items-start">
                        <div className="mr-3 p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold group-hover:text-cyan-600 transition-colors">Mountain View</h3>
                            <p className="text-sm text-gray-600 mt-1">Majestic natural scenery</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10">
                    <div className="flex items-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0ea5e9" className="group-hover:scale-110 transition-transform duration-300" style={{ transformOrigin: 'center', transitionDelay: `${(star - 1) * 50}ms` }}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        ))}
                        <span className="text-sm text-gray-600 ml-1">5.0</span>
                    </div>
                    <p className="text-gray-700 font-medium bg-white/70 p-3 rounded-lg backdrop-blur-sm">Breathtaking mountain landscapes with hover effects and icon display. Perfectly captures natural beauty.</p>
                </CardContent>

                <CardFooter className="relative z-10" align="end">
                    <button className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors text-sm font-medium shadow-md hover:shadow-lg">
                        View More
                    </button>
                </CardFooter>
            </Card>

            {/* City Night Scene Card - Dark Style */}
            <Card
                variant="elevated"
                className="group h-auto"
                theme="orange"
                interactive={true}
                backgroundImage="https://images.unsplash.com/photo-1489619243109-4e0ea59cfe10"
                backgroundImageAlt="City night scene"
                backgroundImageOverlay="linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5))"
            >
                <div className="relative z-10 flex flex-col h-full text-white p-2">
                    <div className="flex justify-between items-start mb-10 p-3">
                        <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <div className="flex space-x-2">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-orange-500 text-white shadow-lg">
                                City
                            </span>
                            <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                                Featured
                            </span>
                        </div>
                    </div>

                    <div className="mt-auto p-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-orange-200 transition-colors">City Night Scene</h3>
                        <div className="flex items-center mt-2 mb-3">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f97316" className="mr-1 group-hover:animate-pulse" style={{ animationDelay: `${(star - 1) * 100}ms`, animationDuration: "1s" }}>
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-white/90 text-sm ml-2">5.0 (128 reviews)</span>
                        </div>
                        <p className="text-white/90 mb-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">City skyline and lights perfectly capture the charm and vitality of urban nightscapes. Immerse yourself in the city&apos;s glow.</p>
                        <button className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md hover:from-orange-600 hover:to-orange-700 transition-all text-sm font-medium shadow-lg group-hover:shadow-orange-500/30">
                            View Details
                        </button>
                    </div>
                </div>
            </Card>

            {/* Floral Glass Effect Card */}
            <Card
                variant="glass"
                theme="violet"
                className="group h-auto"
                interactive={true}
                style={{ background: 'rgba(109, 40, 217, 0.05)' }}
                backgroundImage="https://images.unsplash.com/photo-1511884642898-4c92249e20b6"
                backgroundImageAlt="Floral background"
                backgroundImageOverlay="linear-gradient(to bottom right, rgba(76, 29, 149, 0.5), rgba(124, 58, 237, 0.3), rgba(139, 92, 246, 0.4))"
            >
                <div className="relative z-10 flex flex-col h-full text-white">
                    <CardHeader className="backdrop-blur-md bg-white/10 border-b border-white/10" showDivider={false} action={
                        <div className="bg-violet-100 text-violet-700 text-xs px-2.5 py-1 rounded-full shadow-sm">Featured</div>
                    }>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                                    <path d="M12 2a9 9 0 0 0-9 9c0 4 7 13 9 13s9-9 9-13a9 9 0 0 0-9-9z"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold">Purple Flowers</h3>
                        </div>
                    </CardHeader>

                    <div className="flex-1 p-5 flex items-center justify-center">
                        <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-200">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </div>
                            <p className="text-white font-medium text-lg">Card with Glass Effect</p>
                            <p className="text-white/80 text-sm mt-1">Combined with beautiful floral images</p>
                        </div>
                    </div>

                    <div className="p-5 bg-gradient-to-t from-violet-900/70 to-transparent backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-white/90 text-sm">42 Saved</span>
                            </div>
                            <button className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-md hover:bg-white/30 transition-colors text-sm">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Nature Landscape Card - Text Card */}
            <Card
                variant="outlined"
                theme="green"
                className="group h-auto"
                interactive={true}
                backgroundImage="https://images.unsplash.com/photo-1501854140801-50d01698950b"
                backgroundImageAlt="Natural scenery"
                backgroundImageOverlay="linear-gradient(to bottom right, rgba(6, 78, 59, 0.9), rgba(6, 95, 70, 0.7), rgba(5, 150, 105, 0.8))"
            >
                <div className="relative z-10 flex flex-col h-full p-5 text-white">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
                                    <path d="M6.8 11a6 6 0 1 0 10.4 0" />
                                    <path d="M12 3v8" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white">Natural Landscape</h3>
                                <p className="text-xs text-green-200/90">Beautiful scenes from nature</p>
                            </div>
                        </div>
                        <div className="px-2 py-0.5 text-xs font-medium text-white bg-green-500/50 backdrop-blur-sm rounded-full">Nature</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                        <p className="text-white/90">Beautiful natural landscapes, lush green mountains and clear blue skies create a breathtaking picture. Escape the hustle of the city and feel peace and tranquility.</p>
                    </div>

                    <div className="mt-auto flex justify-between items-center">
                        <div className="flex items-center text-sm text-white/80">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            2 days ago
                        </div>
                        <button className="text-sm text-white font-medium bg-green-600/70 hover:bg-green-600/90 transition-colors px-3 py-1.5 rounded-md backdrop-blur-sm">
                            View More →
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    ),
};

// Complete Card Example
export const Complete: CardStory = {
    args: {
        theme: 'violet',
        variant: 'elevated',
        size: 'lg',
        interactive: true,
        badge: "Premium",
        backgroundImage: "https://images.unsplash.com/photo-1522252234503-e356532cafd5",
        backgroundImageAlt: "Code example",
        backgroundImageOverlay: "linear-gradient(135deg, rgba(0, 0, 0, 0.75), rgba(74, 29, 150, 0.85), rgba(95, 30, 148, 0.75))",
    },
    render: (args) => (
        <div
            onClick={() => alert('Card was clicked!')}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    alert('Card was clicked!');
                }
            }}
            tabIndex={0}
            role="button"
            aria-label="Interactive card example"
            className="w-96 cursor-pointer"
        >
            <Card {...args} className="group transition-all duration-300 hover:shadow-xl hover:shadow-violet-900/30">
                <CardHeader className="relative z-10" showDivider action={
                    <div className="flex space-x-2">
                        <button className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                    </div>
                }>
                    <div className="flex items-start">
                        <div className="mr-3 p-2 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-violet-200 transition-colors">Complete Card Example</h3>
                            <p className="text-sm text-violet-200/90">Advanced showcase of features</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10" showDivider>
                    <div className="space-y-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                            <p className="text-white/90">
                                This card demonstrates all available features with optimized design elements and interactive components.
                            </p>
                        </div>
                        <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#c4b5fd" className="group-hover:scale-110 transition-transform duration-300" style={{ transformOrigin: 'center', transitionDelay: `${(star - 1) * 50}ms` }}>
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            ))}
                            <span className="text-sm text-violet-200 ml-2">5.0 (42 reviews)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="bg-white/10 backdrop-blur-sm p-2 rounded border border-white/20 text-center">
                                <div className="text-sm font-medium text-white">Features</div>
                                <div className="text-xs text-violet-200/80">12+ options</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-2 rounded border border-white/20 text-center">
                                <div className="text-sm font-medium text-white">Customizable</div>
                                <div className="text-xs text-violet-200/80">Multiple themes</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="relative z-10">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center space-x-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-violet-300 border-2 border-white/20 flex items-center justify-center text-xs text-violet-900 font-medium overflow-hidden">
                                        {i}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm text-violet-200">+42 users</span>
                        </div>
                        <button className="px-4 py-2 bg-white text-violet-900 rounded-md hover:bg-violet-100 transition-colors shadow-sm hover:shadow-md group-hover:shadow-violet-500/30 font-medium">
                            Explore Now
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    ),
};

// Dashboard Cards
export const Dashboard: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card theme="violet" variant="elevated" badge="Data">
                <CardHeader className="" action={null}>
                    <div className="flex items-center">
                        <div className="mr-3 p-2 bg-violet-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Income Statistics</h3>
                            <p className="text-sm text-gray-500">This Month&apos;s Data</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="">
                    <div className="mt-2">
                        <div className="text-3xl font-bold">$ 24,563</div>
                        <div className="flex items-center mt-2 text-sm">
                            <span className="flex items-center text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                                12.5%
                            </span>
                            <span className="ml-2 text-gray-500">Compared to last month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card
                theme="slate"
                variant="elevated"
                className="overflow-hidden"
                badge="Visits"
                backgroundImage="https://images.unsplash.com/photo-1554224155-6726b3ff858f"
                backgroundImageAlt="Visit data background"
                backgroundImageOverlay="linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(51, 65, 85, 0.9))"
                textColorMode="light"
                glassMorphism={true}
                backgroundBlur={true}
            >
                <CardHeader className="relative z-10" showDivider action={null}>
                    <h3 className="text-lg font-semibold text-white">Recent Visits</h3>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <div className="divide-y divide-white/10">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center p-4 hover:bg-white/10 backdrop-blur-sm transition-colors">
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mr-3 flex-shrink-0 text-white font-medium">
                                    {String.fromCharCode(64 + i)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">User {i}</p>
                                    <p className="text-xs text-slate-200/80">user{i}@example.com</p>
                                </div>
                                <div className="text-xs text-slate-200/80">{i} hours ago</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="relative z-10">
                    <div className="flex justify-center w-full">
                        <button className="text-sm text-white hover:text-white/90 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors">
                            View All Visits →
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    ),
};

// Product Cards
export const ProductCards: CardStory = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
                variant="elevated"
                theme="cyan"
                className="group"
                interactive={true}
                badge="Hot Sale"
                badgeColor="#ef4444"
            >
                <div className="relative overflow-hidden rounded-t-xl" style={{ aspectRatio: '1/1' }}>
                    <img
                        src="https://images.unsplash.com/photo-1523275335684-37898b6baf30"
                        alt="Watch"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <CardHeader className="" action={null}>
                    <div>
                        <p className="text-sm text-gray-500">Premium Accessories</p>
                        <h3 className="text-lg font-semibold mt-1">Classic Watch</h3>
                    </div>
                </CardHeader>
                <CardContent className="">
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-cyan-600">$ 899</div>
                        <div className="text-sm text-gray-500 line-through">$ 1299</div>
                    </div>
                </CardContent>
                <CardFooter className="">
                    <button className="w-full py-2 bg-cyan-500 text-white text-sm font-medium rounded-md hover:bg-cyan-600 transition-colors">
                        Add to Cart
                    </button>
                </CardFooter>
            </Card>

            <Card
                variant="elevated"
                theme="green"
                className="group"
                interactive={true}
                badge="Discount"
                badgeColor="#22c55e"
            >
                <div className="relative overflow-hidden rounded-t-xl" style={{ aspectRatio: '1/1' }}>
                    <img
                        src="https://images.unsplash.com/photo-1542291026-7eec264c27ff"
                        alt="Sneakers"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <CardHeader className="" action={null}>
                    <div>
                        <p className="text-sm text-gray-500">Sports Gear</p>
                        <h3 className="text-lg font-semibold mt-1">Casual Sneakers</h3>
                    </div>
                </CardHeader>
                <CardContent className="">
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">$ 599</div>
                        <div className="text-sm text-gray-500 line-through">$ 799</div>
                    </div>
                </CardContent>
                <CardFooter className="">
                    <button className="w-full py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors">
                        Add to Cart
                    </button>
                </CardFooter>
            </Card>

            <Card
                variant="elevated"
                theme="orange"
                className="group"
                interactive={true}
                badge="New"
                badgeColor="#f97316"
            >
                <div className="relative overflow-hidden rounded-t-xl" style={{ aspectRatio: '1/1' }}>
                    <img
                        src="https://images.unsplash.com/photo-1491553895911-0055eca6402d"
                        alt="Headphones"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <CardHeader className="" action={null}>
                    <div>
                        <p className="text-sm text-gray-500">Electronics</p>
                        <h3 className="text-lg font-semibold mt-1">Wireless Headphones</h3>
                    </div>
                </CardHeader>
                <CardContent className="">
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-orange-600">$ 499</div>
                        <div className="text-sm text-gray-500 line-through">$ 699</div>
                    </div>
                </CardContent>
                <CardFooter className="">
                    <button className="w-full py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 transition-colors">
                        Add to Cart
                    </button>
                </CardFooter>
            </Card>
        </div>
    ),
};

// Advanced Features Showcase
export const AdvancedFeatures: CardStory = {
    render: () => (
        <div className="space-y-12">
            {/* Card Group & Stacked Cards */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">Card Groups & Animations</h3>

                <CardGroup stacked horizontal gap="1.5rem" className="">
                    <Card
                        theme="violet"
                        variant="elevated"
                        animation="slide"
                        animationDelay={0}
                        interactive={true}
                        elevation="high"
                    >
                        <CardContent className="">
                            <h3 className="text-lg font-semibold">Animated Cards</h3>
                            <p className="text-gray-600 mt-2">Cards with slide-in animation effects.</p>
                        </CardContent>
                    </Card>

                    <Card
                        theme="cyan"
                        variant="filled"
                        animation="slide"
                        animationDelay={200}
                        elevation="medium"
                        interactive={true}
                    >
                        <CardContent className="">
                            <h3 className="text-lg font-semibold">Animated Cards</h3>
                            <p className="text-gray-600 mt-2">With sequential delays.</p>
                        </CardContent>
                    </Card>

                    <Card
                        theme="orange"
                        variant="glass"
                        animation="slide"
                        animationDelay={400}
                        elevation="medium"
                        interactive={true}
                    >
                        <CardContent className="">
                            <h3 className="text-lg font-semibold">Animated Cards</h3>
                            <p className="text-gray-600 mt-2">For smooth entry sequences.</p>
                        </CardContent>
                    </Card>
                </CardGroup>

                <div className="mt-8">
                    <CardGroup stacked className="">
                        <Card
                            theme="slate"
                            variant="elevated"
                            clickable
                            position="first"
                            badge="Top"
                        >
                            <CardHeader className="pb-0" action={null}>
                                <h3 className="text-lg font-semibold">Stacked Cards</h3>
                            </CardHeader>
                            <CardContent className="">
                                <p className="text-gray-600">Top card in the stack with elevated style.</p>
                            </CardContent>
                        </Card>

                        <Card
                            theme="slate"
                            variant="elevated"
                            position="middle"
                            badge="Middle"
                        >
                            <CardHeader className="pb-0" action={null}>
                                <h3 className="text-lg font-semibold">Stacked Cards</h3>
                            </CardHeader>
                            <CardContent className="">
                                <p className="text-gray-600">Middle card in the stack.</p>
                            </CardContent>
                        </Card>

                        <Card
                            theme="slate"
                            variant="elevated"
                            position="last"
                            badge="Bottom"
                            interactive
                        >
                            <CardHeader className="pb-0" action={null}>
                                <h3 className="text-lg font-semibold">Stacked Cards</h3>
                            </CardHeader>
                            <CardContent className="">
                                <p className="text-gray-600">Bottom card in the stack with hover effects.</p>
                            </CardContent>
                            <CardFooter className="">
                                <CardActions className="">
                                    <button className="px-4 py-2 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors">
                                        View Details
                                    </button>
                                </CardActions>
                            </CardFooter>
                        </Card>
                    </CardGroup>
                </div>
            </div>

            {/* Different States & Features */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">Card States & Special Features</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Loading Cards */}
                    <Card
                        theme="violet"
                        loading={true}
                        loadingProgress={75}
                        loadingText="Downloading files..."
                        variant="elevated"
                        className="min-h-[180px]"
                    >
                        <CardHeader className="" action={null}>
                            <h3 className="text-lg font-semibold">Loading with Progress</h3>
                        </CardHeader>
                        <CardContent className="">
                            <p className="text-gray-600">
                                This card shows loading state with a progress indicator.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Selectable Card */}
                    <Card
                        theme="cyan"
                        variant="outlined"
                        selectable
                        selected
                        badge="Selected"
                        className="min-h-[180px]"
                    >
                        <CardHeader className="" action={null}>
                            <h3 className="text-lg font-semibold">Selectable Card</h3>
                        </CardHeader>
                        <CardContent className="">
                            <p className="text-gray-600">
                                This card can be selected as part of a group.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Highlighted Card */}
                    <Card
                        theme="green"
                        variant="elevated"
                        highlighted
                        badge="Featured"
                        badgeColor="#15803d"
                        className="min-h-[180px]"
                    >
                        <CardHeader className="" action={null}>
                            <h3 className="text-lg font-semibold">Highlighted Card</h3>
                        </CardHeader>
                        <CardContent className="">
                            <p className="text-gray-600">
                                This card is highlighted with a colored border to draw attention.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Disabled Card */}
                    <Card
                        theme="orange"
                        variant="filled"
                        disabled
                        badge="Disabled"
                        className="min-h-[180px]"
                    >
                        <CardHeader className="" action={null}>
                            <h3 className="text-lg font-semibold">Disabled Card</h3>
                        </CardHeader>
                        <CardContent className="">
                            <p className="text-gray-600">
                                This card is disabled and cannot be interacted with.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* More sections with the same fixes */}
        </div>
    ),
}; 