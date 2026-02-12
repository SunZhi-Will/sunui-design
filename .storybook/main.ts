import type { StorybookConfig } from "@storybook/nextjs";
import type webpack from 'webpack';

// Define a type for webpack rule
type WebpackRule = webpack.RuleSetRule;

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
  ],
  staticDirs: ["../public"],
  // Tailwind CSS 4.0 不需要 webpack 配置，使用內建的 CSS 處理
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript'
  },
  docs: {
    autodocs: "tag",
    defaultName: 'Docs'
  }
};

export default config;
