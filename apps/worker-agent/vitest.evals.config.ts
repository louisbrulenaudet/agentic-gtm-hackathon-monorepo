import { defineConfig } from "vitest/config";

/**
 * Live-model eval suite (separate from the deterministic unit tests in
 * `vitest.config.ts`). Evals need a running Flue app — `pnpm exec flue dev`, or
 * `FLUE_BASE_URL=<deployment>` — plus the provider credentials configured on
 * that server process. Longer timeout because each case drives a real agent
 * run.
 */
export default defineConfig({
  test: {
    include: ["tests/evals/**/*.eval.ts"],
    reporters: ["default", "vitest-evals/reporter"],
    testTimeout: 60_000,
  },
});
