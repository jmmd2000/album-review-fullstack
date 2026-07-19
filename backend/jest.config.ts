import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 30000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/../shared/src/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  setupFiles: ["<rootDir>/src/__tests__/jest.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/jest.setupAfterEnv.ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  forceExit: true,
};

export default config;
