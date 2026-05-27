import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  globalSetup: './tests/globalSetup.ts',
  globalTeardown: './tests/globalTeardown.ts',
  testTimeout: 30000,
};

export default config;
