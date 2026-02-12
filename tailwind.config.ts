/** Minimal type for Tailwind config to avoid resolving tailwindcss ESM types (moduleResolution) */
interface TailwindConfig {
  content?: string[];
  theme?: { extend?: Record<string, unknown> };
  plugins?: unknown[];
}

const config: TailwindConfig = {
  content: [
    './packages/**/*.{js,ts,jsx,tsx}',
    './packages/**/src/**/*.{js,jsx,ts,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config; 