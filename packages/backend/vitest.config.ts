import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, 'tests/setup.ts')],
    /** Один процес: спільний Prisma / setSocketService між файлами тестів */
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
