import type { Config } from "jest";
import { createDefaultEsmPreset } from "ts-jest";

const presetConfig = createDefaultEsmPreset();

export default {
  ...presetConfig,
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"]
} satisfies Config;