/**
 * Secret bindings are not declared in `wrangler.jsonc` `vars`, so `wrangler
 * types` does not emit them onto the generated `Env`. Augment the `Cloudflare`
 * namespace here so `import { env } from "cloudflare:workers"` is fully typed
 * across the app.
 *
 * Non-secret vars (AI_GATEWAY_ID, CF_ACCOUNT_ID, ENVIRONMENT) and the `AI`
 * binding come from the generated `worker-configuration.d.ts`.
 */
declare namespace Cloudflare {
  interface Env {
    /**
     * Inbound API key (as `X-API-Key` or `Authorization: Bearer`). HACKATHON:
     * currently unused — the auth guard was removed from `/agents/*`,
     * `/workflows/*` and `/runs/:runId` so the browser SPA can call this Worker
     * directly. `middlewares/require-api-key.ts` still reads it and can be
     * re-wired to restore fail-closed auth.
     */
    AGENT_API_KEY: string;

    /**
     * Cloudflare AI Gateway authorization token (an API token with the AI
     * Gateway "Run" permission). Sent as the `cf-aig-authorization: Bearer`
     * header by `src/providers/anthropic-gateway.ts` to authenticate the
     * orchestrator's Claude Opus 4.8 calls to the gateway. The gateway supplies
     * the Anthropic credentials itself (BYOK stored key or Unified Billing
     * credits), so no Anthropic API key is stored in this Worker.
     */
    CF_AIG_TOKEN: string;

    /**
     * Sillage workspace key (`sk_live_...`), sent as a static `Authorization:
     * Bearer` to the Sillage MCP server by `src/mcp/sillage.ts`. Optional —
     * when unset the orchestrator runs without the Sillage read tools, so it is
     * typed as possibly `undefined`.
     */
    SILLAGE_API_KEY?: string;
  }
}
