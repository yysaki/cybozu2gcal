import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/__tests__/tsconfig.json',
    },
  },
  moduleNameMapper: { '/src/(.*)': '<rootDir>/src/$1' },
  testMatch: ['<rootDir>/__tests__/**/*.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};

export default config;
