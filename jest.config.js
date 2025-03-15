/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/node_modules/@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/ui/(.*)$': '<rootDir>/src/components/ui/$1',
    '^@/infrastructure/repositories/(.*)$': '<rootDir>/src/infrastructure/repositories/$1',
    '^@/domain/(.*)$': '<rootDir>/src/domain/$1'
  },
  // リポジトリテストはNode環境で実行
  projects: [
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/**/*.test.tsx', '**/app/api/__tests__/**/*.test.ts', '**/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/node_modules/@testing-library/jest-dom'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/components/ui/(.*)$': '<rootDir>/src/components/ui/$1',
        '^@/infrastructure/repositories/(.*)$': '<rootDir>/src/infrastructure/repositories/$1',
        '^@/domain/(.*)$': '<rootDir>/src/domain/$1'
      },
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/infrastructure/repositories/__tests__/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/domain/(.*)$': '<rootDir>/src/domain/$1'
      },
    }
  ]
}

module.exports = config;
