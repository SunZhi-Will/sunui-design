import type { StorybookConfig } from "@storybook/nextjs";
import type webpack from 'webpack';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  stories: [
    '../packages/*/src/**/*.stories.@(js|jsx|ts|tsx)'
    // '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  staticDirs: ["../public"],
  webpackFinal: async (config: webpack.Configuration) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sun-ui/social-button': '../packages/social-button/src',
        '@sun-ui/floating-button': '../packages/floating-button/src',
      };
    }
    return config;
  },
};

export default config;
