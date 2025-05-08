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
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sunui-design/card': require.resolve('../packages/card'),
        '@sunui-design/core': require.resolve('../packages/core'),
        '@sunui-design/countdown-banner': require.resolve('../packages/countdown-banner'),
        '@sunui-design/filter': require.resolve('../packages/filter-grid'),
        '@sunui-design/floating': require.resolve('../packages/floating-button'),
        '@sunui-design/gradient': require.resolve('../packages/gradient-background'),
        '@sunui-design/side-panel': require.resolve('../packages/side-panel'),
        '@sunui-design/social': require.resolve('../packages/social-button')
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
