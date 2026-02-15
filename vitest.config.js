import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.js'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/index-hono.js',
        'src/routes-hono/**',
        'src/models/**',
        'src/utils/auth.js',
        'src/utils/slug.js',
      ],
      exclude: [
        'src/routes-hono/frontend.js',
        'src/routes-hono/admin.js',
      ],
    },
  },
});
