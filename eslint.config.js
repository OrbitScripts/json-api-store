const tsParser = require("@typescript-eslint/parser");
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const ignores = [
    'dist/',
    'out-tsc/',
    'node_modules/',
    '.idea/',
    '.vscode/',
    '.history/',
    '.angular/',
    'coverage/',
    'coverage-ts/',
    'package-lock.json',
    '.cache',
];

module.exports = tseslint.config(
    {
        ignores,
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            globals: {
                window: true,
                document: true,
                console: true,
                process: true,
                setTimeout: true,
                clearTimeout: true,
                setInterval: true,
                clearInterval: true
            },
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                sourceType: "module",
                ecmaVersion: 2022,
            },
        },
        processor: angular.processInlineTemplates,
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
            ...angular.configs.tsRecommended,
        ],
        rules: {
            curly: "error",
            "no-console": [
                "warn",
                { allow: ["warn", "error"] },
            ],
            "no-bitwise": "error",
            "eqeqeq": ["error", "always", { null: "ignore" }],
            semi: ["error", "always"],
            indent: ["error", 2],

            "@angular-eslint/use-pipe-transform-interface": "error",
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "app",
                    style: "camelCase",
                },
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "app",
                    style: "kebab-case",
                },
            ],

            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-expressions": "error",
            "@typescript-eslint/no-use-before-define": "error",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-unused-vars": "off"
        },
    }
);
