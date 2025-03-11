import type { StorybookConfig } from "@storybook/nextjs";
import type webpack from 'webpack';
import path from 'path';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  stories: [
    '../packages/*/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/*/src/**/*.mdx'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes'
  ],
  staticDirs: ["../public"],
  webpackFinal: async (config: webpack.Configuration) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sunui-design/core': path.resolve(__dirname, '../packages/core/src'),
        '@sunui-design/social': path.resolve(__dirname, '../packages/social-button/src'),
        '@sunui-design/floating': path.resolve(__dirname, '../packages/floating-button/src'),
        '@sunui-design/gradient': path.resolve(__dirname, '../packages/gradient-background/src'),
        '@sunui-design/filter': path.resolve(__dirname, '../packages/filter-grid/src')
      };

      // 確保 TypeScript 文件被正確處理
      config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx'];
    }
    return config;
  },
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript'
  },
  docs: {
    autodocs: true,
    defaultName: 'Docs'
  }
};

export default config;
