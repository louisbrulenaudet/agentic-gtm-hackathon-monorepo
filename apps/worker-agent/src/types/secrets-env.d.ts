/**
 * Secret bindings are not declared in `wrangler.jsonc` `vars`, so `wrangler
 * types` does not emit them onto the generated `Env`. Augment the `Cloudflare`
 * namespace here so `import { env } from "cloudflare:workers"` is fully typed
 * across the app.
 *
 * Non-secret vars (AI_GATEWAY_ID, ENVIRONMENT) and the `AI` binding come from
 * the generated `worker-configuration.d.ts`.
 */
declare namespace Cloudflare {
  interface Env {
    /**
     * Inbound API key required on `/agents/*`, `/workflows/*` and
     * `/runs/:runId` (as `X-API-Key` or `Authorization: Bearer`). Enforced by
     * `middlewares/require-api-key.ts`; requests are refused with `503` when it
     * is unset.
     */
    AGENT_API_KEY: string;
  }
}
