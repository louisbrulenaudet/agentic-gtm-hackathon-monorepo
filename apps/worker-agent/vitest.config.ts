import { defineConfig } from "vitest/config";

/**
 * Deterministic unit / integration tests.
 *
 * These run with no network and no Workers runtime. The `cloudflare:workers`
 * module (which only exists inside the Workers runtime) is aliased to a mutable
 * stub so modules like the API-key guard can be exercised directly; everything
 * else under test is runtime-agnostic (schemas, enums, the idempotency
 * middleware with a fake KV, standalone Hono route groups). Model-backed agent
 * behaviour is covered separately by the eval suite — see
 * `vitest.evals.config.ts`, which discovers the eval files under
 * `tests/evals`.
 */
export default defineConfig({
  resolve: {
    alias: {
      // decodeURIComponent: the repo path contains non-ASCII characters that
      // URL.pathname percent-encodes.
      "cloudflare:workers": decodeURIComponent(
        new URL("./tests/stubs/cloudflare-workers.ts", import.meta.url)
          .pathname,
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
  },
});
