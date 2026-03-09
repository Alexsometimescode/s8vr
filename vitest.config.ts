import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx', 'components/**/*.tsx'],
      exclude: ['node_modules', 'dist', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': '/home/s8vr/s8vr-App/s8vr-App',
    },
  },
});
