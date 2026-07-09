import { defineConfig } from "@flue/cli/config";

/**
 * Flue build/dev configuration.
 *
 * `target: "cloudflare"` makes `flue build`/`flue dev` emit a Workers
 * entrypoint and the deployable `dist/worker_agent/wrangler.json` (deploy THAT,
 * not the source `wrangler.jsonc`). The npm scripts also pass `--target
 * cloudflare` explicitly, which keeps the target unambiguous in CI.
 */
export default defineConfig({
  target: "cloudflare",
  output: "dist",
});
