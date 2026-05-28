import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['**/src/**/*.{ts,tsx}'],
      exclude: [
        '**/src/main.tsx',
        '**/src/**/*.test.{ts,tsx}',
        '**/src/test/**',
'**/node_modules/**',
      ],
    },
  },
});
