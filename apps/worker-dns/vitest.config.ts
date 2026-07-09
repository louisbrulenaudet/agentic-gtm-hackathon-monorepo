import { defineConfig } from "vitest/config";

/**
 * `src/index.ts` (the `WorkerEntrypoint`) is intentionally untested directly —
 * it is a thin RPC shim over `services/analyze-domain.ts`, which is fully
 * covered under plain Node with no Workers runtime needed.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
  },
});
