import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/tests/**/*.test.js'],
    testTimeout: 60000,
    hookTimeout: 180000, // first run downloads the mongod binary for mongodb-memory-server
  },
});
