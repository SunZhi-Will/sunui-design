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
