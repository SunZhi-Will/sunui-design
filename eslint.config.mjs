import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
    // 全局忽略配置
    {
        ignores: [
            // 忽略編譯後和類型文件
            '**/dist/**',
            '**/types/**',
            '**/*.d.ts',

            // 忽略測試文件
            '**/__tests__/**',
            '**/test/**',

            // 其他忽略規則
            '**/node_modules/**',
            'build/**',
            'out/**',
            '.next/**',
            'storybook-static/**'
        ],
    },

    // 基本 JavaScript 配置（適用於所有 JS 文件）
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Node globals
                __dirname: 'readonly',
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',

                // Browser globals
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                navigator: 'readonly',
                location: 'readonly',

                // Common globals
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',

                // Testing globals
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-undef': 'error',
            'no-unused-vars': 'warn',
        },
    },

    // Jest 配置文件
    {
        files: ['jest.*.js'],
        plugins: {
            'react': react,
            'jsx-a11y': jsxA11y,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Jest globals
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                global: 'readonly',

                // Browser globals
                window: 'readonly',
                document: 'readonly',

                // Node globals
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
                console: 'readonly',
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'jsx-a11y/alt-text': 'off',
        },
    },

    // CommonJS 腳本文件配置
    {
        files: ['scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                // Node globals
                __dirname: 'readonly',
                __filename: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
            },
        },
        rules: {
            'no-undef': 'off',
            'no-unused-vars': 'off', // 禁用未使用變量警告
        },
    },

    // TypeScript 和 React 配置
    {
        files: ['**/*.{ts,tsx}'],
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
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                alert: 'readonly',
                File: 'readonly',
                FileReader: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLDivElement: 'readonly',
                IntersectionObserver: 'readonly',
                SVGSVGElement: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                navigator: 'readonly',
                location: 'readonly',
                fetch: 'readonly',

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
            '@typescript-eslint/no-empty-object-type': 'error',
            'import/no-unresolved': 'off',
            'jsx-a11y/alt-text': 'error',
            'no-undef': 'off', // TypeScript handles this
            'no-redeclare': 'off', // TypeScript handles this
            '@typescript-eslint/no-unused-expressions': 'off',
            'react-hooks/exhaustive-deps': 'warn',
            'no-fallthrough': 'error',
            'no-sparse-arrays': 'error',
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