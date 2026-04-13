import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ServiceWorkerGlobalScope: 'readonly',
        caches: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        HTMLRewriter: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-constant-condition': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['src/frontend/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    ignores: ['**/pinyin-data.js'],
  },
];