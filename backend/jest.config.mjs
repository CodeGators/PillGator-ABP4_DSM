import { createDefaultEsmPreset } from "ts-jest";

const presetConfig = createDefaultEsmPreset();

/** @type {import('jest').Config} */
export default {
  ...presetConfig,
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"]
};