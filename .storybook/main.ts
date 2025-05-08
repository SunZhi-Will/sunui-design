import type { StorybookConfig } from "@storybook/nextjs";
import type webpack from 'webpack';
import path from 'path';

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
  webpackFinal: async (config: webpack.Configuration) => {
    if (config.module?.rules) {
      config.module.rules = (config.module.rules as WebpackRule[]).filter(
        (rule) => !(rule.test instanceof RegExp && rule.test.test('.css'))
      );
    }

    if (config.module?.rules) {
      const rules = config.module.rules as WebpackRule[];
      rules.push({
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
        include: /\.css$/,
      });
    }

    // 幫助 Webpack 解析內部模組
    if (config.resolve) {
      // 添加解析擴展名
      config.resolve.extensions = [
        ...(config.resolve.extensions || []),
        '.ts', '.tsx'
      ];

      // 添加模塊目錄
      config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve(__dirname, '../'),
        'node_modules'
      ];

      // 設置別名
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sunui-design/card': path.resolve(__dirname, '../packages/card/src'),
        '@sunui-design/core': path.resolve(__dirname, '../packages/core/src'),
        '@sunui-design/countdown-banner': path.resolve(__dirname, '../packages/countdown-banner/src'),
        '@sunui-design/filter': path.resolve(__dirname, '../packages/filter-grid/src'),
        '@sunui-design/floating': path.resolve(__dirname, '../packages/floating-button/src'),
        '@sunui-design/gradient': path.resolve(__dirname, '../packages/gradient-background/src'),
        '@sunui-design/side-panel': path.resolve(__dirname, '../packages/side-panel/src'),
        '@sunui-design/social': path.resolve(__dirname, '../packages/social-button/src')
      };
    }

    return config;
  },
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript'
  },
  docs: {
    autodocs: "tag",
    defaultName: 'Docs'
  }
};

export default config;
