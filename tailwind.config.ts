import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './packages/**/*.{js,ts,jsx,tsx}',
    './packages/**/src/**/*.{js,jsx,ts,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config; 