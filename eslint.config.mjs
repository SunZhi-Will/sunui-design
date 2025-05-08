import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
    js.configs.recommended,
    {
        ignores: [
            // 忽略所有編譯後的文件
            '**/dist/**',
            '**/.next/**',
            '**/node_modules/**',
            '**/.storybook/**',
            '**/out/**',
            '**/build/**',
            '**/coverage/**',

            // 忽略生成的類型文件
            '**/*.d.ts',

            // 忽略特定的問題文件
            'packages/card/dist/src/Card.js',
            'packages/card/dist/src/components.js',
            'packages/card/dist/src/index.js',
            'packages/file-upload/dist/FileUpload.js',
            'packages/countdown-banner/dist/CountdownBanner.js',
            'packages/side-panel/dist/SidePanel.js',

            // 其他常見的忽略
            '**/*.min.js',
            '**/*.bundle.js'
        ]
    },
    // Node.js 專用配置
    {
        files: ['**/*.cjs', '**/scripts/**/*.js'],
        languageOptions: {
            globals: {
                // Node.js globals
                process: 'readonly',
                console: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'writable',
            }
        }
    },
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            '@typescript-eslint': typescript,
            'react': react,
            'react-hooks': reactHooks,
            'import': importPlugin,
            'jsx-a11y': jsxA11y,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                // Browser globals
                document: 'readonly',
                window: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                alert: 'readonly',
                File: 'readonly',
                FileReader: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLDivElement: 'readonly',
                IntersectionObserver: 'readonly',
                SVGSVGElement: 'readonly',

                // Node globals
                __dirname: 'readonly',
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',

                // Testing globals
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',

                // TypeScript globals
                JSX: 'readonly',
                React: 'readonly',
            },
        },
        rules: {
            ...typescript.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...importPlugin.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            '@typescript-eslint/no-require-imports': 'off',
            'import/no-unresolved': 'off',
            'jsx-a11y/alt-text': 'error',
            'no-undef': 'off', // TypeScript handles this
            'no-redeclare': 'off', // TypeScript handles this
            '@typescript-eslint/no-unused-expressions': 'off',
            'react-hooks/exhaustive-deps': 'warn',
        },
        settings: {
            react: {
                version: 'detect',
            },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                },
            },
        },
    },
]; 