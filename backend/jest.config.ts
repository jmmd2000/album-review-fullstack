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
  setupFiles: ["dotenv/config"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  detectOpenHandles: true,
  forceExit: true,
};

export default config;
