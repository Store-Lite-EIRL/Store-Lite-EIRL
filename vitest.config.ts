import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // @/app/* → ./app/* (Next.js app dir at project root)
      { find: /^@\/app\//, replacement: path.resolve(__dirname, './app/') + '/' },
      // @/* → ./src/* (matches tsconfig paths)
      { find: /^@\//, replacement: path.resolve(__dirname, './src/') + '/' },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**', 'app/**', 'tests/**'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.*', 'app/**/*.test.*', '**/node_modules/**'],
    },
  },
});
