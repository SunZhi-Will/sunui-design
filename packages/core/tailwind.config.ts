import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: 'var(--sun-ui-primary-50)',
                    100: 'var(--sun-ui-primary-100)',
                    200: 'var(--sun-ui-primary-200)',
                    300: 'var(--sun-ui-primary-300)',
                    400: 'var(--sun-ui-primary-400)',
                    500: 'var(--sun-ui-primary-500)',
                    600: 'var(--sun-ui-primary-600)',
                    700: 'var(--sun-ui-primary-700)',
                    800: 'var(--sun-ui-primary-800)',
                    900: 'var(--sun-ui-primary-900)',
                    950: 'var(--sun-ui-primary-950)',
                },
                success: {
                    light: 'var(--sun-ui-success-light)',
                    DEFAULT: 'var(--sun-ui-success)',
                    dark: 'var(--sun-ui-success-dark)',
                },
                warning: {
                    light: 'var(--sun-ui-warning-light)',
                    DEFAULT: 'var(--sun-ui-warning)',
                    dark: 'var(--sun-ui-warning-dark)',
                },
                danger: {
                    light: 'var(--sun-ui-danger-light)',
                    DEFAULT: 'var(--sun-ui-danger)',
                    dark: 'var(--sun-ui-danger-dark)',
                },
                info: {
                    light: 'var(--sun-ui-info-light)',
                    DEFAULT: 'var(--sun-ui-info)',
                    dark: 'var(--sun-ui-info-dark)',
                },
                background: 'var(--sun-ui-background)',
                foreground: 'var(--sun-ui-foreground)',
                border: 'var(--sun-ui-border)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
};

export default config;