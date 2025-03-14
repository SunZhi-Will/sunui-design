import type { StorybookConfig } from "@storybook/nextjs";
import type webpack from 'webpack';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  stories: [
    '../src/stories/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/stories/**/*.mdx'
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

      };
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
